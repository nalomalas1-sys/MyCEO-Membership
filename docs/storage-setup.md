# Supabase Storage Setup for Lesson Files

## Storage Bucket Creation

The `lesson-files` storage bucket is **automatically created** when you run the database migration:

**Migration File:** `supabase/migrations/20240101000006_create_lesson_files_bucket.sql`

### What the Migration Creates

The migration automatically:
- ✅ Creates the `lesson-files` bucket
- ✅ Sets it as a public bucket (for read access)
- ✅ Configures a 50 MB file size limit
- ✅ Sets allowed MIME types for:
  - Videos: `video/mp4`, `video/webm`, `video/ogg`
  - Documents: `application/pdf`
  - Presentations: `.ppt`, `.pptx`, `.odp`
  - Images: `image/jpeg`, `image/png`, `image/gif`, `image/webp`
  - Audio: `audio/mpeg`, `audio/ogg`, `audio/wav`
- ✅ Sets up RLS policies:
  - Public read access (anyone can view files)
  - Admin-only upload, update, and delete

### Manual Setup (Alternative)

If you prefer to create the bucket manually via the Supabase Dashboard:

1. Go to your Supabase Dashboard
2. Navigate to **Storage** in the left sidebar
3. Click **New bucket**
4. Configure the bucket:
   - **Name:** `lesson-files`
   - **Public bucket:** ✅ **Yes** (so files can be accessed via public URLs)
   - **File size limit:** 50 MB (or adjust as needed)
   - **Allowed MIME types:** See the migration file for the complete list

**Note:** If you create the bucket manually, you still need to run the migration to set up the RLS policies, or create them manually using the policies defined in the migration file.

### File Structure

Files are stored with the following structure:
```
lesson-files/
  └── {moduleId}/
      └── {timestamp}-{random}.{ext}
```

This keeps files organized by module and prevents naming conflicts.



