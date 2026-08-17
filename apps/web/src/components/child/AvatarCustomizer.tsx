import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { CheckCircle2, Sparkles, Image as ImageIcon } from 'lucide-react';

// ── Avatar Definitions ──────────────────────────────────────────
// Each avatar has a unique seed that produces a distinct look via DiceBear
interface AvatarOption {
  id: string;
  label: string;
  seed: string;
  style: string; // DiceBear style
}

const AVATAR_OPTIONS: AvatarOption[] = [
  // Adventurer style — friendly, diverse cartoon characters
  { id: 'adv-1', label: 'Alex', seed: 'Alex', style: 'adventurer' },
  { id: 'adv-2', label: 'Sam', seed: 'Sam', style: 'adventurer' },
  { id: 'adv-3', label: 'Jordan', seed: 'Jordan', style: 'adventurer' },
  { id: 'adv-4', label: 'Riley', seed: 'Riley', style: 'adventurer' },
  { id: 'adv-5', label: 'Casey', seed: 'Casey', style: 'adventurer' },
  { id: 'adv-6', label: 'Morgan', seed: 'Morgan', style: 'adventurer' },

  // Fun Emoji style
  { id: 'fun-1', label: 'Sunny', seed: 'Sunny', style: 'fun-emoji' },
  { id: 'fun-2', label: 'Blaze', seed: 'Blaze', style: 'fun-emoji' },
  { id: 'fun-3', label: 'Starry', seed: 'Starry', style: 'fun-emoji' },
  { id: 'fun-4', label: 'Bubbly', seed: 'Bubbly', style: 'fun-emoji' },

  // Adventurer neutral style
  { id: 'adn-1', label: 'Nova', seed: 'Nova', style: 'adventurer-neutral' },
  { id: 'adn-2', label: 'Comet', seed: 'Comet', style: 'adventurer-neutral' },
  { id: 'adn-3', label: 'Echo', seed: 'Echo', style: 'adventurer-neutral' },
  { id: 'adn-4', label: 'Storm', seed: 'Storm', style: 'adventurer-neutral' },

  // Lorelei style — elegant & unique
  { id: 'lor-1', label: 'Luna', seed: 'Luna', style: 'lorelei' },
  { id: 'lor-2', label: 'Phoenix', seed: 'Phoenix', style: 'lorelei' },
  { id: 'lor-3', label: 'Sage', seed: 'Sage', style: 'lorelei' },
  { id: 'lor-4', label: 'Ivy', seed: 'Ivy', style: 'lorelei' },

  // Bottts style — fun robots
  { id: 'bot-1', label: 'Bolt', seed: 'Bolt', style: 'bottts' },
  { id: 'bot-2', label: 'Gizmo', seed: 'Gizmo', style: 'bottts' },
  { id: 'bot-3', label: 'Pixel', seed: 'Pixel', style: 'bottts' },
  { id: 'bot-4', label: 'Turbo', seed: 'Turbo', style: 'bottts' },

  // Thumbs style — cute thumbs-up characters
  { id: 'thm-1', label: 'Buddy', seed: 'Buddy', style: 'thumbs' },
  { id: 'thm-2', label: 'Champ', seed: 'Champ', style: 'thumbs' },
  { id: 'thm-3', label: 'Hero', seed: 'Hero', style: 'thumbs' },
  { id: 'thm-4', label: 'Ace', seed: 'Ace', style: 'thumbs' },
];

function getAvatarUrl(avatar: AvatarOption): string {
  return `https://api.dicebear.com/9.x/${avatar.style}/svg?seed=${encodeURIComponent(avatar.seed)}`;
}

// ── Types ────────────────────────────────────────────────────────
type AvatarConfig = {
  selectedAvatarId: string;
  customImageUrl?: string | null;
};

interface AvatarCustomizerProps {
  childId: string;
  childName: string;
}

