import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChildNavBar } from '@/components/navigation/ChildNavBar';
import { XPProgressBar } from '@/components/child/XPProgressBar';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { RefreshCw, Trophy, Building2, BookOpen, Store, TrendingUp, Star, Zap, Target, Flame } from 'lucide-react';

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
  const [refreshing, setRefreshing] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAndLoadChildSession = () => {
      const sessionStr = localStorage.getItem('child_session');
      
      if (!sessionStr) {
        console.log('No child session found, redirecting to login');
        navigate('/child/login');
        return null;
      }

      try {
        const session = JSON.parse(sessionStr);
        console.log('Loaded child session:', session);
        return session;
      } catch (err) {
        console.error('Failed to parse child session:', err);
        navigate('/child/login');
        return null;
      }
    };

    const session = checkAndLoadChildSession();
    
    if (session) {
      setChildSession(session);
      
      const fetchChildData = async () => {
        try {
          const { data, error } = await supabase
            .from('children')
            .select('total_xp, current_level, current_streak')
            .eq('id', session.childId)
            .eq('access_code', session.accessCode)
            .single();

          if (error) {
            console.error('Error fetching child data:', error);
            localStorage.removeItem('child_session');
            navigate('/child/login');
            return;
          }

          if (data) {
            setChildData(data);
          } else {
            localStorage.removeItem('child_session');
            navigate('/child/login');
          }
        } catch (err) {
          console.error('Failed to fetch child data:', err);
          localStorage.removeItem('child_session');
          navigate('/child/login');
        } finally {
          setLoading(false);
        }
      };

      fetchChildData();
    } else {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    if (!childSession) return;

    const verifySession = async () => {
      const { data, error } = await supabase
        .from('children')
        .select('id')
        .eq('id', childSession.childId)
        .eq('access_code', childSession.accessCode)
        .single();

      if (error || !data) {
        console.log('Session verification failed, redirecting to login');
        localStorage.removeItem('child_session');
        navigate('/child/login');
      }
    };

    const interval = setInterval(verifySession, 30000);
    
    return () => clearInterval(interval);
  }, [childSession, navigate]);

  const handleLogout = () => {
    localStorage.removeItem('child_session');
    navigate('/child/login');
  };

  const handleRefresh = async () => {
    if (!childSession || refreshing) return;
    
    setRefreshing(true);
    try {
      const { data, error } = await supabase
        .from('children')
        .select('total_xp, current_level, current_streak')
        .eq('id', childSession.childId)
        .eq('access_code', childSession.accessCode)
        .single();

      if (error) {
        console.error('Error refreshing child data:', error);
      } else if (data) {
        setChildData(data);
      }
    } catch (err) {
      console.error('Failed to refresh child data:', err);
    } finally {
      setTimeout(() => setRefreshing(false), 500);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100">
        <div className="text-center">
          <div className="inline-block animate-bounce mb-6">
            <div className="w-20 h-20 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-2xl flex items-center justify-center shadow-lg">
              <Zap className="w-10 h-10 text-white" />
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-800 mb-2 font-sans">
            Loading Your Adventure...
          </div>
          <div className="text-gray-600 font-sans">
            Getting your business world ready!
          </div>
        </div>
      </div>
    );
  }

  if (!childSession) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-purple-50 to-pink-50 font-sans overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse delay-500"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {/* Header */}
        <div className="mb-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-2xl flex items-center justify-center shadow-lg transform hover:scale-105 transition-transform duration-300">
                  <Star className="w-8 h-8 text-white" />
                </div>
                <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-md">
                  Lv{childData?.current_level || 1}
                </div>
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-1">
                  Welcome back, {childSession.childName}! 👋
                </h1>
                <p className="text-gray-600 text-lg">
                  Your business adventure awaits!
                </p>
              </div>
            </div>
            
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="px-5 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 flex items-center space-x-2 font-medium disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
            </button>
          </div>
        </div>

        {/* Progress Section */}
        <div className="mb-10">
          <div className="bg-white rounded-3xl p-8 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center mr-3">
                <Target className="w-5 h-5 text-white" />
              </div>
              Your Adventure Progress
            </h2>
            
            {childData && (
              <div className="mb-8">
                <XPProgressBar
                  currentLevel={childData.current_level}
                  currentXP={childData.total_xp}
                  showDetails={true}
                />
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Level Card */}
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-2xl p-6 border border-blue-200 transform hover:scale-[1.02] transition-transform duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-blue-600 font-medium">Current Level</div>
                  <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                    <Star className="w-5 h-5 text-white" />
                  </div>
                </div>
                <div className="text-3xl font-bold text-gray-800">{childData?.current_level || 1}</div>
                <div className="text-sm text-gray-600 mt-2">Business Hero Rank</div>
              </div>

              {/* XP Card */}
              <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-2xl p-6 border border-purple-200 transform hover:scale-[1.02] transition-transform duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-purple-600 font-medium">Total XP</div>
                  <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                    <Zap className="w-5 h-5 text-white" />
                  </div>
                </div>
                <div className="text-3xl font-bold text-gray-800">{childData?.total_xp || 0}</div>
                <div className="text-sm text-gray-600 mt-2">Experience Points Earned</div>
              </div>

              {/* Streak Card */}
              <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-2xl p-6 border border-orange-200 transform hover:scale-[1.02] transition-transform duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-orange-600 font-medium">Daily Streak</div>
                  <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                    <Flame className="w-5 h-5 text-white" />
                  </div>
                </div>
                <div className="flex items-end">
                  <div className="text-3xl font-bold text-gray-800 mr-2">{childData?.current_streak || 0}</div>
                  <div className="text-gray-600 mb-1">days</div>
                </div>
                <div className="text-sm text-gray-600 mt-2">Keep the fire burning!</div>
              </div>
            </div>
          </div>
        </div>

        {/* Adventure Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
          {/* My Company Card */}
          <div 
            className="group cursor-pointer transform hover:-translate-y-2 transition-all duration-300"
            onClick={() => navigate('/child/company')}
          >
            <div className="bg-gradient-to-br from-white to-blue-50 rounded-3xl p-6 shadow-lg border border-blue-100 h-full group-hover:shadow-xl group-hover:border-blue-200">
              <div className="flex items-start mb-6">
                <div className="w-14 h-14 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300">
                  <Building2 className="w-7 h-7 text-white" />
                </div>
                <div className="ml-4">
                  <h3 className="text-xl font-bold text-gray-800 mb-1">My Company</h3>
                  <p className="text-gray-600 text-sm">Build your business empire</p>
                </div>
              </div>
              <div className="mb-6">
                <div className="flex space-x-2 mb-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="w-8 h-8 bg-gradient-to-r from-blue-200 to-cyan-200 rounded-lg"></div>
                  ))}
                </div>
                <p className="text-gray-700">Create and manage your virtual company</p>
              </div>
              <div className="px-4 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl text-center font-medium shadow-md group-hover:shadow-lg transition-shadow">
                Enter Headquarters
              </div>
            </div>
          </div>

          {/* Learn & Earn Card */}
          <div 
            className="group cursor-pointer transform hover:-translate-y-2 transition-all duration-300"
            onClick={() => navigate('/child/modules')}
          >
            <div className="bg-gradient-to-br from-white to-green-50 rounded-3xl p-6 shadow-lg border border-green-100 h-full group-hover:shadow-xl group-hover:border-green-200">
              <div className="flex items-start mb-6">
                <div className="w-14 h-14 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300">
                  <BookOpen className="w-7 h-7 text-white" />
                </div>
                <div className="ml-4">
                  <h3 className="text-xl font-bold text-gray-800 mb-1">Learn & Earn</h3>
                  <p className="text-gray-600 text-sm">Complete quests for rewards</p>
                </div>
              </div>
              <div className="mb-6">
                <div className="flex space-x-2 mb-3">
                  {[1, 2, 3].map((i) => (
                    <div 
                      key={i} 
                      className="w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full flex items-center justify-center animate-pulse"
                      style={{ animationDelay: `${i * 200}ms` }}
                    >
                    </div>
                  ))}
                </div>
                <p className="text-gray-700">Fun lessons with XP and coin rewards</p>
              </div>
              <div className="px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl text-center font-medium shadow-md group-hover:shadow-lg transition-shadow">
                Start Learning
              </div>
            </div>
          </div>

          {/* Marketplace Card */}
          <div 
            className="group cursor-pointer transform hover:-translate-y-2 transition-all duration-300"
            onClick={() => navigate('/child/marketplace')}
          >
            <div className="bg-gradient-to-br from-white to-purple-50 rounded-3xl p-6 shadow-lg border border-purple-100 h-full group-hover:shadow-xl group-hover:border-purple-200">
              <div className="flex items-start mb-6">
                <div className="w-14 h-14 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300">
                  <Store className="w-7 h-7 text-white" />
                </div>
                <div className="ml-4">
                  <h3 className="text-xl font-bold text-gray-800 mb-1">Marketplace</h3>
                  <p className="text-gray-600 text-sm">Trade and shop with friends</p>
                </div>
              </div>
              <div className="mb-6">
                <div className="flex space-x-3 mb-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-red-400 to-pink-400 rounded-lg transform rotate-3"></div>
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-lg transform -rotate-3"></div>
                </div>
                <p className="text-gray-700">Buy, sell, and trade virtual items</p>
              </div>
              <div className="px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl text-center font-medium shadow-md group-hover:shadow-lg transition-shadow">
                Visit Market
              </div>
            </div>
          </div>

          {/* Achievements Card */}
          <div 
            className="group cursor-pointer transform hover:-translate-y-2 transition-all duration-300"
            onClick={() => navigate('/child/achievements')}
          >
            <div className="bg-gradient-to-br from-white to-yellow-50 rounded-3xl p-6 shadow-lg border border-yellow-100 h-full group-hover:shadow-xl group-hover:border-yellow-200">
              <div className="flex items-start mb-6">
                <div className="w-14 h-14 bg-gradient-to-r from-yellow-500 to-amber-500 rounded-2xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300">
                  <Trophy className="w-7 h-7 text-white" />
                </div>
                <div className="ml-4">
                  <h3 className="text-xl font-bold text-gray-800 mb-1">Achievements</h3>
                  <p className="text-gray-600 text-sm">Unlock badges and rewards</p>
                </div>
              </div>
              <div className="mb-6">
                <div className="flex space-x-2 mb-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full"></div>
                  <div className="w-10 h-10 bg-gradient-to-r from-gray-300 to-gray-400 rounded-full"></div>
                  <div className="w-10 h-10 bg-gradient-to-r from-amber-600 to-orange-600 rounded-full"></div>
                </div>
                <p className="text-gray-700">Complete challenges to earn badges</p>
              </div>
              <div className="px-4 py-3 bg-gradient-to-r from-yellow-500 to-amber-500 text-white rounded-xl text-center font-medium shadow-md group-hover:shadow-lg transition-shadow">
                View Achievements
              </div>
            </div>
          </div>

          {/* Leaderboard Card */}
          <div 
            className="group cursor-pointer transform hover:-translate-y-2 transition-all duration-300"
            onClick={() => navigate('/child/leaderboard')}
          >
            <div className="bg-gradient-to-br from-white to-red-50 rounded-3xl p-6 shadow-lg border border-red-100 h-full group-hover:shadow-xl group-hover:border-red-200">
              <div className="flex items-start mb-6">
                <div className="w-14 h-14 bg-gradient-to-r from-red-500 to-orange-500 rounded-2xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300">
                  <TrendingUp className="w-7 h-7 text-white" />
                </div>
                <div className="ml-4">
                  <h3 className="text-xl font-bold text-gray-800 mb-1">Leaderboard</h3>
                  <p className="text-gray-600 text-sm">Compete with friends</p>
                </div>
              </div>
              <div className="mb-6">
                <div className="flex items-center justify-center space-x-3 mb-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-yellow-400 to-amber-400 rounded-full flex items-center justify-center text-white font-bold shadow">1</div>
                  <div className="w-10 h-10 bg-gradient-to-r from-gray-300 to-gray-400 rounded-full flex items-center justify-center text-white font-bold shadow">2</div>
                  <div className="w-8 h-8 bg-gradient-to-r from-amber-700 to-orange-700 rounded-full flex items-center justify-center text-white font-bold text-sm shadow">3</div>
                </div>
                <p className="text-gray-700">See who's leading the adventure</p>
              </div>
              <div className="px-4 py-3 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-xl text-center font-medium shadow-md group-hover:shadow-lg transition-shadow">
                View Rankings
              </div>
            </div>
          </div>

          {/* Daily Rewards Card */}
          <div 
            className="group cursor-pointer transform hover:-translate-y-2 transition-all duration-300"
            onClick={() => navigate('/child/rewards')}
          >
            <div className="bg-gradient-to-br from-white to-cyan-50 rounded-3xl p-6 shadow-lg border border-cyan-100 h-full group-hover:shadow-xl group-hover:border-cyan-200">
              <div className="flex items-start mb-6">
                <div className="w-14 h-14 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-2xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300">
                  <div className="text-xl">🎁</div>
                </div>
                <div className="ml-4">
                  <h3 className="text-xl font-bold text-gray-800 mb-1">Daily Rewards</h3>
                  <p className="text-gray-600 text-sm">Claim your daily bonus</p>
                </div>
              </div>
              <div className="mb-6">
                <div className="grid grid-cols-7 gap-1 mb-3">
                  {[1, 2, 3, 4, 5, 6, 7].map((day) => (
                    <div 
                      key={day} 
                      className={`aspect-square rounded-lg flex items-center justify-center text-sm font-medium transition-all duration-300 ${
                        day <= (childData?.current_streak || 0) 
                          ? 'bg-gradient-to-r from-green-400 to-emerald-500 text-white shadow' 
                          : 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-500'
                      }`}
                    >
                      {day}
                    </div>
                  ))}
                </div>
                <p className="text-gray-700">Log in daily for special rewards</p>
              </div>
              <div className="px-4 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-xl text-center font-medium shadow-md group-hover:shadow-lg transition-shadow">
                Claim Reward
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center py-6">
          <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-3 rounded-full shadow-lg">
            <Star className="w-5 h-5" />
            <span className="font-medium">Every business hero started with a single coin! 🌟</span>
          </div>
        </div>
      </div>
    </div>
  );
}