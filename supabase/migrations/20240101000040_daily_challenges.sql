-- Daily Challenge Completions tracking table
-- Tracks which daily challenges a child has completed on a given day

CREATE TABLE IF NOT EXISTS public.daily_challenge_completions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  challenge_key TEXT NOT NULL,        -- e.g. 'complete_lesson', 'make_sale', 'earn_xp_50'
  challenge_date DATE NOT NULL DEFAULT CURRENT_DATE,
  xp_awarded INTEGER DEFAULT 0,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(child_id, challenge_key, challenge_date)
);

-- Index for fast lookups by child + date
CREATE INDEX IF NOT EXISTS idx_daily_challenge_child_date
  ON public.daily_challenge_completions(child_id, challenge_date);

-- RLS policies
ALTER TABLE public.daily_challenge_completions ENABLE ROW LEVEL SECURITY;

-- Allow anonymous read access (children use anon role)
CREATE POLICY "Anyone can read daily challenge completions"
  ON public.daily_challenge_completions
  FOR SELECT
  USING (true);

-- Allow anonymous insert (children track their own completions)
CREATE POLICY "Anyone can insert daily challenge completions"
  ON public.daily_challenge_completions
  FOR INSERT
  WITH CHECK (true);

-- Allow admin full access
CREATE POLICY "Admins can manage daily challenge completions"
  ON public.daily_challenge_completions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
