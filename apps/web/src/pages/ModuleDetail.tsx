import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChildNavBar } from '@/components/navigation/ChildNavBar';
import { useModule, useChildModuleProgress, Lesson } from '@/hooks/useModules';
import { supabase } from '@/lib/supabase';

interface ChildSession {
  childId: string;
  childName: string;
  accessCode: string;
}

export default function ModuleDetailPage() {
  const { moduleId } = useParams<{ moduleId: string }>();
  const navigate = useNavigate();
  const { module, lessons, loading } = useModule(moduleId || '');
  const [childSession, setChildSession] = useState<ChildSession | null>(null);
  const [lessonProgress, setLessonProgress] = useState<Record<string, any>>({});
  const [startingModule, setStartingModule] = useState(false);

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
    if (!childSession || !moduleId) return;

    async function fetchLessonProgress() {
      const { data } = await supabase
        .from('child_lesson_progress')
        .select('*')
        .eq('child_id', childSession.childId);

      if (data) {
        const progressMap: Record<string, any> = {};
        data.forEach((p) => {
          progressMap[p.lesson_id] = p;
        });
        setLessonProgress(progressMap);
      }
    }

    fetchLessonProgress();
  }, [childSession, moduleId]);

  const { progress } = useChildModuleProgress(
    childSession?.childId || '',
    moduleId || ''
  );

  const handleStartModule = async () => {
    if (!childSession || !moduleId) return;

    setStartingModule(true);
    try {
      // Create or update module progress
      const { error } = await supabase
        .from('child_module_progress')
        .upsert({
          child_id: childSession.childId,
          module_id: moduleId,
          status: 'in_progress',
          progress_percentage: 0,
          started_at: new Date().toISOString(),
        }, {
          onConflict: 'child_id,module_id',
        });

      if (error) throw error;

      // Create activity
      await supabase.from('activities').insert({
        child_id: childSession.childId,
        activity_type: 'module_start',
        module_id: moduleId,
        xp_earned: 0,
      });

      // Navigate to first lesson
      if (lessons.length > 0) {
        navigate(`/child/lessons/${lessons[0].id}`);
      }
    } catch (err: any) {
      alert('Failed to start module: ' + (err.message || 'Unknown error'));
    } finally {
      setStartingModule(false);
    }
  };

  const handleLessonClick = (lesson: Lesson) => {
    navigate(`/child/lessons/${lesson.id}`);
  };

  const getLessonStatus = (lesson: Lesson) => {
    const lessonProg = lessonProgress[lesson.id];
    if (lessonProg?.is_completed) {
      return { icon: '✓', color: 'text-green-600', bg: 'bg-green-50' };
    }
    return { icon: '○', color: 'text-gray-400', bg: 'bg-gray-50' };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-pink-50 to-purple-50 flex items-center justify-center">
        <div className="text-2xl">Loading module...</div>
      </div>
    );
  }

  if (!module || !childSession) {
    return null;
  }

  const isStarted = progress?.status === 'in_progress' || progress?.status === 'completed';
  const isCompleted = progress?.status === 'completed';

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-pink-50 to-purple-50">
      <ChildNavBar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        <div className="card mb-8 overflow-hidden p-0">
          {/* Thumbnail */}
          {module.thumbnail_url ? (
            <div className="w-full h-64 overflow-hidden bg-gray-100">
              <img
                src={module.thumbnail_url}
                alt={module.title}
                className="w-full h-full object-cover"
              />
            </div>
          ) : null}
          
          <div className="p-6">
            <div className="mb-4">
              <span className="px-3 py-1 text-sm font-medium rounded-full bg-primary-100 text-primary-800">
                {module.track.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
              </span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">{module.title}</h1>
            <p className="text-gray-600 mb-6">{module.description || 'No description available.'}</p>

            <div className="flex items-center gap-6 text-sm text-gray-600 mb-6">
            <span>⭐ Difficulty: {module.difficulty_level}/5</span>
            <span>🎁 Reward: {module.xp_reward} XP</span>
            {progress && (
              <span>📊 Progress: {progress.progress_percentage}%</span>
            )}
          </div>

          {/* Progress Bar */}
          {progress && (
            <div className="mb-6">
              <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                <span>Module Progress</span>
                <span className="font-semibold">{progress.progress_percentage}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    progress.progress_percentage === 100
                      ? 'bg-green-500'
                      : progress.progress_percentage > 0
                      ? 'bg-primary-500'
                      : 'bg-gray-300'
                  }`}
                  style={{ width: `${progress.progress_percentage}%` }}
                />
              </div>
            </div>
          )}

          {!isStarted && (
            <button
              onClick={handleStartModule}
              disabled={startingModule}
              className="btn btn-primary w-full"
            >
              {startingModule ? 'Starting...' : 'Start Module'}
            </button>
          )}

          {isCompleted && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <p className="text-green-800 font-semibold">🎉 Module Completed!</p>
              <p className="text-green-700 text-sm mt-1">
                You earned {progress?.xp_earned || module.xp_reward} XP
              </p>
            </div>
          )}
          </div>
        </div>

        <div className="card">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Lessons</h2>
          {lessons.length === 0 ? (
            <p className="text-gray-600">No lessons available yet.</p>
          ) : (
            <div className="space-y-3">
              {lessons.map((lesson, index) => {
                const status = getLessonStatus(lesson);
                return (
                  <div
                    key={lesson.id}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      lessonProgress[lesson.id]?.is_completed
                        ? 'border-green-300 bg-green-50'
                        : 'border-gray-200 hover:border-primary-300 hover:bg-primary-50'
                    }`}
                    onClick={() => handleLessonClick(lesson)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${status.bg} ${status.color}`}>
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{lesson.title}</h3>
                          <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                            <span className="capitalize">{lesson.lesson_type}</span>
                            {lesson.duration_minutes && (
                              <span>⏱️ {lesson.duration_minutes} min</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className={`text-2xl ${status.color}`}>
                        {status.icon}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

