import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChildNavBar } from '@/components/navigation/ChildNavBar';
import { LoadingAnimation } from '@/components/ui/LoadingAnimation';
import { LinkifiedText } from '@/components/ui/LinkifiedText';
import { useModules, Module } from '@/hooks/useModules';
import { supabase } from '@/lib/supabase';
import { generateSSOTicketAndRedirect } from '@/lib/sso';
import { Sparkles, Lock } from 'lucide-react';
import { getTrackTheme, getThemeForKey, CATEGORY_ORDER } from '@/constants/moduleTrackThemes';
import { useLearningTracks } from '@/hooks/useLearningTracks';

interface ChildSession {
  childId: string;
  childName: string;
  accessCode: string;
}

export default function ModulesPage() {
  const { modules, loading } = useModules();
  const { tracks } = useLearningTracks();
  const [childSession, setChildSession] = useState<ChildSession | null>(null);
  const [childProgress, setChildProgress] = useState<Record<string, any>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [ssoLoading, setSsoLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Clear any existing Supabase auth session to ensure we use anon role
    // This is important because child sessions use access codes, not Supabase Auth
    supabase.auth.signOut().catch(() => {
      // Ignore errors if already signed out
    });

    const sessionStr = localStorage.getItem('child_session');
    if (!sessionStr) {
      navigate('/child/login');
      return;
    }

    try {
      const session = JSON.parse(sessionStr);
      setChildSession(session);
    } catch (err) {
      navigate('/child/login');
    }
  }, [navigate]);

  useEffect(() => {
    if (!childSession) return;

    async function fetchProgress() {
      if (!childSession) return;
      const { data } = await supabase
        .from('child_module_progress')
        .select('*')
        .eq('child_id', childSession.childId);

      if (data) {
        const progressMap: Record<string, any> = {};
        data.forEach((p) => {
          progressMap[p.module_id] = p;
        });
        setChildProgress(progressMap);
      }
    }

    fetchProgress();
  }, [childSession]);

  const getStatusBadge = (module: Module) => {
    const progress = childProgress[module.id];
    if (!progress) {
      return (
        <span className="px-3 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-700 border border-gray-200 animate-pulse">
          ✨ New
        </span>
      );
    }

    switch (progress.status) {
      case 'completed':
        return (
          <span className="px-3 py-1 text-xs font-semibold rounded-full bg-green-500 text-white shadow-md transform transition-transform hover:scale-105">
            ✓ Completed
          </span>
        );
      case 'in_progress':
        return (
          <span className="px-3 py-1 text-xs font-semibold rounded-full bg-blue-500 text-white shadow-md">
            🔄 {progress.progress_percentage}%
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-700 border border-gray-200">
            Not Started
          </span>
        );
    }
  };

  const getProgressBar = (module: Module) => {
    const progress = childProgress[module.id];
    if (!progress || progress.status === 'not_started' || progress.status === 'completed') {
      return null;
    }
    const theme = getTrackTheme(module.track);
    return (
      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden mt-3">
        <div
          className={`h-full ${theme.progressBar} rounded-full transition-all duration-500 ease-out shadow-sm`}
          style={{ width: `${progress.progress_percentage}%` }}
        />
      </div>
    );
  };

  if (loading) {
    return <LoadingAnimation message="Loading modules..." variant="fullscreen" />;
  }

  if (!childSession) {
    return null;
  }

  // Filter modules based on search and category
  const filteredModules = modules.filter((module) => {
    const matchesSearch =
      module.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (module.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
    const matchesCategory = selectedCategory === null || module.track === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Group modules by track (category)
  const groupedModules = filteredModules.reduce((acc, module) => {
    const track = module.track;
    if (!acc[track]) {
      acc[track] = [];
    }
    acc[track].push(module);
    return acc;
  }, {} as Record<string, Module[]>);

  const categoryOrder = tracks?.length ? tracks.map((t) => t.slug) : CATEGORY_ORDER;
  const getSectionTheme = (slug: string) => {
    const t = tracks?.find((x) => x.slug === slug);
    if (t) {
      const theme = getThemeForKey(t.theme_key);
      return { ...theme, name: t.name, icon: t.icon };
    }
    return getTrackTheme(slug);
  };
  const getCardTheme = (slug: string) => {
    const t = tracks?.find((x) => x.slug === slug);
    if (t) {
      const theme = getThemeForKey(t.theme_key);
      return { ...theme, name: t.name, icon: t.icon };
    }
    return getTrackTheme(slug);
  };
   

  const totalModules = modules.length;
  const completedModules = Object.values(childProgress).filter(
    (p: any) => p.status === 'completed'
  ).length;

  return (
    <div className="min-h-screen bg-gray-100">
      <ChildNavBar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section - separate block for contrast */}
        <div className="mb-8 animate-fade-in bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-purple-600 mb-2">
                Learning Modules 📚
              </h1>
              <p className="text-lg text-gray-600">Choose a module to start your learning journey!</p>
            </div>
            {totalModules > 0 && (
              <div className="flex items-center gap-4">
                {/* AI Tools Button */}
                <button
                  onClick={async () => {
                    if (!childSession) return;
                    setSsoLoading(true);
                    try {
                      // Fetch parent_id for the child
                      const { data: childData } = await supabase
                        .from('children')
                        .select('parent_id')
                        .eq('id', childSession.childId)
                        .single();

                      if (childData?.parent_id) {
                        await generateSSOTicketAndRedirect({
                          actorType: 'child',
                          actorId: childSession.childId,
                          parentId: childData.parent_id,
                        });
                      } else {
                        alert('Could not find parent information');
                      }
                    } catch (err) {
                      console.error('SSO failed:', err);
                      alert('Failed to open AI Tools. Please try again.');
                    } finally {
                      setSsoLoading(false);
                    }
                  }}
                  disabled={ssoLoading}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-lg shadow-md hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Sparkles className="h-5 w-5" />
                  {ssoLoading ? 'Opening...' : 'AI Tools'}
                </button>
                <div className="bg-gray-50 rounded-lg shadow-md px-4 py-2 border border-gray-200">
                  <div className="text-xs text-gray-500 uppercase tracking-wide">Progress</div>
                  <div className="text-lg font-bold text-gray-900">
                    {completedModules} / {totalModules}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4 mt-6 pt-6 border-t border-gray-200 mb-0">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder=" Search modules..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-3 pl-10 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all shadow-sm"
              />
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                🔍
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${selectedCategory === null
                  ? 'bg-purple-600 text-white shadow-md scale-105'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
              >
                All
              </button>
              {categoryOrder.map((slug) => {
                const theme = getSectionTheme(slug);
                return (
                  <button
                    key={slug}
                    onClick={() => setSelectedCategory(selectedCategory === slug ? null : slug)}
                    className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 border-2 ${selectedCategory === slug
                      ? `${theme.button} ${theme.buttonHover} text-white border-transparent shadow-md scale-105`
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                      }`}
                  >
                    <span>{theme.icon}</span>
                    {theme.name}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modules Content */}
        {filteredModules.length === 0 ? (
          <div className="card text-center py-12 animate-fade-in">
            <div className="text-6xl mb-4">🔍</div>
            <p className="text-xl font-semibold text-gray-700 mb-2">No modules found</p>
            <p className="text-gray-500">
              {searchQuery || selectedCategory
                ? ''
                : 'No modules available yet. Check back soon!'}
            </p>
            {(searchQuery || selectedCategory) && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory(null);
                }}
                className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-12">
            {categoryOrder.map((slug, categoryIndex) => {
              const trackModules = groupedModules[slug] || [];
              if (trackModules.length === 0) return null;

              const sectionTheme = getSectionTheme(slug);
              return (
                <div
                  key={slug}
                  className={`rounded-2xl p-6 sm:p-8 ${sectionTheme.sectionBg} ${sectionTheme.sectionBorder} ${sectionTheme.sectionAccent} space-y-4 animate-fade-in`}
                  style={{ animationDelay: `${categoryIndex * 100}ms` }}
                >
                  {/* Category Header - distinct block */}
                  <div className={`mb-6 rounded-xl border-2 ${sectionTheme.badge} bg-white/80 backdrop-blur px-4 py-3 flex items-center gap-4`}>
                    <div className={`p-3 rounded-xl border-2 ${sectionTheme.badge} shadow-md`}>
                      <span className="text-3xl">{sectionTheme.icon}</span>
                    </div>
                    <div className="flex-1">
                      <h2 className="text-3xl font-bold text-gray-900">
                        {sectionTheme.name}
                      </h2>
                      <p className="text-sm text-gray-500 mt-1">
                        {trackModules.length} {trackModules.length === 1 ? 'module' : 'modules'} in this track
                      </p>
                    </div>
                    <span className={`px-4 py-2 text-sm font-semibold rounded-full border-2 ${sectionTheme.badge}`}>
                      {trackModules.length}
                    </span>
                  </div>

                  {/* Module Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {trackModules.map((module, index) => {
                      const progress = childProgress[module.id];
                      const isCompleted = progress?.status === 'completed';
                      const isLocked = module.is_locked;
                      const theme = getCardTheme(module.track);

                      return (
                        <div
                          key={module.id}
                          className={`group relative bg-white rounded-xl shadow-md border-2 overflow-hidden transition-all duration-300 ${isLocked
                            ? 'border-gray-300 cursor-not-allowed opacity-75'
                            : `${theme.cardBorder} cursor-pointer hover:shadow-2xl hover:scale-105 hover:-translate-y-1 ${theme.cardBorderHover} ${isCompleted ? 'ring-2 ring-green-200' : ''}`
                            } animate-fade-in`}
                          style={{ animationDelay: `${(categoryIndex * 100) + (index * 50)}ms` }}
                          onClick={() => {
                            if (!isLocked) {
                              navigate(`/child/modules/${module.id}`);
                            }
                          }}
                        >
                          {/* Thumbnail */}
                          {module.thumbnail_url ? (
                            <div className="w-full h-48 overflow-hidden bg-gray-100 border-b-2 border-gray-200">
                              <img
                                src={module.thumbnail_url}
                                alt={module.title}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                              />
                            </div>
                          ) : (
                            <div className={`w-full h-48 ${theme.placeholderBg} flex items-center justify-center border-b-2 ${theme.cardBorder}`}>
                              <span className="text-6xl">{theme.icon}</span>
                            </div>
                          )}

                          <div className="p-6">
                            {/* Lock Badge */}
                            {isLocked && (
                              <div className="absolute top-2 right-2 bg-gray-600 text-white rounded-full p-2 shadow-lg z-10">
                                <Lock className="h-4 w-4" />
                              </div>
                            )}

                            {/* Completion Badge */}
                            {!isLocked && isCompleted && (
                              <div className="absolute top-2 right-2 bg-green-500 text-white rounded-full p-2 shadow-lg animate-bounce z-10">
                                ✓
                              </div>
                            )}

                            {/* Card Header */}
                            <div className="flex items-start justify-between mb-4">
                              <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${theme.badge}`}>
                                {theme.name}
                              </span>
                              {isLocked ? (
                                <span className="px-3 py-1 text-xs font-semibold rounded-full bg-gray-200 text-gray-600 border border-gray-300">
                                  🔒 Locked
                                </span>
                              ) : (
                                getStatusBadge(module)
                              )}
                            </div>

                            {/* Module Title */}
                            <h3 className={`text-xl font-bold text-gray-900 mb-3 transition-colors ${theme.titleHover}`}>
                              {module.title}
                            </h3>

                            {/* Description */}
                            <p className="text-gray-600 mb-4 line-clamp-2 min-h-[3rem]">
                              {module.description ? (
                                <LinkifiedText text={module.description} />
                              ) : (
                                'No description available'
                              )}
                            </p>

                            {/* Progress Bar */}
                            {getProgressBar(module)}

                            {/* Footer Info - distinct block */}
                            <div className={`flex items-center justify-between text-sm mt-4 pt-4 border-t-2 border-gray-200 bg-gray-50 rounded-lg px-3 py-2 -mx-1`}>
                              <div className="flex items-center gap-1 text-amber-500">
                                <span className="text-base">⭐</span>
                                <span className="font-semibold text-gray-700">Level {module.difficulty_level}</span>
                              </div>
                              <div className={`flex items-center gap-1 ${theme.accentText}`}>
                                <span className="text-base">🎁</span>
                                <span className="font-bold">{module.xp_reward} XP</span>
                              </div>
                            </div>

                            {/* Hover Arrow */}
                            <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                              <span className="text-2xl">→</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add custom animations */}
      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
}