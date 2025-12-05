
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChildNavBar } from '@/components/navigation/ChildNavBar';
import { AchievementBadge } from '@/components/child/AchievementBadge';
import { supabase } from '@/lib/supabase';
import { Trophy, Star, Award, Target, Zap, Flame, Lock, CheckCircle, Filter } from 'lucide-react';

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
  const progressPercentage = totalCount > 0 ? Math.round((earnedCount / totalCount) * 100) : 0;

  const getRarityColor = (rarity: string, isEarned: boolean) => {
    if (!isEarned) return 'from-gray-200 to-gray-300 text-gray-600';
    
    switch(rarity) {
      case 'common': return 'from-gray-400 to-gray-500 text-white';
      case 'rare': return 'from-blue-400 to-blue-500 text-white';
      case 'epic': return 'from-purple-400 to-purple-500 text-white';
      case 'legendary': return 'from-yellow-400 to-orange-500 text-white';
      default: return 'from-gray-400 to-gray-500 text-white';
    }
  };

  const getTypeIcon = (type: string) => {
    switch(type) {
      case 'milestone': return <Target className="h-5 w-5" />;
      case 'performance': return <Star className="h-5 w-5" />;
      case 'company': return <Award className="h-5 w-5" />;
      case 'engagement': return <Flame className="h-5 w-5" />;
      default: return <Trophy className="h-5 w-5" />;
    }
  };

  const getFilterConfig = (type: string) => {
    switch(type) {
      case 'milestone': return { name: 'Milestone', color: 'blue', icon: <Target /> };
      case 'performance': return { name: 'Performance', color: 'green', icon: <Star /> };
      case 'company': return { name: 'Company', color: 'purple', icon: <Award /> };
      case 'engagement': return { name: 'Engagement', color: 'orange', icon: <Flame /> };
      default: return { name: 'All', color: 'gray', icon: <Filter /> };
    }
  };

  if (!childSession) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-purple-50 to-pink-50">
      <ChildNavBar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header with Progress */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-2xl border-3 border-yellow-600 flex items-center justify-center shadow-lg">
                  <Trophy className="h-8 w-8 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-10 h-10 bg-gradient-to-r from-red-400 to-pink-500 rounded-full border-2 border-white flex items-center justify-center shadow-md">
                  <span className="text-xs font-bold text-white">{earnedCount}</span>
                </div>
              </div>
              <div>
                <h1 className="text-4xl font-bold text-gray-900 mb-2">
                  ACHIEVEMENTS
                </h1>
                <p className="text-lg text-gray-700">
                  Unlock badges and earn rewards!
                </p>
              </div>
            </div>
            
            {/* Progress Card */}
            <div className="bg-white rounded-2xl p-6 border-3 border-gray-300 shadow-lg min-w-[300px]">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-blue-500" />
                  <span className="font-bold text-gray-800">Progress</span>
                </div>
                <span className="text-2xl font-bold text-gray-900">
                  {progressPercentage}%
                </span>
              </div>
              
              {/* Progress Bar */}
              <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden mb-3">
                <div 
                  className="h-full bg-gradient-to-r from-green-400 to-emerald-500 transition-all duration-500"
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">
                  {earnedCount} of {totalCount} unlocked
                </span>
                <span className="font-bold text-green-600">
                  +{achievements.reduce((sum, a) => earnedAchievementIds.has(a.id) ? sum + a.xp_bonus : sum, 0)} XP
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Filter buttons */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="h-5 w-5 text-gray-600" />
            <span className="font-bold text-gray-800">Filter by Type</span>
          </div>
          <div className="flex flex-wrap gap-3">
            {(['all', 'milestone', 'performance', 'company', 'engagement'] as const).map((filterType) => {
              const config = getFilterConfig(filterType);
              const isActive = filter === filterType;
              
              return (
                <button
                  key={filterType}
                  onClick={() => setFilter(filterType)}
                  className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold transition-all ${
                    isActive
                      ? `bg-gradient-to-r from-${config.color}-500 to-${config.color}-600 text-white shadow-lg`
                      : 'bg-white text-gray-700 hover:bg-gray-100 border-2 border-gray-300'
                  }`}
                >
                  <div className={`p-2 rounded-lg ${isActive ? 'bg-white/20' : 'bg-gray-100'}`}>
                    {config.icon}
                  </div>
                  <span>{config.name}</span>
                  {isActive && (
                    <div className="ml-2 w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                      <span className="text-xs font-bold">
                        {filterType === 'all' ? totalCount : 
                         achievements.filter(a => a.achievement_type === filterType).length}
                      </span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Achievements grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-400 to-purple-400 rounded-2xl border-3 border-black flex items-center justify-center mb-4 animate-pulse">
              <Trophy className="h-8 w-8 text-white" />
            </div>
            <div className="text-xl font-bold text-gray-800 mb-2">Loading Achievements...</div>
            <div className="text-gray-600">Gathering your badges!</div>
          </div>
        ) : filteredAchievements.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 bg-gradient-to-r from-gray-300 to-gray-400 rounded-2xl border-3 border-gray-500 flex items-center justify-center mb-4">
              <Lock className="h-8 w-8 text-gray-600" />
            </div>
            <div className="text-xl font-bold text-gray-800 mb-2">No Achievements Found</div>
            <div className="text-gray-600">Try a different filter or keep playing to earn more!</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredAchievements.map((achievement) => {
              const earned = earnedAchievementIds.has(achievement.id);
              
              return (
                <div
                  key={achievement.id}
                  className="group relative transform transition-all duration-300 hover:-translate-y-1"
                >
                  <div className={`relative rounded-2xl p-5 border-3 shadow-lg hover:shadow-xl ${
                    earned 
                      ? 'bg-white border-yellow-400' 
                      : 'bg-white border-gray-300'
                  }`}>
                    {/* Achievement Header */}
                    <div className="flex items-start gap-4 mb-4">
                      {/* Badge Icon */}
                      <div className={`relative w-16 h-16 rounded-2xl border-3 flex items-center justify-center ${
                        earned 
                          ? `border-yellow-500 bg-gradient-to-r ${getRarityColor(achievement.rarity, earned).split(' ')[0]} ${getRarityColor(achievement.rarity, earned).split(' ')[1]}`
                          : 'border-gray-400 bg-gradient-to-r from-gray-200 to-gray-300'
                      }`}>
                        {achievement.icon_url ? (
                          <img 
                            src={achievement.icon_url} 
                            alt={achievement.name}
                            className="w-10 h-10"
                          />
                        ) : (
                          <Trophy className={`h-8 w-8 ${earned ? 'text-white' : 'text-gray-600'}`} />
                        )}
                        
                        {/* Earned Checkmark */}
                        {earned && (
                          <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full border-2 border-white flex items-center justify-center shadow-md">
                            <CheckCircle className="h-4 w-4 text-white" />
                          </div>
                        )}
                      </div>
                      
                      {/* Title and Type */}
                      <div className="flex-1">
                        <h3 className={`font-bold text-gray-900 text-lg mb-2 ${earned ? '' : 'opacity-80'}`}>
                          {achievement.name}
                        </h3>
                        <div className="flex items-center gap-2 mb-2">
                          <div className={`p-1.5 rounded ${earned ? 'bg-blue-50' : 'bg-gray-100'}`}>
                            {getTypeIcon(achievement.achievement_type)}
                          </div>
                          <span className={`text-sm font-medium ${
                            earned ? 'text-blue-600' : 'text-gray-500'
                          }`}>
                            {achievement.achievement_type}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-bold px-2 py-1 rounded ${
                            earned 
                              ? achievement.rarity === 'common' ? 'bg-gray-100 text-gray-800' :
                                achievement.rarity === 'rare' ? 'bg-blue-100 text-blue-800' :
                                achievement.rarity === 'epic' ? 'bg-purple-100 text-purple-800' :
                                'bg-orange-100 text-orange-800'
                              : 'bg-gray-100 text-gray-500'
                          }`}>
                            {achievement.rarity.toUpperCase()}
                          </span>
                          {achievement.xp_bonus > 0 && (
                            <span className="text-xs font-bold text-green-600">
                              +{achievement.xp_bonus} XP
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Description */}
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {achievement.description}
                    </p>
                    
                    {/* Earned Date or Locked State */}
                    <div className="pt-4 border-t border-gray-200">
                      {earned ? (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-xs text-gray-600">Earned</span>
                          </div>
                          <span className="text-xs text-gray-500">
                            {achievement.earned_at ? new Date(achievement.earned_at).toLocaleDateString() : 'Recently'}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Lock className="h-4 w-4 text-gray-400" />
                          <span className="text-xs text-gray-600">Keep playing to unlock!</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Rarity Legend */}
        <div className="mt-10 p-8 bg-white rounded-3xl border-3 border-gray-300 shadow-xl">
          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            Rarity Levels
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {(['common', 'rare', 'epic', 'legendary'] as const).map((rarity) => (
              <div key={rarity} className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-gray-50 to-white border-2 border-gray-300">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  rarity === 'common' ? 'bg-gradient-to-r from-gray-400 to-gray-500' :
                  rarity === 'rare' ? 'bg-gradient-to-r from-blue-400 to-blue-500' :
                  rarity === 'epic' ? 'bg-gradient-to-r from-purple-400 to-purple-500' :
                  'bg-gradient-to-r from-yellow-400 to-orange-500'
                }`}>
                  <Trophy className="h-6 w-6 text-white" />
                </div>
                <div>
                  <div className={`font-bold text-lg ${
                    rarity === 'common' ? 'text-gray-700' :
                    rarity === 'rare' ? 'text-blue-700' :
                    rarity === 'epic' ? 'text-purple-700' :
                    'text-orange-700'
                  }`}>
                    {rarity.charAt(0).toUpperCase() + rarity.slice(1)}
                  </div>
                  <div className="text-sm text-gray-600">
                    {rarity === 'common' ? 'Easy to earn' :
                     rarity === 'rare' ? 'Moderate challenge' :
                     rarity === 'epic' ? 'Difficult tasks' :
                     'Ultimate achievements'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Motivation Footer */}
        <div className="text-center mt-8 p-8 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-3xl border-3 border-yellow-300">
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="w-12 h-12 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full flex items-center justify-center">
              <Flame className="h-6 w-6 text-white" />
            </div>
            <p className="text-lg font-bold text-gray-900">
              🏆 Every achievement brings you closer to mastery! 🏆
            </p>
          </div>
          <p className="text-gray-700">
            Complete quests, build your company, and trade in the marketplace to unlock more badges!
          </p>
        </div>
      </div>

      {/* Add CSS for clean font */}
      <style>{`
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
        }
        
        .border-3 {
          border-width: 3px;
        }
      `}</style>
    </div>
  );
}
