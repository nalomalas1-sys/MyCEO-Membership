-- Fix RLS policy to allow parents to soft-delete their children
-- The issue: The UPDATE policy only had a USING clause checking deleted_at IS NULL,
-- which prevented setting deleted_at to a non-null value (soft delete).
-- Solution: Add a WITH CHECK clause that allows updates even when deleted_at is being set.

DROP POLICY IF EXISTS "Parents can update their own children" ON public.children;

CREATE POLICY "Parents can update their own children" ON public.children
  FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT user_id FROM public.parents WHERE id = parent_id
    )
    AND deleted_at IS NULL
  )
  WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM public.parents WHERE id = parent_id
    )
    -- Allow updates even when deleted_at is being set (for soft delete)
    -- This allows parents to update their children and also soft-delete them
  );

