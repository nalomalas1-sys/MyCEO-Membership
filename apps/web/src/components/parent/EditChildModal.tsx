import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/lib/supabase';
import { Child } from '@/types/child';
import { X } from 'lucide-react';
import { ProfilePictureUpload } from './ProfilePictureUpload';

const editChildSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  age: z.number().min(6).max(16),
  gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say']).optional(),
});

type EditChildFormData = z.infer<typeof editChildSchema>;

interface EditChildModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  child: Child | null;
}

export function EditChildModal({ isOpen, onClose, onSuccess, child }: EditChildModalProps) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [profilePictureUrl, setProfilePictureUrl] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<EditChildFormData>({
    resolver: zodResolver(editChildSchema),
  });

  useEffect(() => {
    if (child && isOpen) {
      reset({
        name: child.name,
        age: child.age || 8,
        gender: child.gender || undefined,
      });
      setProfilePictureUrl(child.profile_picture_url);
    }
  }, [child, isOpen, reset]);

  const onSubmit = async (data: EditChildFormData) => {
    if (!child) return;

    setLoading(true);
    setError(null);

    try {
      // First verify the child exists and user has permission
      const { data: childData, error: fetchError } = await supabase
        .from('children')
        .select('id, deleted_at')
        .eq('id', child.id)
        .single();

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          setError('Child not found. It may have been deleted.');
        } else if (fetchError.code === '42501' || fetchError.message.includes('permission') || fetchError.message.includes('policy')) {
          setError('You do not have permission to update this child. Please refresh the page and try again.');
        } else {
          setError(fetchError.message || 'Failed to verify child. Please try again.');
        }
        return;
      }

      if (childData?.deleted_at) {
        setError('This child has been deleted and cannot be updated.');
        return;
      }

      const updateData: any = {
        name: data.name,
        age: data.age,
        gender: data.gender,
      };

      // Only update profile picture if it was changed
      if (profilePictureUrl !== child.profile_picture_url) {
        updateData.profile_picture_url = profilePictureUrl;
      }

      const { error: updateError } = await supabase
        .from('children')
        .update(updateData)
        .eq('id', child.id);

      if (updateError) {
        if (updateError.code === '42501' || updateError.message.includes('permission') || updateError.message.includes('policy')) {
          setError('Permission denied. Please refresh the page and try again.');
        } else {
          setError(updateError.message || 'Failed to update child. Please try again.');
        }
        return;
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !child) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Edit Child</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <ProfilePictureUpload
            currentImageUrl={profilePictureUrl}
            onImageUploaded={(url) => setProfilePictureUrl(url)}
            onImageRemoved={() => setProfilePictureUrl(null)}
            disabled={loading}
          />

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Child's Name
            </label>
            <input
              id="name"
              type="text"
              {...register('name')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="age" className="block text-sm font-medium text-gray-700 mb-1">
              Age
            </label>
            <input
              id="age"
              type="number"
              min="6"
              max="16"
              {...register('age', { valueAsNumber: true })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
            {errors.age && (
              <p className="mt-1 text-sm text-red-600">{errors.age.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-1">
              Gender (Optional)
            </label>
            <select
              id="gender"
              {...register('gender')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Select gender (optional)</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
              <option value="prefer_not_to_say">Prefer not to say</option>
            </select>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 btn btn-primary disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


