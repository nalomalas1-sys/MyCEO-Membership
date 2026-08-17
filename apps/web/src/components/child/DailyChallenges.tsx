import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useNavigate } from 'react-router-dom';
import {
    Target,
    BookOpen,
    ShoppingBag,
    TrendingUp,
    Star,
    Flame,
    CheckCircle2,
    Sparkles,
    Gift,
    Zap,
} from 'lucide-react';

// ── Challenge Definitions ──────────────────────────────────────
interface ChallengeDefinition {
    key: string;
    title: string;
    description: string;
    xpReward: number;
    icon: React.ReactNode;
    gradient: string;
    borderColor: string;
    checkFn: (childId: string, today: string) => Promise<boolean>;
}


const CHALLENGE_POOL: ChallengeDefinition[] = [
    {
        key: 'complete_lesson',
        title: 'Lesson Hero',
        description: 'Complete 1 lesson today',
        xpReward: 25,
        icon: <BookOpen className="h-6 w-6" />,
        gradient: 'from-blue-400 to-cyan-400',
        borderColor: 'border-blue-300',
        checkFn: async (childId, today) => {
            const { count } = await supabase
                .from('child_lesson_progress')
                .select('*', { count: 'exact', head: true })
                .eq('child_id', childId)
                .eq('is_completed', true)
                .gte('completed_at', `${today}T00:00:00`)
                .lt('completed_at', `${today}T23:59:59.999`);
            return (count ?? 0) >= 1;
        },
    },
    {
        key: 'complete_2_lessons',
        title: 'Double Learner',
        description: 'Complete 2 lessons today',
        xpReward: 50,
        icon: <Star className="h-6 w-6" />,
        gradient: 'from-amber-400 to-yellow-400',
        borderColor: 'border-amber-300',
        checkFn: async (childId, today) => {
            const { count } = await supabase
                .from('child_lesson_progress')
                .select('*', { count: 'exact', head: true })
                .eq('child_id', childId)
                .eq('is_completed', true)
                .gte('completed_at', `${today}T00:00:00`)
                .lt('completed_at', `${today}T23:59:59.999`);
            return (count ?? 0) >= 2;
        },
    },
    {
        key: 'make_transaction',
        title: 'Business Move',
        description: 'Record a company transaction',
        xpReward: 30,
        icon: <TrendingUp className="h-6 w-6" />,
        gradient: 'from-green-400 to-emerald-400',
        borderColor: 'border-green-300',
        checkFn: async (childId, today) => {
            // Get child's company first
            const { data: company } = await supabase
                .from('companies')
                .select('id')
                .eq('child_id', childId)
                .single();
            if (!company) return false;
            const { count } = await supabase
                .from('company_transactions')
                .select('*', { count: 'exact', head: true })
                .eq('company_id', company.id)
                .gte('created_at', `${today}T00:00:00`)
                .lt('created_at', `${today}T23:59:59.999`);
            return (count ?? 0) >= 1;
        },
    },
    {
        key: 'marketplace_list',
        title: 'Shop Owner',
        description: 'List a product on the marketplace',
        xpReward: 35,
        icon: <ShoppingBag className="h-6 w-6" />,
        gradient: 'from-purple-400 to-pink-400',
        borderColor: 'border-purple-300',
        checkFn: async (childId, today) => {
            const { count } = await supabase
                .from('marketplace_items')
                .select('*', { count: 'exact', head: true })
                .eq('seller_child_id', childId)
                .gte('created_at', `${today}T00:00:00`)
                .lt('created_at', `${today}T23:59:59.999`);
            return (count ?? 0) >= 1;
        },
    },
    {
        key: 'quiz_ace',
        title: 'Quiz Ace',
        description: 'Score 80%+ on a quiz',
        xpReward: 40,
        icon: <Zap className="h-6 w-6" />,
        gradient: 'from-orange-400 to-red-400',
        borderColor: 'border-orange-300',
        checkFn: async (childId, today) => {
            const { data } = await supabase
                .from('activities')
                .select('quiz_score')
                .eq('child_id', childId)
                .eq('activity_type', 'quiz_attempt')
                .gte('created_at', `${today}T00:00:00`)
                .lt('created_at', `${today}T23:59:59.999`);
            return (data ?? []).some((a) => (a.quiz_score ?? 0) >= 80);
        },
    },
    {
        key: 'streak_keeper',
        title: 'Streak Keeper',
        description: 'Keep your streak alive today! 🔥',
        xpReward: 20,
        icon: <Flame className="h-6 w-6" />,
        gradient: 'from-red-400 to-orange-400',
        borderColor: 'border-red-300',
        checkFn: async (childId, today) => {
            const { data } = await supabase
                .from('children')
                .select('last_activity_at')
                .eq('id', childId)
                .single();
            if (!data?.last_activity_at) return false;
            return data.last_activity_at.startsWith(today);
        },
    },
    {
        key: 'play_challenge_mode',
        title: 'Lightning Round',
        description: 'Play 1 Challenge Mode round today',
        xpReward: 40,
        icon: <Zap className="h-6 w-6" />,
        gradient: 'from-indigo-400 to-purple-400',
        borderColor: 'border-indigo-300',
        checkFn: async (childId, today) => {
          const { count } = await supabase
            .from('challenge_runs')
            .select('*', { count: 'exact', head: true })
            .eq('child_id', childId)
            .gte('created_at', `${today}T00:00:00`)
            .lt('created_at', `${today}T23:59:59.999`);
          return (count ?? 0) >= 1;
        },
      },
];

