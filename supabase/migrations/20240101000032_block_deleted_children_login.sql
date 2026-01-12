-- Migration to block soft-deleted children from logging in
-- This updates the check_parent_subscription_by_access_code function to exclude
-- children with a non-null deleted_at timestamp

-- Update the function to check subscription by access code (for login flow)
-- Now also checks that the child is not soft-deleted
CREATE OR REPLACE FUNCTION public.check_parent_subscription_by_access_code(p_access_code TEXT)
RETURNS TABLE(
  child_id UUID,
  child_name TEXT,
  access_code TEXT,
  parent_subscription_status TEXT,
  subscription_valid BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id AS child_id,
    c.name AS child_name,
    c.access_code,
    p.subscription_status AS parent_subscription_status,
    (p.subscription_status IN ('active', 'trialing')) AS subscription_valid
  FROM public.children c
  INNER JOIN public.parents p ON p.id = c.parent_id
  WHERE c.access_code = p_access_code
    AND c.deleted_at IS NULL;  -- Block soft-deleted children from logging in
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Also update the check_parent_subscription_for_child function to be consistent
CREATE OR REPLACE FUNCTION public.check_parent_subscription_for_child(p_child_id UUID)
RETURNS TABLE(
  child_id UUID,
  child_name TEXT,
  access_code TEXT,
  parent_subscription_status TEXT,
  subscription_valid BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id AS child_id,
    c.name AS child_name,
    c.access_code,
    p.subscription_status AS parent_subscription_status,
    (p.subscription_status IN ('active', 'trialing')) AS subscription_valid
  FROM public.children c
  INNER JOIN public.parents p ON p.id = c.parent_id
  WHERE c.id = p_child_id
    AND c.deleted_at IS NULL;  -- Block soft-deleted children from being accessed
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
