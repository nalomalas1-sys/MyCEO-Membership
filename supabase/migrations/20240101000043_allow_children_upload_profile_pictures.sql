-- Migration: Allow children (anon role) to upload profile pictures

-- For child sessions we use the Supabase anon key without an authenticated user,
-- so auth.uid() is null. The existing policies only allow authenticated parents/admins
-- to insert into the "profile-pictures" bucket, which causes
-- "new row violates row-level security policy" when children try to upload.
--
-- This policy allows both anonymous and authenticated clients to INSERT into the
-- profile-pictures bucket, while keeping READ public (already configured).

CREATE POLICY "Anyone can upload profile pictures"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'profile-pictures'
);

