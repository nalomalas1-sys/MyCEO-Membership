# PDF and PowerPoint Support Feature

## Overview

Added support for PDF documents and PowerPoint presentations in lessons. Children can now view and download these files directly in the lesson viewer.

## Features Implemented

### 1. Database Migration
- **File:** `supabase/migrations/20240101000005_add_pdf_presentation_lesson_types.sql`
- Added `pdf` and `presentation` as valid lesson types
- Updated the `lessons` table constraint to allow these new types

### 2. Admin Module Editor
- **File:** `apps/web/src/pages/admin/AdminModuleEdit.tsx`
- Added file upload interface for PDFs and PowerPoints
- Drag-and-drop file upload with visual feedback
- File validation (type and size checks)
- Upload progress indicator
- Automatic file upload to Supabase Storage
- Support for:
  - PDF files (.pdf)
  - PowerPoint files (.ppt, .pptx, .odp)

### 3. Lesson Viewer (Child View)
- **File:** `apps/web/src/pages/LessonViewer.tsx`
- Enhanced UI with animated gradient header
- PDF viewer with embedded iframe
- PowerPoint viewer using Office Online viewer
- Download buttons for both PDFs and presentations
- Beautiful, child-friendly interface with:
  - Animated sparkles
  - Gradient backgrounds
  - Smooth transitions
  - Clear call-to-action buttons

### 4. Type Updates
- **File:** `apps/web/src/hooks/useModules.ts`
- Updated `Lesson` interface to include `pdf` and `presentation` types

## Setup Required

### 1. Run Database Migration
```sql
-- Run the migration file
-- supabase/migrations/20240101000005_add_pdf_presentation_lesson_types.sql
```

### 2. Create Supabase Storage Bucket
The storage bucket is **automatically created** by the migration `20240101000006_create_lesson_files_bucket.sql`.

If you need to create it manually, see `docs/storage-setup.md` for detailed instructions.

### 3. Install Dependencies (Optional - for drag-and-drop)
```bash
cd apps/web
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

## Usage

### For Admins

1. **Create/Edit a Lesson:**
   - Go to Admin → Content Management
   - Create or edit a module
   - Add a new lesson
   - Select "PDF Document" or "PowerPoint/Presentation" as lesson type
   - Click to upload a file
   - File will be automatically uploaded to Supabase Storage
   - Save the lesson

### For Children

1. **View PDF:**
   - Open a lesson with PDF type
   - PDF is displayed in an embedded viewer
   - Click "Download PDF" to save locally

2. **View PowerPoint:**
   - Open a lesson with presentation type
   - Presentation is displayed using Office Online viewer
   - Click "View Online" to open in a new tab
   - Click "Download" to save locally

## File Storage

- **Location:** Supabase Storage bucket `lesson-files`
- **Structure:** `{moduleId}/{timestamp}-{random}.{ext}`
- **Max Size:** 50 MB per file
- **Access:** Public URLs for viewing

## UI Enhancements

### Lesson Viewer Improvements:
- ✨ Animated gradient header with sparkles
- 🎨 Color-coded file type indicators
- 📱 Responsive design
- 🎯 Clear download buttons
- 💫 Smooth animations and transitions
- 🌈 Child-friendly color scheme

## Technical Details

### File Upload Flow:
1. User selects file in admin form
2. File is validated (type and size)
3. File is uploaded to Supabase Storage
4. Public URL is retrieved
5. URL is saved to lesson's `content_url` field
6. Lesson type is automatically set based on file type

### PDF Display:
- Uses browser's native PDF viewer via iframe
- Includes toolbar for navigation
- Supports zoom and print

### PowerPoint Display:
- Uses Microsoft Office Online viewer
- Falls back to download if viewer unavailable
- Shows helpful tip for best experience

## Future Enhancements

- [ ] Drag-and-drop reordering for lessons (Phase 10 continuation)
- [ ] File preview thumbnails
- [ ] Multiple file uploads per lesson
- [ ] File versioning
- [ ] Analytics on file downloads
- [ ] Convert PowerPoint to PDF automatically



