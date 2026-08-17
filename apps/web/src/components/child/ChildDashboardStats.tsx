import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { StatsCounter } from '@/components/ui/StatsCounter';
import { BookOpen, Flame, Trophy, Star } from 'lucide-react';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';


interface ChildDashboardStatsProps {
    childId: string;
}

interface StatsData {
    totalXp: number;
    currentStreak: number;
    lessonsFinished: number;
    badgesEarned: number;
    companyRevenue: number;
}

export function ChildDashboardStats({ childId }: ChildDashboardStatsProps) {
    const [stats, setStats] = useState<StatsData>({
        totalXp: 0,
        currentStreak: 0,
        lessonsFinished: 0,
        badgesEarned: 0,
        companyRevenue: 0,
    });
    const [loading, setLoading] = useState(true);
    const { isEnabled } = useFeatureFlags();

    useEffect(() => {
        async function fetchStats() {
            try {
                // Fetch base child stats
                const { data: childData } = await supabase
                    .from('children')
                    .select('total_xp, current_streak')
                    .eq('id', childId)
                    .single();

                // Fetch aggregates concurrently
                const [
                    { count: lessonsCount },
                    { count: badgesCount }
                ] = await Promise.all([
                    supabase
                        .from('child_lesson_progress')
                        .select('*', { count: 'exact', head: true })
                        .eq('child_id', childId)
                        .eq('is_completed', true),
                    supabase
                        .from('child_achievements')
                        .select('*', { count: 'exact', head: true })
                        .eq('child_id', childId),
                ]);

                let revenue = 0;
                if (isEnabled('company')) {
                    const { data: company } = await supabase
                        .from('companies')
                        .select('total_revenue')
                        .eq('child_id', childId)
                        .single();
                    if (company) {
                        revenue = company.total_revenue;
                    }
                }

                setStats({
                    totalXp: childData?.total_xp || 0,
                    currentStreak: childData?.current_streak || 0,
                    lessonsFinished: lessonsCount || 0,
                    badgesEarned: badgesCount || 0,
                    companyRevenue: revenue,
                });
            } catch (err) {
                console.error('Failed to fetch dashboard stats:', err);
            } finally {
                setLoading(false);
            }
        }

        fetchStats();
    }, [childId, isEnabled]);

    // Listen for instant XP updates from Daily Quests
    useEffect(() => {
        const handleXpGained = (e: any) => {
            const amount = e.detail?.amount || 0;
            if (amount > 0) {
                setStats(prev => ({ ...prev, totalXp: prev.totalXp + amount }));
            }
        };

        window.addEventListener('child_xp_gained', handleXpGained);
        return () => window.removeEventListener('child_xp_gained', handleXpGained);
    }, []);

    if (loading) {
        return (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="bg-white rounded-2xl shadow-sm border-2 border-gray-100 p-4 animate-pulse">
                        <div className="h-10 w-10 bg-gray-200 rounded-xl mb-3" />
                        <div className="h-6 w-16 bg-gray-200 rounded mb-1" />
                        <div className="h-4 w-20 bg-gray-100 rounded" />
                    </div>
                ))}
            </div>
        );
    }

    const statCards = [
        {
            label: 'Total XP',
            value: stats.totalXp,
            icon: <Star className="h-6 w-6 text-yellow-500" />,
            color: 'bg-yellow-50 border-yellow-200',
            iconBg: 'bg-yellow-100',
        },
        {
            label: 'Day Streak',
            value: stats.currentStreak,
            icon: <Flame className="h-6 w-6 text-orange-500" />,
            color: 'bg-orange-50 border-orange-200',
            iconBg: 'bg-orange-100',
        },
        {
            label: 'Lessons Done',
            value: stats.lessonsFinished,
            icon: <BookOpen className="h-6 w-6 text-blue-500" />,
            color: 'bg-blue-50 border-blue-200',
            iconBg: 'bg-blue-100',
        },
        {
            label: 'Badges Earned',
            value: stats.badgesEarned,
            icon: <Trophy className="h-6 w-6 text-green-500" />,
            color: 'bg-green-50 border-green-200',
            iconBg: 'bg-green-100',
        },
    ];

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-8">
            {statCards.map((stat, idx) => (
                <div
                    key={stat.label}
                    className={`flex flex-col p-4 rounded-2xl border-2 ${stat.color} shadow-sm relative overflow-hidden group hover:shadow-md transition-all duration-300 hover:-translate-y-1`}
                    style={{ animation: `fadeInUp 0.5s ease-out ${idx * 0.1}s both` }}
                >
                    {/* Animated background decoration */}
                    <div className="absolute -right-4 -top-4 w-20 h-20 bg-white opacity-40 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />

                    <div className={`p-2.5 rounded-xl w-fit mb-3 shadow-sm ${stat.iconBg}`}>
                        {stat.icon}
                    </div>

                    <div className="relative z-10 flex flex-col">
                        <StatsCounter
                            value={stat.value}
                            className="text-2xl md:text-3xl font-black text-gray-900 drop-shadow-sm tracking-tight"
                        />
                        <span className="text-xs md:text-sm font-bold text-gray-600 mt-1 uppercase tracking-wide">
                            {stat.label}
                        </span>
                    </div>
                </div>
            ))}

            <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
        </div>
    );
}