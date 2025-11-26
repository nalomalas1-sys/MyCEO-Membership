-- Automatically update module progress when lessons are completed
-- This ensures module progress always reflects the actual lesson completion status

-- Function to update module progress when lesson progress changes
CREATE OR REPLACE FUNCTION update_module_progress_on_lesson_complete()
RETURNS TRIGGER AS $$
DECLARE
  v_module_id UUID;
  v_child_id UUID;
  v_total_lessons INTEGER;
  v_completed_lessons INTEGER;
  v_progress_percentage INTEGER;
  v_is_complete BOOLEAN;
  v_current_status TEXT;
  v_completed_at TIMESTAMPTZ;
BEGIN
  -- Only process if lesson is being marked as completed
  IF NEW.is_completed = true AND (OLD.is_completed IS NULL OR OLD.is_completed = false) THEN
    -- Get the module_id for this lesson
    SELECT module_id INTO v_module_id
    FROM public.lessons
    WHERE id = NEW.lesson_id;
    
    -- If no module found, exit
    IF v_module_id IS NULL THEN
      RETURN NEW;
    END IF;
    
    v_child_id := NEW.child_id;
    
    -- Get total lessons in module
    SELECT COUNT(*) INTO v_total_lessons
    FROM public.lessons
    WHERE module_id = v_module_id;
    
    -- If no lessons in module, exit
    IF v_total_lessons = 0 THEN
      RETURN NEW;
    END IF;
    
    -- Get completed lessons count
    SELECT COUNT(*) INTO v_completed_lessons
    FROM public.child_lesson_progress
    WHERE child_id = v_child_id
      AND lesson_id IN (SELECT id FROM public.lessons WHERE module_id = v_module_id)
      AND is_completed = true;
    
    -- Calculate progress percentage
    v_progress_percentage := ROUND((v_completed_lessons::DECIMAL / v_total_lessons) * 100);
    v_is_complete := (v_progress_percentage = 100);
    
    -- Get current module progress status
    SELECT status, completed_at INTO v_current_status, v_completed_at
    FROM public.child_module_progress
    WHERE child_id = v_child_id AND module_id = v_module_id;
    
    -- Upsert module progress
    INSERT INTO public.child_module_progress (
      child_id,
      module_id,
      status,
      progress_percentage,
      started_at,
      completed_at,
      updated_at
    )
    VALUES (
      v_child_id,
      v_module_id,
      CASE 
        WHEN v_is_complete THEN 'completed'
        WHEN v_current_status = 'not_started' OR v_current_status IS NULL THEN 'in_progress'
        ELSE 'in_progress'
      END,
      v_progress_percentage,
      CASE 
        WHEN v_current_status = 'not_started' OR v_current_status IS NULL THEN NOW()
        ELSE (SELECT started_at FROM public.child_module_progress WHERE child_id = v_child_id AND module_id = v_module_id)
      END,
      CASE 
        WHEN v_is_complete AND (v_completed_at IS NULL) THEN NOW()
        ELSE v_completed_at
      END,
      NOW()
    )
    ON CONFLICT (child_id, module_id)
    DO UPDATE SET
      status = CASE 
        WHEN v_is_complete THEN 'completed'
        ELSE 'in_progress'
      END,
      progress_percentage = v_progress_percentage,
      completed_at = CASE 
        WHEN v_is_complete AND (child_module_progress.completed_at IS NULL) THEN NOW()
        ELSE child_module_progress.completed_at
      END,
      updated_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on child_lesson_progress table
DROP TRIGGER IF EXISTS trigger_update_module_progress_on_lesson_complete ON public.child_lesson_progress;

CREATE TRIGGER trigger_update_module_progress_on_lesson_complete
  AFTER INSERT OR UPDATE OF is_completed ON public.child_lesson_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_module_progress_on_lesson_complete();

-- Add comment
COMMENT ON FUNCTION update_module_progress_on_lesson_complete() IS 
  'Automatically updates child_module_progress when a lesson is marked as completed. Calculates progress percentage and updates module status based on completed lessons.';



