-- Learning tracks: admin-managed track list for modules.
-- Allows admin to create new tracks without code changes.

CREATE TABLE IF NOT EXISTS public.learning_tracks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT '📚',
  theme_key TEXT NOT NULL DEFAULT 'gray' CHECK (theme_key IN ('gray', 'purple', 'green', 'cyan', 'red', 'indigo')),
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed existing tracks (all current module.track values must exist for FK)
INSERT INTO public.learning_tracks (slug, name, icon, theme_key, order_index)
VALUES
  ('entrepreneurship', 'Interactive Games', '🎮', 'purple', 1),
  ('project_based', 'Project Based', '🔨', 'green', 2),
  ('online_class', 'Online Class', '💻', 'cyan', 3),
  ('recording', 'Recording', '🎥', 'red', 4),
  ('money_basics', 'Money Basics', '💰', 'gray', 5),
  ('advanced', 'Advanced', '📚', 'gray', 6)
ON CONFLICT (slug) DO NOTHING;

ALTER TABLE public.modules DROP CONSTRAINT IF EXISTS modules_track_check;
ALTER TABLE public.modules
  ADD CONSTRAINT modules_track_fkey
  FOREIGN KEY (track) REFERENCES public.learning_tracks(slug) ON DELETE RESTRICT;

ALTER TABLE public.learning_tracks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "learning_tracks_select"
  ON public.learning_tracks FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "learning_tracks_admin_all"
  ON public.learning_tracks FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'));

CREATE OR REPLACE FUNCTION public.set_learning_tracks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS learning_tracks_updated_at ON public.learning_tracks;
CREATE TRIGGER learning_tracks_updated_at
  BEFORE UPDATE ON public.learning_tracks
  FOR EACH ROW EXECUTE FUNCTION public.set_learning_tracks_updated_at();
