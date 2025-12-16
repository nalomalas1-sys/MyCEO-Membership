-- Allow parents to view and restore deleted children
-- Update SELECT policy to allow viewing deleted children (for restore functionality)
DROP POLICY IF EXISTS "Parents can view their own children" ON public.children;

CREATE POLICY "Parents can view their own children" ON public.children
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM public.parents WHERE id = parent_id
    )
    -- Allow viewing both active and deleted children (for restore functionality)
  );

-- Update UPDATE policy to allow restoring deleted children
-- The USING clause should allow updating deleted children (for restore)
DROP POLICY IF EXISTS "Parents can update their own children" ON public.children;

CREATE POLICY "Parents can update their own children" ON public.children
  FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT user_id FROM public.parents WHERE id = parent_id
    )
    -- Allow updating both active and deleted children (for restore functionality)
  )
  WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM public.parents WHERE id = parent_id
    )
    -- Allow updates including setting deleted_at back to NULL (restore)
  );

