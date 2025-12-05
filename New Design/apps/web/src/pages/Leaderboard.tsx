
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChildNavBar } from '@/components/navigation/ChildNavBar';
import { supabase } from '@/lib/supabase';
import { Trophy, TrendingUp, Star, Medal, Award, Crown, Users, Flame, Target } from 'lucide-react';
import { formatCurrency } from '@/utils/currency';

interface ChildSession {
  childId: string;
  childName: string;
  accessCode: string;
}

interface LeaderboardEntry {
  rank: number;
  childId: string;
  childName: string;
  value: number;
  companyName?: string;
  profilePictureUrl?: string | null;
}

export default function LeaderboardPage() {
  const navigate = useNavigate();
  const [childSession, setChildSession] = useState<ChildSession | null>(null);
  const [topRevenue, setTopRevenue] = useState<LeaderboardEntry[]>([]);
  const [topLevel, setTopLevel] = useState<LeaderboardEntry[]>([]);
  const [topSales, setTopSales] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'revenue' | 'level' | 'sales'>('revenue');

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

    async function fetchLeaderboards() {
      try {
        setLoading(true);

        // Fetch Top Revenue
        const { data: revenueData, error: revenueError } = await supabase
          .from('companies')
          .select(`
            total_revenue,
            company_name,
            child_id,
            children!inner (
              id,
              name,
              profile_picture_url
            )
          `)
          .order('total_revenue', { ascending: false })
          .limit(10);

        if (revenueError) throw revenueError;

        const revenueEntries: LeaderboardEntry[] =
          revenueData?.map((item: any, index: number) => ({
            rank: index + 1,
            childId: item.child_id,
            childName: item.children?.name || 'Unknown',
            value: parseFloat(item.total_revenue || 0),
            companyName: item.company_name,
            profilePictureUrl: item.children?.profile_picture_url,
          })) || [];

        setTopRevenue(revenueEntries);

        // Fetch Top Level
        const { data: levelData, error: levelError } = await supabase
          .from('children')
          .select('id, name, current_level, total_xp, profile_picture_url')
          .order('current_level', { ascending: false })
          .order('total_xp', { ascending: false })
          .limit(10);

        if (levelError) throw levelError;

        const levelEntries: LeaderboardEntry[] =
          levelData?.map((child: any, index: number) => ({
            rank: index + 1,
            childId: child.id,
            childName: child.name,
            value: child.current_level,
            profilePictureUrl: child.profile_picture_url,
          })) || [];

        setTopLevel(levelEntries);

        // Fetch Top Sales (count purchases by seller)
        const { data: purchasesData, error: purchasesError } = await supabase
          .from('marketplace_purchases')
          .select('item_id');

        if (purchasesError) throw purchasesError;

        const itemIds = purchasesData?.map((p: any) => p.item_id).filter(Boolean) || [];
        
        if (itemIds.length > 0) {
          const { data: itemsData, error: itemsError } = await supabase
            .from('marketplace_items')
            .select('id, seller_child_id')
            .in('id', itemIds);

          if (itemsError) throw itemsError;

          const salesCount: Record<string, number> = {};
          
          purchasesData?.forEach((purchase: any) => {
            const item = itemsData?.find((i: any) => i.id === purchase.item_id);
            if (item?.seller_child_id) {
              const sellerId = item.seller_child_id;
              salesCount[sellerId] = (salesCount[sellerId] || 0) + 1;
            }
          });

          const sellerIds = Object.keys(salesCount);
          if (sellerIds.length > 0) {
            const { data: childrenData, error: childrenError } = await supabase
              .from('children')
              .select('id, name, profile_picture_url')
              .in('id', sellerIds);

            if (childrenError) throw childrenError;

            const childrenMap = new Map(
              childrenData?.map((c: any) => [c.id, { name: c.name, profilePictureUrl: c.profile_picture_url }]) || []
            );

            const salesEntries: LeaderboardEntry[] = Object.entries(salesCount)
              .map(([childId, count]) => {
                const childData = childrenMap.get(childId);
                return {
                  rank: 0,
                  childId,
                  childName: childData?.name || 'Unknown',
                  value: count,
                  profilePictureUrl: childData?.profilePictureUrl,
                };
              })
              .sort((a, b) => b.value - a.value)
              .slice(0, 10)
              .map((entry, index) => ({
                ...entry,
                rank: index + 1,
              }));

            setTopSales(salesEntries);
          } else {
            setTopSales([]);
          }
        } else {
          setTopSales([]);
        }
      } catch (err) {
        console.error('Failed to fetch leaderboards:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchLeaderboards();
  }, [childSession]);

  if (!childSession) {
    return null;
  }

  const getRankIcon = (rank: number) => {
    switch(rank) {
      case 1: return <Crown className="h-7 w-7 text-yellow-500" />;
      case 2: return <Medal className="h-6 w-6 text-gray-400" />;
      case 3: return <Medal className="h-6 w-6 text-orange-500" />;
      default: return <span className="text-lg font-bold text-gray-700">#{rank}</span>;
    }
  };

  const getRankBadge = (rank: number) => {
    switch(rank) {
      case 1: return 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-yellow-900';
      case 2: return 'bg-gradient-to-r from-gray-200 to-gray-300 text-gray-900';
      case 3: return 'bg-gradient-to-r from-orange-200 to-orange-300 text-orange-900';
      default: return 'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-900';
    }
  };

  const getTabIcon = (tab: string) => {
    switch(tab) {
      case 'revenue': return <TrendingUp className="h-5 w-5" />;
      case 'level': return <Star className="h-5 w-5" />;
      case 'sales': return <Award className="h-5 w-5" />;
      default: return <Trophy className="h-5 w-5" />;
    }
  };

  const renderLeaderboard = (entries: LeaderboardEntry[], formatValue: (val: number) => string, icon: React.ReactNode) => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-400 to-purple-400 rounded-2xl border-3 border-black flex items-center justify-center mb-4 animate-pulse">
            <Target className="h-8 w-8 text-white" />
          </div>
          <div className="text-xl font-bold text-gray-800 mb-2">Loading Leaderboard...</div>
          <div className="text-gray-600">Getting the latest rankings!</div>
        </div>
      );
    }

    if (entries.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="w-16 h-16 bg-gradient-to-r from-gray-300 to-gray-400 rounded-2xl border-3 border-black flex items-center justify-center mb-4">
            <Users className="h-8 w-8 text-gray-600" />
          </div>
          <div className="text-xl font-bold text-gray-800 mb-2">No Data Yet</div>
          <div className="text-gray-600">Be the first to compete!</div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Top 3 Podium */}
        {entries.length >= 3 && (
          <div className="flex items-end justify-center gap-6 mb-8">
            {/* 2nd Place */}
            <div className="flex flex-col items-center transform translate-y-4">
              <div className="w-20 h-20 rounded-full bg-gradient-to-r from-gray-200 to-gray-300 border-3 border-gray-400 flex items-center justify-center mb-3">
                <div className="text-2xl font-bold text-gray-800">2</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-gray-800 text-sm">{entries[1].childName}</div>
                <div className="text-sm text-gray-600">{formatValue(entries[1].value)}</div>
              </div>
            </div>
            
            {/* 1st Place */}
            <div className="flex flex-col items-center">
              <div className="w-24 h-24 rounded-full bg-gradient-to-r from-yellow-400 to-yellow-500 border-3 border-yellow-600 flex items-center justify-center mb-3">
                <Crown className="h-8 w-8 text-yellow-900" />
              </div>
              <div className="text-center">
                <div className="font-bold text-gray-800">{entries[0].childName}</div>
                <div className="text-lg text-yellow-600">{formatValue(entries[0].value)}</div>
              </div>
            </div>
            
            {/* 3rd Place */}
            <div className="flex flex-col items-center transform translate-y-8">
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-orange-200 to-orange-300 border-3 border-orange-400 flex items-center justify-center mb-3">
                <div className="text-xl font-bold text-orange-800">3</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-gray-800 text-sm">{entries[2].childName}</div>
                <div className="text-sm text-gray-600">{formatValue(entries[2].value)}</div>
              </div>
            </div>
          </div>
        )}

        {/* Rest of the Leaderboard */}
        <div className="space-y-4">
          {entries.slice(3).map((entry) => {
            const isCurrentUser = entry.childId === childSession.childId;
            return (
              <div
                key={entry.childId}
                className={`flex items-center gap-4 p-4 rounded-2xl border-3 transition-all hover:scale-[1.02] ${
                  isCurrentUser
                    ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-400'
                    : 'bg-white border-gray-300'
                } shadow-md hover:shadow-lg`}
              >
                <div className={`flex items-center justify-center w-12 h-12 rounded-full ${getRankBadge(entry.rank)} border-2 border-gray-400`}>
                  {getRankIcon(entry.rank)}
                </div>
                
                {/* Profile Picture or Initial */}
                <div className="relative">
                  {entry.profilePictureUrl ? (
                    <img
                      src={entry.profilePictureUrl}
                      alt={entry.childName}
                      className="w-14 h-14 rounded-full object-cover border-2 border-gray-400"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center border-2 border-gray-400">
                      <span className="text-xl font-bold text-white">{entry.childName.charAt(0).toUpperCase()}</span>
                    </div>
                  )}
                  {isCurrentUser && (
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full border-2 border-yellow-600 flex items-center justify-center">
                      <span className="text-xs font-bold text-gray-900">YOU</span>
                    </div>
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-lg text-gray-900">{entry.childName}</span>
                    {entry.rank <= 3 && (
                      <Flame className="h-4 w-4 text-orange-500" />
                    )}
                  </div>
                  {entry.companyName && (
                    <span className="text-sm text-gray-600">{entry.companyName}</span>
                  )}
                </div>

                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900">{formatValue(entry.value)}</div>
                  <div className="text-xs text-gray-500">Rank #{entry.rank}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-purple-50 to-pink-50">
      <ChildNavBar />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-4 mb-6">
            <Trophy className="h-12 w-12 text-yellow-500" />
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                LEADERBOARD
              </h1>
              <div className="w-48 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 mx-auto rounded-full"></div>
            </div>
            <Crown className="h-12 w-12 text-yellow-500" />
          </div>
          <p className="text-lg text-gray-700 mb-6">
            Compete with other young entrepreneurs! 👑
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 border-3 border-gray-300 shadow-lg">
            <div className="flex items-center gap-4 mb-3">
              <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-emerald-500 rounded-xl flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <div>
                <div className="text-sm text-gray-600">Total Competitors</div>
                <div className="text-2xl font-bold text-gray-900">
                  {Math.max(topRevenue.length, topLevel.length, topSales.length)}
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl p-6 border-3 border-gray-300 shadow-lg">
            <div className="flex items-center gap-4 mb-3">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-cyan-500 rounded-xl flex items-center justify-center">
                <Star className="h-6 w-6 text-white" />
              </div>
              <div>
                <div className="text-sm text-gray-600">Your Best Rank</div>
                <div className="text-2xl font-bold text-gray-900">
                  {(() => {
                    const allEntries = [...topRevenue, ...topLevel, ...topSales];
                    const userEntries = allEntries.filter(e => e.childId === childSession.childId);
                    const bestRank = userEntries.length > 0 ? Math.min(...userEntries.map(e => e.rank)) : '--';
                    return bestRank === '--' ? bestRank : `#${bestRank}`;
                  })()}
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl p-6 border-3 border-gray-300 shadow-lg">
            <div className="flex items-center gap-4 mb-3">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-pink-500 rounded-xl flex items-center justify-center">
                <Target className="h-6 w-6 text-white" />
              </div>
              <div>
                <div className="text-sm text-gray-600">Active Categories</div>
                <div className="text-2xl font-bold text-gray-900">3</div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-4 mb-8 justify-center">
          {(['revenue', 'level', 'sales'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-3 px-6 py-3 rounded-xl font-bold transition-all ${
                activeTab === tab
                  ? {
                      'revenue': 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg',
                      'level': 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg',
                      'sales': 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg',
                    }[tab]
                  : 'bg-white text-gray-700 hover:bg-gray-100 border-2 border-gray-300'
              }`}
            >
              <div className={`p-2 rounded-lg ${activeTab === tab ? 'bg-white/20' : 'bg-gray-100'}`}>
                {getTabIcon(tab)}
              </div>
              <span className="text-lg">
                {tab === 'revenue' ? 'Top Revenue' : 
                 tab === 'level' ? 'Top Level' : 
                 'Top Sales'}
              </span>
            </button>
          ))}
        </div>

        {/* Leaderboard Content */}
        <div className="bg-white rounded-3xl p-8 border-3 border-gray-300 shadow-xl">
          {/* Tab Header */}
          <div className="flex items-center gap-4 mb-8">
            <div className={`p-4 rounded-2xl ${
              activeTab === 'revenue' ? 'bg-gradient-to-r from-green-100 to-emerald-100' :
              activeTab === 'level' ? 'bg-gradient-to-r from-blue-100 to-cyan-100' :
              'bg-gradient-to-r from-purple-100 to-pink-100'
            }`}>
              {getTabIcon(activeTab)}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">
                {activeTab === 'revenue' ? '💰 Top Revenue Earners' :
                 activeTab === 'level' ? '⭐ Highest Levels' :
                 '🏆 Most Sales'}
              </h2>
              <p className="text-gray-600">
                {activeTab === 'revenue' ? 'Who made the most virtual money?' :
                 activeTab === 'level' ? 'Who reached the highest adventure level?' :
                 'Who sold the most products?'}
              </p>
            </div>
          </div>

          {activeTab === 'revenue' && renderLeaderboard(topRevenue, (val) => formatCurrency(val), <TrendingUp />)}
          {activeTab === 'level' && renderLeaderboard(topLevel, (val) => `Level ${val}`, <Star />)}
          {activeTab === 'sales' && renderLeaderboard(topSales, (val) => `${val} ${val === 1 ? 'sale' : 'sales'}`, <Award />)}
        </div>

        {/* Motivation Footer */}
        <div className="text-center mt-8 p-8 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-3xl border-3 border-yellow-300">
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="w-12 h-12 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full flex items-center justify-center">
              <Trophy className="h-6 w-6 text-white" />
            </div>
            <p className="text-lg font-bold text-gray-900">
              🎮 Keep playing to climb the ranks! 🎮
            </p>
          </div>
          <p className="text-gray-700">
            Every sale, every lesson, and every achievement gets you closer to the top!
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
