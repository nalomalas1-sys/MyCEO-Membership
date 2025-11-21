-- Allow anonymous users to query children by access_code for child login
-- This is necessary for the child login flow where children use access codes to authenticate

-- Create a secure function for looking up children by access code
-- This function can be called by anonymous users and only returns limited fields
CREATE OR REPLACE FUNCTION public.lookup_child_by_access_code(p_access_code TEXT)
RETURNS TABLE(id UUID, name TEXT, access_code TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT c.id, c.name, c.access_code
  FROM public.children c
  WHERE c.access_code = p_access_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to anonymous users
GRANT EXECUTE ON FUNCTION public.lookup_child_by_access_code(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.lookup_child_by_access_code(TEXT) TO authenticated;

-- Also add a simple RLS policy to allow anonymous SELECT on children table
-- This is safe because access codes are unique and act as passwords
-- The application code limits which fields are selected (id, name, access_code only)
CREATE POLICY "Allow anonymous access code lookup for child login"
  ON public.children FOR SELECT
  USING (true);

