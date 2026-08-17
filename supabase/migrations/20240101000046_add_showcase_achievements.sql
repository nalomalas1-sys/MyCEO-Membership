-- Add showcase column to children table
ALTER TABLE public.children
  ADD COLUMN IF NOT EXISTS showcase_achievement_ids JSONB DEFAULT '[]'::jsonb;

-- RPC: Children can update their showcase (only earned achievements, max 5)
CREATE OR REPLACE FUNCTION public.update_child_showcase_achievements(
  p_child_id UUID,
  p_achievement_ids UUID[]
)
RETURNS VOID AS $$
DECLARE
  v_earned_count INT;
  v_input_count INT;
BEGIN
  v_input_count := COALESCE(array_length(p_achievement_ids, 1), 0);

  IF v_input_count > 5 THEN
    RAISE EXCEPTION 'Maximum 5 showcase badges allowed';
  END IF;

  IF v_input_count = 0 THEN
    UPDATE public.children
    SET showcase_achievement_ids = '[]'::jsonb, updated_at = NOW()
    WHERE id = p_child_id;
    RETURN;
  END IF;

  -- Count how many of the requested IDs are actually earned by this child
  SELECT COUNT(*) INTO v_earned_count
  FROM unnest(p_achievement_ids) AS aid
  WHERE EXISTS (
    SELECT 1 FROM public.child_achievements ca
    WHERE ca.child_id = p_child_id AND ca.achievement_id = aid
  );

  IF v_earned_count != v_input_count THEN
    RAISE EXCEPTION 'All showcase achievements must be earned by this child';
  END IF;

  UPDATE public.children
  SET showcase_achievement_ids = (
    SELECT COALESCE(jsonb_agg(elem ORDER BY ord), '[]'::jsonb)
    FROM unnest(p_achievement_ids) WITH ORDINALITY AS t(elem, ord)
  ),
  updated_at = NOW()
  WHERE id = p_child_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
