-- Flexible Track Submissions Migration
-- Adds support for YouTube videos, external links, and text-only submissions
-- in addition to existing file upload capability
--
-- Created: 2024-01-01 00:00:39 UTC

-- ============================================================================
-- SCHEMA CHANGES
-- ============================================================================

-- Add youtube_url column for YouTube video submissions
ALTER TABLE public.track_submissions 
ADD COLUMN IF NOT EXISTS youtube_url TEXT;

-- Add external_link column for external URL submissions
ALTER TABLE public.track_submissions 
ADD COLUMN IF NOT EXISTS external_link TEXT;

-- Make file columns nullable to support non-file submissions
-- First, we need to drop the NOT NULL constraints
ALTER TABLE public.track_submissions 
ALTER COLUMN file_url DROP NOT NULL;

ALTER TABLE public.track_submissions 
ALTER COLUMN file_name DROP NOT NULL;

-- ============================================================================
-- CONSTRAINT CHANGES
-- ============================================================================

-- Drop existing constraint if it exists (for idempotency)
ALTER TABLE public.track_submissions 
DROP CONSTRAINT IF EXISTS check_has_content;

-- Add check constraint: at least one content type must be provided
-- This ensures submissions have at least: file, youtube video, external link, or notes
ALTER TABLE public.track_submissions 
ADD CONSTRAINT check_has_content CHECK (
  file_url IS NOT NULL 
  OR youtube_url IS NOT NULL 
  OR external_link IS NOT NULL 
  OR notes IS NOT NULL
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Add index for youtube_url lookups (optional, for performance)
CREATE INDEX IF NOT EXISTS idx_track_submissions_youtube_url 
ON public.track_submissions(youtube_url) 
WHERE youtube_url IS NOT NULL;

-- Add index for external_link lookups (optional, for performance)
CREATE INDEX IF NOT EXISTS idx_track_submissions_external_link 
ON public.track_submissions(external_link) 
WHERE external_link IS NOT NULL;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON COLUMN public.track_submissions.youtube_url IS 'YouTube video URL for video submissions';
COMMENT ON COLUMN public.track_submissions.external_link IS 'External URL/link for link submissions';
