import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Upload, X, File, CheckCircle2, AlertCircle } from 'lucide-react';

interface TrackSubmissionUploadProps {
  childId: string;
  moduleId: string;
  moduleTitle: string;
  onSuccess?: () => void;
}

export function TrackSubmissionUpload({
  childId,
  moduleId,
  moduleTitle,
  onSuccess,
}: TrackSubmissionUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [notes, setNotes] = useState('');
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
    if (!file) {
      setError('Please select a file to upload');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      // Get file extension
      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'file';
      const fileName = `${childId}/${moduleId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      // Upload file to storage
      const { error: uploadError } = await supabase.storage
        .from('track-submissions')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Get signed URL for private bucket (valid for 1 year)
      // Note: For private buckets, we'll store the path and generate signed URLs when needed
      // For now, store the file path and generate signed URL on-demand
      const filePath = fileName;

      // Create or update submission record
      // Store the file path - we'll generate signed URLs when viewing
      const submissionData = {
        child_id: childId,
        module_id: moduleId,
        file_url: filePath, // Store path, not URL
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type,
        notes: notes.trim() || null,
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
            <div className="flex items-center gap-2 text-sm text-green-600">
              <File className="h-4 w-4" />
              <span>{existingSubmission.file_name}</span>
              <span className="text-green-500">•</span>
              <span>{formatFileSize(existingSubmission.file_size || 0)}</span>
            </div>
            {existingSubmission.notes && (
              <p className="text-sm text-green-700 mt-2 italic">"{existingSubmission.notes}"</p>
            )}
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
          <File className="h-6 w-6 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-blue-900 mb-1">Submission Already Uploaded</h3>
            <p className="text-sm text-blue-700 mb-3">
              You've already submitted your work for this module. You can update it by uploading a new file.
            </p>
            <div className="flex items-center gap-2 text-sm text-blue-600 mb-2">
              <File className="h-4 w-4" />
              <span>{existingSubmission.file_name}</span>
              <span className="text-blue-500">•</span>
              <span>{formatFileSize(existingSubmission.file_size || 0)}</span>
            </div>
            {existingSubmission.notes && (
              <p className="text-sm text-blue-700 mb-2 italic">"{existingSubmission.notes}"</p>
            )}
            <p className="text-xs text-blue-600">
              Submitted on {new Date(existingSubmission.submitted_at).toLocaleDateString()}
            </p>
          </div>
        </div>
        <button
          onClick={() => setExistingSubmission(null)}
          className="btn btn-secondary text-sm"
        >
          Upload New File
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
        Upload your completed work for "{moduleTitle}". Your parent will be able to view and download it.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* File Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Upload File *
          </label>
          {!file ? (
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
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
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
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
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Notes (Optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            placeholder="Add any notes about your submission..."
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
          disabled={!file || uploading}
          className="btn btn-primary w-full"
        >
          {uploading ? 'Uploading...' : 'Upload Submission'}
        </button>
      </form>
    </div>
  );
}

