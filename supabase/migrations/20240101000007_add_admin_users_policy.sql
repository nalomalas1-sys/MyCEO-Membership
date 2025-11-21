-- Migration to add RLS policy for admins to view all users
-- This helps with admin dashboard and login redirect functionality

-- First, create a SECURITY DEFINER function to check admin role
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

