import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChildNavBar } from '@/components/navigation/ChildNavBar';
import { useModules, Module } from '@/hooks/useModules';
import { supabase } from '@/lib/supabase';

interface ChildSession {
  childId: string;
  childName: string;
  accessCode: string;
}

export default function ModulesPage() {
  const { modules, loading } = useModules();
  const [childSession, setChildSession] = useState<ChildSession | null>(null);
  const [childProgress, setChildProgress] = useState<Record<string, any>>({});
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

  const getTrackColor = (track: string) => {
    switch (track) {
      case 'money_basics':
        return 'bg-blue-100 text-blue-800';
      case 'entrepreneurship':
        return 'bg-purple-100 text-purple-800';
      case 'advanced':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTrackName = (track: string) => {
    switch (track) {
      case 'money_basics':
        return 'Money Basics';
      case 'entrepreneurship':
        return 'Entrepreneurship';
      case 'advanced':
        return 'Advanced';
      default:
        return track;
    }
  };

  const getStatusBadge = (module: Module) => {
    const progress = childProgress[module.id];
    if (!progress) {
      return (
        <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
          Not Started
        </span>
      );
    }

    switch (progress.status) {
      case 'completed':
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
            ✓ Completed
          </span>
        );
      case 'in_progress':
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
            In Progress ({progress.progress_percentage}%)
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
            Not Started
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-pink-50 to-purple-50 flex items-center justify-center">
        <div className="text-2xl">Loading modules...</div>
      </div>
    );
  }

  if (!childSession) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-pink-50 to-purple-50">
      <ChildNavBar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Learning Modules 📚</h1>
          <p className="text-lg text-gray-600">Choose a module to start learning!</p>
        </div>

        {modules.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-gray-600">No modules available yet. Check back soon!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {modules.map((module) => (
              <div
                key={module.id}
                className="card hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => navigate(`/child/modules/${module.id}`)}
              >
                <div className="flex items-start justify-between mb-4">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTrackColor(module.track)}`}>
                    {getTrackName(module.track)}
                  </span>
                  {getStatusBadge(module)}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{module.title}</h3>
                <p className="text-gray-600 mb-4 line-clamp-2">{module.description || 'No description'}</p>
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>⭐ Level {module.difficulty_level}</span>
                  <span>🎁 {module.xp_reward} XP</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

