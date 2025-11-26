-- Add specialty field to companies table for customization
ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS specialty TEXT;

-- Add comment
COMMENT ON COLUMN public.companies.specialty IS 'The business specialty or industry focus of the company (e.g., Technology, Food & Beverage, Fashion, etc.)';



