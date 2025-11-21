-- Create storage bucket for profile pictures
-- This bucket will store child profile pictures
--
-- Created: 2024-01-01 00:00:12 UTC
-- Last Modified: 2024-01-01 00:00:12 UTC
--
-- NOTE: When making any adjustments to this migration, update the "Last Modified"
-- timestamp above and add/update timestamps for the specific sections being changed.

-- ============================================================================
-- BUCKET CREATION
-- ============================================================================
-- Timestamp: 2024-01-01 00:00:12 UTC
-- Create the bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profile-pictures',
  'profile-pictures',
  true, -- Public bucket for easy access to profile pictures
  5242880, -- 5MB file size limit
  ARRAY[
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- RLS POLICIES SETUP
-- ============================================================================
-- Timestamp: 2024-01-01 00:00:12 UTC
-- Enable RLS on the bucket
-- Note: RLS is automatically enabled on storage.objects, but we need policies

-- Drop existing policies if they exist (for idempotency)
-- Timestamp: 2024-01-01 00:00:12 UTC
DO $$
BEGIN
  -- Drop policies only if they exist to avoid notices
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Public can view profile pictures'
  ) THEN
    DROP POLICY "Public can view profile pictures" ON storage.objects;
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Parents can upload profile pictures'
  ) THEN
    DROP POLICY "Parents can upload profile pictures" ON storage.objects;
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Parents can update profile pictures'
  ) THEN
    DROP POLICY "Parents can update profile pictures" ON storage.objects;
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Parents can delete profile pictures'
  ) THEN
    DROP POLICY "Parents can delete profile pictures" ON storage.objects;
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Admins can manage profile pictures'
  ) THEN
    DROP POLICY "Admins can manage profile pictures" ON storage.objects;
  END IF;
END $$;

-- Policy: Anyone can view profile pictures (public read)
-- This allows profile pictures to be displayed
-- Timestamp: 2024-01-01 00:00:12 UTC
CREATE POLICY "Public can view profile pictures"
ON storage.objects FOR SELECT
USING (bucket_id = 'profile-pictures');

-- Policy: Parents can upload profile pictures for their children
-- Timestamp: 2024-01-01 00:00:12 UTC
CREATE POLICY "Parents can upload profile pictures"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'profile-pictures'
  AND EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role = 'parent'
  )
);

-- Policy: Parents can update profile pictures for their children
-- Timestamp: 2024-01-01 00:00:12 UTC
CREATE POLICY "Parents can update profile pictures"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'profile-pictures'
  AND EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role = 'parent'
  )
);

-- Policy: Parents can delete profile pictures for their children
-- Timestamp: 2024-01-01 00:00:12 UTC
CREATE POLICY "Parents can delete profile pictures"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'profile-pictures'
  AND EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role = 'parent'
  )
);

-- Policy: Admins can manage all profile pictures
-- Timestamp: 2024-01-01 00:00:12 UTC
CREATE POLICY "Admins can manage profile pictures"
ON storage.objects FOR ALL
USING (
  bucket_id = 'profile-pictures'
  AND EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

