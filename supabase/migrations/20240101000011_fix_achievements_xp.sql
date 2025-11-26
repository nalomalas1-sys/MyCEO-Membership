-- Fix achievements and XP functionality
-- This migration fixes issues with achievement checking and XP calculation

-- Fix: Ensure check_achievements properly handles NULL values
CREATE OR REPLACE FUNCTION check_achievements(
  p_child_id UUID,
  p_activity_type TEXT
)
RETURNS TABLE(achievement_id UUID, achievement_name TEXT) AS $$
DECLARE
  modules_completed INTEGER;
  perfect_quizzes INTEGER;
  current_streak INTEGER;
  company_revenue DECIMAL;
BEGIN
  -- Get child stats
  SELECT COUNT(*) INTO modules_completed
  FROM public.child_module_progress
  WHERE child_id = p_child_id AND status = 'completed';
  
  -- Count perfect quizzes (score = 100)
  -- Use child_lesson_progress as the source of truth for quiz completions
  SELECT COUNT(DISTINCT clp.lesson_id) INTO perfect_quizzes
  FROM public.child_lesson_progress clp
  INNER JOIN public.lessons l ON l.id = clp.lesson_id
  WHERE clp.child_id = p_child_id
    AND l.lesson_type = 'quiz'
    AND clp.quiz_score = 100
    AND clp.is_completed = true;
  
  SELECT COALESCE(c.current_streak, 0) INTO current_streak
  FROM public.children c
  WHERE c.id = p_child_id;
  
  SELECT COALESCE(total_revenue, 0) INTO company_revenue
  FROM public.companies
  WHERE child_id = p_child_id;
  
  -- Check milestone achievements (only on module completion)
  IF p_activity_type = 'module_complete' THEN
    RETURN QUERY
    SELECT a.id, a.name
    FROM public.achievements a
    WHERE a.achievement_type = 'milestone'
      AND (a.criteria->>'modules_completed')::INTEGER <= modules_completed
      AND NOT EXISTS (
        SELECT 1 FROM public.child_achievements ca
        WHERE ca.child_id = p_child_id AND ca.achievement_id = a.id
      );
  END IF;
  
  -- Check performance achievements (on quiz attempts or lesson completion with quiz)
  IF p_activity_type IN ('quiz_attempt', 'lesson_complete') THEN
    RETURN QUERY
    SELECT a.id, a.name
    FROM public.achievements a
    WHERE a.achievement_type = 'performance'
      AND (a.criteria->>'perfect_quizzes')::INTEGER IS NOT NULL
      AND (a.criteria->>'perfect_quizzes')::INTEGER <= perfect_quizzes
      AND NOT EXISTS (
        SELECT 1 FROM public.child_achievements ca
        WHERE ca.child_id = p_child_id AND ca.achievement_id = a.id
      );
  END IF;
  
  -- Check engagement achievements (streaks) - check on any activity
  RETURN QUERY
  SELECT a.id, a.name
  FROM public.achievements a
  WHERE a.achievement_type = 'engagement'
    AND (a.criteria->>'streak_days')::INTEGER IS NOT NULL
    AND (a.criteria->>'streak_days')::INTEGER <= current_streak
    AND NOT EXISTS (
      SELECT 1 FROM public.child_achievements ca
      WHERE ca.child_id = p_child_id AND ca.achievement_id = a.id
    );
  
  -- Check company achievements (on any activity, but typically triggered by company actions)
  RETURN QUERY
  SELECT a.id, a.name
  FROM public.achievements a
  WHERE a.achievement_type = 'company'
    AND (a.criteria->>'revenue_threshold')::DECIMAL IS NOT NULL
    AND (a.criteria->>'revenue_threshold')::DECIMAL <= company_revenue
    AND NOT EXISTS (
      SELECT 1 FROM public.child_achievements ca
      WHERE ca.child_id = p_child_id AND ca.achievement_id = a.id
    );
END;
$$ LANGUAGE plpgsql;

-- Fix: Ensure award_achievements_and_xp properly handles all cases
CREATE OR REPLACE FUNCTION award_achievements_and_xp(
  p_child_id UUID,
  p_activity_type TEXT,
  p_module_id UUID DEFAULT NULL,
  p_quiz_score INTEGER DEFAULT NULL
)
RETURNS TABLE(
  new_achievements JSONB,
  xp_earned INTEGER,
  new_total_xp INTEGER,
  new_level INTEGER,
  leveled_up BOOLEAN
) 
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_xp_earned INTEGER := 0;
  v_base_xp INTEGER := 0;
  v_perfect_bonus INTEGER := 0;
  v_streak_bonus INTEGER := 0;
  v_achievement_bonus INTEGER := 0;
  v_current_streak INTEGER;
  v_current_xp INTEGER;
  v_old_level INTEGER;
  v_new_level INTEGER;
  v_leveled_up BOOLEAN := false;
  v_new_achievements JSONB := '[]'::JSONB;
  v_achievement_record RECORD;
  v_child_exists BOOLEAN;
