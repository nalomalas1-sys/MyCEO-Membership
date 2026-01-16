-- Migration: Add module locking feature
-- This allows admins to lock modules so children can see but not access them
-- The lock applies globally to all children

-- Add is_locked column to modules table
ALTER TABLE public.modules 
ADD COLUMN IF NOT EXISTS is_locked BOOLEAN DEFAULT false;

-- Create an index for the is_locked column
CREATE INDEX IF NOT EXISTS idx_modules_is_locked ON public.modules(is_locked);
