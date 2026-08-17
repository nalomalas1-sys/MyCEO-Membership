-- Migration: Update update_child_avatar to also handle profile_picture_url

CREATE OR REPLACE FUNCTION update_child_avatar(
  p_child_id UUID,
  p_avatar_config JSONB
)
RETURNS VOID AS $$
BEGIN
  UPDATE public.children
  SET avatar_config = p_avatar_config,
      -- Only update profile_picture_url when a custom image URL is provided
      profile_picture_url = COALESCE(p_avatar_config->>'customImageUrl', profile_picture_url),
      updated_at = NOW()
  WHERE id = p_child_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

