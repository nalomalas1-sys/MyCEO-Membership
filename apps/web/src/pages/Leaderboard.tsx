import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChildNavBar } from '@/components/navigation/ChildNavBar';
import { supabase } from '@/lib/supabase';
import { Trophy, TrendingUp, Star, Medal, Award } from 'lucide-react';
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
        // Get all purchases with their items
        const { data: purchasesData, error: purchasesError } = await supabase
          .from('marketplace_purchases')
          .select('item_id');

        if (purchasesError) throw purchasesError;

        // Get all items with seller IDs
        const itemIds = purchasesData?.map((p: any) => p.item_id).filter(Boolean) || [];

        if (itemIds.length > 0) {
          const { data: itemsData, error: itemsError } = await supabase
            .from('marketplace_items')
            .select('id, seller_child_id')
            .in('id', itemIds);

          if (itemsError) throw itemsError;

          // Count sales per seller
          const salesCount: Record<string, number> = {};

          purchasesData?.forEach((purchase: any) => {
            const item = itemsData?.find((i: any) => i.id === purchase.item_id);
            if (item?.seller_child_id) {
              const sellerId = item.seller_child_id;
              salesCount[sellerId] = (salesCount[sellerId] || 0) + 1;
            }
          });

          // Get child names and profile pictures for sellers
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

            // Convert to array and sort
            const salesEntries: LeaderboardEntry[] = Object.entries(salesCount)
              .map(([childId, count]) => {
                const childData = childrenMap.get(childId);
                return {
                  rank: 0, // Will be set after sorting
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
    if (rank === 1) return <Medal className="h-6 w-6 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-6 w-6 text-gray-400" />;
    if (rank === 3) return <Medal className="h-6 w-6 text-orange-600" />;
    return <span className="text-lg font-bold text-gray-600">#{rank}</span>;
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) return 'bg-yellow-400 text-yellow-900';
    if (rank === 2) return 'bg-gray-300 text-gray-900';
    if (rank === 3) return 'bg-orange-300 text-orange-900';
    return 'bg-gray-200 text-gray-700';
  };

  const renderLeaderboard = (entries: LeaderboardEntry[], formatValue: (val: number) => string) => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="text-lg text-gray-600">Loading leaderboard...</div>
        </div>
      );
    }

    if (entries.length === 0) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="text-lg text-gray-600">No data available yet</div>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {entries.map((entry) => {
          const isCurrentUser = entry.childId === childSession.childId;
          return (
            <div
              key={entry.childId}
              className={`flex items-center gap-4 p-4 rounded-xl shadow-md transition-all ${isCurrentUser
                  ? 'bg-yellow-100 border-4 border-yellow-400'
                  : 'bg-white border-2 border-gray-200'
                }`}
            >
              <div className={`flex items-center justify-center w-12 h-12 rounded-full ${getRankBadge(entry.rank)}`}>
                {getRankIcon(entry.rank)}
              </div>
              {entry.profilePictureUrl ? (
                <img
                  src={entry.profilePictureUrl}
                  alt={entry.childName}
                  className="w-14 h-14 rounded-full object-cover border-2 border-gray-300"
                />
              ) : (
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center border-2 border-gray-300">
                  <span className="text-xl font-bold text-white">{entry.childName.charAt(0).toUpperCase()}</span>
                </div>
              )}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-lg text-gray-900">{entry.childName}</span>
                  {isCurrentUser && (
                    <span className="text-xs bg-yellow-400 text-yellow-900 px-2 py-1 rounded-full font-bold">
                      You
                    </span>
                  )}
                </div>
                {entry.companyName && (
                  <span className="text-sm text-gray-600">{entry.companyName}</span>
                )}
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900">{formatValue(entry.value)}</div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-pink-50 to-purple-50">
      <ChildNavBar />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Trophy className="h-10 w-10 text-yellow-500" />
            <h1 className="text-4xl font-bold text-gray-900">Leaderboard</h1>
            <Trophy className="h-10 w-10 text-yellow-500" />
          </div>
          <p className="text-lg text-gray-600">See who's leading the way!</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-4 mb-6 justify-center">
          <button
            onClick={() => setActiveTab('revenue')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-bold transition-all ${activeTab === 'revenue'
                ? 'bg-green-500 text-white shadow-lg scale-105'
                : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
          >
            <TrendingUp className="h-5 w-5" />
            Top Profit
          </button>
          <button
            onClick={() => setActiveTab('level')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-bold transition-all ${activeTab === 'level'
                ? 'bg-blue-500 text-white shadow-lg scale-105'
                : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
          >
            <Star className="h-5 w-5" />
            Top Level
          </button>
          <button
            onClick={() => setActiveTab('sales')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-bold transition-all ${activeTab === 'sales'
                ? 'bg-purple-500 text-white shadow-lg scale-105'
                : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
          >
            <Award className="h-5 w-5" />
            Top Sales
          </button>
        </div>

        {/* Leaderboard Content */}
        <div className="bg-white rounded-2xl shadow-xl p-6 border-4 border-yellow-300">
          {activeTab === 'revenue' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <TrendingUp className="h-6 w-6 text-green-500" />
                Top Profit Earners
              </h2>
              {renderLeaderboard(topRevenue, (val) => formatCurrency(val))}
            </div>
          )}

          {activeTab === 'level' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Star className="h-6 w-6 text-blue-500" />
                Highest Levels
              </h2>
              {renderLeaderboard(topLevel, (val) => `Level ${val}`)}
            </div>
          )}

          {activeTab === 'sales' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Award className="h-6 w-6 text-purple-500" />
                Most Sales
              </h2>
              {renderLeaderboard(topSales, (val) => `${val} ${val === 1 ? 'sale' : 'sales'}`)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

