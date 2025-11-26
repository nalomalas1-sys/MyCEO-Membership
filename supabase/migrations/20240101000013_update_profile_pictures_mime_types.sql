-- Update profile-pictures bucket to support additional JPEG variants
-- This migration adds support for .jfif files and other JPEG MIME types
--
-- Created: 2024-01-01 00:00:13 UTC
-- Last Modified: 2024-01-01 00:00:13 UTC

-- ============================================================================
-- UPDATE BUCKET MIME TYPES
-- ============================================================================
-- Timestamp: 2024-01-01 00:00:13 UTC
-- Update the bucket to include additional JPEG MIME types
UPDATE storage.buckets
SET allowed_mime_types = ARRAY[
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/jfif',
  'image/pjpeg'
]
WHERE id = 'profile-pictures';






