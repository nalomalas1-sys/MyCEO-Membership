-- Add DELETE policy for admins on modules table
-- This allows admins to delete modules (and their associated lessons via CASCADE)

CREATE POLICY "Admins can delete modules"
  ON public.modules FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );


