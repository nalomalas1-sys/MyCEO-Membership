import { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AdminNavBar } from '@/components/navigation/AdminNavBar';
import { LoadingAnimation } from '@/components/ui/LoadingAnimation';
import { supabase } from '@/lib/supabase';
import { BookOpen, Users, CheckCircle2, XCircle, Search, ChevronDown, ChevronUp, GraduationCap, Filter } from 'lucide-react';

interface Module {
  id: string;
  title: string;
  description: string | null;
  track: string;
  order_index: number;
}

interface Lesson {
  id: string;
  module_id: string;
  title: string;
  lesson_type: string;
  order_index: number;
}

interface Child {
  id: string;
  name: string;
  completed_at?: string;
}

interface CompletionData {
  totalChildren: number;
  completedChildren: Child[];
  notCompletedChildren: Child[];
}

function AdminCompletionTrackingContent() {
  const [modules, setModules] = useState<Module[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [viewType, setViewType] = useState<'module' | 'lesson'>('module');
  const [searchQuery, setSearchQuery] = useState('');
  const [trackFilter, setTrackFilter] = useState<string>('all');
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [moduleCompletionData, setModuleCompletionData] = useState<Record<string, CompletionData>>({});
  const [lessonCompletionData, setLessonCompletionData] = useState<Record<string, CompletionData>>({});
  const [loadingCompletion, setLoadingCompletion] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchModules();
    fetchLessons();
  }, []);

  useEffect(() => {
    if (viewType === 'module' && modules.length > 0) {
      // Load completion data for all modules
      modules.forEach((module) => {
        if (!moduleCompletionData[module.id]) {
          fetchModuleCompletion(module.id);
        }
      });
    } else if (viewType === 'lesson' && lessons.length > 0) {
      // Load completion data for all lessons
      lessons.forEach((lesson) => {
        if (!lessonCompletionData[lesson.id]) {
          fetchLessonCompletion(lesson.id);
        }
      });
    }
  }, [viewType, modules, lessons]);

  async function fetchModules() {
    try {
      const { data, error } = await supabase
        .from('modules')
        .select('id, title, description, track, order_index')
        .order('order_index', { ascending: true });

      if (error) throw error;
      setModules(data || []);
    } catch (error) {
      console.error('Failed to fetch modules:', error);
    }
  }

  async function fetchLessons() {
    try {
      const { data, error } = await supabase
        .from('lessons')
        .select('id, module_id, title, lesson_type, order_index')
        .order('module_id, order_index', { ascending: true });

      if (error) throw error;
      setLessons(data || []);
    } catch (error) {
      console.error('Failed to fetch lessons:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchModuleCompletion(moduleId: string) {
    if (loadingCompletion.has(moduleId)) return;

    try {
      setLoadingCompletion((prev) => new Set(prev).add(moduleId));

      // Get all children
      const { data: allChildren, error: childrenError } = await supabase
        .from('children')
        .select('id, name')
        .is('deleted_at', null);

      if (childrenError) throw childrenError;

      // Get children who completed the module
      const { data: completedProgress, error: progressError } = await supabase
        .from('child_module_progress')
        .select('child_id, completed_at')
        .eq('module_id', moduleId)
        .eq('status', 'completed');

      if (progressError) throw progressError;

      const completedChildIds = new Set(completedProgress?.map((p) => p.child_id) || []);
      const completedChildren: Child[] = [];
      const notCompletedChildren: Child[] = [];

      allChildren?.forEach((child) => {
        const progress = completedProgress?.find((p) => p.child_id === child.id);
        if (completedChildIds.has(child.id)) {
          completedChildren.push({
            id: child.id,
            name: child.name,
            completed_at: progress?.completed_at,
          });
        } else {
          notCompletedChildren.push({
            id: child.id,
            name: child.name,
          });
        }
      });

      setModuleCompletionData((prev) => ({
        ...prev,
        [moduleId]: {
          totalChildren: allChildren?.length || 0,
          completedChildren,
          notCompletedChildren,
        },
      }));
    } catch (error) {
      console.error(`Failed to fetch module completion for ${moduleId}:`, error);
    } finally {
      setLoadingCompletion((prev) => {
        const next = new Set(prev);
        next.delete(moduleId);
        return next;
      });
    }
  }

  async function fetchLessonCompletion(lessonId: string) {
    if (loadingCompletion.has(lessonId)) return;

    try {
      setLoadingCompletion((prev) => new Set(prev).add(lessonId));

      // Get all children
      const { data: allChildren, error: childrenError } = await supabase
        .from('children')
        .select('id, name')
        .is('deleted_at', null);

      if (childrenError) throw childrenError;

      // Get children who completed the lesson
      const { data: completedProgress, error: progressError } = await supabase
        .from('child_lesson_progress')
        .select('child_id, completed_at')
        .eq('lesson_id', lessonId)
        .eq('is_completed', true);

      if (progressError) throw progressError;

      const completedChildIds = new Set(completedProgress?.map((p) => p.child_id) || []);
      const completedChildren: Child[] = [];
      const notCompletedChildren: Child[] = [];

      allChildren?.forEach((child) => {
        const progress = completedProgress?.find((p) => p.child_id === child.id);
        if (completedChildIds.has(child.id)) {
          completedChildren.push({
            id: child.id,
            name: child.name,
            completed_at: progress?.completed_at,
          });
        } else {
          notCompletedChildren.push({
            id: child.id,
            name: child.name,
          });
        }
      });

      setLessonCompletionData((prev) => ({
        ...prev,
        [lessonId]: {
          totalChildren: allChildren?.length || 0,
          completedChildren,
          notCompletedChildren,
        },
      }));
    } catch (error) {
      console.error(`Failed to fetch lesson completion for ${lessonId}:`, error);
    } finally {
      setLoadingCompletion((prev) => {
        const next = new Set(prev);
        next.delete(lessonId);
        return next;
      });
    }
  }

  const toggleExpand = (id: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Get unique tracks from modules
  const availableTracks = Array.from(new Set(modules.map((m) => m.track))).sort();

  // Helper function to format track name for display
  const formatTrackName = (track: string) => {
    return track
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const filteredModules = modules.filter((module) => {
    const matchesSearch = module.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTrack = trackFilter === 'all' || module.track === trackFilter;
    return matchesSearch && matchesTrack;
  });

  const filteredLessons = lessons.filter((lesson) => {
    const module = modules.find((m) => m.id === lesson.module_id);
    const matchesSearch = lesson.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTrack = trackFilter === 'all' || (module && module.track === trackFilter);
    return matchesSearch && matchesTrack;
  });

  const getLessonsForModule = (moduleId: string) => {
    return filteredLessons.filter((lesson) => lesson.module_id === moduleId);
  };

  if (loading) {
    return <LoadingAnimation message="Loading..." variant="fullscreen" />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavBar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Completion Tracking</h1>
          <p className="text-gray-600">Track which children have completed modules and lessons</p>
        </div>

        {/* View Type Toggle */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-gray-200">
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="flex items-center gap-4">
              <span className="text-sm font-semibold text-gray-700">View:</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setViewType('module')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    viewType === 'module'
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    Modules
                  </div>
                </button>
                <button
                  onClick={() => setViewType('lesson')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    viewType === 'lesson'
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <GraduationCap className="h-4 w-4" />
                    Lessons
                  </div>
                </button>
              </div>
            </div>

            {/* Track Filter */}
            <div className="flex items-center gap-2 ml-auto">
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                value={trackFilter}
                onChange={(e) => setTrackFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm font-medium"
              >
                <option value="all">All Tracks</option>
                {availableTracks.map((track) => (
                  <option key={track} value={track}>
                    {formatTrackName(track)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder={`Search ${viewType === 'module' ? 'modules' : 'lessons'}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </div>

        {/* Modules View */}
        {viewType === 'module' && (
          <div className="space-y-4">
            {filteredModules.length === 0 ? (
              <div className="bg-white rounded-xl shadow-lg p-12 text-center border border-gray-200">
                <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 text-lg">No modules found</p>
              </div>
            ) : (
              filteredModules.map((module) => {
                const completionData = moduleCompletionData[module.id];
                const isLoading = loadingCompletion.has(module.id);
                const isExpanded = expandedItems.has(module.id);

                return (
                  <div
                    key={module.id}
                    className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden"
                  >
                    <div
                      className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => {
                        toggleExpand(module.id);
                        if (!completionData && !isLoading) {
                          fetchModuleCompletion(module.id);
                        }
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">{module.title}</h3>
                          {module.description && (
                            <p className="text-sm text-gray-600 mb-3">{module.description}</p>
                          )}
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                              {module.track}
                            </span>
                            {completionData && (
                              <>
                                <div className="flex items-center gap-2">
                                  <Users className="h-4 w-4" />
                                  <span>Total: {completionData.totalChildren}</span>
                                </div>
                                <div className="flex items-center gap-2 text-green-600">
                                  <CheckCircle2 className="h-4 w-4" />
                                  <span>Completed: {completionData.completedChildren.length}</span>
                                </div>
                                <div className="flex items-center gap-2 text-red-600">
                                  <XCircle className="h-4 w-4" />
                                  <span>Not Completed: {completionData.notCompletedChildren.length}</span>
                                </div>
                              </>
                            )}
                            {isLoading && (
                              <span className="text-gray-500">Loading...</span>
                            )}
                          </div>
                        </div>
                        <div className="ml-4">
                          {isExpanded ? (
                            <ChevronUp className="h-5 w-5 text-gray-400" />
                          ) : (
                            <ChevronDown className="h-5 w-5 text-gray-400" />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {isExpanded && completionData && (
                      <div className="border-t border-gray-200 bg-gray-50 p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Completed Children */}
                          <div>
                            <h4 className="text-md font-semibold text-green-800 mb-3 flex items-center gap-2">
                              <CheckCircle2 className="h-5 w-5" />
                              Completed ({completionData.completedChildren.length})
                            </h4>
                            {completionData.completedChildren.length === 0 ? (
                              <p className="text-sm text-gray-600">No children have completed this module yet.</p>
                            ) : (
                              <div className="space-y-2 max-h-96 overflow-y-auto">
                                {completionData.completedChildren.map((child) => (
                                  <div
                                    key={child.id}
                                    className="bg-white rounded-lg p-3 border border-green-200"
                                  >
                                    <div className="flex items-center justify-between">
                                      <span className="font-medium text-gray-900">{child.name}</span>
                                      {child.completed_at && (
                                        <span className="text-xs text-gray-500">
                                          {new Date(child.completed_at).toLocaleDateString()}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Not Completed Children */}
                          <div>
                            <h4 className="text-md font-semibold text-red-800 mb-3 flex items-center gap-2">
                              <XCircle className="h-5 w-5" />
                              Not Completed ({completionData.notCompletedChildren.length})
                            </h4>
                            {completionData.notCompletedChildren.length === 0 ? (
                              <p className="text-sm text-gray-600">All children have completed this module!</p>
                            ) : (
                              <div className="space-y-2 max-h-96 overflow-y-auto">
                                {completionData.notCompletedChildren.map((child) => (
                                  <div
                                    key={child.id}
                                    className="bg-white rounded-lg p-3 border border-red-200"
                                  >
                                    <span className="font-medium text-gray-900">{child.name}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Lessons View */}
        {viewType === 'lesson' && (
          <div className="space-y-4">
            {filteredLessons.length === 0 ? (
              <div className="bg-white rounded-xl shadow-lg p-12 text-center border border-gray-200">
                <GraduationCap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 text-lg">No lessons found</p>
              </div>
            ) : (
              filteredLessons.map((lesson) => {
                const module = modules.find((m) => m.id === lesson.module_id);
                const completionData = lessonCompletionData[lesson.id];
                const isLoading = loadingCompletion.has(lesson.id);
                const isExpanded = expandedItems.has(lesson.id);

                return (
                  <div
                    key={lesson.id}
                    className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden"
                  >
                    <div
                      className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => {
                        toggleExpand(lesson.id);
                        if (!completionData && !isLoading) {
                          fetchLessonCompletion(lesson.id);
                        }
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">{lesson.title}</h3>
                          <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                            {module && (
                              <>
                                <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                                  {formatTrackName(module.track)}
                                </span>
                                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                                  {module.title}
                                </span>
                              </>
                            )}
                            <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                              {lesson.lesson_type}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            {completionData && (
                              <>
                                <div className="flex items-center gap-2">
                                  <Users className="h-4 w-4" />
                                  <span>Total: {completionData.totalChildren}</span>
                                </div>
                                <div className="flex items-center gap-2 text-green-600">
                                  <CheckCircle2 className="h-4 w-4" />
                                  <span>Completed: {completionData.completedChildren.length}</span>
                                </div>
                                <div className="flex items-center gap-2 text-red-600">
                                  <XCircle className="h-4 w-4" />
                                  <span>Not Completed: {completionData.notCompletedChildren.length}</span>
                                </div>
                              </>
                            )}
                            {isLoading && (
                              <span className="text-gray-500">Loading...</span>
                            )}
                          </div>
                        </div>
                        <div className="ml-4">
                          {isExpanded ? (
                            <ChevronUp className="h-5 w-5 text-gray-400" />
                          ) : (
                            <ChevronDown className="h-5 w-5 text-gray-400" />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {isExpanded && completionData && (
                      <div className="border-t border-gray-200 bg-gray-50 p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Completed Children */}
                          <div>
                            <h4 className="text-md font-semibold text-green-800 mb-3 flex items-center gap-2">
                              <CheckCircle2 className="h-5 w-5" />
                              Completed ({completionData.completedChildren.length})
                            </h4>
                            {completionData.completedChildren.length === 0 ? (
                              <p className="text-sm text-gray-600">No children have completed this lesson yet.</p>
                            ) : (
                              <div className="space-y-2 max-h-96 overflow-y-auto">
                                {completionData.completedChildren.map((child) => (
                                  <div
                                    key={child.id}
                                    className="bg-white rounded-lg p-3 border border-green-200"
                                  >
                                    <div className="flex items-center justify-between">
                                      <span className="font-medium text-gray-900">{child.name}</span>
                                      {child.completed_at && (
                                        <span className="text-xs text-gray-500">
                                          {new Date(child.completed_at).toLocaleDateString()}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Not Completed Children */}
                          <div>
                            <h4 className="text-md font-semibold text-red-800 mb-3 flex items-center gap-2">
                              <XCircle className="h-5 w-5" />
                              Not Completed ({completionData.notCompletedChildren.length})
                            </h4>
                            {completionData.notCompletedChildren.length === 0 ? (
                              <p className="text-sm text-gray-600">All children have completed this lesson!</p>
                            ) : (
                              <div className="space-y-2 max-h-96 overflow-y-auto">
                                {completionData.notCompletedChildren.map((child) => (
                                  <div
                                    key={child.id}
                                    className="bg-white rounded-lg p-3 border border-red-200"
                                  >
                                    <span className="font-medium text-gray-900">{child.name}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminCompletionTrackingPage() {
  return (
    <ProtectedRoute requireRole="admin">
      <AdminCompletionTrackingContent />
    </ProtectedRoute>
  );
}
