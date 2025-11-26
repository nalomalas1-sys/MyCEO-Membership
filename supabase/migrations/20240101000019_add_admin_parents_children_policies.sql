-- Migration to add RLS policies for admins to view and manage all parents and children
-- This allows admins to see all users in the admin user management page

-- Admins can view all parents
CREATE POLICY "Admins can view all parents"
  ON public.parents FOR SELECT
  USING (public.is_admin());

-- Admins can update all parents (for managing subscriptions, trials, etc.)
CREATE POLICY "Admins can update all parents"
  ON public.parents FOR UPDATE
  USING (public.is_admin());

-- Admins can view all children
CREATE POLICY "Admins can view all children"
  ON public.children FOR SELECT
  USING (public.is_admin());

-- Admins can update all children (for support purposes)
CREATE POLICY "Admins can update all children"
  ON public.children FOR UPDATE
  USING (public.is_admin());



