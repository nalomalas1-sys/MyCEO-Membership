import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/lib/supabase';
import { ChildCodeDisplay } from './ChildCodeDisplay';
import { ProfilePictureUpload } from './ProfilePictureUpload';

const addChildSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  age: z.number().min(6).max(16),
  gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say']).optional(),
});

type AddChildFormData = z.infer<typeof addChildSchema>;

interface AddChildModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  parentId: string;
}

export function AddChildModal({ isOpen, onClose, onSuccess, parentId }: AddChildModalProps) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [childName, setChildName] = useState<string>('');
  const [profilePictureUrl, setProfilePictureUrl] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<AddChildFormData>({
    resolver: zodResolver(addChildSchema),
  });

  const onSubmit = async (data: AddChildFormData) => {
    setLoading(true);
    setError(null);

    try {
      // Generate access code via Edge Function
      const { data: codeData, error: codeError } = await supabase.functions.invoke(
        'generate-child-code'
      );

      if (codeError || !codeData?.code) {
        setError('Failed to generate access code. Please try again.');
        return;
      }

      const accessCode = codeData.code;

      // Create child record
      const { data: child, error: childError } = await supabase
        .from('children')
        .insert({
          parent_id: parentId,
          name: data.name,
          age: data.age,
          gender: data.gender,
          access_code: accessCode,
          profile_picture_url: profilePictureUrl,
        })
        .select()
        .single();

      if (childError) {
        setError(childError.message);
        return;
      }

      // Create company for child
      await supabase.from('companies').insert({
        child_id: child.id,
        company_name: `${data.name}'s Company`,
        initial_capital: 1000.00,
        current_balance: 1000.00,
      });

      setChildName(data.name);
      setGeneratedCode(accessCode);
      setProfilePictureUrl(null);
      reset();
      onSuccess();
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-2xl font-bold mb-4">Add Child</h2>

        {generatedCode ? (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <p className="text-green-800 font-semibold mb-2">Child added successfully!</p>
            </div>
            <ChildCodeDisplay code={generatedCode} childName={childName || 'Your child'} />
            <button
              onClick={() => {
                setGeneratedCode(null);
                onClose();
              }}
              className="w-full btn btn-primary"
            >
              Done
            </button>
          </div>
        ) : (
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
                <option value="">Prefer not to say</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
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
                {loading ? 'Adding...' : 'Add Child'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}





