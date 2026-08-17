import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { BookOpen, CheckCircle2, Trophy, Zap, Clock } from 'lucide-react';

interface FeedItem {
    id: string;
    childName: string;
    activityType: string;
    xpEarned: number;
    moduleTitle?: string;
    lessonTitle?: string;
    quizScore?: number | null;
    createdAt: string;
    isCurrentChild: boolean;
}

interface ActivityFeedProps {
    childId: string;
}

export function ActivityFeed({ childId }: ActivityFeedProps) {
    const [items, setItems] = useState<FeedItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchFeed() {
            try {
                // 1. Fetch recent activities (all children)
                const { data: activities, error } = await supabase
                    .from('activities')
                    .select('id, child_id, activity_type, module_id, lesson_id, quiz_score, xp_earned, created_at')
                    .order('created_at', { ascending: false })
                    .limit(15);

                if (error || !activities) throw error;

                // 2. Get unique child IDs and fetch names
                const childIds = [...new Set(activities.map(a => a.child_id))];
                const { data: children } = await supabase
                    .from('children')
                    .select('id, name')
                    .in('id', childIds);

                const childMap = new Map(children?.map(c => [c.id, c.name]) || []);

                // 3. Get module/lesson titles
                const moduleIds = [...new Set(activities.map(a => a.module_id).filter(Boolean))];
                const lessonIds = [...new Set(activities.map(a => a.lesson_id).filter(Boolean))];

                const [modulesRes, lessonsRes] = await Promise.all([
                    moduleIds.length > 0
                        ? supabase.from('modules').select('id, title').in('id', moduleIds)
                        : Promise.resolve({ data: [] }),
                    lessonIds.length > 0
                        ? supabase.from('lessons').select('id, title').in('id', lessonIds)
                        : Promise.resolve({ data: [] }),
                ]);

                const moduleMap = new Map(modulesRes.data?.map(m => [m.id, m.title]) || []);
                const lessonMap = new Map(lessonsRes.data?.map(l => [l.id, l.title]) || []);

                // 4. Build feed items
                const feedItems: FeedItem[] = activities.map(a => ({
                    id: a.id,
                    childName: childMap.get(a.child_id) || 'Someone',
                    activityType: a.activity_type,
                    xpEarned: a.xp_earned || 0,
                    moduleTitle: a.module_id ? moduleMap.get(a.module_id) : undefined,
                    lessonTitle: a.lesson_id ? lessonMap.get(a.lesson_id) : undefined,
                    quizScore: a.quiz_score,
                    createdAt: a.created_at,
                    isCurrentChild: a.child_id === childId,
                }));

                setItems(feedItems);
            } catch (err) {
                console.error('Failed to load activity feed:', err);
            } finally {
                setLoading(false);
            }
        }

        fetchFeed();

          // Subscribe to new activities in real-time
    const channel = supabase
    .channel('activity-feed')
    .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'activities' },
        async (payload) => {
            const a = payload.new;
            // Fetch child name
            const { data: child } = await supabase
                .from('children')
                .select('name')
                .eq('id', a.child_id)
                .single();
            // Fetch module/lesson titles if needed
            let moduleTitle: string | undefined;
            let lessonTitle: string | undefined;
            if (a.module_id) {
                const { data } = await supabase
                    .from('modules').select('title').eq('id', a.module_id).single();
                moduleTitle = data?.title;
            }
            if (a.lesson_id) {
                const { data } = await supabase
                    .from('lessons').select('title').eq('id', a.lesson_id).single();
                lessonTitle = data?.title;
            }
            const newItem: FeedItem = {
                id: a.id,
                childName: child?.name || 'Someone',
                activityType: a.activity_type,
                xpEarned: a.xp_earned || 0,
                moduleTitle,
                lessonTitle,
                quizScore: a.quiz_score,
                createdAt: a.created_at,
                isCurrentChild: a.child_id === childId,
            };
            // Prepend new item and keep max 15
            setItems((prev) => [newItem, ...prev].slice(0, 15));
        }
    )
    .subscribe();
// Cleanup: unsubscribe when component unmounts
return () => {
    supabase.removeChannel(channel);
};
    }, [childId]);

    // --- Helper functions ---

    function getIcon(type: string) {
        switch (type) {
            case 'lesson_complete': return <CheckCircle2 className="h-5 w-5 text-green-500" />;
            case 'module_complete': return <Trophy className="h-5 w-5 text-yellow-500" />;
            case 'module_start': return <BookOpen className="h-5 w-5 text-blue-500" />;
            case 'quiz_attempt': return <CheckCircle2 className="h-5 w-5 text-purple-500" />;
            case 'challenge_mode': return <Zap className="h-5 w-5 text-orange-500" />;
            default: return <Clock className="h-5 w-5 text-gray-400" />;
        }
    }

    function getText(item: FeedItem) {
        const name = item.isCurrentChild ? 'You' : item.childName;
        switch (item.activityType) {
            case 'lesson_complete':
                return <><strong>{name}</strong> completed <strong>{item.lessonTitle || 'a lesson'}</strong></>;
            case 'module_complete':
                return <><strong>{name}</strong> finished <strong>{item.moduleTitle || 'a module'}</strong></>;
            case 'module_start':
                return <><strong>{name}</strong> started <strong>{item.moduleTitle || 'a module'}</strong></>;
            case 'quiz_attempt':
                return <><strong>{name}</strong> scored {item.quizScore ?? 0}% on a quiz</>;
            case 'challenge_mode':
                return <><strong>{name}</strong> completed a Challenge Mode round</>;
            default:
                return <><strong>{name}</strong> did something awesome</>;
        }
    }

    function timeAgo(dateStr: string) {
        const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
        if (diff < 60) return 'Just now';
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
        if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
        return new Date(dateStr).toLocaleDateString();
    }

    // --- Render ---

    if (loading) {
        return (
            <div className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">What's Happening</h3>
                <div className="animate-pulse space-y-3">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-12 bg-gray-100 rounded-lg" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                📢 What's Happening
            </h3>
            {items.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-4">No activity yet!</p>
            ) : (
                <div className="space-y-3 max-h-80 overflow-y-auto">
                    {items.map(item => (
                        <div
                            key={item.id}
                            className={`flex items-start gap-3 p-3 rounded-xl transition-colors ${
                                item.isCurrentChild ? 'bg-blue-50 border border-blue-100' : 'bg-gray-50'
                            }`}
                        >
                            <div className="mt-0.5">{getIcon(item.activityType)}</div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm text-gray-900">{getText(item)}</p>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-xs text-gray-500">{timeAgo(item.createdAt)}</span>
                                    {item.xpEarned > 0 && (
                                        <span className="text-xs font-semibold text-green-600">+{item.xpEarned} XP</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}