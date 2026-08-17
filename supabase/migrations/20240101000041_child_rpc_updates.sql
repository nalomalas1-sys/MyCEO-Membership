-- Functions for children to update their own data safely bypassing RLS
-- Since children use anon role with access codes, they cannot update the children table directly

-- Function to update avatar config
CREATE OR REPLACE FUNCTION update_child_avatar(
  p_child_id UUID,
  p_avatar_config JSONB
)
RETURNS VOID AS $$
BEGIN
  UPDATE public.children
  SET avatar_config = p_avatar_config,
      updated_at = NOW()
  WHERE id = p_child_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to add XP to a child and automatically handle level ups
CREATE OR REPLACE FUNCTION add_xp_to_child(
  p_child_id UUID,
  p_xp_amount INTEGER
)
RETURNS JSONB AS $$
DECLARE
  v_current_xp INTEGER;
  v_current_level INTEGER;
  v_new_xp INTEGER;
  v_new_level INTEGER;
  v_result JSONB;
BEGIN
  -- Get current stats
  SELECT total_xp, current_level INTO v_current_xp, v_current_level
  FROM public.children
  WHERE id = p_child_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Child not found';
  END IF;

  v_new_xp := COALESCE(v_current_xp, 0) + p_xp_amount;
  v_new_level := calculate_level_from_xp(v_new_xp);

  -- Update child
  UPDATE public.children
  SET total_xp = v_new_xp,
      current_level = v_new_level,
      updated_at = NOW()
  WHERE id = p_child_id;

  -- If leveled up, create notification
  IF v_new_level > COALESCE(v_current_level, 1) THEN
    INSERT INTO public.notifications (child_id, notification_type, title, message, data)
    VALUES (
      p_child_id, 
      'level_up', 
      'Level Up!', 
      'You reached Level ' || v_new_level || '! Keep up the great work!', 
      json_build_object('level', v_new_level)::jsonb
    );
  END IF;

  v_result := json_build_object(
    'total_xp', v_new_xp,
    'current_level', v_new_level,
    'leveled_up', v_new_level > COALESCE(v_current_level, 1)
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
