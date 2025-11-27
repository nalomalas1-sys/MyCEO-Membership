-- Add quantity field to marketplace_items table
ALTER TABLE public.marketplace_items
ADD COLUMN IF NOT EXISTS quantity INTEGER DEFAULT 1 CHECK (quantity >= 0);

-- Update existing items to have quantity 1 if they are available, 0 if sold
UPDATE public.marketplace_items
SET quantity = CASE 
  WHEN status = 'available' THEN 1
  WHEN status = 'sold' THEN 0
  ELSE 0
END
WHERE quantity IS NULL;

-- Set default to 1 for new items
ALTER TABLE public.marketplace_items
ALTER COLUMN quantity SET DEFAULT 1;



