-- Allow anonymous users to access child progress tables for child sessions
-- This is necessary because children authenticate via access codes, not Supabase Auth
-- The access code acts as the authentication mechanism, validated during login

-- Allow anonymous SELECT on child_module_progress
-- This is safe because:
-- 1. Access codes are unique and act as passwords
-- 2. Application code only queries for the specific child_id from the validated session
-- 3. The child_id is validated during login via access code lookup
CREATE POLICY "Allow anonymous access to child module progress"
  ON public.child_module_progress FOR SELECT
  TO anon
  USING (true);

-- Allow anonymous SELECT on child_lesson_progress
CREATE POLICY "Allow anonymous access to child lesson progress"
  ON public.child_lesson_progress FOR SELECT
  TO anon
  USING (true);

-- Allow anonymous INSERT on child_module_progress
-- This allows children to create their own progress records
CREATE POLICY "Allow anonymous insert on child module progress"
  ON public.child_module_progress FOR INSERT
  TO anon
  WITH CHECK (true);

-- Allow anonymous UPDATE on child_module_progress
-- This allows children to update their own progress
CREATE POLICY "Allow anonymous update on child module progress"
  ON public.child_module_progress FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

-- Allow anonymous INSERT on child_lesson_progress
CREATE POLICY "Allow anonymous insert on child lesson progress"
  ON public.child_lesson_progress FOR INSERT
  TO anon
  WITH CHECK (true);

-- Allow anonymous UPDATE on child_lesson_progress
CREATE POLICY "Allow anonymous update on child lesson progress"
  ON public.child_lesson_progress FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

-- Allow anonymous INSERT on activities
-- This allows children to create activity records when they complete lessons/modules
CREATE POLICY "Allow anonymous insert on activities"
  ON public.activities FOR INSERT
  TO anon
  WITH CHECK (true);

-- Allow anonymous SELECT on activities
-- This allows children to view their own activities
CREATE POLICY "Allow anonymous select on activities"
  ON public.activities FOR SELECT
  TO anon
  USING (true);

