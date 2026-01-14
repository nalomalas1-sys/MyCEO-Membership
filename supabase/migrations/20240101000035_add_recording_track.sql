-- Add 'recording' to the modules track enum
-- Drop and recreate the check constraint to include 'recording' type
ALTER TABLE public.modules 
DROP CONSTRAINT IF EXISTS modules_track_check;

ALTER TABLE public.modules 
ADD CONSTRAINT modules_track_check 
CHECK (track IN ('money_basics', 'entrepreneurship', 'advanced', 'project_based', 'online_class', 'recording'));
