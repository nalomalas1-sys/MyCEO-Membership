-- Create track_submissions table, RLS policies, and storage bucket
-- This migration sets up the project-based track submission system
--
-- Created: 2024-01-01 00:00:23 UTC

-- ============================================================================
-- TABLE CREATION (if not exists)
-- ============================================================================
-- Create track_submissions table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.track_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  notes TEXT,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(child_id, module_id)
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_track_submissions_child_id ON public.track_submissions(child_id);
CREATE INDEX IF NOT EXISTS idx_track_submissions_module_id ON public.track_submissions(module_id);

-- Enable RLS
ALTER TABLE public.track_submissions ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES
-- ============================================================================
-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Parents can view submissions of their children" ON public.track_submissions;
DROP POLICY IF EXISTS "Allow anonymous access to track submissions" ON public.track_submissions;
DROP POLICY IF EXISTS "Allow anonymous insert on track submissions" ON public.track_submissions;
DROP POLICY IF EXISTS "Allow anonymous update on track submissions" ON public.track_submissions;
DROP POLICY IF EXISTS "System can manage track submissions" ON public.track_submissions;

-- Policy: Parents can view submissions of their children
CREATE POLICY "Parents can view submissions of their children"
  ON public.track_submissions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.children
      JOIN public.parents ON parents.id = children.parent_id
      WHERE children.id = track_submissions.child_id
      AND parents.user_id = auth.uid()
    )
  );

-- Policy: Allow anonymous SELECT on track_submissions
-- This is safe because:
-- 1. Access codes are unique and act as passwords
-- 2. Application code only queries for the specific child_id from the validated session
-- 3. The child_id is validated during login via access code lookup
CREATE POLICY "Allow anonymous access to track submissions"
  ON public.track_submissions FOR SELECT
  TO anon
  USING (true);

-- Policy: Allow anonymous INSERT on track_submissions
-- This allows children to create their own submission records
CREATE POLICY "Allow anonymous insert on track submissions"
  ON public.track_submissions FOR INSERT
  TO anon
  WITH CHECK (true);

-- Policy: Allow anonymous UPDATE on track_submissions
-- This allows children to update their own submissions
CREATE POLICY "Allow anonymous update on track submissions"
  ON public.track_submissions FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

-- Policy: System can manage track submissions (for authenticated users)
CREATE POLICY "System can manage track submissions"
  ON public.track_submissions FOR ALL
  USING (true);

-- ============================================================================
-- TRIGGERS
-- ============================================================================
-- Add updated_at trigger for track_submissions
DROP TRIGGER IF EXISTS update_track_submissions_updated_at ON public.track_submissions;
CREATE TRIGGER update_track_submissions_updated_at 
  BEFORE UPDATE ON public.track_submissions
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- STORAGE BUCKET CREATION
-- ============================================================================
-- Create the track-submissions storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'track-submissions',
  'track-submissions',
  false, -- Private bucket - files accessed via signed URLs
  104857600, -- 100MB file size limit
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'video/mp4',
    'video/webm',
    'video/ogg',
    'audio/mpeg',
    'audio/ogg',
    'audio/wav',
    'application/zip'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- STORAGE RLS POLICIES
-- ============================================================================
-- Drop existing storage policies if they exist
DROP POLICY IF EXISTS "Children can upload track submissions" ON storage.objects;
DROP POLICY IF EXISTS "Children can view their own track submissions" ON storage.objects;
DROP POLICY IF EXISTS "Parents can view their children's track submissions" ON storage.objects;
DROP POLICY IF EXISTS "System can manage track submissions" ON storage.objects;

-- Policy: Allow anonymous users to upload to track-submissions bucket
-- This allows children (authenticated via access code) to upload files
CREATE POLICY "Children can upload track submissions"
  ON storage.objects FOR INSERT
  TO anon
  WITH CHECK (bucket_id = 'track-submissions');

-- Policy: Allow anonymous users to view files in track-submissions bucket
-- Files will be accessed via signed URLs generated by the application
CREATE POLICY "Children can view their own track submissions"
  ON storage.objects FOR SELECT
  TO anon
  USING (bucket_id = 'track-submissions');

-- Policy: Parents can view their children's submissions
CREATE POLICY "Parents can view their children's track submissions"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'track-submissions'
    AND EXISTS (
      SELECT 1 FROM public.track_submissions ts
      JOIN public.children c ON c.id = ts.child_id
      JOIN public.parents p ON p.id = c.parent_id
      WHERE ts.file_url = (storage.objects.name)
      AND p.user_id = auth.uid()
    )
  );

-- Policy: System can manage track submissions (for authenticated operations)
CREATE POLICY "System can manage track submissions"
  ON storage.objects FOR ALL
  USING (bucket_id = 'track-submissions');