// ── Deterministic daily selection (3 challenges per day) ────
function getDailyChallenges(dateStr: string): ChallengeDefinition[] {
    // Use a simple hash of the date to pick 3 challenges deterministically
    let hash = 0;
    for (let i = 0; i < dateStr.length; i++) {
        hash = (hash << 5) - hash + dateStr.charCodeAt(i);
        hash |= 0;
    }
    const indices = new Set<number>();
    let seed = Math.abs(hash);
    while (indices.size < 3) {
        seed = (seed * 16807 + 7) % 2147483647;
        indices.add(seed % CHALLENGE_POOL.length);
    }
    return Array.from(indices).map((i) => CHALLENGE_POOL[i]);
}

function getToday(): string {
    return new Date().toISOString().split('T')[0];
}

// ── Component ──────────────────────────────────────────────────
interface DailyChallengesProps {
    childId: string;
}

interface ChallengeState {
    key: string;
    completed: boolean;
    claimed: boolean;
    checking: boolean;
}

export function DailyChallenges({ childId }: DailyChallengesProps) {
    const [challenges, setChallenges] = useState<ChallengeDefinition[]>([]);
    const [states, setStates] = useState<Map<string, ChallengeState>>(new Map());
    const [loading, setLoading] = useState(true);
    const [totalXpEarned, setTotalXpEarned] = useState(0);
    const [claimingKey, setClaimingKey] = useState<string | null>(null);
    const [celebrateKey, setCelebrateKey] = useState<string | null>(null);

    const today = getToday();
    const navigate = useNavigate();

    // ── Fetch daily challenges + check status ──
    const fetchChallenges = useCallback(async () => {
        const dailyChallenges = getDailyChallenges(today);
        setChallenges(dailyChallenges);

        // Check which ones are already claimed
        const { data: completions } = await supabase
            .from('daily_challenge_completions')
            .select('challenge_key, xp_awarded')
            .eq('child_id', childId)
            .eq('challenge_date', today);

        const claimedKeys = new Set((completions ?? []).map((c) => c.challenge_key));
        const earnedXp = (completions ?? []).reduce((sum, c) => sum + (c.xp_awarded ?? 0), 0);
        setTotalXpEarned(earnedXp);

        // Check completion for each challenge
        const newStates = new Map<string, ChallengeState>();
        for (const challenge of dailyChallenges) {
            const claimed = claimedKeys.has(challenge.key);
            let completed = claimed;

            if (!claimed) {
                try {
                    completed = await challenge.checkFn(childId, today);
                } catch {
                    completed = false;
                }
            }

            newStates.set(challenge.key, {
                key: challenge.key,
                completed,
                claimed,
                checking: false,
            });
        }

        setStates(newStates);
        setLoading(false);
    }, [childId, today]);

    useEffect(() => {
        fetchChallenges();
        // Refresh every 30 seconds to pick up newly completed challenges
        const interval = setInterval(fetchChallenges, 30000);
        return () => clearInterval(interval);
    }, [fetchChallenges]);

    // ── Claim reward ──
    const claimReward = async (challenge: ChallengeDefinition) => {
        const state = states.get(challenge.key);
        if (!state || !state.completed || state.claimed) return;

        setClaimingKey(challenge.key);
        try {
            // Insert completion record
            await supabase.from('daily_challenge_completions').insert({
                child_id: childId,
                challenge_key: challenge.key,
                challenge_date: today,
                xp_awarded: challenge.xpReward,
            });

            // Award XP to the child using RPC to bypass RLS
            const { error: rpcError } = await supabase.rpc('add_xp_to_child', {
                p_child_id: childId,
                p_xp_amount: challenge.xpReward
            });

            if (rpcError) {
                console.error("Failed to add XP to child", rpcError);
            }

            // Update UI state
            setStates((prev) => {
                const next = new Map(prev);
                next.set(challenge.key, { ...state, claimed: true });
                return next;
            });
            setTotalXpEarned((prev) => prev + challenge.xpReward);

            // Dispatch event to sync XP across dashboard
            window.dispatchEvent(new CustomEvent('child_xp_gained', {
                detail: { amount: challenge.xpReward }
            }));

            // Trigger celebration
            setCelebrateKey(challenge.key);
            setTimeout(() => setCelebrateKey(null), 2000);
        } catch (err) {
            console.error('Failed to claim challenge:', err);
        } finally {
            setClaimingKey(null);
        }
    };

    // Count progress
    const completedCount = Array.from(states.values()).filter(
        (s) => s.completed || s.claimed
    ).length;

    if (loading) {
        return (
            <div className="bg-white rounded-2xl shadow-lg p-6 border-4 border-indigo-200 animate-pulse">
                <div className="h-8 bg-gray-200 rounded w-48 mb-4" />
                <div className="space-y-3">
                    <div className="h-20 bg-gray-100 rounded-xl" />
                    <div className="h-20 bg-gray-100 rounded-xl" />
                    <div className="h-20 bg-gray-100 rounded-xl" />
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl shadow-lg p-6 border-4 border-indigo-200 relative overflow-hidden">
            {/* Sparkle background decoration */}
            <div className="absolute top-0 right-0 opacity-10 pointer-events-none">
                <Sparkles className="h-32 w-32 text-indigo-500" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between mb-5 relative z-10">
  <div className="flex items-center gap-3">
    <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg">
      <Target className="h-6 w-6 text-white" />
    </div>
    <div>
      <h2 className="text-2xl font-bold text-gray-900">Daily Quests</h2>
      <p className="text-sm text-gray-500">
        Complete quests to earn bonus XP!
      </p>
    </div>
  </div>

  <div className="flex flex-col items-end gap-2">
    <div className="text-right">
      <div className="text-xs text-gray-500 uppercase tracking-wider font-semibold">
        Progress
      </div>
      <div className="text-lg font-bold text-indigo-600">
        {completedCount}/{challenges.length}
      </div>
    </div>
    <button
      type="button"
      onClick={() => navigate('/child/challenge')}
      className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-sm hover:bg-indigo-600 transition-colors"
    >
      <Zap className="h-4 w-4" />
      Challenge
    </button>
  </div>
</div>

            {/* Progress bar */}
            <div className="w-full bg-gray-100 rounded-full h-3 mb-5 overflow-hidden">
                <div
                    className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full transition-all duration-700 ease-out"
                    style={{ width: `${(completedCount / challenges.length) * 100}%` }}
                />
            </div>

            {/* Challenge cards */}
            <div className="space-y-3 relative z-10">
                {challenges.map((challenge, idx) => {
                    const state = states.get(challenge.key);
                    const isCompleted = state?.completed || state?.claimed;
                    const isClaimed = state?.claimed;
                    const isClaiming = claimingKey === challenge.key;
                    const isCelebrating = celebrateKey === challenge.key;

                    return (
                        <div
                            key={challenge.key}
                            className={`relative rounded-xl border-2 transition-all duration-500 ${isClaimed
                                ? 'bg-gray-50 border-gray-200 opacity-75'
                                : isCompleted
                                    ? `bg-gradient-to-r ${challenge.gradient} bg-opacity-10 ${challenge.borderColor} shadow-md`
                                    : `bg-white ${challenge.borderColor} hover:shadow-md`
                                }`}
                            style={{
                                animationDelay: `${idx * 100}ms`,
                                animation: 'fadeInUp 0.5s ease-out both',
                            }}
                        >
                            {/* Celebration overlay */}
                            {isCelebrating && (
                                <div className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none z-20">
                                    <div className="absolute inset-0 bg-gradient-to-r from-yellow-200/60 to-amber-200/60 animate-pulse" />
                                    {[...Array(12)].map((_, i) => (
                                        <div
                                            key={i}
                                            className="absolute text-lg animate-bounce"
                                            style={{
                                                left: `${Math.random() * 90}%`,
                                                top: `${Math.random() * 80}%`,
                                                animationDelay: `${Math.random() * 0.5}s`,
                                                animationDuration: `${0.5 + Math.random() * 0.5}s`,
                                            }}
                                        >
                                            {['⭐', '✨', '🎉', '💎'][i % 4]}
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="flex items-center gap-4 p-4">
                                {/* Icon */}
                                <div
                                    className={`flex-shrink-0 p-3 rounded-xl transition-all duration-300 ${isClaimed
                                        ? 'bg-gray-200 text-gray-400'
                                        : isCompleted
                                            ? 'bg-white/80 text-gray-800 shadow-sm'
                                            : `bg-gradient-to-br ${challenge.gradient} text-white shadow-lg`
                                        }`}
                                >
                                    {isClaimed ? (
                                        <CheckCircle2 className="h-6 w-6 text-green-500" />
                                    ) : (
                                        challenge.icon
                                    )}
                                </div>

                                {/* Text */}
                                <div className="flex-1 min-w-0">
                                    <h3
                                        className={`font-bold text-sm ${isClaimed ? 'text-gray-400 line-through' : 'text-gray-900'
                                            }`}
                                    >
                                        {challenge.title}
                                    </h3>
                                    <p
                                        className={`text-xs ${isClaimed ? 'text-gray-400' : 'text-gray-600'
                                            }`}
                                    >
                                        {challenge.description}
                                    </p>
                                </div>

                                {/* XP reward / Claim button */}
                                <div className="flex-shrink-0">
                                    {isClaimed ? (
                                        <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-xs font-bold">
                                            <CheckCircle2 className="h-3.5 w-3.5" />
                                            +{challenge.xpReward} XP
                                        </span>
                                    ) : isCompleted ? (
                                        <button
                                            onClick={() => claimReward(challenge)}
                                            disabled={isClaiming}
                                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-amber-400 to-yellow-400 text-gray-900 rounded-lg text-xs font-bold hover:from-amber-500 hover:to-yellow-500 shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105 active:scale-95 disabled:opacity-50"
                                        >
                                            {isClaiming ? (
                                                <span className="animate-spin">⏳</span>
                                            ) : (
                                                <Gift className="h-4 w-4" />
                                            )}
                                            Claim +{challenge.xpReward} XP
                                        </button>
                                    ) : (
                                        <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-500 rounded-lg text-xs font-semibold">
                                            <Sparkles className="h-3.5 w-3.5" />
                                            +{challenge.xpReward} XP
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Total XP earned today */}
            {totalXpEarned > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-center gap-2">
                    <Sparkles className="h-4 w-4 text-amber-500" />
                    <span className="text-sm font-bold text-amber-600">
                        {totalXpEarned} bonus XP earned from quests today!
                    </span>
                    <Sparkles className="h-4 w-4 text-amber-500" />
                </div>
            )}

            {/* All complete celebration */}
            {completedCount === challenges.length && challenges.length > 0 && (
                <div className="mt-4 p-3 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl border border-amber-200 text-center">
                    <p className="text-sm font-bold text-amber-700">
                        🎉 All quests completed! You're a superstar! Come back tomorrow for new quests!
                    </p>
                </div>
            )}

            {/* CSS animation */}
            <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
        </div>
    );
}