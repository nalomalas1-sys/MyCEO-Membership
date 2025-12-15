-- Migration to add function for checking parent subscription status during child login
-- This allows anonymous users to verify if a child's parent has an active subscription

-- Create a function to check if a child's parent has an active subscription
-- This function uses SECURITY DEFINER to bypass RLS and check parent subscription status
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
  WHERE c.id = p_child_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to anonymous users
GRANT EXECUTE ON FUNCTION public.check_parent_subscription_for_child(UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.check_parent_subscription_for_child(UUID) TO authenticated;

-- Also create a function to check subscription by access code (for login flow)
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
  WHERE c.access_code = p_access_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to anonymous users
GRANT EXECUTE ON FUNCTION public.check_parent_subscription_by_access_code(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.check_parent_subscription_by_access_code(TEXT) TO authenticated;

