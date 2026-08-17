-- Add reply support to chat_messages
ALTER TABLE public.chat_messages
  ADD COLUMN IF NOT EXISTS reply_to_id UUID REFERENCES public.chat_messages(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS reply_to_name TEXT,
  ADD COLUMN IF NOT EXISTS reply_to_content TEXT;

-- Update the send_chat_message RPC to support replies
CREATE OR REPLACE FUNCTION public.send_chat_message(
  p_conversation_id UUID,
  p_child_id UUID,
  p_content TEXT,
  p_reply_to_id UUID DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
  v_child_name TEXT;
  v_is_participant BOOLEAN;
  v_last_msg_time TIMESTAMPTZ;
  v_clean_content TEXT;
  v_is_filtered BOOLEAN := false;
  v_msg_id UUID;
  v_reply_name TEXT;
  v_reply_content TEXT;
BEGIN
  SELECT name INTO v_child_name FROM public.children WHERE id = p_child_id;
  IF v_child_name IS NULL THEN
    RAISE EXCEPTION 'Child not found';
  END IF;

  SELECT EXISTS(
    SELECT 1 FROM public.chat_participants
    WHERE conversation_id = p_conversation_id AND child_id = p_child_id
  ) INTO v_is_participant;

  IF NOT v_is_participant THEN
    IF EXISTS(SELECT 1 FROM public.chat_conversations WHERE id = p_conversation_id AND type = 'topic_room') THEN
      INSERT INTO public.chat_participants (conversation_id, child_id)
      VALUES (p_conversation_id, p_child_id);
    ELSE
      RAISE EXCEPTION 'Not a participant';
    END IF;
  END IF;

  SELECT MAX(created_at) INTO v_last_msg_time
  FROM public.chat_messages
  WHERE sender_id = p_child_id;

  IF v_last_msg_time IS NOT NULL AND v_last_msg_time > NOW() - INTERVAL '3 seconds' THEN
    RAISE EXCEPTION 'Please wait a moment before sending another message';
  END IF;

  v_clean_content := TRIM(p_content);

  IF v_clean_content = '' THEN
    RAISE EXCEPTION 'Message cannot be empty';
  END IF;

  IF v_clean_content ~* 'https?://|www\.' THEN
    v_is_filtered := true;
  END IF;

  IF v_clean_content ~ '\+?6?0\d[\d\s\-]{7,}' THEN
    v_is_filtered := true;
  END IF;

  IF v_clean_content ~* '[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}' THEN
    v_is_filtered := true;
  END IF;

  -- Fetch reply info if replying
  IF p_reply_to_id IS NOT NULL THEN
    SELECT sender_name, LEFT(content, 100)
    INTO v_reply_name, v_reply_content
    FROM public.chat_messages
    WHERE id = p_reply_to_id;
  END IF;

  IF v_is_filtered THEN
    INSERT INTO public.chat_messages (conversation_id, sender_id, sender_name, content, is_filtered, reply_to_id, reply_to_name, reply_to_content)
    VALUES (p_conversation_id, p_child_id, v_child_name, '[Message filtered]', true, p_reply_to_id, v_reply_name, v_reply_content)
    RETURNING id INTO v_msg_id;
  ELSE
    INSERT INTO public.chat_messages (conversation_id, sender_id, sender_name, content, is_filtered, reply_to_id, reply_to_name, reply_to_content)
    VALUES (p_conversation_id, p_child_id, v_child_name, v_clean_content, false, p_reply_to_id, v_reply_name, v_reply_content)
    RETURNING id INTO v_msg_id;
  END IF;

  UPDATE public.chat_participants
  SET last_read_at = NOW()
  WHERE conversation_id = p_conversation_id AND child_id = p_child_id;

  RETURN jsonb_build_object('id', v_msg_id, 'filtered', v_is_filtered);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
