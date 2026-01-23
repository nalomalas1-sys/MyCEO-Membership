import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Upload, X, File, CheckCircle2, AlertCircle, Youtube, Link2, FileText, Play } from 'lucide-react';

interface TrackSubmissionUploadProps {
  childId: string;
  moduleId: string;
  moduleTitle: string;
  onSuccess?: () => void;
}

// Extract YouTube video ID from various URL formats
function extractYouTubeId(url: string): string | null {
  if (!url) return null;

  // Match various YouTube URL formats
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([^&\n?#]+)/,
    /^([a-zA-Z0-9_-]{11})$/, // Just the video ID
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }

  return null;
}

// Validate URL format
function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function TrackSubmissionUpload({
  childId,
  moduleId,
  moduleTitle,
  onSuccess,
}: TrackSubmissionUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [notes, setNotes] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [externalLink, setExternalLink] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [existingSubmission, setExistingSubmission] = useState<any>(null);

  // Check for existing submission on mount
  useEffect(() => {
    async function checkExisting() {
      const { data, error } = await supabase
        .from('track_submissions')
        .select('*')
        .eq('child_id', childId)
        .eq('module_id', moduleId)
        .single();

      if (error && error.code !== 'PGRST116') {
        // PGRST116 is "not found" which is expected when no submission exists
        console.error('Error checking existing submission:', error);
        return;
      }

      if (data) {
        setExistingSubmission(data);
      }
    }
    checkExisting();
  }, [childId, moduleId]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validate file size (100MB limit)
    const maxSize = 100 * 1024 * 1024; // 100MB
    if (selectedFile.size > maxSize) {
      setError('File size must be less than 100MB');
      return;
    }

    setFile(selectedFile);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate at least one content type is provided
    const hasFile = file !== null;
    const hasYoutube = youtubeUrl.trim() !== '';
    const hasLink = externalLink.trim() !== '';
    const hasNotes = notes.trim() !== '';

    if (!hasFile && !hasYoutube && !hasLink && !hasNotes) {
      setError('Please provide at least one: file, YouTube video, link, or notes');
      return;
    }

    // Validate YouTube URL if provided
    if (hasYoutube) {
      const videoId = extractYouTubeId(youtubeUrl.trim());
      if (!videoId) {
        setError('Please enter a valid YouTube URL');
        return;
      }
    }

    // Validate external link if provided
    if (hasLink && !isValidUrl(externalLink.trim())) {
      setError('Please enter a valid URL for the external link');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      let filePath: string | null = null;
      let fileName: string | null = null;
      let fileSize: number | null = null;
      let mimeType: string | null = null;

      // Upload file if provided
      if (file) {
        // Get file extension
        const fileExt = file.name.split('.').pop()?.toLowerCase() || 'file';
        const storagePath = `${childId}/${moduleId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        // Upload file to storage
        const { error: uploadError } = await supabase.storage
          .from('track-submissions')
          .upload(storagePath, file, {
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadError) throw uploadError;

        filePath = storagePath;
        fileName = file.name;
        fileSize = file.size;
        mimeType = file.type;
      }

      // Create or update submission record
      const submissionData = {
        child_id: childId,
        module_id: moduleId,
        file_url: filePath,
        file_name: fileName,
        file_size: fileSize,
        mime_type: mimeType,
        youtube_url: hasYoutube ? youtubeUrl.trim() : null,
        external_link: hasLink ? externalLink.trim() : null,
        notes: hasNotes ? notes.trim() : null,
      };

      const { error: dbError } = await supabase
        .from('track_submissions')
        .upsert(submissionData, {
          onConflict: 'child_id,module_id',
        });

      if (dbError) throw dbError;

      // Refetch existing submission
      const { data } = await supabase
        .from('track_submissions')
        .select('*')
        .eq('child_id', childId)
        .eq('module_id', moduleId)
        .single();

      if (data) {
        setExistingSubmission(data);
      }

      setSuccess(true);
      setFile(null);
      setNotes('');
      setYoutubeUrl('');
      setExternalLink('');

      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.message || 'Failed to upload submission. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    setError(null);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // Get YouTube preview ID
  const youtubePreviewId = extractYouTubeId(youtubeUrl);

  if (success && existingSubmission) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-green-900 mb-1">Submission Uploaded Successfully!</h3>
            <p className="text-sm text-green-700 mb-3">
              Your submission for "{moduleTitle}" has been uploaded. Your parent can now view it.
            </p>

            {/* Show what was submitted */}
            <div className="space-y-2">
              {existingSubmission.file_name && (
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <File className="h-4 w-4" />
                  <span>{existingSubmission.file_name}</span>
                  <span className="text-green-500">•</span>
                  <span>{formatFileSize(existingSubmission.file_size || 0)}</span>
                </div>
              )}
              {existingSubmission.youtube_url && (
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <Youtube className="h-4 w-4" />
                  <span>YouTube Video</span>
                </div>
              )}
              {existingSubmission.external_link && (
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <Link2 className="h-4 w-4" />
                  <span>External Link</span>
                </div>
              )}
              {existingSubmission.notes && (
                <p className="text-sm text-green-700 mt-2 italic">"{existingSubmission.notes}"</p>
              )}
            </div>

            <p className="text-xs text-green-600 mt-3">
              Submitted on {new Date(existingSubmission.submitted_at).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (existingSubmission && !success) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start gap-3 mb-4">
          <FileText className="h-6 w-6 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-blue-900 mb-1">Submission Already Uploaded</h3>
            <p className="text-sm text-blue-700 mb-3">
              You've already submitted your work for this module. You can update it by uploading new content.
            </p>

            {/* Show existing submission content */}
            <div className="space-y-2">
              {existingSubmission.file_name && (
                <div className="flex items-center gap-2 text-sm text-blue-600">
                  <File className="h-4 w-4" />
                  <span>{existingSubmission.file_name}</span>
                  <span className="text-blue-500">•</span>
                  <span>{formatFileSize(existingSubmission.file_size || 0)}</span>
                </div>
              )}
              {existingSubmission.youtube_url && (
                <div className="flex items-center gap-2 text-sm text-blue-600">
                  <Youtube className="h-4 w-4" />
                  <span className="truncate max-w-xs">{existingSubmission.youtube_url}</span>
                </div>
              )}
              {existingSubmission.external_link && (
                <div className="flex items-center gap-2 text-sm text-blue-600">
                  <Link2 className="h-4 w-4" />
                  <span className="truncate max-w-xs">{existingSubmission.external_link}</span>
                </div>
              )}
              {existingSubmission.notes && (
                <p className="text-sm text-blue-700 mb-2 italic">"{existingSubmission.notes}"</p>
              )}
            </div>

            <p className="text-xs text-blue-600 mt-2">
              Submitted on {new Date(existingSubmission.submitted_at).toLocaleDateString()}
            </p>
          </div>
        </div>
        <button
          onClick={() => setExistingSubmission(null)}
          className="btn btn-secondary text-sm"
        >
          Update Submission
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        Upload Your Project Submission
      </h3>
      <p className="text-sm text-gray-600 mb-4">
        Submit your work for "{moduleTitle}". You can upload a file, share a YouTube video, add a link, or write notes.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* YouTube Video Section */}
        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
            <Youtube className="h-4 w-4 text-red-500" />
            YouTube Video (Optional)
          </label>
          <input
            type="text"
            value={youtubeUrl}
            onChange={(e) => setYoutubeUrl(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            placeholder="https://www.youtube.com/watch?v=..."
          />

          {/* YouTube Preview */}
          {youtubePreviewId && (
            <div className="mt-3">
              <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                <Play className="h-3 w-3" /> Video Preview
              </p>
              <div className="relative pb-[56.25%] h-0 overflow-hidden rounded-lg border border-gray-300">
                <iframe
                  className="absolute top-0 left-0 w-full h-full"
                  src={`https://www.youtube.com/embed/${youtubePreviewId}`}
                  title="YouTube video preview"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
          )}
        </div>

        {/* External Link Section */}
        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
            <Link2 className="h-4 w-4 text-blue-500" />
            External Link (Optional)
          </label>
          <input
            type="text"
            value={externalLink}
            onChange={(e) => setExternalLink(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            placeholder="https://example.com/my-project"
          />
          <p className="text-xs text-gray-500 mt-1">
            Share a link to your project, presentation, or any external resource
          </p>
        </div>

        {/* File Upload */}
        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
            <File className="h-4 w-4 text-green-500" />
            Upload File (Optional)
          </label>
          {!file ? (
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-white hover:bg-gray-50 transition-colors">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="h-8 w-8 text-gray-400 mb-2" />
                <p className="mb-2 text-sm text-gray-500">
                  <span className="font-semibold">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-gray-500">
                  PDF, Word, Excel, PowerPoint, Images, Videos, or ZIP (Max 100MB)
                </p>
              </div>
              <input
                type="file"
                className="hidden"
                onChange={handleFileSelect}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.webp,.mp4,.webm,.ogg,.mp3,.wav,.zip"
              />
            </label>
          ) : (
            <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200">
              <File className="h-5 w-5 text-gray-600" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
              </div>
              <button
                type="button"
                onClick={handleRemoveFile}
                className="p-1 text-gray-400 hover:text-red-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          )}
        </div>

        {/* Notes */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
            <FileText className="h-4 w-4 text-purple-500" />
            Notes (Optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            placeholder="Add any notes about your submission, describe your project, or write your response here..."
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={uploading}
          className="btn btn-primary w-full"
        >
          {uploading ? 'Uploading...' : 'Submit'}
        </button>

        <p className="text-xs text-center text-gray-500">
          You must provide at least one: file, YouTube video, link, or notes
        </p>
      </form>
    </div>
  );
}
