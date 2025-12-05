-- Migration to update trial period from 1 day to 30 days
-- Updates the handle_new_parent function to set 30-day trial period

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

