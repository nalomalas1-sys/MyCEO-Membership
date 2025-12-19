import { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AdminNavBar } from '@/components/navigation/AdminNavBar';
import { LoadingAnimation } from '@/components/ui/LoadingAnimation';
import { LinkifiedText } from '@/components/ui/LinkifiedText';
import { supabase } from '@/lib/supabase';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Plus, Edit, Eye, EyeOff, Search, Trash2, ExternalLink } from 'lucide-react';

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
  thumbnail_url: string | null;
  created_at: string;
  lessons_count: number;
}

function AdminContentContent() {
  const navigate = useNavigate();
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [trackFilter, setTrackFilter] = useState<string>('all');
  const [publishedFilter, setPublishedFilter] = useState<string>('all');

  useEffect(() => {
    fetchModules();
  }, [trackFilter, publishedFilter]);

  async function fetchModules() {
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
    } catch (error) {
      console.error('Failed to fetch modules:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleTogglePublish = async (moduleId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('modules')
        .update({
          is_published: !currentStatus,
          published_at: !currentStatus ? new Date().toISOString() : null,
        })
        .eq('id', moduleId);

      if (error) throw error;

      fetchModules();
    } catch (error) {
      console.error('Failed to toggle publish status:', error);
      alert('Failed to update module status');
    }
  };

  const handleDeleteModule = async (moduleId: string, moduleTitle: string) => {
    if (!confirm(`Are you sure you want to delete "${moduleTitle}"? This will also delete all associated lessons.`)) {
      return;
    }

    try {
      // First delete all lessons
      const { error: lessonsError } = await supabase
        .from('lessons')
        .delete()
        .eq('module_id', moduleId);

      if (lessonsError) throw lessonsError;

      // Then delete the module
      const { error: moduleError } = await supabase
        .from('modules')
        .delete()
        .eq('id', moduleId);

      if (moduleError) throw moduleError;

      fetchModules();
    } catch (error) {
      console.error('Failed to delete module:', error);
      alert('Failed to delete module');
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
      project_based: 'Project Based',
    };
    return names[track] || track;
  };

  const getDifficultyName = (level: number) => {
    if (level <= 1) return 'Beginner';
    if (level <= 3) return 'Intermediate';
    return 'Advanced';
  };

  const filteredModules = modules.filter((module) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      module.title.toLowerCase().includes(query) ||
      module.description?.toLowerCase().includes(query)
    );
  });

  if (loading) {
    return <LoadingAnimation message="Loading content..." variant="fullscreen" />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavBar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Content Management</h1>
            <p className="text-gray-600">Manage modules, lessons, and learning content</p>
          </div>
          <button
            onClick={() => navigate('/admin/content/create')}
            className="btn btn-primary flex items-center gap-2"
          >
            <Plus className="h-5 w-5" />
            Create Module
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-gray-200">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search modules..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <select
              value={trackFilter}
              onChange={(e) => setTrackFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="all">All Tracks</option>
              <option value="money_basics">Money Basics</option>
              <option value="entrepreneurship">Entrepreneurship</option>
              <option value="advanced">Advanced</option>
              <option value="project_based">Project Based</option>
            </select>
            <select
              value={publishedFilter}
              onChange={(e) => setPublishedFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="all">All Status</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
          </div>
        </div>

        {/* Modules List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredModules.length === 0 ? (
            <div className="col-span-full bg-white rounded-xl shadow-lg p-12 text-center border border-gray-200">
              <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 text-lg mb-4">No modules found</p>
              <button
                onClick={() => navigate('/admin/content/create')}
                className="btn btn-primary"
              >
                Create Your First Module
              </button>
            </div>
          ) : (
            filteredModules.map((module) => (
              <div
                key={module.id}
                className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-shadow"
              >
                {/* Thumbnail */}
                {module.thumbnail_url ? (
                  <div className="w-full h-40 overflow-hidden bg-gray-100">
                    <img
                      src={module.thumbnail_url}
                      alt={module.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-full h-40 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                    <BookOpen className="h-12 w-12 text-gray-400" />
                  </div>
                )}
                
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">{module.title}</h3>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                          {getTrackName(module.track)}
                        </span>
                        <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                          {getDifficultyName(module.difficulty_level)}
                        </span>
                        {module.is_published ? (
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            Published
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full flex items-center gap-1">
                            <EyeOff className="h-3 w-3" />
                            Draft
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {module.description && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      <LinkifiedText text={module.description} />
                    </p>
                  )}

                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <span>{module.lessons_count} {module.lessons_count === 1 ? 'lesson' : 'lessons'}</span>
                    <span>{module.xp_reward} XP</span>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => navigate(`/admin/content/${module.id}/edit`)}
                      className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium text-gray-700 flex items-center justify-center gap-2"
                    >
                      <Edit className="h-4 w-4" />
                      Edit
                    </button>
                    {module.is_published && (
                      <button
                        onClick={() => handlePreviewModule(module.id)}
                        className="px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
                        title="Preview module"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleTogglePublish(module.id, module.is_published)}
                      className={`px-4 py-2 rounded-lg transition-colors font-medium flex items-center justify-center gap-2 ${
                        module.is_published
                          ? 'bg-yellow-100 hover:bg-yellow-200 text-yellow-800'
                          : 'bg-green-100 hover:bg-green-200 text-green-800'
                      }`}
                    >
                      {module.is_published ? (
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
                    <button
                      onClick={() => handleDeleteModule(module.id, module.title)}
                      className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-800 rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
                      title="Delete module"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
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

