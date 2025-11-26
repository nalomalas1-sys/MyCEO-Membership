import { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface ProfilePictureUploadProps {
  currentImageUrl?: string | null;
  onImageUploaded: (url: string) => void;
  onImageRemoved?: () => void;
  disabled?: boolean;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/jfif', 'image/pjpeg'];

// Map file extensions to MIME types
const getMimeTypeFromExtension = (extension: string): string => {
  const ext = extension.toLowerCase();
  const mimeMap: Record<string, string> = {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'jfif': 'image/jpeg',
    'pjpeg': 'image/jpeg',
    'png': 'image/png',
    'webp': 'image/webp',
  };
  return mimeMap[ext] || 'image/jpeg'; // Default to JPEG if unknown
};

export function ProfilePictureUpload({
  currentImageUrl,
  onImageUploaded,
  onImageRemoved,
  disabled = false,
}: ProfilePictureUploadProps) {
  const [preview, setPreview] = useState<string | null>(currentImageUrl || null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type (check MIME type and extension as fallback)
    const fileExt = file.name.split('.').pop()?.toLowerCase();
    const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp', 'jfif'];
    const isValidType = ALLOWED_TYPES.includes(file.type) || 
                        (fileExt && allowedExtensions.includes(fileExt));

    if (!isValidType) {
      setError('Please upload a JPEG, PNG, or WebP image');
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setError('Image must be less than 5 MB');
      return;
    }

    setError(null);
    setUploading(true);

    try {
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Upload to Supabase Storage
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      // Determine correct MIME type
      // If the detected type is invalid or application/json, use extension-based detection
      let contentType = file.type;
      if (!contentType || 
          contentType === 'application/json' || 
          !ALLOWED_TYPES.includes(contentType)) {
        // Use extension to determine MIME type
        contentType = getMimeTypeFromExtension(fileExt || 'jpg');
      } else if (contentType === 'image/jfif' || contentType === 'image/pjpeg') {
        // Normalize JPEG variants
        contentType = 'image/jpeg';
      }

      console.log('File upload details:', {
        fileName,
        originalType: file.type,
        detectedType: contentType,
        fileExt,
        fileSize: file.size,
      });

      // Create a new Blob with the correct MIME type to ensure Supabase uses it
      // This ensures the file object itself has the correct type, not just the upload option
      const fileBlob = new Blob([file], { type: contentType });
      const fileWithCorrectType = new File([fileBlob], file.name, {
        type: contentType,
        lastModified: file.lastModified,
      });

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('profile-pictures')
        .upload(fileName, fileWithCorrectType, {
          cacheControl: '3600',
          upsert: false,
          contentType: contentType,
        });

          if (uploadError) {
        console.error('Upload error details:', uploadError);
        throw new Error(uploadError.message || 'Failed to upload image');
          }

          // Get public URL
          const { data: urlData } = supabase.storage
            .from('profile-pictures')
            .getPublicUrl(fileName);

          if (!urlData?.publicUrl) {
            throw new Error('Failed to get image URL');
          }

          onImageUploaded(urlData.publicUrl);
    } catch (err: any) {
          setError(err.message || 'Failed to upload image');
          setPreview(currentImageUrl || null);
    } finally {
          setUploading(false);
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
    }
  };

  const handleRemove = () => {
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (onImageRemoved) {
      onImageRemoved();
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Profile Picture (Optional)
      </label>
      <div className="flex items-center space-x-4">
        {/* Preview */}
        <div className="relative">
          {preview ? (
            <div className="relative group">
              <img
                src={preview}
                alt="Profile preview"
                className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
              />
              {!disabled && (
                <button
                  type="button"
                  onClick={handleRemove}
                  className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Remove image"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          ) : (
            <div className="w-20 h-20 rounded-full bg-gray-100 border-2 border-gray-200 flex items-center justify-center">
              <ImageIcon className="h-8 w-8 text-gray-400" />
            </div>
          )}
        </div>

        {/* Upload Button */}
        {!disabled && (
          <div className="flex-1">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp,image/jfif,image/pjpeg"
              onChange={handleFileSelect}
              disabled={uploading || disabled}
              className="hidden"
              id="profile-picture-upload"
            />
            <label
              htmlFor="profile-picture-upload"
              className={`inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg cursor-pointer transition-colors ${
                uploading || disabled
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Upload className="h-4 w-4 mr-2" />
              {uploading ? 'Uploading...' : preview ? 'Change Picture' : 'Upload Picture'}
            </label>
            <p className="text-xs text-gray-500 mt-1">
              JPEG, PNG, or WebP (max 5 MB)
            </p>
          </div>
        )}
      </div>
      {error && (
        <p className="text-sm text-red-600 mt-1">{error}</p>
      )}
    </div>
  );
}




