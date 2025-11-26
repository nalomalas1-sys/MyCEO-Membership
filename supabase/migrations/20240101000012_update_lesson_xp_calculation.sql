-- Update lesson XP calculation to use module XP divided by number of lessons
-- This ensures the total XP from all lessons equals the module's predetermined XP

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
  v_module_xp INTEGER;
  v_lesson_count INTEGER;
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
    -- Module completion: award 0 base XP since lessons already gave the XP
    -- (Lessons divide the module XP among them, so module completion doesn't need additional base XP)
    -- Bonuses (perfect quiz, streak, achievements) are still applied below
    v_base_xp := 0;
    v_xp_earned := 0;
  ELSIF p_activity_type = 'lesson_complete' AND p_module_id IS NOT NULL THEN
    -- Lesson completion: calculate XP as module XP divided by number of lessons
    SELECT COALESCE(m.xp_reward, 100) INTO v_module_xp
    FROM public.modules m
    WHERE m.id = p_module_id;
    
    -- Count lessons in the module
    SELECT COUNT(*) INTO v_lesson_count
    FROM public.lessons
    WHERE module_id = p_module_id;
    
    -- Calculate lesson XP: module XP / number of lessons
    -- If no lessons found, default to 50 XP
    IF v_lesson_count > 0 THEN
      v_base_xp := v_module_xp / v_lesson_count;
    ELSE
      v_base_xp := 50; -- Default fallback if no lessons found
    END IF;
    
    v_xp_earned := v_base_xp;
  ELSIF p_activity_type = 'lesson_complete' THEN
    -- Lesson completion without module_id: default to 50 XP
    v_xp_earned := 50;
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

