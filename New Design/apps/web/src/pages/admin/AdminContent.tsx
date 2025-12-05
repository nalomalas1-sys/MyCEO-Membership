import { useState, useEffect, useCallback } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AdminNavBar } from '@/components/navigation/AdminNavBar';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Plus,
  Edit,
  Eye,
  EyeOff,
  Search,
  Filter,
  Trash2,
  ExternalLink,
  TrendingUp,
  Layers,
  Award,
  Calendar,
  ChevronRight,
  AlertTriangle,
  CheckCircle,
  Clock,
  MoreVertical,
  Sparkles,
  AlertCircle,
  Copy,
  RefreshCw,
  BarChart3,
  Zap,
  FolderOpen,
  X,
  Loader2,
  Database,
  Shield
} from 'lucide-react';

interface Module {
  id: string;
  title: string;
  description: string | null;
  track: string;
  order_index: number;
  difficulty_level: number;
  xp_reward: number;
  is_published: boolean;
  published_at: string | null;
  created_at: string;
  lessons_count: number;
}

function AdminContentContent() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingModuleId, setDeletingModuleId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [trackFilter, setTrackFilter] = useState<string>('all');
  const [publishedFilter, setPublishedFilter] = useState<string>('all');
  const [showToast, setShowToast] = useState<{type: 'success' | 'error' | 'info', message: string} | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    published: 0,
    draft: 0,
    totalLessons: 0,
    totalXP: 0,
    averageDifficulty: 0
  });

  // Show toast notification
  const showNotification = useCallback((type: 'success' | 'error' | 'info', message: string) => {
    setShowToast({ type, message });
    setTimeout(() => setShowToast(null), 4000);
  }, []);

  const fetchModules = useCallback(async () => {
    try {
      setLoading(true);

      let query = supabase
        .from('modules')
        .select('*')
        .order('order_index', { ascending: true });

      if (trackFilter !== 'all') {
        query = query.eq('track', trackFilter);
      }

      if (publishedFilter !== 'all') {
        query = query.eq('is_published', publishedFilter === 'published');
      }

      const { data, error } = await query;

      if (error) throw error;

      // Get lessons count for each module
      const modulesWithCounts = await Promise.all(
        (data || []).map(async (module) => {
          const { count } = await supabase
            .from('lessons')
            .select('id', { count: 'exact', head: true })
            .eq('module_id', module.id);

          return {
            ...module,
            lessons_count: count || 0,
          };
        })
      );

      setModules(modulesWithCounts as Module[]);

      // Calculate stats
      let totalLessons = 0;
      let publishedCount = 0;
      let draftCount = 0;
      let totalXP = 0;
      let totalDifficulty = 0;

      modulesWithCounts.forEach(module => {
        totalLessons += module.lessons_count;
        totalXP += module.xp_reward;
        totalDifficulty += module.difficulty_level;
        
        if (module.is_published) {
          publishedCount++;
        } else {
          draftCount++;
        }
      });

      setStats({
        total: modulesWithCounts.length,
        published: publishedCount,
        draft: draftCount,
        totalLessons,
        totalXP,
        averageDifficulty: modulesWithCounts.length > 0 
          ? Math.round((totalDifficulty / modulesWithCounts.length) * 10) / 10 
          : 0
      });
    } catch (error) {
      console.error('Failed to fetch modules:', error);
      showNotification('error', 'Failed to load modules');
    } finally {
      setLoading(false);
    }
  }, [trackFilter, publishedFilter, showNotification]);

  useEffect(() => {
    fetchModules();
  }, [fetchModules]);

  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => setShowToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [showToast]);

  const handleTogglePublish = async (moduleId: string, currentStatus: boolean, moduleTitle: string) => {
    try {
      const { error } = await supabase
        .from('modules')
        .update({
          is_published: !currentStatus,
          published_at: !currentStatus ? new Date().toISOString() : null,
        })
        .eq('id', moduleId);

      if (error) throw error;

      showNotification('success', `Module "${moduleTitle}" ${!currentStatus ? 'published' : 'unpublished'} successfully!`);
      fetchModules();
    } catch (error) {
      console.error('Failed to toggle publish status:', error);
      showNotification('error', 'Failed to update module status');
    }
  };

  const handleDeleteModule = async (moduleId: string, moduleTitle: string) => {
    if (!confirm(`Are you sure you want to delete "${moduleTitle}"? This will delete ALL associated lessons and student data permanently.`)) {
      return;
    }

    try {
      setDeletingModuleId(moduleId);
      showNotification('info', `Deleting "${moduleTitle}"...`);

      // STEP 1: First, delete all lessons in this module (including their quiz questions and attempts)
      const { data: lessons } = await supabase
        .from('lessons')
        .select('id')
        .eq('module_id', moduleId);

      if (lessons && lessons.length > 0) {
        const lessonIds = lessons.map(l => l.id);
        
        // Delete quiz attempts for these lessons
        await supabase
          .from('quiz_attempts')
          .delete()
          .in('lesson_id', lessonIds)
          .then(({ error }) => {
            if (error && !error.message.includes('no rows')) {
              console.warn('Error deleting quiz attempts:', error);
            }
          });

        // Delete quiz questions for these lessons
        await supabase
          .from('quiz_questions')
          .delete()
          .in('lesson_id', lessonIds)
          .then(({ error }) => {
            if (error && !error.message.includes('no rows')) {
              console.warn('Error deleting quiz questions:', error);
            }
          });

        // Delete the lessons themselves
        const { error: lessonsError } = await supabase
          .from('lessons')
          .delete()
          .eq('module_id', moduleId);

        if (lessonsError) {
          console.error('Error deleting lessons:', lessonsError);
          // Continue anyway, might be cascade
        }
      }

      // STEP 2: Delete any module-specific data (student progress, etc.)
      try {
        // Check if student_progress table exists and delete entries
        const { error: progressError } = await supabase
          .from('student_progress')
          .delete()
          .eq('module_id', moduleId);

        if (progressError && !progressError.message.includes('no rows')) {
          console.warn('Error deleting student progress:', progressError);
        }
      } catch (e) {
        // Table might not exist, that's okay
      }

      // STEP 3: Now delete the module itself
      const { error: moduleError } = await supabase
        .from('modules')
        .delete()
        .eq('id', moduleId);

      if (moduleError) {
        // If we get a foreign key constraint error, the database needs CASCADE enabled
        if (moduleError.code === '23503' || moduleError.message.includes('foreign key constraint')) {
          throw new Error(
            'Database constraint prevents deletion. Please run this SQL in Supabase:\n\n' +
            'ALTER TABLE lessons DROP CONSTRAINT IF EXISTS lessons_module_id_fkey;\n' +
            'ALTER TABLE lessons ADD CONSTRAINT lessons_module_id_fkey FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE;'
          );
        }
        throw moduleError;
      }

      // STEP 4: Update local state IMMEDIATELY
      const deletedModule = modules.find(m => m.id === moduleId);
      if (deletedModule) {
        setModules(prev => prev.filter(m => m.id !== moduleId));
        
        // Update stats
        setStats(prev => ({
          total: prev.total - 1,
          published: deletedModule.is_published ? prev.published - 1 : prev.published,
          draft: !deletedModule.is_published ? prev.draft - 1 : prev.draft,
          totalLessons: prev.totalLessons - deletedModule.lessons_count,
          totalXP: prev.totalXP - deletedModule.xp_reward,
          averageDifficulty: prev.total > 1 
            ? Math.round(((prev.averageDifficulty * prev.total) - deletedModule.difficulty_level) / (prev.total - 1) * 10) / 10
            : 0
        }));
      }

      showNotification('success', `✅ Module "${moduleTitle}" deleted successfully!`);

      // STEP 5: Verify deletion after 2 seconds
      setTimeout(async () => {
        const { data: verifyData } = await supabase
          .from('modules')
          .select('id')
          .eq('id', moduleId)
          .single();
        
        if (verifyData) {
          console.warn('Module still exists after deletion attempt');
          showNotification('error', 'Module deletion may have failed. Please refresh to confirm.');
        }
      }, 2000);

    } catch (error: any) {
      console.error('❌ Delete failed:', error);
      
      // Check if it's a constraint error and show helpful message
      if (error.message.includes('Database constraint prevents deletion')) {
        showNotification('error', 
          'Database constraint error. Please enable CASCADE delete by running the SQL command shown in console.'
        );
        console.error('\n⚠️ SQL FIX REQUIRED ⚠️\n' + error.message.split('\n\n')[1]);
      } else {
        showNotification('error', error.message || 'Failed to delete module');
      }
      
      // Refresh to restore correct state
      fetchModules();
    } finally {
      setDeletingModuleId(null);
    }
  };

  // SIMPLE DELETE (Direct database delete - assumes CASCADE is enabled)
  const handleSimpleDelete = async (moduleId: string, moduleTitle: string) => {
    if (!confirm(`Delete "${moduleTitle}"?`)) return;

    try {
      setDeletingModuleId(moduleId);

      // Save module info for local state update
      const moduleToDelete = modules.find(m => m.id === moduleId);
      
      if (!moduleToDelete) {
        throw new Error('Module not found');
      }

      // Direct delete (requires CASCADE to be enabled in database)
      const { error } = await supabase
        .from('modules')
        .delete()
        .eq('id', moduleId);

      if (error) {
        // Check if it's a constraint error
        if (error.code === '23503' || error.message.includes('foreign key constraint')) {
          const fixSQL = `
          -- Run this in Supabase SQL Editor to enable CASCADE delete:
          ALTER TABLE lessons 
          DROP CONSTRAINT IF EXISTS lessons_module_id_fkey;
          
          ALTER TABLE lessons 
          ADD CONSTRAINT lessons_module_id_fkey 
          FOREIGN KEY (module_id) 
          REFERENCES modules(id) 
          ON DELETE CASCADE;
          `;
          
          console.error('⚠️ DATABASE FIX REQUIRED ⚠️\n' + fixSQL);
          
          throw new Error(
            'Cannot delete module with lessons. ' +
            'Please run the SQL command in console to enable CASCADE delete, ' +
            'or delete all lessons in this module first.'
          );
        }
        throw error;
      }

      // Update local state immediately
      setModules(prev => prev.filter(m => m.id !== moduleId));
      
      // Update local stats
      setStats(prev => ({
        total: prev.total - 1,
        published: moduleToDelete.is_published ? prev.published - 1 : prev.published,
        draft: !moduleToDelete.is_published ? prev.draft - 1 : prev.draft,
        totalLessons: prev.totalLessons - moduleToDelete.lessons_count,
        totalXP: prev.totalXP - moduleToDelete.xp_reward,
        averageDifficulty: prev.total > 1 
          ? Math.round(((prev.averageDifficulty * prev.total) - moduleToDelete.difficulty_level) / (prev.total - 1) * 10) / 10
          : 0
      }));

      showNotification('success', `✅ Module "${moduleTitle}" deleted!`);
      
      // Wait 3 seconds, then refresh from server
      setTimeout(() => {
        fetchModules();
      }, 3000);
      
    } catch (error: any) {
      console.error('Delete error:', error);
      showNotification('error', error.message || 'Failed to delete module');
      fetchModules();
    } finally {
      setDeletingModuleId(null);
    }
  };

  const handleRefresh = async () => {
    showNotification('info', 'Refreshing modules...');
    await fetchModules();
    showNotification('success', 'Modules refreshed!');
  };

  const handleDuplicateModule = async (moduleId: string) => {
    try {
      const { data: module, error } = await supabase
        .from('modules')
        .select('*')
        .eq('id', moduleId)
        .single();

      if (error) throw error;

      const { data: newModule, error: insertError } = await supabase
        .from('modules')
        .insert({
          title: `${module.title} (Copy)`,
          description: module.description,
          track: module.track,
          order_index: module.order_index + 1,
          difficulty_level: module.difficulty_level,
          xp_reward: module.xp_reward,
          is_published: false,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      showNotification('success', 'Module duplicated!');
      navigate(`/admin/content/${newModule.id}/edit`);
    } catch (error) {
      console.error('Failed to duplicate module:', error);
      showNotification('error', 'Failed to duplicate module');
    }
  };

  const handlePreviewModule = (moduleId: string) => {
    window.open(`/child/modules/${moduleId}`, '_blank');
  };

  const getTrackName = (track: string) => {
    const names: Record<string, string> = {
      money_basics: 'Money Basics',
      entrepreneurship: 'Entrepreneurship',
      advanced: 'Advanced',
    };
    return names[track] || track;
  };

  const getDifficultyName = (level: number) => {
    if (level <= 1) return 'Beginner';
    if (level <= 3) return 'Intermediate';
    return 'Advanced';
  };

  const getDifficultyColor = (level: number) => {
    if (level <= 1) return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    if (level <= 3) return 'bg-amber-100 text-amber-800 border-amber-200';
    return 'bg-rose-100 text-rose-800 border-rose-200';
  };

  const getTrackColor = (track: string) => {
    const colors: Record<string, string> = {
      money_basics: 'bg-blue-100 text-blue-800 border-blue-200',
      entrepreneurship: 'bg-purple-100 text-purple-800 border-purple-200',
      advanced: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    };
    return colors[track] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const filteredModules = modules.filter((module) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      module.title.toLowerCase().includes(query) ||
      module.description?.toLowerCase().includes(query) ||
      getTrackName(module.track).toLowerCase().includes(query) ||
      getDifficultyName(module.difficulty_level).toLowerCase().includes(query)
    );
  });

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not published';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading && modules.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mb-4"></div>
          <div className="text-lg text-gray-600">Loading content...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Toast Notification */}
      {showToast && (
        <div className={`fixed top-4 right-4 z-50 ${
          showToast.type === 'success' ? 'bg-emerald-600' : 
          showToast.type === 'error' ? 'bg-red-600' : 'bg-blue-600'
        } text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-3 max-w-md`}>
          {showToast.type === 'success' ? (
            <CheckCircle className="h-5 w-5" />
          ) : showToast.type === 'error' ? (
            <AlertCircle className="h-5 w-5" />
          ) : (
            <RefreshCw className="h-5 w-5 animate-spin" />
          )}
          <span className="font-medium">{showToast.message}</span>
          <button
            onClick={() => setShowToast(null)}
            className="ml-auto text-white/80 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

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
            <span className="text-sm font-medium text-primary-600">Content Management</span>
          </div>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Content Management</h1>
              <p className="text-gray-600">Create and manage learning modules and lessons</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleRefresh}
                disabled={loading}
                className="p-2 text-gray-600 hover:text-primary-600 hover:bg-white rounded-xl transition-colors disabled:opacity-50"
                title="Refresh modules"
              >
                <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={() => navigate('/admin/content/create')}
                className="btn btn-primary flex items-center gap-2 px-6 py-3 rounded-xl hover:shadow-lg transition-all duration-200"
              >
                <Plus className="h-5 w-5" />
                Create New Module
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Total Modules</p>
                <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-xl">
                <FolderOpen className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-gray-600">Published</span>
                  <span className="font-semibold">{stats.published}</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                    style={{ width: `${stats.total > 0 ? (stats.published / stats.total) * 100 : 0}%` }}
                  />
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-gray-600">Draft</span>
                  <span className="font-semibold">{stats.draft}</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-amber-500 rounded-full transition-all duration-300"
                    style={{ width: `${stats.total > 0 ? (stats.draft / stats.total) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Total Lessons</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalLessons}</p>
                <p className="text-xs text-gray-500 mt-1">Across all modules</p>
              </div>
              <div className="p-3 bg-purple-50 rounded-xl">
                <BookOpen className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-center gap-2 text-sm">
                <div className="p-1 bg-blue-100 rounded">
                  <TrendingUp className="h-3 w-3 text-blue-600" />
                </div>
                <span className="text-gray-600">Avg. Difficulty:</span>
                <span className="font-semibold">{stats.averageDifficulty}/5</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Total XP Value</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalXP}</p>
                <p className="text-xs text-gray-500 mt-1">Available for students</p>
              </div>
              <div className="p-3 bg-emerald-50 rounded-xl">
                <Zap className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-center gap-2 text-sm">
                <div className="p-1 bg-emerald-100 rounded">
                  <Award className="h-3 w-3 text-emerald-600" />
                </div>
                <span className="text-gray-600">Avg. per module:</span>
                <span className="font-semibold">
                  {stats.total > 0 ? Math.round(stats.totalXP / stats.total) : 0} XP
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Module Status</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.published > 0 ? `${Math.round((stats.published / stats.total) * 100)}%` : '0%'}
                </p>
                <p className="text-xs text-gray-500 mt-1">Published rate</p>
              </div>
              <div className="p-3 bg-indigo-50 rounded-xl">
                <BarChart3 className="h-6 w-6 text-indigo-600" />
              </div>
            </div>
            <div className="mt-4">
              <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                stats.published === stats.total ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
              }`}>
                {stats.published === stats.total ? (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    All Published
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-4 w-4" />
                    {stats.draft} in Draft
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Database Fix Notice */}
        {modules.some(m => m.lessons_count > 0) && (
          <div className="mb-8 bg-blue-50 border border-blue-200 rounded-2xl p-6">
            <div className="flex items-start gap-3">
              <Database className="h-6 w-6 text-blue-600 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-blue-800 mb-2">Database Configuration Required</h3>
                <p className="text-blue-700 text-sm mb-3">
                  Some modules have lessons. To delete modules successfully, you need to enable CASCADE delete in your database.
                </p>
                <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-xs overflow-x-auto mb-3">
                  <pre className="whitespace-pre-wrap">
{`-- Run this in Supabase SQL Editor:
ALTER TABLE lessons 
DROP CONSTRAINT IF EXISTS lessons_module_id_fkey;

ALTER TABLE lessons 
ADD CONSTRAINT lessons_module_id_fkey 
FOREIGN KEY (module_id) 
REFERENCES modules(id) 
ON DELETE CASCADE;`}
                  </pre>
                </div>
                <button
                  onClick={() => window.open('https://supabase.com/docs/guides/database/tables#cascade-delete', '_blank')}
                  className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-800 px-3 py-1 rounded"
                >
                  Learn about CASCADE delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Filters Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-primary-600" />
              <h3 className="text-lg font-semibold text-gray-900">Filter & Search Modules</h3>
            </div>
            <span className="text-sm text-gray-500">
              Showing {filteredModules.length} of {modules.length} modules
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search modules..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-gray-50 transition-colors"
              />
            </div>
            <select
              value={trackFilter}
              onChange={(e) => setTrackFilter(e.target.value)}
              className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-gray-50 transition-colors"
            >
              <option value="all">All Tracks</option>
              <option value="money_basics">Money Basics</option>
              <option value="entrepreneurship">Entrepreneurship</option>
              <option value="advanced">Advanced</option>
            </select>
            <select
              value={publishedFilter}
              onChange={(e) => setPublishedFilter(e.target.value)}
              className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-gray-50 transition-colors"
            >
              <option value="all">All Status</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
          </div>
        </div>

        {/* Modules List */}
        {filteredModules.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-20 h-20 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <BookOpen className="h-10 w-10 text-primary-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">No modules found</h3>
              <p className="text-gray-600 mb-8">
                {searchQuery || trackFilter !== 'all' || publishedFilter !== 'all'
                  ? 'Try adjusting your search or filters.'
                  : 'Get started by creating your first learning module.'}
              </p>
              <button
                onClick={() => navigate('/admin/content/create')}
                className="btn btn-primary inline-flex items-center gap-2 px-6 py-3"
              >
                <Plus className="h-5 w-5" />
                Create Your First Module
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredModules.map((module) => (
              <div
                key={module.id}
                className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300"
              >
                <div className="p-6">
                  {/* Module Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getTrackColor(module.track)}`}>
                          {getTrackName(module.track)}
                        </span>
                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getDifficultyColor(module.difficulty_level)}`}>
                          {getDifficultyName(module.difficulty_level)}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 mb-2 truncate">{module.title}</h3>
                    </div>
                  </div>

                  {/* Module Description */}
                  {module.description && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">{module.description}</p>
                  )}

                  {/* Module Stats */}
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">{module.lessons_count}</div>
                      <div className="text-xs text-gray-500">Lessons</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">{module.xp_reward}</div>
                      <div className="text-xs text-gray-500">XP</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">{module.difficulty_level}</div>
                      <div className="text-xs text-gray-500">Level</div>
                    </div>
                  </div>

                  {/* Status Bar */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                      {module.is_published ? (
                        <div className="flex items-center gap-1 px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-sm font-medium">
                          <Eye className="h-3 w-3" />
                          Published
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-sm font-medium">
                          <EyeOff className="h-3 w-3" />
                          Draft
                        </div>
                      )}
                      <div className="text-xs text-gray-500">
                        {module.is_published ? formatDate(module.published_at) : 'Not published'}
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">#{module.order_index}</div>
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => navigate(`/admin/content/${module.id}/edit`)}
                      className="flex items-center justify-center gap-2 px-4 py-3 bg-primary-50 hover:bg-primary-100 text-primary-700 rounded-xl font-medium transition-colors"
                    >
                      <Edit className="h-4 w-4" />
                      Edit
                    </button>
                    <div className="grid grid-cols-2 gap-2">
                      {module.is_published ? (
                        <>
                          <button
                            onClick={() => handlePreviewModule(module.id)}
                            className="p-3 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl transition-colors flex items-center justify-center"
                            title="Preview module"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleTogglePublish(module.id, module.is_published, module.title)}
                            className="p-3 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-xl transition-colors flex items-center justify-center"
                            title="Unpublish module"
                          >
                            <EyeOff className="h-4 w-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleDuplicateModule(module.id)}
                            className="p-3 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl transition-colors flex items-center justify-center"
                            title="Duplicate module"
                          >
                            <Copy className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleTogglePublish(module.id, module.is_published, module.title)}
                            className="p-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl transition-colors flex items-center justify-center"
                            title="Publish module"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Delete Button */}
                  <button
                    onClick={() => handleSimpleDelete(module.id, module.title)}
                    disabled={deletingModuleId === module.id}
                    className={`w-full mt-4 px-4 py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 ${
                      deletingModuleId === module.id
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-red-50 hover:bg-red-100 text-red-700 hover:text-red-800'
                    }`}
                  >
                    {deletingModuleId === module.id ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 className="h-4 w-4" />
                        Delete Module
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Quick Stats Footer */}
        <div className="mt-8 bg-gradient-to-r from-primary-50 to-primary-100 border border-primary-200 rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white rounded-xl shadow-sm">
                <Sparkles className="h-6 w-6 text-primary-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Content Analytics</h3>
                <p className="text-sm text-gray-600">Quick overview of your learning content</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-gray-600">Modules Created</p>
                <p className="text-2xl font-bold text-gray-900">{modules.length}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Total Lessons</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalLessons}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Publish Rate</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.total > 0 ? Math.round((stats.published / stats.total) * 100) : 0}%
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminContentPage() {
  return (
    <ProtectedRoute requireRole="admin">
      <AdminContentContent />
    </ProtectedRoute>
  );
}