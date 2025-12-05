-- Migration to fix user registration
-- Adds INSERT policies and triggers to automatically create user and parent records

-- Add INSERT policy for users table
-- Users can insert their own profile when they sign up
CREATE POLICY "Users can insert their own profile"
  ON public.users FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Add INSERT policy for parents table
-- Users can insert their own parent record when they sign up
CREATE POLICY "Users can insert their own parent record"
  ON public.parents FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Function to automatically create user record in public.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_email TEXT;
  user_full_name TEXT;
BEGIN
  -- Get email from auth.users
  user_email := NEW.email;
  
  -- Get full_name from user metadata if available
  user_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(user_email, '@', 1));
  
  -- Insert into public.users
  INSERT INTO public.users (id, email, full_name, role)
  VALUES (
    NEW.id,
    user_email,
    user_full_name,
    'parent' -- Default role for new signups
  )
  ON CONFLICT (id) DO NOTHING; -- Prevent errors if record already exists
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user record when auth user is created
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Function to automatically create parent record when user is created
CREATE OR REPLACE FUNCTION public.handle_new_parent()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create parent record if user role is 'parent'
  IF NEW.role = 'parent' THEN
    INSERT INTO public.parents (user_id, subscription_status, trial_ends_at)
    VALUES (
      NEW.id,
      'trialing',
      NOW() + INTERVAL '30 days' -- 30-day trial
    )
    ON CONFLICT (user_id) DO NOTHING; -- Prevent errors if record already exists
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create parent record when user is created
CREATE TRIGGER on_user_created
  AFTER INSERT ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_parent();



