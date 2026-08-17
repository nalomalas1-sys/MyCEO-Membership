import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChildNavBar } from '@/components/navigation/ChildNavBar';
import { XPProgressBar } from '@/components/child/XPProgressBar';
import { DailyChallenges } from '@/components/child/DailyChallenges';
import { ChildDashboardStats } from '@/components/child/ChildDashboardStats';
import { LoadingAnimation } from '@/components/ui/LoadingAnimation';
import { supabase } from '@/lib/supabase';
import { BackgroundEffects, FloatingCharacters, PiggyBankMascot, FloatingBackgroundStyles } from '@/components/ui/FloatingBackground';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';
import { Trophy, Building2, ShoppingBag, BookOpen } from 'lucide-react'; 
import { ActivityFeed } from '@/components/child/ActivityFeed';

interface ChildSession {
  childId: string;
  childName: string;
  accessCode: string;
}

interface ChildData {
  total_xp: number;
  current_level: number;
  current_streak: number;
}

export default function ChildDashboardPage() {
  const [childSession, setChildSession] = useState<ChildSession | null>(null);
  const [childData, setChildData] = useState<ChildData | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { isEnabled } = useFeatureFlags();

  useEffect(() => {
    supabase.auth.signOut().catch(() => {});

    const sessionStr = localStorage.getItem('child_session');
    if (!sessionStr) {
      navigate('/child/login');
      return;
    }

    let session: ChildSession;
    try {
      session = JSON.parse(sessionStr);
    } catch {
      navigate('/child/login');
      setLoading(false);
      return;
    }

    async function checkSubscription() {
      try {
        const { data: result, error } = await supabase
          .rpc('check_parent_subscription_for_child', {
            p_child_id: session.childId
          })
          .single();

        if (error || !result) {
          localStorage.removeItem('child_session');
          navigate('/child/login?error=subscription_check_failed');
          return;
        }

        const subscriptionResult = result as {
          child_id: string;
          child_name: string;
          access_code: string;
          parent_subscription_status: string;
          subscription_valid: boolean;
        };

        if (!subscriptionResult.subscription_valid) {
          localStorage.removeItem('child_session');
          navigate('/child/login?error=subscription_expired');
          return;
        }

        setChildSession(session);
      } catch (err) {
        console.error('Failed to check subscription:', err);
        localStorage.removeItem('child_session');
        navigate('/child/login?error=subscription_check_failed');
      } finally {
        setLoading(false);
      }
    }

    checkSubscription();
  }, [navigate]);

  useEffect(() => {
    if (!childSession) return;

    const sessionId = childSession.childId;

    async function fetchChildData() {
      try {
        const { data, error } = await supabase
          .from('children')
          .select('total_xp, current_level, current_streak')
          .eq('id', sessionId)
          .single();

        if (error) throw error;
        setChildData(data);
      } catch (err) {
        console.error('Failed to fetch child data:', err);
      }
    }

    fetchChildData();
  }, [childSession]);

  

  // When XP is claimed (e.g. from Daily Quests), refetch child data so the progress bar animates
  useEffect(() => {
    if (!childSession) return;

    const handleXpGained = () => {
      supabase
        .from('children')
        .select('total_xp, current_level, current_streak')
        .eq('id', childSession.childId)
        .single()
        .then(({ data, error }) => {
          if (!error && data) setChildData(data);
        });
    };

    window.addEventListener('child_xp_gained', handleXpGained);
    return () => window.removeEventListener('child_xp_gained', handleXpGained);
  }, [childSession]);

  if (loading) {
    return <LoadingAnimation message="Loading..." variant="fullscreen" />;
  }


  if (!childSession) {
    return null;
  }

  return (
    <div className="min-h-screen relative bg-gradient-to-b from-blue-100 via-yellow-50 to-amber-50 font-sans text-blue-900 overflow-hidden selection:bg-yellow-300 selection:text-yellow-900">
      <BackgroundEffects />
      <FloatingCharacters />
      <PiggyBankMascot />
      <FloatingBackgroundStyles />

      <ChildNavBar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2 border-b-4 border-yellow-300 inline-block pb-2">
            Welcome back, {childSession.childName}! 👋
          </h1>
          <p className="text-lg text-gray-600 mt-4 font-medium">Ready to continue your CEO journey?</p>
        </div>

        {/* Continue Learning Button */}
        <button
          onClick={() => navigate('/child/modules')}
          className="w-full md:w-auto mb-8 relative flex items-center justify-center gap-2 px-6 py-3 rounded-xl border-2 border-gray-700 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,0.3)] active:shadow-none bg-gradient-to-r from-blue-500 to-cyan-400 hover:from-blue-400 hover:to-cyan-300 active:translate-y-1 active:translate-x-1 transition-all group"
        >
          <div className="w-9 h-9 bg-white/20 rounded-lg border-2 border-white/30 flex items-center justify-center group-hover:scale-110 transition-transform">
            <BookOpen className="h-5 w-5 text-white drop-shadow-[2px_2px_0px_rgba(0,0,0,0.3)]" />
          </div>
          <span className="font-black text-white text-sm md:text-base tracking-wide drop-shadow-[2px_2px_0px_rgba(0,0,0,0.3)] uppercase">Continue Learning →</span>
        </button>

        {/* Animated Stats Array */}
        <ChildDashboardStats childId={childSession.childId} />

        {/* Quick Links Arcade */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-8">
          <button
            onClick={() => navigate('/child/leaderboard')}
            className="relative flex items-center justify-center gap-2 p-3 md:p-4 rounded-xl border-2 border-gray-700 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,0.3)] active:shadow-none bg-orange-400 hover:bg-orange-300 active:translate-y-1 active:translate-x-1 transition-all group"
          >
            <span className="text-xl md:text-2xl group-hover:scale-110 transition-transform drop-shadow-[2px_2px_0px_rgba(0,0,0,0.3)]">🏅</span>
            <span className="font-black text-white text-sm md:text-base tracking-wide drop-shadow-[2px_2px_0px_rgba(0,0,0,0.3)] uppercase">Leaderboard</span>
          </button>

          <button
            onClick={() => navigate('/child/achievements')}
            className="relative flex items-center justify-center gap-2 p-3 md:p-4 rounded-xl border-2 border-gray-700 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,0.3)] active:shadow-none bg-green-400 hover:bg-green-300 active:translate-y-1 active:translate-x-1 transition-all group"
          >
            <Trophy className="h-5 w-5 md:h-6 md:w-6 text-yellow-300 drop-shadow-[2px_2px_0px_rgba(0,0,0,0.3)] group-hover:scale-110 transition-transform" />
            <span className="font-black text-white text-sm md:text-base tracking-wide drop-shadow-[2px_2px_0px_rgba(0,0,0,0.3)] uppercase">Badges</span>
          </button>

          {isEnabled('company') ? (
            <button
              onClick={() => navigate('/child/company')}
              className="relative flex items-center justify-center gap-2 p-3 md:p-4 rounded-xl border-2 border-gray-700 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,0.3)] active:shadow-none bg-yellow-400 hover:bg-yellow-300 active:translate-y-1 active:translate-x-1 transition-all group"
            >
              <Building2 className="h-5 w-5 md:h-6 md:w-6 text-blue-500 drop-shadow-[1px_1px_0px_rgba(0,0,0,0.2)] group-hover:scale-110 transition-transform" />
              <span className="font-black text-white text-sm md:text-base tracking-wide drop-shadow-[2px_2px_0px_rgba(0,0,0,0.3)] uppercase">Company</span>
            </button>
          ) : (
            <div className="relative flex items-center justify-center gap-2 p-3 md:p-4 rounded-xl border-2 border-gray-400 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] bg-gray-200 opacity-80 cursor-not-allowed">
              <Building2 className="h-5 w-5 md:h-6 md:w-6 text-gray-500" />
              <span className="font-black text-gray-500 text-sm md:text-base tracking-wide uppercase">Locked</span>
            </div>
          )}

          {isEnabled('marketplace') ? (
            <button
              onClick={() => navigate('/child/marketplace')}
              className="relative flex items-center justify-center gap-2 p-3 md:p-4 rounded-xl border-2 border-gray-700 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,0.3)] active:shadow-none bg-purple-400 hover:bg-purple-300 active:translate-y-1 active:translate-x-1 transition-all group"
            >
              <ShoppingBag className="h-5 w-5 md:h-6 md:w-6 text-pink-300 drop-shadow-[2px_2px_0px_rgba(0,0,0,0.3)] group-hover:scale-110 transition-transform" />
              <span className="font-black text-white text-sm md:text-base tracking-wide drop-shadow-[2px_2px_0px_rgba(0,0,0,0.3)] uppercase">Market</span>
            </button>
          ) : (
            <div className="relative flex items-center justify-center gap-2 p-3 md:p-4 rounded-xl border-2 border-gray-400 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] bg-gray-200 opacity-80 cursor-not-allowed">
              <ShoppingBag className="h-5 w-5 md:h-6 md:w-6 text-gray-500" />
              <span className="font-black text-gray-500 text-sm md:text-base tracking-wide uppercase">Locked</span>
            </div>
          )}
        </div>

        {/* Daily Quests */}
        <div className="mb-8">
          <DailyChallenges childId={childSession.childId} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <div className="bg-white rounded-2xl shadow-lg p-6 lg:col-span-2">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Your Progress</h2>
            <div className="space-y-6">
              {childData && (
                <XPProgressBar
                  currentLevel={childData.current_level}
                  currentXP={childData.total_xp}
                  showDetails={true}
                />
              )}
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-700">Streak</span>
                  <span className="font-bold text-orange-600">
                    🔥 {childData?.current_streak || 0} {childData?.current_streak === 1 ? 'day' : 'days'}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Keep learning daily to maintain your streak! +10 XP per day of streak.
                </p>
              </div>
            </div>
          </div>

          {/* Activity Feed - right column */}
          <ActivityFeed childId={childSession.childId} />
        </div>
      </div>
    </div>
  );
}