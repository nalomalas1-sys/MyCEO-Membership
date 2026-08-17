-- ============================================
-- Chat System: Topic Rooms (Phase 1)
-- ============================================

-- 1. Chat conversations table
CREATE TABLE IF NOT EXISTS public.chat_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL DEFAULT 'topic_room' CHECK (type IN ('topic_room', 'friend')),
  name TEXT NOT NULL,
  topic_slug TEXT UNIQUE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read conversations"
  ON public.chat_conversations FOR SELECT USING (true);

-- 2. Chat participants table
CREATE TABLE IF NOT EXISTS public.chat_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
  child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  last_read_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(conversation_id, child_id)
);

ALTER TABLE public.chat_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read participants"
  ON public.chat_participants FOR SELECT USING (true);

CREATE POLICY "Anyone can insert participants"
  ON public.chat_participants FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update participants"
  ON public.chat_participants FOR UPDATE USING (true);

-- 3. Chat messages table
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  sender_name TEXT NOT NULL,
  content TEXT NOT NULL CHECK (char_length(content) <= 500),
  is_filtered BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read messages"
  ON public.chat_messages FOR SELECT USING (true);

CREATE POLICY "System can insert messages"
  ON public.chat_messages FOR INSERT WITH CHECK (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation ON public.chat_messages(conversation_id, created_at);
CREATE INDEX IF NOT EXISTS idx_chat_participants_child ON public.chat_participants(child_id);

-- 4. RPC: send_chat_message (with word filter + rate limit)
CREATE OR REPLACE FUNCTION public.send_chat_message(
  p_conversation_id UUID,
  p_child_id UUID,
  p_content TEXT
) RETURNS JSONB AS $$
DECLARE
  v_child_name TEXT;
  v_is_participant BOOLEAN;
  v_last_msg_time TIMESTAMPTZ;
  v_clean_content TEXT;
  v_is_filtered BOOLEAN := false;
  v_msg_id UUID;
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

  IF v_is_filtered THEN
    INSERT INTO public.chat_messages (conversation_id, sender_id, sender_name, content, is_filtered)
    VALUES (p_conversation_id, p_child_id, v_child_name, '[Message filtered]', true)
    RETURNING id INTO v_msg_id;
  ELSE
    INSERT INTO public.chat_messages (conversation_id, sender_id, sender_name, content, is_filtered)
    VALUES (p_conversation_id, p_child_id, v_child_name, v_clean_content, false)
    RETURNING id INTO v_msg_id;
  END IF;

  UPDATE public.chat_participants
  SET last_read_at = NOW()
  WHERE conversation_id = p_conversation_id AND child_id = p_child_id;

  RETURN jsonb_build_object('id', v_msg_id, 'filtered', v_is_filtered);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Seed 4 topic rooms
INSERT INTO public.chat_conversations (type, name, topic_slug) VALUES
  ('topic_room', 'Business Ideas', 'business_ideas'),
  ('topic_room', 'Money Tips', 'money_tips'),
  ('topic_room', 'Challenge Talk', 'challenge_talk'),
  ('topic_room', 'General', 'general')
ON CONFLICT (topic_slug) DO NOTHING;

-- 6. Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;