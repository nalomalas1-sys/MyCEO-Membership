-- Add stripe_registration feature flag
INSERT INTO public.feature_flags (name, description, enabled) 
VALUES ('stripe_registration', 'Require Stripe payment during signup', true)
ON CONFLICT (name) DO NOTHING;

