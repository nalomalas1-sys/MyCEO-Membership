import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChildNavBar } from '@/components/navigation/ChildNavBar';
import { AchievementBadge } from '@/components/child/AchievementBadge';
import { supabase } from '@/lib/supabase';
import { LoadingAnimation } from '@/components/ui/LoadingAnimation';

interface ChildSession {
  childId: string;
  childName: string;
  accessCode: string;
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  achievement_type: 'milestone' | 'performance' | 'company' | 'engagement';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  icon_url: string | null;
  xp_bonus: number;
  criteria: any;
  earned_at?: string;
}

export default function AchievementsPage() {
  const [childSession, setChildSession] = useState<ChildSession | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [earnedAchievementIds, setEarnedAchievementIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'milestone' | 'performance' | 'company' | 'engagement'>('all');
  const navigate = useNavigate();

  useEffect(() => {
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

    async function fetchAchievements() {
      try {
        // Fetch all achievements
        const { data: allAchievements, error: achievementsError } = await supabase
          .from('achievements')
          .select('*')
          .order('achievement_type', { ascending: true })
          .order('rarity', { ascending: true });

        if (achievementsError) throw achievementsError;

        // Fetch earned achievements
        const { data: earnedAchievements, error: earnedError } = await supabase
          .from('child_achievements')
          .select('achievement_id, earned_at')
          .eq('child_id', childSession.childId);

        if (earnedError) throw earnedError;

        const earnedIds = new Set(earnedAchievements?.map((ea) => ea.achievement_id) || []);
        setEarnedAchievementIds(earnedIds);

        // Merge earned data with achievements
        const achievementsWithEarned = (allAchievements || []).map((achievement) => {
          const earned = earnedAchievements?.find((ea) => ea.achievement_id === achievement.id);
          return {
            ...achievement,
            earned_at: earned?.earned_at,
          };
        });

        setAchievements(achievementsWithEarned);
      } catch (err: any) {
        console.error('Failed to fetch achievements:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchAchievements();
  }, [childSession]);

  const filteredAchievements = filter === 'all'
    ? achievements
    : achievements.filter((a) => a.achievement_type === filter);

  const earnedCount = achievements.filter((a) => earnedAchievementIds.has(a.id)).length;
  const totalCount = achievements.length;

  if (loading) {
    return <LoadingAnimation message="Loading achievements..." variant="fullscreen" />;
  }

  if (!childSession) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-pink-50 to-purple-50">
      <ChildNavBar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">🏆 Achievements</h1>
          <p className="text-lg text-gray-600">
            You've earned {earnedCount} out of {totalCount} achievements!
          </p>
        </div>

        {/* Filter buttons */}
        <div className="mb-6 flex flex-wrap gap-2">
          {(['all', 'milestone', 'performance', 'company', 'engagement'] as const).map((filterType) => (
            <button
              key={filterType}
              onClick={() => setFilter(filterType)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === filterType
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {filterType === 'all' ? 'All' : filterType.charAt(0).toUpperCase() + filterType.slice(1)}
            </button>
          ))}
        </div>

        {/* Achievements grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
          {filteredAchievements.map((achievement) => {
            const earned = earnedAchievementIds.has(achievement.id);
            return (
              <div
                key={achievement.id}
                className="bg-white rounded-2xl shadow-lg p-4 flex flex-col items-center text-center"
              >
                <AchievementBadge
                  name={achievement.name}
                  description={achievement.description}
                  rarity={achievement.rarity}
                  iconUrl={achievement.icon_url}
                  earned={earned}
                  earnedAt={achievement.earned_at}
                  size="md"
                />
                <div className="mt-4 w-full">
                  <h3 className="font-semibold text-gray-900 text-sm mb-1">{achievement.name}</h3>
                  <p className="text-xs text-gray-600 mb-2">{achievement.description}</p>
                  {achievement.xp_bonus > 0 && (
                    <p className="text-xs text-primary-600 font-medium">
                      +{achievement.xp_bonus} XP
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {filteredAchievements.length === 0 && (
          <div className="text-center py-12 bg-white rounded-2xl shadow-lg">
            <p className="text-gray-600">No achievements found in this category.</p>
          </div>
        )}
      </div>
    </div>
  );
}






