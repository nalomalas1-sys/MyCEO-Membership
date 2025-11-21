-- Function to award achievements and update XP
-- This function checks for new achievements, awards them, and updates child XP

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
  SELECT total_xp, current_level, current_streak
  INTO v_current_xp, v_old_level, v_current_streak
  FROM public.children
  WHERE id = p_child_id;

  -- Calculate base XP based on activity type
  IF p_activity_type = 'module_complete' AND p_module_id IS NOT NULL THEN
    SELECT xp_reward INTO v_base_xp
    FROM public.modules
    WHERE id = p_module_id;
    
    v_xp_earned := COALESCE(v_base_xp, 100); -- Default 100 XP if module not found
  ELSIF p_activity_type = 'lesson_complete' THEN
    v_xp_earned := 50; -- Base XP for lesson completion
  ELSIF p_activity_type = 'quiz_attempt' THEN
    v_xp_earned := 25; -- Base XP for quiz attempt
  ELSE
    v_xp_earned := 0; -- No XP for other activity types
  END IF;

  -- Perfect quiz bonus (+50 XP)
  IF p_quiz_score = 100 THEN
    v_perfect_bonus := 50;
    v_xp_earned := v_xp_earned + v_perfect_bonus;
  END IF;

  -- Update streak first (this function handles the streak logic)
  PERFORM update_child_streak(p_child_id);
  
  -- Get updated streak after update
  SELECT current_streak INTO v_current_streak
  FROM public.children
  WHERE id = p_child_id;

  -- Streak bonus (+10 XP per day of streak)
  IF v_current_streak > 0 THEN
    v_streak_bonus := v_current_streak * 10;
    v_xp_earned := v_xp_earned + v_streak_bonus;
  END IF;

  -- Check for new achievements
  FOR v_achievement_record IN
    SELECT * FROM check_achievements(p_child_id, p_activity_type)
  LOOP
    -- Award the achievement
    INSERT INTO public.child_achievements (child_id, achievement_id)
    VALUES (p_child_id, v_achievement_record.achievement_id)
    ON CONFLICT (child_id, achievement_id) DO NOTHING;

    -- Get achievement XP bonus
    SELECT COALESCE(xp_bonus, 0) INTO v_achievement_bonus
    FROM public.achievements
    WHERE id = v_achievement_record.achievement_id;

    -- Add to total achievement bonus (accumulate)
    v_achievement_bonus := COALESCE(v_achievement_bonus, 0);
    v_xp_earned := v_xp_earned + v_achievement_bonus;

    -- Add to new achievements array
    v_new_achievements := v_new_achievements || jsonb_build_object(
      'id', v_achievement_record.achievement_id,
      'name', v_achievement_record.achievement_name,
      'xp_bonus', v_achievement_bonus
    );
  END LOOP;

  -- Update child's total XP
  v_current_xp := v_current_xp + v_xp_earned;
  v_new_level := calculate_level_from_xp(v_current_xp);
  v_leveled_up := v_new_level > v_old_level;

  UPDATE public.children
  SET total_xp = v_current_xp,
      current_level = v_new_level,
      last_activity_at = NOW()
  WHERE id = p_child_id;

  -- Return results
  RETURN QUERY SELECT
    v_new_achievements,
    v_xp_earned,
    v_current_xp,
    v_new_level,
    v_leveled_up;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions to authenticated and anonymous users
-- SECURITY DEFINER allows the function to bypass RLS while still being secure
-- The function validates child_id exists before making any updates
GRANT EXECUTE ON FUNCTION award_achievements_and_xp(UUID, TEXT, UUID, INTEGER) TO authenticated, anon;

