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
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

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

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
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
      const fileExt = file.name.split('.').pop();
      const fileName = `profile-pictures/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      supabase.storage
        .from('profile-pictures')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        })
        .then(async ({ data: uploadData, error: uploadError }) => {
          if (uploadError) {
            throw uploadError;
          }

          // Get public URL
          const { data: urlData } = supabase.storage
            .from('profile-pictures')
            .getPublicUrl(fileName);

          if (!urlData?.publicUrl) {
            throw new Error('Failed to get image URL');
          }

          onImageUploaded(urlData.publicUrl);
        })
        .catch((err) => {
          setError(err.message || 'Failed to upload image');
          setPreview(currentImageUrl || null);
        })
        .finally(() => {
          setUploading(false);
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        });
    } catch (err: any) {
      setError(err.message || 'Failed to process image');
      setUploading(false);
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
              accept="image/jpeg,image/jpg,image/png,image/webp"
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




