import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useParams } from 'react-router-dom';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AdminNavBar } from '@/components/navigation/AdminNavBar';
import { supabase } from '@/lib/supabase';
import { 
  ArrowLeft, 
  Save, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff, 
  Upload, 
  FileText, 
  Presentation, 
  X, 
  GripVertical,
  BookOpen,
  TrendingUp,
  Target,
  Award,
  ChevronRight,
  AlertCircle,
  Clock,
  Video,
  FileQuestion,
  Text,
  CheckCircle,
  AlertTriangle,
  MoreVertical,
  Layers,
  Users,
  Calendar,
  Sparkles,
  Link,
  ExternalLink
} from 'lucide-react';
import { QuizBuilder } from '@/components/admin/QuizBuilder';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const moduleSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().optional(),
  track: z.enum(['money_basics', 'entrepreneurship', 'advanced']),
  order_index: z.number().min(1, 'Order index must be at least 1'),
  difficulty_level: z.number().min(1).max(5),
  xp_reward: z.number().min(0, 'XP reward must be non-negative'),
});

type ModuleFormData = z.infer<typeof moduleSchema>;

interface Lesson {
  id: string;
  title: string;
  lesson_type: 'video' | 'text' | 'quiz' | 'pdf' | 'presentation';
  content: string | null;
  content_url: string | null;
  order_index: number;
  duration_minutes: number | null;
}

