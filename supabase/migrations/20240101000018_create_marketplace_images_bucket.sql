-- Create storage bucket for marketplace item images
-- This bucket will store product images for marketplace items
--
-- Created: 2024-01-01 00:00:18 UTC
-- Last Modified: 2024-01-01 00:00:18 UTC
--
-- NOTE: When making any adjustments to this migration, update the "Last Modified"
-- timestamp above and add/update timestamps for the specific sections being changed.

-- ============================================================================
-- BUCKET CREATION
-- ============================================================================
-- Timestamp: 2024-01-01 00:00:18 UTC
-- Create the bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'marketplace-images',
  'marketplace-images',
  true, -- Public bucket for easy access to marketplace images
  5242880, -- 5MB file size limit
  ARRAY[
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/jfif',
    'image/pjpeg'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- RLS POLICIES SETUP
-- ============================================================================
-- Timestamp: 2024-01-01 00:00:18 UTC
-- Enable RLS on the bucket
-- Note: RLS is automatically enabled on storage.objects, but we need policies

-- Drop existing policies if they exist (for idempotency)
-- Timestamp: 2024-01-01 00:00:18 UTC
DO $$
BEGIN
  -- Drop policies only if they exist to avoid notices
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Public can view marketplace images'
  ) THEN
    DROP POLICY "Public can view marketplace images" ON storage.objects;
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Children can upload marketplace images'
  ) THEN
    DROP POLICY "Children can upload marketplace images" ON storage.objects;
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Children can update marketplace images'
  ) THEN
    DROP POLICY "Children can update marketplace images" ON storage.objects;
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Children can delete marketplace images'
  ) THEN
    DROP POLICY "Children can delete marketplace images" ON storage.objects;
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Admins can manage marketplace images'
  ) THEN
    DROP POLICY "Admins can manage marketplace images" ON storage.objects;
  END IF;
END $$;

-- Policy: Anyone can view marketplace images (public read)
-- This allows marketplace images to be displayed
-- Timestamp: 2024-01-01 00:00:18 UTC
CREATE POLICY "Public can view marketplace images"
ON storage.objects FOR SELECT
USING (bucket_id = 'marketplace-images');

-- Policy: Children (anon role) can upload marketplace images
-- Since children use access codes instead of auth.uid(), we allow anon role to upload
-- Application logic verifies the child session
-- Timestamp: 2024-01-01 00:00:18 UTC
CREATE POLICY "Children can upload marketplace images"
ON storage.objects FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'marketplace-images');

-- Policy: Children can update marketplace images
-- Timestamp: 2024-01-01 00:00:18 UTC
CREATE POLICY "Children can update marketplace images"
ON storage.objects FOR UPDATE
TO anon, authenticated
USING (bucket_id = 'marketplace-images');

-- Policy: Children can delete marketplace images
-- Timestamp: 2024-01-01 00:00:18 UTC
CREATE POLICY "Children can delete marketplace images"
ON storage.objects FOR DELETE
TO anon, authenticated
USING (bucket_id = 'marketplace-images');

-- Policy: Admins can manage all marketplace images
-- Timestamp: 2024-01-01 00:00:18 UTC
CREATE POLICY "Admins can manage marketplace images"
ON storage.objects FOR ALL
USING (
  bucket_id = 'marketplace-images'
  AND EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);



