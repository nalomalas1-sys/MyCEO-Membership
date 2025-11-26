-- Database functions for business logic

-- Function to generate unique child access code
CREATE OR REPLACE FUNCTION generate_child_access_code()
RETURNS TEXT AS $$
DECLARE
  code TEXT;
  exists_check BOOLEAN;
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- Excludes O, 0, I, 1
  i INTEGER;
BEGIN
  LOOP
    code := '';
    FOR i IN 1..6 LOOP
      code := code || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
    END LOOP;
    
    -- Format as ABC-123
    code := upper(substr(code, 1, 3) || '-' || substr(code, 4, 3));
    
    -- Check if code already exists
    SELECT EXISTS(SELECT 1 FROM public.children WHERE access_code = code) INTO exists_check;
    
    EXIT WHEN NOT exists_check;
  END LOOP;
  
  RETURN code;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate child's level from XP
CREATE OR REPLACE FUNCTION calculate_level_from_xp(total_xp INTEGER)
RETURNS INTEGER AS $$
BEGIN
  CASE
    WHEN total_xp >= 8000 THEN RETURN 8;
    WHEN total_xp >= 4000 THEN RETURN 7;
    WHEN total_xp >= 2000 THEN RETURN 6;
    WHEN total_xp >= 1000 THEN RETURN 5;
    WHEN total_xp >= 500 THEN RETURN 4;
    WHEN total_xp >= 250 THEN RETURN 3;
    WHEN total_xp >= 100 THEN RETURN 2;
    ELSE RETURN 1;
  END CASE;
END;
$$ LANGUAGE plpgsql;

-- Function to update child level when XP changes
CREATE OR REPLACE FUNCTION update_child_level()
RETURNS TRIGGER AS $$
DECLARE
  new_level INTEGER;
BEGIN
  new_level := calculate_level_from_xp(NEW.total_xp);
  NEW.current_level := new_level;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update child level
CREATE TRIGGER update_child_level_trigger
  BEFORE UPDATE OF total_xp ON public.children
  FOR EACH ROW
  EXECUTE FUNCTION update_child_level();

-- Function to calculate module progress percentage
CREATE OR REPLACE FUNCTION calculate_module_progress(
  p_child_id UUID,
  p_module_id UUID
)
RETURNS INTEGER AS $$
DECLARE
  total_lessons INTEGER;
  completed_lessons INTEGER;
BEGIN
  -- Get total lessons in module
  SELECT COUNT(*) INTO total_lessons
  FROM public.lessons
  WHERE module_id = p_module_id;
  
  IF total_lessons = 0 THEN
    RETURN 0;
  END IF;
  
  -- Get completed lessons
  SELECT COUNT(*) INTO completed_lessons
  FROM public.child_lesson_progress
  WHERE child_id = p_child_id
    AND lesson_id IN (SELECT id FROM public.lessons WHERE module_id = p_module_id)
    AND is_completed = true;
  
  RETURN ROUND((completed_lessons::DECIMAL / total_lessons) * 100);
END;
$$ LANGUAGE plpgsql;

-- Function to check and award achievements
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
  
  SELECT c.current_streak INTO current_streak
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
    AND (a.criteria->>'revenue_threshold')::DECIMAL <= company_revenue
    AND NOT EXISTS (
      SELECT 1 FROM public.child_achievements ca
      WHERE ca.child_id = p_child_id AND ca.achievement_id = a.id
    );
END;
$$ LANGUAGE plpgsql;

-- Function to update streak
CREATE OR REPLACE FUNCTION update_child_streak(p_child_id UUID)
RETURNS VOID AS $$
DECLARE
  last_activity_date DATE;
  current_date DATE := CURRENT_DATE;
  current_streak_val INTEGER;
BEGIN
  SELECT last_activity_at::DATE, current_streak
  INTO last_activity_date, current_streak_val
  FROM public.children
  WHERE id = p_child_id;
  
  IF last_activity_date IS NULL THEN
    -- First activity
    UPDATE public.children
    SET current_streak = 1, last_activity_at = NOW()
    WHERE id = p_child_id;
  ELSIF last_activity_date = current_date THEN
    -- Already active today, no change
    RETURN;
  ELSIF last_activity_date = current_date - INTERVAL '1 day' THEN
    -- Consecutive day
    UPDATE public.children
    SET current_streak = current_streak_val + 1, last_activity_at = NOW()
    WHERE id = p_child_id;
  ELSE
    -- Streak broken, reset to 1
    UPDATE public.children
    SET current_streak = 1, last_activity_at = NOW()
    WHERE id = p_child_id;
  END IF;
END;
$$ LANGUAGE plpgsql;