function AdminModuleEditContent() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [isPublished, setIsPublished] = useState(false);
  const [showLessonForm, setShowLessonForm] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [reordering, setReordering] = useState(false);
  const [moduleStats, setModuleStats] = useState({
    totalLessons: 0,
    totalDuration: 0,
    lessonTypes: {} as Record<string, number>
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<ModuleFormData>({
    resolver: zodResolver(moduleSchema),
  });

  useEffect(() => {
    if (id) {
      fetchModule();
    }
  }, [id]);

  async function fetchModule() {
    if (!id) return;

    try {
      setFetching(true);

      const { data: module, error: moduleError } = await supabase
        .from('modules')
        .select('*')
        .eq('id', id)
        .single();

      if (moduleError) throw moduleError;

      reset({
        title: module.title,
        description: module.description || '',
        track: module.track,
        order_index: module.order_index,
        difficulty_level: module.difficulty_level,
        xp_reward: module.xp_reward,
      });

      setIsPublished(module.is_published);

      // Fetch lessons
      const { data: lessonsData, error: lessonsError } = await supabase
        .from('lessons')
        .select('*')
        .eq('module_id', id)
        .order('order_index', { ascending: true });

      if (lessonsError) throw lessonsError;

      const lessonsArray = lessonsData || [];
      setLessons(lessonsArray);

      // Calculate stats
      let totalDuration = 0;
      const lessonTypes: Record<string, number> = {};
      
      lessonsArray.forEach(lesson => {
        totalDuration += lesson.duration_minutes || 0;
        lessonTypes[lesson.lesson_type] = (lessonTypes[lesson.lesson_type] || 0) + 1;
      });

      setModuleStats({
        totalLessons: lessonsArray.length,
        totalDuration,
        lessonTypes
      });
    } catch (err: any) {
      console.error('Failed to fetch module:', err);
      setError(err.message || 'Failed to load module');
    } finally {
      setFetching(false);
    }
  }

  const onSubmit = async (data: ModuleFormData) => {
    if (!id) return;

    setLoading(true);
    setError(null);

    try {
      const { error: updateError } = await supabase
        .from('modules')
        .update({
          title: data.title,
          description: data.description || null,
          track: data.track,
          order_index: data.order_index,
          difficulty_level: data.difficulty_level,
          xp_reward: data.xp_reward,
        })
        .eq('id', id);

      if (updateError) throw updateError;

      // Show success message
      const successMsg = document.createElement('div');
      successMsg.className = 'fixed top-4 right-4 bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-lg z-50 flex items-center gap-2';
      successMsg.innerHTML = `
        <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
        </svg>
        <span>Module updated successfully!</span>
      `;
      document.body.appendChild(successMsg);
      setTimeout(() => successMsg.remove(), 3000);
    } catch (err: any) {
      console.error('Failed to update module:', err);
      setError(err.message || 'Failed to update module');
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePublish = async () => {
    if (!id) return;

    try {
      const { error } = await supabase
        .from('modules')
        .update({
          is_published: !isPublished,
          published_at: !isPublished ? new Date().toISOString() : null,
        })
        .eq('id', id);

      if (error) throw error;
      setIsPublished(!isPublished);
      
      // Show status change message
      const statusMsg = document.createElement('div');
      statusMsg.className = 'fixed top-4 right-4 bg-blue-600 text-white px-4 py-3 rounded-xl shadow-lg z-50 flex items-center gap-2';
      statusMsg.innerHTML = `
        <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
        <span>Module ${!isPublished ? 'published' : 'unpublished'} successfully!</span>
      `;
      document.body.appendChild(statusMsg);
      setTimeout(() => statusMsg.remove(), 3000);
    } catch (err: any) {
      console.error('Failed to toggle publish:', err);
      alert('Failed to update publish status');
    }
  };

  const handleDeleteLesson = async (lessonId: string) => {
    if (!confirm('Are you sure you want to delete this lesson?')) return;

    try {
      const { error } = await supabase.from('lessons').delete().eq('id', lessonId);

      if (error) throw error;
      
      // Show delete confirmation
      const deleteMsg = document.createElement('div');
      deleteMsg.className = 'fixed top-4 right-4 bg-amber-600 text-white px-4 py-3 rounded-xl shadow-lg z-50 flex items-center gap-2';
      deleteMsg.innerHTML = `
        <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
        </svg>
        <span>Lesson deleted successfully</span>
      `;
      document.body.appendChild(deleteMsg);
      setTimeout(() => deleteMsg.remove(), 3000);
      
      fetchModule();
    } catch (err: any) {
      console.error('Failed to delete lesson:', err);
      alert('Failed to delete lesson');
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = lessons.findIndex((lesson) => lesson.id === active.id);
    const newIndex = lessons.findIndex((lesson) => lesson.id === over.id);

    if (oldIndex === -1 || newIndex === -1) {
      return;
    }

    const newLessons = arrayMove(lessons, oldIndex, newIndex);
    setLessons(newLessons);
    setReordering(true);

    // Update order_index for all affected lessons
    try {
      const updates = newLessons.map((lesson, index) => ({
        id: lesson.id,
        order_index: index + 1,
      }));

      const updatePromises = updates.map((update) =>
        supabase
          .from('lessons')
          .update({ order_index: update.order_index })
          .eq('id', update.id)
      );

      await Promise.all(updatePromises);

      // Verify no errors occurred
      const results = await Promise.all(updatePromises);
      const hasError = results.some((result) => result.error);

      if (hasError) {
        throw new Error('Failed to update lesson order');
      }

      // Show reorder success
      const reorderMsg = document.createElement('div');
      reorderMsg.className = 'fixed top-4 right-4 bg-green-600 text-white px-4 py-3 rounded-xl shadow-lg z-50 flex items-center gap-2';
      reorderMsg.innerHTML = `
        <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
        </svg>
        <span>Lessons reordered successfully!</span>
      `;
      document.body.appendChild(reorderMsg);
      setTimeout(() => reorderMsg.remove(), 3000);
    } catch (err: any) {
      console.error('Failed to reorder lessons:', err);
      alert('Failed to save lesson order. Please try again.');
      fetchModule();
    } finally {
      setReordering(false);
    }
  };

  const getTrackInfo = (track: string) => {
    const info = {
      money_basics: {
        color: 'bg-blue-100 text-blue-800 border-blue-200',
        name: 'Money Basics',
      },
      entrepreneurship: {
        color: 'bg-purple-100 text-purple-800 border-purple-200',
        name: 'Entrepreneurship',
      },
      advanced: {
        color: 'bg-indigo-100 text-indigo-800 border-indigo-200',
        name: 'Advanced',
      },
    };
    return info[track as keyof typeof info] || info.money_basics;
  };

  const getDifficultyInfo = (level: number) => {
    const info = {
      1: { name: 'Beginner', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
      2: { name: 'Easy', color: 'bg-green-100 text-green-800 border-green-200' },
      3: { name: 'Intermediate', color: 'bg-amber-100 text-amber-800 border-amber-200' },
      4: { name: 'Advanced', color: 'bg-orange-100 text-orange-800 border-orange-200' },
      5: { name: 'Expert', color: 'bg-red-100 text-red-800 border-red-200' },
    };
    return info[level as keyof typeof info] || info[1];
  };

  const getLessonTypeIcon = (type: string) => {
    const icons = {
      video: <Video className="h-4 w-4" />,
      text: <Text className="h-4 w-4" />,
      quiz: <FileQuestion className="h-4 w-4" />,
      pdf: <FileText className="h-4 w-4" />,
      presentation: <Presentation className="h-4 w-4" />,
    };
    return icons[type as keyof typeof icons] || <FileText className="h-4 w-4" />;
  };

  const handlePreviewModule = () => {
    if (id) {
      window.open(`/child/modules/${id}`, '_blank');
    }
  };

  if (fetching) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mb-4"></div>
          <div className="text-lg text-gray-600">Loading module...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <AdminNavBar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
            <span className="text-sm font-medium text-primary-600">Edit Module</span>
          </div>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Edit Module</h1>
              <p className="text-gray-600">Update module details and manage lessons</p>
            </div>
            <div className="flex items-center gap-3">
              {isPublished && (
                <button
                  onClick={handlePreviewModule}
                  className="btn btn-outline flex items-center gap-2 px-4 py-2 rounded-xl"
                >
                  <ExternalLink className="h-4 w-4" />
                  Preview Module
                </button>
              )}
              <button
                onClick={() => navigate('/admin/content')}
                className="btn btn-outline flex items-center gap-2 px-4 py-2 rounded-xl"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Modules
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Module Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Lessons</p>
                    <p className="text-3xl font-bold text-gray-900">{moduleStats.totalLessons}</p>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-xl">
                    <Layers className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Total Duration</p>
                    <p className="text-3xl font-bold text-gray-900">{moduleStats.totalDuration}</p>
                    <p className="text-xs text-gray-500">minutes</p>
                  </div>
                  <div className="p-3 bg-amber-50 rounded-xl">
                    <Clock className="h-6 w-6 text-amber-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">XP Reward</p>
                    <p className="text-3xl font-bold text-gray-900">{watch('xp_reward') || 0}</p>
                  </div>
                  <div className="p-3 bg-emerald-50 rounded-xl">
                    <Award className="h-6 w-6 text-emerald-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Status</p>
                    <p className={`text-lg font-bold ${isPublished ? 'text-emerald-700' : 'text-amber-700'}`}>
                      {isPublished ? 'Published' : 'Draft'}
                    </p>
                  </div>
                  <div className={`p-3 rounded-xl ${isPublished ? 'bg-emerald-50' : 'bg-amber-50'}`}>
                    {isPublished ? (
                      <Eye className="h-6 w-6 text-emerald-600" />
                    ) : (
                      <EyeOff className="h-6 w-6 text-amber-600" />
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Module Form */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-primary-50 to-primary-100 border-b border-primary-200 px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-xl shadow-sm">
                    <BookOpen className="h-6 w-6 text-primary-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">Module Details</h2>
                    <p className="text-sm text-gray-600">Edit module information</p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label htmlFor="title" className="block text-sm font-semibold text-gray-900">
                      Module Title *
                    </label>
                    <input
                      id="title"
                      type="text"
                      {...register('title')}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-white"
                    />
                    {errors.title && (
                      <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="h-4 w-4" />
                        {errors.title.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="track" className="block text-sm font-semibold text-gray-900">
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
                    <div className={`mt-2 px-3 py-2 rounded-lg border ${getTrackInfo(watch('track')).color}`}>
                      <p className="text-xs font-medium">{getTrackInfo(watch('track')).name}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="description" className="block text-sm font-semibold text-gray-900">
                    Description
                  </label>
                  <textarea
                    id="description"
                    {...register('description')}
                    rows={3}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-white"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="difficulty_level" className="block text-sm font-semibold text-gray-900">
                      Difficulty *
                    </label>
                    <select
                      id="difficulty_level"
                      {...register('difficulty_level', { valueAsNumber: true })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-white"
                    >
                      <option value={1}>⭐ Beginner</option>
                      <option value={2}>⭐⭐ Easy</option>
                      <option value={3}>⭐⭐⭐ Intermediate</option>
                      <option value={4}>⭐⭐⭐⭐ Advanced</option>
                      <option value={5}>⭐⭐⭐⭐⭐ Expert</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="xp_reward" className="block text-sm font-semibold text-gray-900">
                      XP Reward *
                    </label>
                    <input
                      id="xp_reward"
                      type="number"
                      min="0"
                      step="10"
                      {...register('xp_reward', { valueAsNumber: true })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-white"
                    />
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

                <div className="flex gap-4 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={handleTogglePublish}
                    className={`px-6 py-3 rounded-xl font-medium transition-colors flex items-center gap-2 ${
                      isPublished
                        ? 'bg-amber-100 hover:bg-amber-200 text-amber-800'
                        : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-800'
                    }`}
                  >
                    {isPublished ? (
                      <>
                        <EyeOff className="h-5 w-5" />
                        Unpublish Module
                      </>
                    ) : (
                      <>
                        <Eye className="h-5 w-5" />
                        Publish Module
                      </>
                    )}
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-5 w-5" />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Lessons Management */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 border-b border-blue-200 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-xl shadow-sm">
                      <Layers className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">Lessons</h2>
                      <p className="text-sm text-gray-600">Manage and organize module lessons</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setEditingLesson(null);
                      setShowLessonForm(true);
                    }}
                    className="btn btn-primary flex items-center gap-2 px-4 py-2 rounded-xl"
                  >
                    <Plus className="h-5 w-5" />
                    Add Lesson
                  </button>
                </div>
              </div>

              <div className="p-6">
                {lessons.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="mx-auto w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                      <FileText className="h-8 w-8 text-blue-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No lessons yet</h3>
                    <p className="text-gray-600 mb-6 max-w-md mx-auto">
                      Add your first lesson to start building this module
                    </p>
                    <button
                      onClick={() => {
                        setEditingLesson(null);
                        setShowLessonForm(true);
                      }}
                      className="btn btn-primary inline-flex items-center gap-2"
                    >
                      <Plus className="h-5 w-5" />
                      Create First Lesson
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="mb-4 flex items-center justify-between">
                      <p className="text-sm text-gray-500">
                        Drag and drop to reorder lessons. Students will see them in this order.
                      </p>
                      <span className="text-sm font-medium text-gray-700">
                        {lessons.length} {lessons.length === 1 ? 'lesson' : 'lessons'}
                      </span>
                    </div>
                    
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={handleDragEnd}
                    >
                      <SortableContext items={lessons.map((l) => l.id)} strategy={verticalListSortingStrategy}>
                        <div className="space-y-3">
                          {lessons.map((lesson) => (
                            <SortableLessonItem
                              key={lesson.id}
                              lesson={lesson}
                              onEdit={() => {
                                setEditingLesson(lesson);
                                setShowLessonForm(true);
                              }}
                              onDelete={() => handleDeleteLesson(lesson.id)}
                              disabled={reordering}
                            />
                          ))}
                        </div>
                      </SortableContext>
                    </DndContext>
                    
                    {reordering && (
                      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        <span className="text-sm text-blue-700">Saving new order...</span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Module Status */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Module Status</h3>
              <div className="space-y-4">
                <div className={`p-4 rounded-xl border-2 ${isPublished ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'}`}>
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${isPublished ? 'bg-emerald-100' : 'bg-amber-100'}`}>
                      {isPublished ? (
                        <CheckCircle className="h-5 w-5 text-emerald-600" />
                      ) : (
                        <AlertTriangle className="h-5 w-5 text-amber-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {isPublished ? 'Published' : 'In Draft'}
                      </p>
                      <p className="text-sm text-gray-600">
                        {isPublished ? 'Visible to students' : 'Only visible to admins'}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Track</span>
                    <span className={`px-3 py-1 text-sm rounded-full ${getTrackInfo(watch('track')).color}`}>
                      {getTrackInfo(watch('track')).name}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Difficulty</span>
                    <span className={`px-3 py-1 text-sm rounded-full ${getDifficultyInfo(watch('difficulty_level')).color}`}>
                      {getDifficultyInfo(watch('difficulty_level')).name}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Order</span>
                    <span className="font-medium text-gray-900">#{watch('order_index') || 1}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">XP Value</span>
                    <span className="font-medium text-gray-900">{watch('xp_reward') || 0} XP</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Lesson Types */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Lesson Types</h3>
              <div className="space-y-3">
                {Object.entries(moduleStats.lessonTypes).map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white rounded-lg">
                        {getLessonTypeIcon(type)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 capitalize">{type}</p>
                        <p className="text-xs text-gray-500">
                          {type === 'video' ? 'Embedded videos' : 
                           type === 'quiz' ? 'Interactive quizzes' : 
                           type === 'pdf' ? 'PDF documents' : 
                           type === 'presentation' ? 'Slide decks' : 'Text content'}
                        </p>
                      </div>
                    </div>
                    <span className="font-bold text-gray-900">{count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-gradient-to-r from-primary-50 to-primary-100 border border-primary-200 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button
                  onClick={() => {
                    setEditingLesson(null);
                    setShowLessonForm(true);
                  }}
                  className="w-full flex items-center gap-3 p-3 bg-white hover:bg-gray-50 rounded-xl border border-gray-200 transition-colors"
                >
                  <div className="p-2 bg-primary-100 rounded-lg">
                    <Plus className="h-4 w-4 text-primary-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-gray-900">Add New Lesson</p>
                    <p className="text-xs text-gray-500">Create additional content</p>
                  </div>
                </button>
                <button
                  onClick={handlePreviewModule}
                  disabled={!isPublished}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                    isPublished
                      ? 'bg-white hover:bg-gray-50 border-gray-200'
                      : 'bg-gray-100 border-gray-200 cursor-not-allowed opacity-50'
                  }`}
                >
                  <div className={`p-2 rounded-lg ${isPublished ? 'bg-blue-100' : 'bg-gray-200'}`}>
                    <ExternalLink className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-gray-900">Preview Module</p>
                    <p className="text-xs text-gray-500">
                      {isPublished ? 'View as student' : 'Publish first to preview'}
                    </p>
                  </div>
                </button>
                <button
                  onClick={() => navigate('/admin/content')}
                  className="w-full flex items-center gap-3 p-3 bg-white hover:bg-gray-50 rounded-xl border border-gray-200 transition-colors"
                >
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <ArrowLeft className="h-4 w-4 text-gray-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-gray-900">Back to All Modules</p>
                    <p className="text-xs text-gray-500">Return to content management</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Lesson Form Modal */}
        {showLessonForm && (
          <LessonFormModal
            moduleId={id!}
            lesson={editingLesson}
            onClose={() => {
              setShowLessonForm(false);
              setEditingLesson(null);
            }}
            onSuccess={() => {
              setShowLessonForm(false);
              setEditingLesson(null);
              fetchModule();
            }}
          />
        )}
      </div>
    </div>
  );
}

// Sortable Lesson Item Component (same as before with minor styling updates)
interface SortableLessonItemProps {
  lesson: Lesson;
  onEdit: () => void;
  onDelete: () => void;
  disabled: boolean;
}

function SortableLessonItem({ lesson, onEdit, onDelete, disabled }: SortableLessonItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: lesson.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getLessonTypeColor = (type: string) => {
    const colors = {
      video: 'bg-red-100 text-red-800',
      text: 'bg-blue-100 text-blue-800',
      quiz: 'bg-purple-100 text-purple-800',
      pdf: 'bg-amber-100 text-amber-800',
      presentation: 'bg-green-100 text-green-800',
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white border-2 border-gray-200 rounded-xl p-4 hover:shadow-md transition-all ${
        isDragging ? 'shadow-lg border-primary-300' : ''
      } ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
    >
      <div className="flex items-center gap-3">
        <button
          {...attributes}
          {...listeners}
          className="p-2 text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing"
          aria-label="Drag to reorder"
        >
          <GripVertical className="h-4 w-4" />
        </button>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`px-2 py-1 text-xs rounded-full ${getLessonTypeColor(lesson.lesson_type)}`}>
              {lesson.lesson_type.charAt(0).toUpperCase() + lesson.lesson_type.slice(1)}
            </span>
            <span className="text-xs text-gray-500">#{lesson.order_index}</span>
            {lesson.duration_minutes && (
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {lesson.duration_minutes} min
              </span>
            )}
          </div>
          <h4 className="font-medium text-gray-900 truncate">{lesson.title}</h4>
        </div>
        
        <div className="flex gap-1">
          <button
            onClick={onEdit}
            className="p-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
            disabled={disabled}
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            onClick={onDelete}
            className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            disabled={disabled}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// LessonFormModal component (same as before with styling updates to match the theme)
interface LessonFormModalProps {
  moduleId: string;
  lesson: Lesson | null;
  onClose: () => void;
  onSuccess: () => void;
}

function LessonFormModal({ moduleId, lesson, onClose, onSuccess }: LessonFormModalProps) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [savedLessonId, setSavedLessonId] = useState<string | null>(lesson?.id || null);
  const [formData, setFormData] = useState({
    title: lesson?.title || '',
    lesson_type: lesson?.lesson_type || 'text' as 'video' | 'text' | 'quiz' | 'pdf' | 'presentation',
    content: lesson?.content || '',
    content_url: lesson?.content_url || '',
    order_index: lesson?.order_index || 1,
    duration_minutes: lesson?.duration_minutes || null,
  });

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = {
      pdf: ['application/pdf'],
      presentation: [
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'application/vnd.oasis.opendocument.presentation',
      ],
    };

    const isPDF = allowedTypes.pdf.includes(file.type);
    const isPresentation = allowedTypes.presentation.includes(file.type);

    if (!isPDF && !isPresentation) {
      setError('Please select a PDF or PowerPoint file (.pdf, .ppt, .pptx, .odp)');
      return;
    }

    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      setError('File size must be less than 50MB');
      return;
    }

    setSelectedFile(file);
    setError(null);
    setUploading(true);
    setUploadProgress(0);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${moduleId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('lesson-files')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('lesson-files')
        .getPublicUrl(fileName);

      if (!urlData?.publicUrl) {
        throw new Error('Failed to get file URL');
      }

      setFormData({
        ...formData,
        content_url: urlData.publicUrl,
        lesson_type: isPDF ? 'pdf' : 'presentation',
      });

      setUploadProgress(100);
    } catch (err: any) {
      console.error('Failed to upload file:', err);
      setError(err.message || 'Failed to upload file');
      setSelectedFile(null);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (lesson) {
        const { error } = await supabase
          .from('lessons')
          .update({
            title: formData.title,
            lesson_type: formData.lesson_type,
            content: formData.content || null,
            content_url: formData.content_url || null,
            order_index: formData.order_index,
            duration_minutes: formData.duration_minutes || null,
          })
          .eq('id', lesson.id);

        if (error) throw error;
        setSavedLessonId(lesson.id);
      } else {
        const { data, error } = await supabase.from('lessons').insert({
          module_id: moduleId,
          title: formData.title,
          lesson_type: formData.lesson_type,
          content: formData.content || null,
          content_url: formData.content_url || null,
          order_index: formData.order_index,
          duration_minutes: formData.duration_minutes || null,
        }).select().single();

        if (error) throw error;
        setSavedLessonId(data.id);
      }

      if (formData.lesson_type === 'quiz') {
        setLoading(false);
      } else {
        onSuccess();
      }
    } catch (err: any) {
      console.error('Failed to save lesson:', err);
      setError(err.message || 'Failed to save lesson');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`bg-white rounded-2xl ${formData.lesson_type === 'quiz' ? 'max-w-5xl' : 'max-w-2xl'} w-full mx-auto max-h-[90vh] overflow-y-auto`}>
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            {lesson ? 'Edit Lesson' : 'Add New Lesson'}
          </h2>
          <p className="text-gray-600 mt-1">
            {lesson ? 'Update lesson details' : 'Create a new lesson for this module'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-900">
                Lesson Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-900">
                Lesson Type *
              </label>
              <select
                value={formData.lesson_type}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    lesson_type: e.target.value as 'video' | 'text' | 'quiz' | 'pdf' | 'presentation',
                  })
                }
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="text">Text</option>
                <option value="video">Video</option>
                <option value="quiz">Quiz</option>
                <option value="pdf">PDF Document</option>
                <option value="presentation">PowerPoint/Presentation</option>
              </select>
            </div>
          </div>

          {/* Rest of the LessonFormModal content remains the same with updated styling */}
          {/* ... (Content type specific fields, file upload, quiz builder, etc.) ... */}

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

          <div className="flex gap-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium text-gray-700 transition-colors"
            >
              {formData.lesson_type === 'quiz' && savedLessonId ? 'Done' : 'Cancel'}
            </button>
            {formData.lesson_type === 'quiz' && savedLessonId ? (
              <button
                type="button"
                onClick={onSuccess}
                className="flex-1 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium transition-colors"
              >
                Finish & Close
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Saving...' : lesson ? 'Update Lesson' : 'Create Lesson'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminModuleEditPage() {
  return (
    <ProtectedRoute requireRole="admin">
      <AdminModuleEditContent />
    </ProtectedRoute>
  );
}