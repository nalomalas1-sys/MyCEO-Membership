-- 20240101000044_create_challenge_runs.sql

-- 1) Table to store each Challenge Mode run
CREATE TABLE IF NOT EXISTS public.challenge_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  mode TEXT NOT NULL DEFAULT 'lightning_60s',
  num_questions INT NOT NULL,
  num_correct INT NOT NULL,
  best_streak INT NOT NULL,
  xp_earned INT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Basic index
CREATE INDEX IF NOT EXISTS idx_challenge_runs_child_id
  ON public.challenge_runs(child_id);

-- 2) RLS: only system functions can write; children will use RPC (SECURITY DEFINER)
ALTER TABLE public.challenge_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "System can manage challenge runs"
ON public.challenge_runs
FOR ALL
USING (true);

-- 3) RPC: finish a challenge run, award XP, and return summary + level info
CREATE OR REPLACE FUNCTION public.finish_challenge_run(
  p_child_id UUID,
  p_num_questions INT,
  p_num_correct INT,
  p_best_streak INT
)
RETURNS JSONB AS $$
DECLARE
  v_base_xp INT;
  v_bonus_xp INT;
  v_total_xp INT;
  v_add_xp_result JSONB;
BEGIN
  -- Base XP: 5 per correct answer
  v_base_xp := GREATEST(p_num_correct, 0) * 5;

  -- Streak bonus: stackable thresholds
  v_bonus_xp := 0;
  IF p_best_streak >= 3 THEN
    v_bonus_xp := v_bonus_xp + 5;
  END IF;
  IF p_best_streak >= 5 THEN
    v_bonus_xp := v_bonus_xp + 10;
  END IF;
  IF p_best_streak >= 10 THEN
    v_bonus_xp := v_bonus_xp + 25;
  END IF;

  v_total_xp := v_base_xp + v_bonus_xp;

  -- Insert run record
  INSERT INTO public.challenge_runs (
    child_id,
    mode,
    num_questions,
    num_correct,
    best_streak,
    xp_earned
  ) VALUES (
    p_child_id,
    'lightning_60s',
    p_num_questions,
    p_num_correct,
    p_best_streak,
    v_total_xp
  );

  -- Award XP using existing function (updates total_xp, level, etc.)
  v_add_xp_result := public.add_xp_to_child(p_child_id, v_total_xp);

  -- Optionally: also log to activities for analytics
  INSERT INTO public.activities (
    child_id,
    activity_type,
    xp_earned
  ) VALUES (
    p_child_id,
    'challenge_mode',
    v_total_xp
  );

  RETURN jsonb_build_object(
    'xp_earned', v_total_xp,
    'base_xp', v_base_xp,
    'bonus_xp', v_bonus_xp,
    'num_questions', p_num_questions,
    'num_correct', p_num_correct,
    'best_streak', p_best_streak
  ) || v_add_xp_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;