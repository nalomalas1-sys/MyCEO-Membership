-- Add soft delete support to children table
ALTER TABLE public.children
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Create index for filtering non-deleted children
CREATE INDEX IF NOT EXISTS idx_children_deleted_at ON public.children(deleted_at) WHERE deleted_at IS NULL;

-- Update RLS policies to exclude soft-deleted children
-- The existing policies should already work, but we'll add a check
DROP POLICY IF EXISTS "Parents can view their own children" ON public.children;
CREATE POLICY "Parents can view their own children" ON public.children
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM public.parents WHERE id = parent_id
    )
    AND deleted_at IS NULL
  );

DROP POLICY IF EXISTS "Parents can update their own children" ON public.children;
CREATE POLICY "Parents can update their own children" ON public.children
  FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT user_id FROM public.parents WHERE id = parent_id
    )
    AND deleted_at IS NULL
  );

-- Add function to automatically delete after 30 days
CREATE OR REPLACE FUNCTION public.cleanup_deleted_children()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.children
  WHERE deleted_at IS NOT NULL
    AND deleted_at < NOW() - INTERVAL '30 days';
END;
$$;

-- Create a scheduled job (requires pg_cron extension)
-- This would typically be set up via Supabase dashboard or cron job
-- For now, we'll just create the function