BEGIN
  -- Validate that child exists
  SELECT EXISTS(SELECT 1 FROM public.children WHERE id = p_child_id) INTO v_child_exists;
  IF NOT v_child_exists THEN
    RAISE EXCEPTION 'Child with id % does not exist', p_child_id;
  END IF;

  -- Get current child stats
  SELECT COALESCE(c.total_xp, 0), COALESCE(c.current_level, 1), COALESCE(c.current_streak, 0)
  INTO v_current_xp, v_old_level, v_current_streak
  FROM public.children c
  WHERE c.id = p_child_id;

  -- Calculate base XP based on activity type
  IF p_activity_type = 'module_complete' AND p_module_id IS NOT NULL THEN
    SELECT COALESCE(xp_reward, 100) INTO v_base_xp
    FROM public.modules
    WHERE id = p_module_id;
    
    v_xp_earned := v_base_xp;
  ELSIF p_activity_type = 'lesson_complete' THEN
    v_xp_earned := 50; -- Base XP for lesson completion
  ELSIF p_activity_type = 'quiz_attempt' THEN
    v_xp_earned := 25; -- Base XP for quiz attempt
  ELSE
    v_xp_earned := 0; -- No XP for other activity types
  END IF;

  -- Perfect quiz bonus (+50 XP)
  IF p_quiz_score IS NOT NULL AND p_quiz_score = 100 THEN
    v_perfect_bonus := 50;
    v_xp_earned := v_xp_earned + v_perfect_bonus;
  END IF;

  -- Update streak first (this function handles the streak logic)
  PERFORM update_child_streak(p_child_id);
  
  -- Get updated streak after update
  SELECT COALESCE(c.current_streak, 0) INTO v_current_streak
  FROM public.children c
  WHERE c.id = p_child_id;

  -- Streak bonus (+10 XP per day of streak)
  IF v_current_streak > 0 THEN
    v_streak_bonus := v_current_streak * 10;
    v_xp_earned := v_xp_earned + v_streak_bonus;
  END IF;

  -- Check for new achievements
  FOR v_achievement_record IN
    SELECT * FROM check_achievements(p_child_id, p_activity_type)
  LOOP
    -- Award the achievement (only if not already earned)
    INSERT INTO public.child_achievements (child_id, achievement_id)
    VALUES (p_child_id, v_achievement_record.achievement_id)
    ON CONFLICT (child_id, achievement_id) DO NOTHING;

    -- Get achievement XP bonus
    SELECT COALESCE(xp_bonus, 0) INTO v_achievement_bonus
    FROM public.achievements
    WHERE id = v_achievement_record.achievement_id;

    -- Add achievement bonus to total XP earned (each achievement bonus is separate)
    v_xp_earned := v_xp_earned + COALESCE(v_achievement_bonus, 0);

    -- Add to new achievements array
    v_new_achievements := v_new_achievements || jsonb_build_object(
      'id', v_achievement_record.achievement_id,
      'name', v_achievement_record.achievement_name,
      'xp_bonus', COALESCE(v_achievement_bonus, 0)
    );
  END LOOP;

  -- Update child's total XP (only if XP was earned)
  IF v_xp_earned > 0 THEN
    v_current_xp := v_current_xp + v_xp_earned;
    v_new_level := calculate_level_from_xp(v_current_xp);
    v_leveled_up := v_new_level > v_old_level;

    UPDATE public.children
    SET total_xp = v_current_xp,
        current_level = v_new_level,
        last_activity_at = NOW()
    WHERE id = p_child_id;
  ELSE
    -- No XP earned, but still update last_activity_at and check level
    v_new_level := calculate_level_from_xp(v_current_xp);
    v_leveled_up := false;
    
    UPDATE public.children
    SET last_activity_at = NOW()
    WHERE id = p_child_id;
  END IF;

  -- Return results (always return, even if no XP earned)
  RETURN QUERY SELECT
    v_new_achievements,
    v_xp_earned,
    v_current_xp,
    v_new_level,
    v_leveled_up;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION award_achievements_and_xp(UUID, TEXT, UUID, INTEGER) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION check_achievements(UUID, TEXT) TO authenticated, anon;

