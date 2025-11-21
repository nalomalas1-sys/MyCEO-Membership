import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AdminNavBar } from '@/components/navigation/AdminNavBar';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Save } from 'lucide-react';

const moduleSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().optional(),
  track: z.enum(['money_basics', 'entrepreneurship', 'advanced']),
  order_index: z.number().min(1, 'Order index must be at least 1'),
  difficulty_level: z.number().min(1).max(5),
  xp_reward: z.number().min(0, 'XP reward must be non-negative'),
});

type ModuleFormData = z.infer<typeof moduleSchema>;

function AdminModuleCreateContent() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ModuleFormData>({
    resolver: zodResolver(moduleSchema),
    defaultValues: {
      track: 'money_basics',
      order_index: 1,
      difficulty_level: 1,
      xp_reward: 100,
    },
  });

  const onSubmit = async (data: ModuleFormData) => {
    setLoading(true);
    setError(null);

    try {
      // Get max order_index for the track to set default
      const { data: existingModules } = await supabase
        .from('modules')
        .select('order_index')
        .eq('track', data.track)
        .order('order_index', { ascending: false })
        .limit(1);

      const orderIndex = data.order_index || (existingModules?.[0]?.order_index || 0) + 1;

      const { data: module, error: insertError } = await supabase
        .from('modules')
        .insert({
          title: data.title,
          description: data.description || null,
          track: data.track,
          order_index: orderIndex,
          difficulty_level: data.difficulty_level,
          xp_reward: data.xp_reward,
          is_published: false,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Navigate to edit page to add lessons
      navigate(`/admin/content/${module.id}/edit`);
    } catch (err: any) {
      console.error('Failed to create module:', err);
      setError(err.message || 'Failed to create module');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavBar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <button
            onClick={() => navigate('/admin/content')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Content Management
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Create New Module</h1>
          <p className="text-gray-600 mt-2">Add a new learning module to the platform</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label htmlFor="title" className="block text-sm font-semibold text-gray-700 mb-2">
                Module Title *
              </label>
              <input
                id="title"
                type="text"
                {...register('title')}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-white"
                placeholder="e.g., Introduction to Money"
              />
              {errors.title && (
                <p className="mt-2 text-sm text-red-600">{errors.title.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-semibold text-gray-700 mb-2">
                Description
              </label>
              <textarea
                id="description"
                {...register('description')}
                rows={4}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-white"
                placeholder="Brief description of what children will learn..."
              />
              {errors.description && (
                <p className="mt-2 text-sm text-red-600">{errors.description.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="track" className="block text-sm font-semibold text-gray-700 mb-2">
                  Learning Track *
                </label>
                <select
                  id="track"
                  {...register('track')}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-white"
                >
                  <option value="money_basics">Money Basics</option>
                  <option value="entrepreneurship">Entrepreneurship</option>
                  <option value="advanced">Advanced</option>
                </select>
                {errors.track && (
                  <p className="mt-2 text-sm text-red-600">{errors.track.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="order_index" className="block text-sm font-semibold text-gray-700 mb-2">
                  Order Index *
                </label>
                <input
                  id="order_index"
                  type="number"
                  min="1"
                  {...register('order_index', { valueAsNumber: true })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-white"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Lower numbers appear first in the track
                </p>
                {errors.order_index && (
                  <p className="mt-2 text-sm text-red-600">{errors.order_index.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="difficulty_level" className="block text-sm font-semibold text-gray-700 mb-2">
                  Difficulty Level *
                </label>
                <select
                  id="difficulty_level"
                  {...register('difficulty_level', { valueAsNumber: true })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-white"
                >
                  <option value={1}>1 - Beginner</option>
                  <option value={2}>2 - Easy</option>
                  <option value={3}>3 - Intermediate</option>
                  <option value={4}>4 - Advanced</option>
                  <option value={5}>5 - Expert</option>
                </select>
                {errors.difficulty_level && (
                  <p className="mt-2 text-sm text-red-600">{errors.difficulty_level.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="xp_reward" className="block text-sm font-semibold text-gray-700 mb-2">
                  XP Reward *
                </label>
                <input
                  id="xp_reward"
                  type="number"
                  min="0"
                  {...register('xp_reward', { valueAsNumber: true })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-white"
                />
                {errors.xp_reward && (
                  <p className="mt-2 text-sm text-red-600">{errors.xp_reward.message}</p>
                )}
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}

            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={() => navigate('/admin/content')}
                className="px-6 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium text-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-medium transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="h-5 w-5" />
                {loading ? 'Creating...' : 'Create Module'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function AdminModuleCreatePage() {
  return (
    <ProtectedRoute requireRole="admin">
      <AdminModuleCreateContent />
    </ProtectedRoute>
  );
}



