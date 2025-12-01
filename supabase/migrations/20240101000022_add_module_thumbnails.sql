-- Add thumbnail_url column to modules table
ALTER TABLE public.modules
ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;

-- Create storage bucket for module thumbnails if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('module-thumbnails', 'module-thumbnails', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist (to allow re-running migration)
DROP POLICY IF EXISTS "Public read access for module thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload module thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update module thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete module thumbnails" ON storage.objects;

-- Create storage policy to allow public read access
CREATE POLICY "Public read access for module thumbnails"
ON storage.objects FOR SELECT
USING (bucket_id = 'module-thumbnails');

-- Create storage policy to allow authenticated users to upload thumbnails
CREATE POLICY "Authenticated users can upload module thumbnails"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'module-thumbnails' AND
  auth.role() = 'authenticated'
);

-- Create storage policy to allow authenticated users to update thumbnails
CREATE POLICY "Authenticated users can update module thumbnails"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'module-thumbnails' AND
  auth.role() = 'authenticated'
);

-- Create storage policy to allow authenticated users to delete thumbnails
CREATE POLICY "Authenticated users can delete module thumbnails"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'module-thumbnails' AND
  auth.role() = 'authenticated'
);

