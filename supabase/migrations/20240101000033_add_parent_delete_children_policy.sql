-- Add DELETE policy for children table
-- This allows parents to permanently delete their own children

CREATE POLICY "Parents can delete their own children"
  ON public.children FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.parents
      WHERE parents.id = children.parent_id
      AND parents.user_id = auth.uid()
    )
  );
