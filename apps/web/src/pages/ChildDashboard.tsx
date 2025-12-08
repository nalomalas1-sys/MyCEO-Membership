import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChildNavBar } from '@/components/navigation/ChildNavBar';
import { XPProgressBar } from '@/components/child/XPProgressBar';
import { LoadingAnimation } from '@/components/ui/LoadingAnimation';
import { supabase } from '@/lib/supabase';
import { BackgroundEffects, FloatingCharacters, PiggyBankMascot, FloatingBackgroundStyles } from '@/components/ui/FloatingBackground';

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

  useEffect(() => {
    // Clear any existing Supabase auth session to ensure we use anon role
    // This is important because child sessions use access codes, not Supabase Auth
    supabase.auth.signOut().catch(() => {
      // Ignore errors if already signed out
    });

    // Get child session from localStorage
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
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    if (!childSession) return;

    async function fetchChildData() {
      try {
        const { data, error } = await supabase
          .from('children')
          .select('total_xp, current_level, current_streak')
          .eq('id', childSession.childId)
          .single();

        if (error) throw error;
        setChildData(data);
      } catch (err) {
        console.error('Failed to fetch child data:', err);
      }
    }

    fetchChildData();
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
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Welcome, {childSession.childName}! 👋
          </h1>
          <p className="text-lg text-gray-600">Ready to learn about money and business?</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-6 border-4 border-yellow-300">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">My Company 🏢</h2>
            <p className="text-gray-600 mb-4">Build and manage your virtual company!</p>
            <button
              onClick={() => navigate('/child/company')}
              className="w-full py-3 bg-yellow-400 text-gray-900 font-bold rounded-lg hover:bg-yellow-500"
            >
              View Company
            </button>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border-4 border-blue-300">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Learn 📚</h2>
            <p className="text-gray-600 mb-4">Complete modules and earn XP!</p>
            <button
              onClick={() => navigate('/child/modules')}
              className="w-full py-3 bg-blue-400 text-gray-900 font-bold rounded-lg hover:bg-blue-500"
            >
              Start Learning
            </button>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border-4 border-purple-300">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Marketplace 🛒</h2>
            <p className="text-gray-600 mb-4">Promote your products and discover others!</p>
            <button
              onClick={() => navigate('/child/marketplace')}
              className="w-full py-3 bg-purple-400 text-gray-900 font-bold rounded-lg hover:bg-purple-500"
            >
              Visit Marketplace
            </button>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border-4 border-green-300">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Achievements 🏆</h2>
            <p className="text-gray-600 mb-4">See all your badges and rewards!</p>
            <button
              onClick={() => navigate('/child/achievements')}
              className="w-full py-3 bg-green-400 text-gray-900 font-bold rounded-lg hover:bg-green-500"
            >
              View Badges
            </button>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border-4 border-orange-300">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Leaderboard 🏅</h2>
            <p className="text-gray-600 mb-4">See who's on top in revenue, level, and sales!</p>
            <button
              onClick={() => navigate('/child/leaderboard')}
              className="w-full py-3 bg-orange-400 text-gray-900 font-bold rounded-lg hover:bg-orange-500"
            >
              View Leaderboard
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6">
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
      </div>
    </div>
  );
}



