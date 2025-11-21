-- Create storage bucket for lesson files (videos, PDFs, presentations, etc.)
-- This bucket will store all lesson-related media files
--
-- Created: 2024-01-01 00:00:06 UTC
-- Last Modified: 2024-01-01 00:00:06 UTC
--
-- NOTE: When making any adjustments to this migration, update the "Last Modified"
-- timestamp above and add/update timestamps for the specific sections being changed.

-- ============================================================================
-- BUCKET CREATION
-- ============================================================================
-- Timestamp: 2024-01-01 00:00:06 UTC
-- Create the bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'lesson-files',
  'lesson-files',
  true, -- Public bucket for easy access to lesson content
  52428800, -- 50MB file size limit
  ARRAY[
    'video/mp4',
    'video/webm',
    'video/ogg',
    'application/pdf',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'audio/mpeg',
    'audio/ogg',
    'audio/wav'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- RLS POLICIES SETUP
-- ============================================================================
-- Timestamp: 2024-01-01 00:00:06 UTC
-- Enable RLS on the bucket
-- Note: RLS is automatically enabled on storage.objects, but we need policies

-- Drop existing policies if they exist (for idempotency)
-- Timestamp: 2024-01-01 00:00:06 UTC
DROP POLICY IF EXISTS "Public can view lesson files" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload lesson files" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update lesson files" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete lesson files" ON storage.objects;

-- Policy: Anyone can view files in the lesson-files bucket (public read)
-- This allows children and parents to access lesson content
-- Timestamp: 2024-01-01 00:00:06 UTC
CREATE POLICY "Public can view lesson files"
ON storage.objects FOR SELECT
USING (bucket_id = 'lesson-files');

-- Policy: Authenticated users with admin role can upload files
-- Timestamp: 2024-01-01 00:00:06 UTC
CREATE POLICY "Admins can upload lesson files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'lesson-files'
  AND EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- Policy: Admins can update lesson files
-- Timestamp: 2024-01-01 00:00:06 UTC
CREATE POLICY "Admins can update lesson files"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'lesson-files'
  AND EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- Policy: Admins can delete lesson files
-- Timestamp: 2024-01-01 00:00:06 UTC
CREATE POLICY "Admins can delete lesson files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'lesson-files'
  AND EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

