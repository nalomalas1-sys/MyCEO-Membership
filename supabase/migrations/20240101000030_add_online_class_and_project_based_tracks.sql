-- Migration to add 'project_based' and 'online_class' to modules.track constraint
-- This updates the CHECK constraint to allow all track types used in the application

-- Drop the existing constraint
ALTER TABLE public.modules 
DROP CONSTRAINT IF EXISTS modules_track_check;

-- Add the new constraint with all track values
ALTER TABLE public.modules 
ADD CONSTRAINT modules_track_check 
CHECK (track IN ('money_basics', 'entrepreneurship', 'advanced', 'project_based', 'online_class'));

