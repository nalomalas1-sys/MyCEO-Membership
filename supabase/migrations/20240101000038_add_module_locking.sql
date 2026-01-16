-- Migration: Add module locking feature
-- This allows parents to lock modules so children can see but not access them

-- Create child_locked_modules table
CREATE TABLE IF NOT EXISTS public.child_locked_modules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  locked_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  locked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(child_id, module_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_child_locked_modules_child_id ON public.child_locked_modules(child_id);
CREATE INDEX IF NOT EXISTS idx_child_locked_modules_module_id ON public.child_locked_modules(module_id);

-- RLS policies
ALTER TABLE public.child_locked_modules ENABLE ROW LEVEL SECURITY;

-- Parents can view locked modules for their children
CREATE POLICY "Parents can view their children's locked modules"
  ON public.child_locked_modules
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.children c
      JOIN public.parents p ON c.parent_id = p.id
      WHERE c.id = child_locked_modules.child_id
      AND p.user_id = auth.uid()
    )
  );

-- Parents can insert locked modules for their children
CREATE POLICY "Parents can lock modules for their children"
  ON public.child_locked_modules
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.children c
      JOIN public.parents p ON c.parent_id = p.id
      WHERE c.id = child_locked_modules.child_id
      AND p.user_id = auth.uid()
    )
  );

-- Parents can delete (unlock) locked modules for their children
CREATE POLICY "Parents can unlock modules for their children"
  ON public.child_locked_modules
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.children c
      JOIN public.parents p ON c.parent_id = p.id
      WHERE c.id = child_locked_modules.child_id
      AND p.user_id = auth.uid()
    )
  );

-- Admins can view all locked modules
CREATE POLICY "Admins can view all locked modules"
  ON public.child_locked_modules
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- Admins can insert locked modules
CREATE POLICY "Admins can lock modules"
  ON public.child_locked_modules
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- Admins can delete (unlock) locked modules
CREATE POLICY "Admins can unlock modules"
  ON public.child_locked_modules
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- Allow anonymous access for child login (children need to check if modules are locked)
CREATE POLICY "Anyone can view locked modules for anonymous child access"
  ON public.child_locked_modules
  FOR SELECT
  USING (true);
