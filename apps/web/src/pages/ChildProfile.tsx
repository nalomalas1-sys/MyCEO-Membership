import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChildNavBar } from '@/components/navigation/ChildNavBar';
import { AvatarCustomizer } from '@/components/child/AvatarCustomizer';
import { XPProgressBar } from '@/components/child/XPProgressBar';
import { AchievementBadge } from '@/components/child/AchievementBadge';
import { LoadingAnimation } from '@/components/ui/LoadingAnimation';
import { BackgroundEffects, FloatingCharacters, FloatingBackgroundStyles } from '@/components/ui/FloatingBackground';
import { supabase } from '@/lib/supabase';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';
import { formatCurrency } from '@/utils/currency';
import { Flame, Trophy, BookOpen, Star, Building2, TrendingUp } from 'lucide-react';

interface ChildSession {
    childId: string;
    childName: string;
    accessCode: string;
}

interface ChildData {
    total_xp: number;
    current_level: number;
    current_streak: number;
    created_at: string;
    showcase_achievement_ids?: string[];
}

interface ProfileStats {
    lessonsCompleted: number;
    quizzesPassed: number;
    totalAchievements: number;
    companyRevenue?: number;
}

export default function ChildProfilePage() {
    const [childSession, setChildSession] = useState<ChildSession | null>(null);
    const [childData, setChildData] = useState<ChildData | null>(null);
    const [stats, setStats] = useState<ProfileStats>({
        lessonsCompleted: 0,
        quizzesPassed: 0,
        totalAchievements: 0,
    });
    const [recentAchievements, setRecentAchievements] = useState<any[]>([]);
    const [allEarnedAchievements, setAllEarnedAchievements] = useState<any[]>([]);
    const [showcaseIds, setShowcaseIds] = useState<string[]>([]);
    const [savingShowcase, setSavingShowcase] = useState(false);
    const [showShowcasePicker, setShowShowcasePicker] = useState(false);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const { isEnabled } = useFeatureFlags();

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

        async function fetchProfileData() {
            try {
                const childId = childSession!.childId;

                // 1. Fetch basic child stats
                const { data: cData, error: cError } = await supabase
                    .from('children')
                    .select('total_xp, current_level, current_streak, created_at, showcase_achievement_ids')
                    .eq('id', childId)
                    .single();

                if (cError) throw cError;
                setChildData(cData);

                const ids = cData?.showcase_achievement_ids;
                if (Array.isArray(ids)) {
                    setShowcaseIds(ids.map((id: string) => String(id)));
                } else {
                    setShowcaseIds([]);
                }
                // 2. Fetch aggregate stats
                const [
                    { count: lessonsCount },
                    { count: quizzesCount },
                    { count: achievementsCount },
                ] = await Promise.all([
                    supabase
                        .from('child_lesson_progress')
                        .select('*', { count: 'exact', head: true })
                        .eq('child_id', childId)
                        .eq('is_completed', true),
                    supabase
                        .from('activities')
                        .select('*', { count: 'exact', head: true })
                        .eq('child_id', childId)
                        .eq('activity_type', 'quiz_attempt')
                        .gte('quiz_score', 80),
                    supabase
                        .from('child_achievements')
                        .select('*', { count: 'exact', head: true })
                        .eq('child_id', childId),
                ]);

                let companyRevenue = 0;
                if (isEnabled('company')) {
                    const { data: company } = await supabase
                        .from('companies')
                        .select('total_revenue')
                        .eq('child_id', childId)
                        .single();
                    if (company) {
                        companyRevenue = company.total_revenue;
                    }
                }

                setStats({
                    lessonsCompleted: lessonsCount ?? 0,
                    quizzesPassed: quizzesCount ?? 0,
                    totalAchievements: achievementsCount ?? 0,
                    companyRevenue,
                });

                // 3. Fetch 4 most recent achievements
                const { data: recentAchv } = await supabase
                    .from('child_achievements')
                    .select(`
            earned_at,
            achievements ( id, name, description, rarity, icon_url, xp_bonus )
          `)
                    .eq('child_id', childId)
                    .order('earned_at', { ascending: false })
                    .limit(4);

                if (recentAchv) {
                    setRecentAchievements(
                        recentAchv.map((ra: any) => ({
                            ...ra.achievements,
                            earned_at: ra.earned_at,
                        }))
                    );
                }

                // 4. Fetch ALL earned achievements (for showcase picker)
                const { data: allEarned } = await supabase
                    .from('child_achievements')
                    .select(`
                        earned_at,
                        achievements ( id, name, description, rarity, icon_url, xp_bonus )
                    `)
                    .eq('child_id', childId)
                    .order('earned_at', { ascending: false });

                if (allEarned) {
                    setAllEarnedAchievements(
                        allEarned.map((ra: any) => ({
                            ...ra.achievements,
                            earned_at: ra.earned_at,
                        }))
                    );
                }
            } catch (err) {
                console.error('Failed to fetch profile data:', err);
            } finally {
                setLoading(false);
            }
        }

        fetchProfileData();
    }, [childSession, isEnabled]);

    // Listen for instant XP updates from Daily Quests or other sources
    useEffect(() => {
        const handleXpGained = (e: any) => {
            const amount = e.detail?.amount || 0;
            if (amount > 0) {
                setChildData(prev => {
                    if (!prev) return prev;
                    return { ...prev, total_xp: prev.total_xp + amount };
                });
            }
        };

        window.addEventListener('child_xp_gained', handleXpGained);
        return () => window.removeEventListener('child_xp_gained', handleXpGained);
    }, []);

    const handleSaveShowcase = async (selectedIds: string[]) => {
        if (selectedIds.length > 5 || !childSession) return;
        setSavingShowcase(true);
        try {
            const { error } = await supabase.rpc('update_child_showcase_achievements', {
                p_child_id: childSession.childId,
                p_achievement_ids: selectedIds,
            });
            if (error) throw error;
            setShowcaseIds(selectedIds);
        } catch (err) {
            console.error('Failed to save showcase:', err);
        } finally {
            setSavingShowcase(false);
        }
    };

    if (loading) {
        return <LoadingAnimation message="Loading your profile..." variant="fullscreen" />;
    }

    if (!childSession || !childData) {
        return null;
    }

    const joinDate = new Date(childData.created_at).toLocaleDateString(undefined, {
        month: 'long',
        year: 'numeric',
    });

    return (
        <div className="min-h-screen relative bg-gradient-to-b from-blue-100 via-indigo-50 to-purple-50 font-sans text-blue-900 overflow-hidden selection:bg-purple-300 selection:text-purple-900">
            <BackgroundEffects />
            <FloatingCharacters />
            <FloatingBackgroundStyles />

            <ChildNavBar />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">My Profile 👤</h1>
                    <p className="text-lg text-gray-600">
                        See your progress, badges, and customize your look!
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Avatar & core stats */}
                    <div className="lg:col-span-1 space-y-8">
                        <AvatarCustomizer childId={childSession.childId} childName={childSession.childName} />

                        <div className="bg-white rounded-2xl shadow-lg p-6 border-4 border-indigo-200">
                            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                                <Star className="h-6 w-6 text-yellow-500" /> All-Time Stats
                            </h2>

                            <div className="space-y-5">
                                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                                            <BookOpen className="h-5 w-5" />
                                        </div>
                                        <span className="font-semibold text-gray-700">Lessons Finished</span>
                                    </div>
                                    <span className="text-lg font-bold text-gray-900">{stats.lessonsCompleted}</span>
                                </div>

                                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-orange-100 text-orange-600 rounded-lg">
                                            <Flame className="h-5 w-5" />
                                        </div>
                                        <span className="font-semibold text-gray-700">Highest Streak</span>
                                    </div>
                                    <span className="text-lg font-bold text-gray-900">{childData.current_streak}</span>
                                </div>

                                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-green-100 text-green-600 rounded-lg">
                                            <Trophy className="h-5 w-5" />
                                        </div>
                                        <span className="font-semibold text-gray-700">Total Badges</span>
                                    </div>
                                    <span className="text-lg font-bold text-gray-900">{stats.totalAchievements}</span>
                                </div>

                                {isEnabled('company') && (
                                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                                                <TrendingUp className="h-5 w-5" />
                                            </div>
                                            <span className="font-semibold text-gray-700">Company Revenue</span>
                                        </div>
                                        <span className="text-lg font-bold text-green-600">
                                            {formatCurrency(stats.companyRevenue || 0)}
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div className="mt-6 pt-4 border-t border-gray-100 text-center text-sm text-gray-500 font-medium">
                                CEO since {joinDate}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Progress & Recent Achievements */}
                    <div className="lg:col-span-2 space-y-8">
                        <div className="bg-white rounded-2xl shadow-lg p-6 lg:p-8 border-4 border-yellow-200">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                                Level Progress
                            </h2>

                            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-2xl mb-2">
                                <XPProgressBar
                                    currentLevel={childData.current_level}
                                    currentXP={childData.total_xp}
                                    showDetails={true}
                                />
                            </div>
                            <p className="text-sm text-gray-600 text-center mt-3 mb-6">
                                Keep completing lessons and daily quests to earn more XP!
                            </p>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                <button
                                    onClick={() => navigate('/child/modules')}
                                    className="p-4 bg-gray-50 rounded-xl border-2 border-transparent hover:border-blue-300 hover:bg-blue-50 transition-all text-center group"
                                >
                                    <BookOpen className="h-8 w-8 mx-auto text-blue-500 mb-2 group-hover:scale-110 transition-transform" />
                                    <span className="font-semibold text-gray-800 text-sm">Modules</span>
                                </button>
                                <button
                                    onClick={() => navigate('/child/leaderboard')}
                                    className="p-4 bg-gray-50 rounded-xl border-2 border-transparent hover:border-orange-300 hover:bg-orange-50 transition-all text-center group"
                                >
                                    <Trophy className="h-8 w-8 mx-auto text-orange-500 mb-2 group-hover:scale-110 transition-transform" />
                                    <span className="font-semibold text-gray-800 text-sm">Rank</span>
                                </button>
                                {isEnabled('company') ? (
                                    <button
                                        onClick={() => navigate('/child/company')}
                                        className="p-4 bg-gray-50 rounded-xl border-2 border-transparent hover:border-green-300 hover:bg-green-50 transition-all text-center group"
                                    >
                                        <Building2 className="h-8 w-8 mx-auto text-green-500 mb-2 group-hover:scale-110 transition-transform" />
                                        <span className="font-semibold text-gray-800 text-sm">Company</span>
                                    </button>
                                ) : (
                                    <div className="p-4 bg-gray-50 rounded-xl opacity-50 text-center grayscale">
                                        <Building2 className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                                        <span className="font-semibold text-gray-500 text-sm">Locked</span>
                                    </div>
                                )}
                                {isEnabled('marketplace') ? (
                                    <button
                                        onClick={() => navigate('/child/marketplace')}
                                        className="p-4 bg-gray-50 rounded-xl border-2 border-transparent hover:border-purple-300 hover:bg-purple-50 transition-all text-center group"
                                    >
                                        <TrendingUp className="h-8 w-8 mx-auto text-purple-500 mb-2 group-hover:scale-110 transition-transform" />
                                        <span className="font-semibold text-gray-800 text-sm">Market</span>
                                    </button>
                                ) : (
                                    <div className="p-4 bg-gray-50 rounded-xl opacity-50 text-center grayscale">
                                        <TrendingUp className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                                        <span className="font-semibold text-gray-500 text-sm">Locked</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Showcase Badges - Pick your top 5 */}
<div className="bg-white rounded-2xl shadow-lg p-6 lg:p-8 border-4 border-amber-200 mb-8">
  <div className="flex justify-between items-center mb-6">
    <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
      ⭐ My Showcase Badges
    </h2>
    <button
      onClick={() => setShowShowcasePicker(!showShowcasePicker)}
      className="text-sm font-bold text-amber-600 hover:text-amber-800 bg-amber-50 px-4 py-2 rounded-lg"
    >
      {showShowcasePicker ? 'Done' : 'Edit'}
    </button>
  </div>
  <p className="text-sm text-gray-600 mb-4">
    Pick up to 5 badges to display. Only earned badges can be showcased.
  </p>

  {showShowcasePicker ? (
    <div className="space-y-4">
      <p className="text-xs text-gray-500">Click earned badges to add/remove from showcase (max 5):</p>
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
        {allEarnedAchievements.map((achv) => {
            const isInShowcase = showcaseIds.includes(achv.id);
            const canAdd = showcaseIds.length < 5 || isInShowcase;
            return (
              <button
                key={achv.id}
                type="button"
                onClick={() => {
                  if (!canAdd && !isInShowcase) return;
                  const next = isInShowcase
                    ? showcaseIds.filter((id) => id !== achv.id)
                    : [...showcaseIds, achv.id].slice(0, 5);
                  handleSaveShowcase(next);
                }}
                className={`p-2 rounded-xl border-2 transition-all ${
                  isInShowcase ? 'border-amber-500 bg-amber-50' : 'border-gray-200 hover:border-amber-300'
                } ${!canAdd && !isInShowcase ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <AchievementBadge
                  name={achv.name}
                  description={achv.description}
                  rarity={achv.rarity}
                  iconUrl={achv.icon_url}
                  earned={true}
                  earnedAt={achv.earned_at}
                  size="sm"
                />
              </button>
            );
          })}
      </div>
      {savingShowcase && <p className="text-sm text-amber-600">Saving...</p>}
    </div>
  ) : (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
      {showcaseIds.length > 0 ? (
        showcaseIds.map((id) => {
          const achv = allEarnedAchievements.find((a: any) => a.id === id);
          if (!achv) return null;
          return (
            <div key={id} className="flex flex-col items-center">
              <AchievementBadge
                name={achv.name}
                description={achv.description}
                rarity={achv.rarity}
                iconUrl={achv.icon_url}
                earned={true}
                earnedAt={achv.earned_at}
                size="md"
              />
              <span className="text-xs font-bold text-gray-800 mt-2 truncate w-full text-center">
                {achv.name}
              </span>
            </div>
          );
        })
      ) : (
        <p className="text-gray-500 col-span-full">No showcase badges yet. Click Edit to pick some!</p>
      )}
    </div>
  )}
</div>

                        <div className="bg-white rounded-2xl shadow-lg p-6 lg:p-8 border-4 border-green-200">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                                    <Trophy className="h-6 w-6 text-yellow-500" /> Recent Badges
                                </h2>
                                <button
                                    onClick={() => navigate('/child/achievements')}
                                    className="text-sm font-bold text-indigo-600 hover:text-indigo-800 transition-colors bg-indigo-50 px-4 py-2 rounded-lg"
                                >
                                    View All
                                </button>
                            </div>

                            {recentAchievements.length > 0 ? (
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                    {recentAchievements.map((achv) => (
                                        <div key={achv.id} className="flex flex-col items-center text-center p-3 bg-gray-50 rounded-xl border border-gray-100 hover:shadow-md transition-shadow">
                                            <AchievementBadge
                                                name={achv.name}
                                                description={achv.description}
                                                rarity={achv.rarity}
                                                iconUrl={achv.icon_url}
                                                earned={true}
                                                earnedAt={achv.earned_at}
                                                size="sm"
                                            />
                                            <span className="text-xs font-bold text-gray-800 mt-3 truncate w-full">
                                                {achv.name}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 bg-gray-50 rounded-xl border border-gray-100 border-dashed">
                                    <p className="text-gray-500 font-medium">No badges yet. Start learning to earn them! 🚀</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}