// ── Component ────────────────────────────────────────────────────
export function AvatarCustomizer({ childId, childName }: AvatarCustomizerProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [customImageUrl, setCustomImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const CUSTOM_PHOTO_ID = 'custom-photo';

  // Load saved avatar
  useEffect(() => {
    let isMounted = true;

    async function loadAvatar() {
      try {
        const { data, error } = await supabase
          .from('children')
          .select('avatar_config')
          .eq('id', childId)
          .single();

        if (error) {
          console.warn('Failed to load avatar config:', error.message || error);
        } else if (data?.avatar_config) {
          let config: AvatarConfig | null = null;

          if (typeof data.avatar_config === 'string') {
            try {
              config = JSON.parse(data.avatar_config);
            } catch (e) {
              console.warn('Failed to parse avatar string config');
            }
          } else if (typeof data.avatar_config === 'object') {
            config = data.avatar_config as AvatarConfig;
          }

          if (isMounted && config?.selectedAvatarId) {
            setSelectedId(config.selectedAvatarId);
            setSavedId(config.selectedAvatarId);
            if (config.customImageUrl) {
              setCustomImageUrl(config.customImageUrl);
            }
          }
        }
      } catch (err) {
        console.warn('Error loading avatar config:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadAvatar();
    return () => { isMounted = false; };
  }, [childId]);

  // Handle custom image upload for "real photo"
  const handleCustomImageClick = () => {
    // reset any previous upload error (if surfaced in future UI)
    if (fileInputRef.current && !uploadingImage && !saving) {
      fileInputRef.current.click();
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = e.target.files?.[0];
    if (!file) return;

    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
    const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/jfif', 'image/pjpeg'];

    // Validate type
    const fileExt = file.name.split('.').pop()?.toLowerCase();
    const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp', 'jfif'];
    const isValidType = ALLOWED_TYPES.includes(file.type) || (fileExt && allowedExtensions.includes(fileExt));

    if (!isValidType) {
      setError('Please upload a JPEG, PNG, or WebP image.');
      return;
    }

    // Validate size
    if (file.size > MAX_FILE_SIZE) {
      setError('Image must be less than 5 MB.');
      return;
    }

    setUploadingImage(true);

    try {
      // Normalize content type similar to parent ProfilePictureUpload
      let contentType = file.type;
      const getMimeTypeFromExtension = (extension: string): string => {
        const ext = extension.toLowerCase();
        const mimeMap: Record<string, string> = {
          jpg: 'image/jpeg',
          jpeg: 'image/jpeg',
          jfif: 'image/jpeg',
          pjpeg: 'image/jpeg',
          png: 'image/png',
          webp: 'image/webp',
        };
        return mimeMap[ext] || 'image/jpeg';
      };

      if (!contentType || contentType === 'application/json' || !ALLOWED_TYPES.includes(contentType)) {
        contentType = getMimeTypeFromExtension(fileExt || 'jpg');
      } else if (contentType === 'image/jfif' || contentType === 'image/pjpeg') {
        contentType = 'image/jpeg';
      }

      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt || 'jpg'}`;
      const fileBlob = new Blob([file], { type: contentType });
      const fileWithCorrectType = new File([fileBlob], file.name, {
        type: contentType,
        lastModified: file.lastModified,
      });

      const { error: uploadError } = await supabase.storage
        .from('profile-pictures')
        .upload(fileName, fileWithCorrectType, {
          cacheControl: '3600',
          upsert: false,
          contentType,
        });

      if (uploadError) {
        console.error('Upload error details:', uploadError);
        throw new Error(uploadError.message || 'Failed to upload image');
      }

      const { data: urlData } = supabase.storage.from('profile-pictures').getPublicUrl(fileName);
      if (!urlData?.publicUrl) {
        throw new Error('Failed to get image URL');
      }

      setCustomImageUrl(urlData.publicUrl);
      setSelectedId(CUSTOM_PHOTO_ID);
      setSuccess(null);
      setError(null);
    } catch (err) {
      console.error('Failed to upload custom avatar image:', err);
      const message = err instanceof Error ? err.message : 'Failed to upload image. Please try again.';
      setError(message);
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Save avatar selection
  const handleSave = async () => {
    if (!selectedId) return;
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const config: AvatarConfig = { selectedAvatarId: selectedId };
      if (selectedId === CUSTOM_PHOTO_ID && customImageUrl) {
        config.customImageUrl = customImageUrl;
      }
      const { error } = await supabase.rpc('update_child_avatar', {
        p_child_id: childId,
        p_avatar_config: config
      });

      if (error) throw error;
      setSavedId(selectedId);
      setSuccess('Avatar saved! 🎨');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Failed to save avatar:', err);
      const message = err instanceof Error ? err.message : 'Failed to save. Please try again.';
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const hasChanges = selectedId !== savedId;
  const selectedAvatar = AVATAR_OPTIONS.find((a) => a.id === selectedId);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 border-4 border-purple-200">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-48" />
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="w-full aspect-square bg-gray-200 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 border-4 border-purple-200">
      {/* Header with current avatar */}
      <div className="flex items-center gap-4 mb-5">
        <div className="relative">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 shadow-md flex items-center justify-center overflow-hidden border-3 border-purple-300">
            {selectedId === CUSTOM_PHOTO_ID && customImageUrl ? (
              <img
                src={customImageUrl}
                alt="Your photo"
                className="w-full h-full object-cover"
              />
            ) : selectedAvatar ? (
              <img
                src={getAvatarUrl(selectedAvatar)}
                alt="Your avatar"
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-2xl">👤</span>
            )}
          </div>
          {selectedAvatar && (
            <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-0.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-white" />
            </div>
          )}
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            Choose Your Avatar 🎨
          </h2>
          <p className="text-xs text-gray-500">
            Pick an avatar that represents you, {childName}!
          </p>
          <button
            type="button"
            onClick={() => setShowPicker((open) => !open)}
            className="mt-2 inline-flex items-center px-3 py-1.5 text-xs font-semibold rounded-lg border border-purple-300 text-purple-700 bg-purple-50 hover:bg-purple-100 transition-colors"
          >
            {showPicker ? 'Hide avatar options' : 'Change avatar'}
          </button>
        </div>
      </div>

      {showPicker && (
        <>
          {/* Avatar Grid */}
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 sm:gap-3 mb-4">
            {/* Custom photo slot */}
            <button
              type="button"
              onClick={handleCustomImageClick}
              className={`relative group aspect-square rounded-xl border-3 transition-all duration-200 overflow-hidden flex items-center justify-center bg-white ${
                selectedId === CUSTOM_PHOTO_ID
                  ? 'border-purple-500 bg-purple-50 shadow-lg scale-105 ring-2 ring-purple-300 ring-offset-1'
                  : 'border-dashed border-gray-300 hover:border-purple-300 hover:shadow-md hover:scale-105'
              }`}
              title="Upload your own photo"
            >
              {customImageUrl ? (
                <img
                  src={customImageUrl}
                  alt="Your photo"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-xs text-gray-500 px-1 text-center">
                  <ImageIcon className="h-5 w-5 mb-1 text-gray-400" />
                  <span>Use your photo</span>
                </div>
              )}
              {selectedId === CUSTOM_PHOTO_ID && (
                <div className="absolute top-0.5 right-0.5 bg-purple-500 rounded-full p-0.5">
                  <CheckCircle2 className="h-3 w-3 text-white" />
                </div>
              )}
            </button>

            {/* Hidden file input for custom photo */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp,image/jfif,image/pjpeg"
              onChange={handleFileSelect}
              className="hidden"
            />

            {/* Predefined avatar options */}
            {AVATAR_OPTIONS.map((avatar) => {
              const isSelected = selectedId === avatar.id;
              return (
                <button
                  key={avatar.id}
                  type="button"
                  onClick={() => {
                    setSelectedId(avatar.id);
                    setSuccess(null);
                    setError(null);
                  }}
                  className={`relative group aspect-square rounded-xl border-3 transition-all duration-200 overflow-hidden ${
                    isSelected
                      ? 'border-purple-500 bg-purple-50 shadow-lg scale-105 ring-2 ring-purple-300 ring-offset-1'
                      : 'border-gray-200 bg-white hover:border-purple-300 hover:shadow-md hover:scale-105'
                  }`}
                  title={avatar.label}
                >
                  <img
                    src={getAvatarUrl(avatar)}
                    alt={avatar.label}
                    className="w-full h-full object-cover p-1"
                    loading="lazy"
                  />
                  {/* Selected indicator */}
                  {isSelected && (
                    <div className="absolute top-0.5 right-0.5 bg-purple-500 rounded-full p-0.5">
                      <CheckCircle2 className="h-3 w-3 text-white" />
                    </div>
                  )}
                  {/* Name tooltip on hover */}
                  <div className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[10px] font-medium text-center py-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    {avatar.label}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Status messages */}
          {error && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-3">
              {error}
            </p>
          )}
          {success && (
            <div className="flex items-center gap-2 text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2 mb-3">
              <Sparkles className="h-3.5 w-3.5" />
              {success}
            </div>
          )}

          {/* Save button */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !hasChanges || !selectedId}
              className={`inline-flex items-center justify-center px-5 py-2.5 text-sm font-bold rounded-xl transition-all duration-200 ${
                hasChanges && selectedId
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              } disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none`}
            >
              {saving ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Saving...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-1.5" />
                  Save Avatar
                </>
              )}
            </button>
            {hasChanges && selectedId && (
              <span className="text-xs text-purple-600 font-medium animate-pulse">
                ← Tap to save your choice!
              </span>
            )}
          </div>
        </>
      )}
    </div>
  );
}