import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useParams } from 'react-router-dom';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AdminNavBar } from '@/components/navigation/AdminNavBar';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Save, Plus, Edit, Trash2, Eye, EyeOff, Upload, FileText, Presentation, X, GripVertical } from 'lucide-react';
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
      setLessons(lessonsData || []);
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

      alert('Module updated successfully!');
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

      // Update all lessons in a transaction-like manner
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
    } catch (err: any) {
      console.error('Failed to reorder lessons:', err);
      alert('Failed to save lesson order. Please try again.');
      // Revert to original order
      fetchModule();
    } finally {
      setReordering(false);
    }
  };

  if (fetching) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavBar />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <button
            onClick={() => navigate('/admin/content')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Content Management
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Edit Module</h1>
              <p className="text-gray-600 mt-2">Update module details and manage lessons</p>
            </div>
            <button
              onClick={handleTogglePublish}
              className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 ${
                isPublished
                  ? 'bg-yellow-100 hover:bg-yellow-200 text-yellow-800'
                  : 'bg-green-100 hover:bg-green-200 text-green-800'
              }`}
            >
              {isPublished ? (
                <>
                  <EyeOff className="h-4 w-4" />
                  Unpublish
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4" />
                  Publish
                </>
              )}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Module Details Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
              <h2 className="text-xl font-semibold mb-4">Module Details</h2>
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
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
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
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
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
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-800 text-sm">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="h-5 w-5" />
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </form>
            </div>
          </div>

          {/* Lessons Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Lessons</h2>
                <button
                  onClick={() => {
                    setEditingLesson(null);
                    setShowLessonForm(true);
                  }}
                  className="p-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  <Plus className="h-5 w-5" />
                </button>
              </div>

              {lessons.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-8">
                  No lessons yet. Click + to add one.
                </p>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext items={lessons.map((l) => l.id)} strategy={verticalListSortingStrategy}>
                    <div className="space-y-2">
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
              )}
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

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`p-3 border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center justify-between ${
        isDragging ? 'shadow-lg' : ''
      } ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
    >
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <button
          {...attributes}
          {...listeners}
          className="p-1 text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing"
          aria-label="Drag to reorder"
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">
            {lesson.title}
          </p>
          <p className="text-xs text-gray-500 capitalize">{lesson.lesson_type}</p>
        </div>
      </div>
      <div className="flex gap-1">
        <button
          onClick={onEdit}
          className="p-1 text-gray-600 hover:text-primary-600"
          disabled={disabled}
        >
          <Edit className="h-4 w-4" />
        </button>
        <button
          onClick={onDelete}
          className="p-1 text-gray-600 hover:text-red-600"
          disabled={disabled}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

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

    // Validate file type
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

    // Validate file size (max 50MB)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      setError('File size must be less than 50MB');
      return;
    }

    setSelectedFile(file);
    setError(null);

    // Upload file to Supabase Storage
    setUploading(true);
    setUploadProgress(0);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${moduleId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('lesson-files')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('lesson-files')
        .getPublicUrl(fileName);

      if (!urlData?.publicUrl) {
        throw new Error('Failed to get file URL');
      }

      // Update form data with the file URL
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
        // Update existing lesson
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
      } else {
        // Create new lesson
        const { error } = await supabase.from('lessons').insert({
          module_id: moduleId,
          title: formData.title,
          lesson_type: formData.lesson_type,
          content: formData.content || null,
          content_url: formData.content_url || null,
          order_index: formData.order_index,
          duration_minutes: formData.duration_minutes || null,
        });

        if (error) throw error;
      }

      onSuccess();
    } catch (err: any) {
      console.error('Failed to save lesson:', err);
      setError(err.message || 'Failed to save lesson');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">
          {lesson ? 'Edit Lesson' : 'Add New Lesson'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
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

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
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

          {(formData.lesson_type === 'pdf' || formData.lesson_type === 'presentation') ? (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {formData.lesson_type === 'pdf' ? 'PDF File' : 'Presentation File'} *
              </label>
              <div className="space-y-3">
                <div className="relative">
                  <input
                    type="file"
                    accept={formData.lesson_type === 'pdf' ? '.pdf' : '.ppt,.pptx,.odp'}
                    onChange={handleFileSelect}
                    disabled={uploading}
                    className="hidden"
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    className={`flex items-center justify-center gap-2 w-full px-4 py-6 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
                      uploading
                        ? 'border-primary-400 bg-primary-50'
                        : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'
                    }`}
                  >
                    {uploading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-600"></div>
                        <span className="text-sm text-gray-600">Uploading... {uploadProgress}%</span>
                      </>
                    ) : selectedFile ? (
                      <>
                        {formData.lesson_type === 'pdf' ? (
                          <FileText className="h-5 w-5 text-green-600" />
                        ) : (
                          <Presentation className="h-5 w-5 text-blue-600" />
                        )}
                        <span className="text-sm text-gray-700 font-medium">{selectedFile.name}</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedFile(null);
                            setFormData({ ...formData, content_url: '' });
                          }}
                          className="ml-auto p-1 hover:bg-red-100 rounded"
                        >
                          <X className="h-4 w-4 text-red-600" />
                        </button>
                      </>
                    ) : (
                      <>
                        <Upload className="h-5 w-5 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          Click to upload {formData.lesson_type === 'pdf' ? 'PDF' : 'PowerPoint'} file
                        </span>
                      </>
                    )}
                  </label>
                </div>
                {formData.content_url && !selectedFile && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
                    {formData.lesson_type === 'pdf' ? (
                      <FileText className="h-4 w-4 text-green-600" />
                    ) : (
                      <Presentation className="h-4 w-4 text-blue-600" />
                    )}
                    <span className="text-sm text-green-700">File uploaded successfully</span>
                  </div>
                )}
                <p className="text-xs text-gray-500">
                  Max file size: 50MB. Supported formats: {formData.lesson_type === 'pdf' ? 'PDF' : 'PPT, PPTX, ODP'}
                </p>
              </div>
            </div>
          ) : formData.lesson_type === 'video' ? (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Video URL *
              </label>
              <input
                type="url"
                value={formData.content_url}
                onChange={(e) => setFormData({ ...formData, content_url: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="https://youtube.com/watch?v=..."
              />
            </div>
          ) : (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Content *
              </label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                rows={6}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                required={formData.lesson_type !== 'video'}
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Order Index *
              </label>
              <input
                type="number"
                min="1"
                value={formData.order_index}
                onChange={(e) =>
                  setFormData({ ...formData, order_index: parseInt(e.target.value) || 1 })
                }
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Duration (minutes)
              </label>
              <input
                type="number"
                min="1"
                value={formData.duration_minutes || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    duration_minutes: e.target.value ? parseInt(e.target.value) : null,
                  })
                }
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
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
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium text-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : lesson ? 'Update Lesson' : 'Create Lesson'}
            </button>
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

