import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AdminNavBar } from '@/components/navigation/AdminNavBar';
import { supabase } from '@/lib/supabase';
import { 
  ArrowLeft, 
  Save, 
  Plus, 
  BookOpen, 
  TrendingUp, 
  Target, 
  Award,
  ChevronRight,
  AlertCircle
} from 'lucide-react';

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
  const [suggestedOrder, setSuggestedOrder] = useState<number>(1);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<ModuleFormData>({
    resolver: zodResolver(moduleSchema),
    defaultValues: {
      track: 'money_basics',
      order_index: 1,
      difficulty_level: 1,
      xp_reward: 100,
    },
  });

  const selectedTrack = watch('track');

  // Fetch suggested order index when track changes
  useState(() => {
    const fetchSuggestedOrder = async () => {
      try {
        const { data: existingModules } = await supabase
          .from('modules')
          .select('order_index')
          .eq('track', selectedTrack)
          .order('order_index', { ascending: false })
          .limit(1);

        setSuggestedOrder((existingModules?.[0]?.order_index || 0) + 1);
      } catch (err) {
        console.error('Failed to fetch module count:', err);
      }
    };

    fetchSuggestedOrder();
  });

  const onSubmit = async (data: ModuleFormData) => {
    setLoading(true);
    setError(null);

    try {
      const orderIndex = data.order_index || suggestedOrder;

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

  const getTrackInfo = (track: string) => {
    const info = {
      money_basics: {
        color: 'bg-blue-100 text-blue-800 border-blue-200',
        description: 'Fundamental financial concepts for beginners',
      },
      entrepreneurship: {
        color: 'bg-purple-100 text-purple-800 border-purple-200',
        description: 'Business and innovation skills for young entrepreneurs',
      },
      advanced: {
        color: 'bg-indigo-100 text-indigo-800 border-indigo-200',
        description: 'Advanced financial concepts and investment strategies',
      },
    };
    return info[track as keyof typeof info] || info.money_basics;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <AdminNavBar />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <button
              onClick={() => navigate('/admin')}
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Dashboard
            </button>
            <ChevronRight className="h-4 w-4 text-gray-400" />
            <button
              onClick={() => navigate('/admin/content')}
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Content Management
            </button>
            <ChevronRight className="h-4 w-4 text-gray-400" />
            <span className="text-sm font-medium text-primary-600">Create Module</span>
          </div>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Create New Module</h1>
              <p className="text-gray-600">Add a new learning module to the platform</p>
            </div>
            <button
              onClick={() => navigate('/admin/content')}
              className="btn btn-outline flex items-center gap-2 px-4 py-2 rounded-xl"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Modules
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-primary-50 to-primary-100 border-b border-primary-200 px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-xl shadow-sm">
                    <Plus className="h-6 w-6 text-primary-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">Module Details</h2>
                    <p className="text-sm text-gray-600">Fill in the module information below</p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
                {/* Module Title */}
                <div className="space-y-2">
                  <label htmlFor="title" className="block text-sm font-semibold text-gray-900">
                    Module Title *
                  </label>
                  <div className="relative">
                    <input
                      id="title"
                      type="text"
                      {...register('title')}
                      className="w-full px-4 py-3 pl-11 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-white"
                      placeholder="e.g., Introduction to Money Management"
                    />
                    <BookOpen className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  </div>
                  {errors.title && (
                    <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {errors.title.message}
                    </p>
                  )}
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <label htmlFor="description" className="block text-sm font-semibold text-gray-900">
                    Description
                  </label>
                  <textarea
                    id="description"
                    {...register('description')}
                    rows={4}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-white"
                    placeholder="Brief description of what children will learn in this module..."
                  />
                </div>

                {/* Learning Track & Order */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label htmlFor="track" className="block text-sm font-semibold text-gray-900">
                      Learning Track *
                    </label>
                    <div className="relative">
                      <select
                        id="track"
                        {...register('track')}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-white appearance-none"
                      >
                        <option value="money_basics">Money Basics</option>
                        <option value="entrepreneurship">Entrepreneurship</option>
                        <option value="advanced">Advanced</option>
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <TrendingUp className="h-5 w-5 text-gray-400" />
                      </div>
                    </div>
                    <div className={`mt-2 px-3 py-2 rounded-lg border ${getTrackInfo(selectedTrack).color}`}>
                      <p className="text-xs font-medium">{getTrackInfo(selectedTrack).description}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="order_index" className="block text-sm font-semibold text-gray-900">
                      Order Index *
                    </label>
                    <input
                      id="order_index"
                      type="number"
                      min="1"
                      {...register('order_index', { valueAsNumber: true })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-white"
                      placeholder={`Suggested: ${suggestedOrder}`}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Lower numbers appear first in the track. Suggested: {suggestedOrder}
                    </p>
                    {errors.order_index && (
                      <p className="mt-2 text-sm text-red-600">{errors.order_index.message}</p>
                    )}
                  </div>
                </div>

                {/* Difficulty & XP */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label htmlFor="difficulty_level" className="block text-sm font-semibold text-gray-900">
                      Difficulty Level *
                    </label>
                    <div className="relative">
                      <select
                        id="difficulty_level"
                        {...register('difficulty_level', { valueAsNumber: true })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-white appearance-none"
                      >
                        <option value={1}>⭐ Beginner</option>
                        <option value={2}>⭐⭐ Easy</option>
                        <option value={3}>⭐⭐⭐ Intermediate</option>
                        <option value={4}>⭐⭐⭐⭐ Advanced</option>
                        <option value={5}>⭐⭐⭐⭐⭐ Expert</option>
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <Target className="h-5 w-5 text-gray-400" />
                      </div>
                    </div>
                    {errors.difficulty_level && (
                      <p className="mt-2 text-sm text-red-600">{errors.difficulty_level.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="xp_reward" className="block text-sm font-semibold text-gray-900">
                      XP Reward *
                    </label>
                    <div className="relative">
                      <input
                        id="xp_reward"
                        type="number"
                        min="0"
                        step="10"
                        {...register('xp_reward', { valueAsNumber: true })}
                        className="w-full px-4 py-3 pl-11 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-white"
                        placeholder="e.g., 100"
                      />
                      <Award className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Total XP students earn upon completion
                    </p>
                    {errors.xp_reward && (
                      <p className="mt-2 text-sm text-red-600">{errors.xp_reward.message}</p>
                    )}
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-red-800">Error</p>
                        <p className="text-sm text-red-700 mt-1">{error}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-4 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => navigate('/admin/content')}
                    className="px-6 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium text-gray-700 transition-colors flex items-center gap-2"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        Creating...
                      </>
                    ) : (
                      <>
                        <Save className="h-5 w-5" />
                        Create Module & Continue
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Sidebar Info */}
          <div className="lg:col-span-1 space-y-6">
            {/* Quick Tips */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary-600" />
                Creation Tips
              </h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <div className="p-1 bg-emerald-100 rounded-md mt-0.5">
                    <div className="h-2 w-2 bg-emerald-600 rounded-full"></div>
                  </div>
                  <p className="text-sm text-gray-600">Start with a clear, engaging title</p>
                </li>
                <li className="flex items-start gap-2">
                  <div className="p-1 bg-emerald-100 rounded-md mt-0.5">
                    <div className="h-2 w-2 bg-emerald-600 rounded-full"></div>
                  </div>
                  <p className="text-sm text-gray-600">Choose appropriate difficulty for the target age</p>
                </li>
                <li className="flex items-start gap-2">
                  <div className="p-1 bg-emerald-100 rounded-md mt-0.5">
                    <div className="h-2 w-2 bg-emerald-600 rounded-full"></div>
                  </div>
                  <p className="text-sm text-gray-600">XP should match module complexity</p>
                </li>
                <li className="flex items-start gap-2">
                  <div className="p-1 bg-emerald-100 rounded-md mt-0.5">
                    <div className="h-2 w-2 bg-emerald-600 rounded-full"></div>
                  </div>
                  <p className="text-sm text-gray-600">You'll add lessons after creating the module</p>
                </li>
              </ul>
            </div>

            {/* Next Steps */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">What's Next?</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <span className="text-sm font-bold text-blue-700">1</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Create Module</p>
                    <p className="text-sm text-gray-600">Fill in basic details and settings</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <span className="text-sm font-bold text-blue-700">2</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Add Lessons</p>
                    <p className="text-sm text-gray-600">Create individual lessons with content</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <span className="text-sm font-bold text-blue-700">3</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Preview & Publish</p>
                    <p className="text-sm text-gray-600">Test and make available to students</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Track Stats */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Track Information</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">Money Basics</span>
                    <span className={`px-2 py-1 text-xs rounded-full ${getTrackInfo('money_basics').color}`}>
                      Beginner
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">Financial fundamentals for ages 8-12</p>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">Entrepreneurship</span>
                    <span className={`px-2 py-1 text-xs rounded-full ${getTrackInfo('entrepreneurship').color}`}>
                      Intermediate
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">Business skills for ages 13-16</p>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">Advanced</span>
                    <span className={`px-2 py-1 text-xs rounded-full ${getTrackInfo('advanced').color}`}>
                      Advanced
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">Complex concepts for ages 16+</p>
                </div>
              </div>
            </div>
          </div>
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