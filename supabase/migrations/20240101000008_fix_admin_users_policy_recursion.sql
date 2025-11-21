-- Fix infinite recursion in admin users policy
-- This migration drops the problematic policy and recreates it using a SECURITY DEFINER function

-- Drop the problematic policy if it exists
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;

-- Create a SECURITY DEFINER function to check admin role
-- SECURITY DEFINER functions run with the privileges of the function owner (postgres),
-- which bypasses RLS and prevents infinite recursion
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- This query bypasses RLS because the function runs with postgres privileges
  SELECT role INTO user_role
  FROM public.users
  WHERE id = auth.uid();
  
  RETURN COALESCE(user_role = 'admin', false);
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- Now create the policy using the function
-- This avoids infinite recursion because the function bypasses RLS
CREATE POLICY "Admins can view all users"
  ON public.users FOR SELECT
  USING (public.is_admin());

