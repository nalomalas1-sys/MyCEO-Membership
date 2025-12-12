-- Create feature_flags table for managing application features
CREATE TABLE IF NOT EXISTS public.feature_flags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  enabled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can read feature flags (needed for frontend)
CREATE POLICY "Public read access for feature flags"
  ON public.feature_flags FOR SELECT
  USING (true);

-- Policy: Only admins can insert feature flags
CREATE POLICY "Admins can insert feature flags"
  ON public.feature_flags FOR INSERT
  WITH CHECK (public.is_admin());

-- Policy: Only admins can update feature flags
CREATE POLICY "Admins can update feature flags"
  ON public.feature_flags FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Policy: Only admins can delete feature flags
CREATE POLICY "Admins can delete feature flags"
  ON public.feature_flags FOR DELETE
  USING (public.is_admin());

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_feature_flags_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_feature_flags_updated_at
  BEFORE UPDATE ON public.feature_flags
  FOR EACH ROW
  EXECUTE FUNCTION update_feature_flags_updated_at();

-- Insert default feature flags
INSERT INTO public.feature_flags (name, description, enabled) VALUES
  ('marketplace', 'Enable marketplace feature for children to buy/sell items', true),
  ('company', 'Enable company building feature for children', true)
ON CONFLICT (name) DO NOTHING;




