import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Clock, BookOpen, CheckCircle2, Trophy } from 'lucide-react';

interface Activity {
  id: string;
  child_id: string;
  activity_type: 'module_start' | 'lesson_complete' | 'quiz_attempt' | 'module_complete';
  module_id: string | null;
  lesson_id: string | null;
  quiz_score: number | null;
  xp_earned: number;
  metadata: any;
  created_at: string;
  child_name?: string;
  module_title?: string;
  lesson_title?: string;
}

interface RecentActivityFeedProps {
  parentId: string;
  limit?: number;
}

export function RecentActivityFeed({ parentId, limit = 10 }: RecentActivityFeedProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchActivities() {
      try {
        // Get all children for this parent (excluding soft-deleted)
        const { data: children, error: childrenError } = await supabase
          .from('children')
          .select('id, name')
          .eq('parent_id', parentId)
          .is('deleted_at', null);

        if (childrenError) throw childrenError;
        if (!children || children.length === 0) {
          setActivities([]);
          setLoading(false);
          return;
        }

        const childIds = children.map((c) => c.id);
        const childMap = new Map(children.map((c) => [c.id, c.name]));

        // Fetch recent activities
        const { data: activitiesData, error: activitiesError } = await supabase
          .from('activities')
          .select('*')
          .in('child_id', childIds)
          .order('created_at', { ascending: false })
          .limit(limit);

        if (activitiesError) throw activitiesError;

        // Fetch module and lesson titles
        const moduleIds = [...new Set(activitiesData?.map((a) => a.module_id).filter(Boolean) || [])];
        const lessonIds = [...new Set(activitiesData?.map((a) => a.lesson_id).filter(Boolean) || [])];

        const [modulesData, lessonsData] = await Promise.all([
          moduleIds.length > 0
            ? supabase
                .from('modules')
                .select('id, title')
                .in('id', moduleIds)
            : Promise.resolve({ data: [], error: null }),
          lessonIds.length > 0
            ? supabase
                .from('lessons')
                .select('id, title')
                .in('id', lessonIds)
            : Promise.resolve({ data: [], error: null }),
        ]);

        const moduleMap = new Map(modulesData.data?.map((m) => [m.id, m.title]) || []);
        const lessonMap = new Map(lessonsData.data?.map((l) => [l.id, l.title]) || []);

        // Enrich activities with names and titles
        const enrichedActivities = (activitiesData || []).map((activity) => ({
          ...activity,
          child_name: childMap.get(activity.child_id),
          module_title: activity.module_id ? moduleMap.get(activity.module_id) : undefined,
          lesson_title: activity.lesson_id ? lessonMap.get(activity.lesson_id) : undefined,
        }));

        setActivities(enrichedActivities);
      } catch (err: any) {
        console.error('Error fetching activities:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchActivities();
  }, [parentId, limit]);

  const getActivityIcon = (type: Activity['activity_type']) => {
    switch (type) {
      case 'module_start':
        return <BookOpen className="h-5 w-5 text-blue-500" />;
      case 'lesson_complete':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'module_complete':
        return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 'quiz_attempt':
        return <CheckCircle2 className="h-5 w-5 text-purple-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getActivityText = (activity: Activity) => {
    const childName = activity.child_name || 'Child';
    switch (activity.activity_type) {
      case 'module_start':
        return (
          <span>
            <strong>{childName}</strong> started{' '}
            <strong>{activity.module_title || 'a module'}</strong>
          </span>
        );
      case 'lesson_complete':
        return (
          <span>
            <strong>{childName}</strong> completed{' '}
            <strong>{activity.lesson_title || 'a lesson'}</strong>
            {activity.quiz_score !== null && (
              <span className="text-primary-600"> (Quiz: {activity.quiz_score}%)</span>
            )}
          </span>
        );
      case 'module_complete':
        return (
          <span>
            <strong>{childName}</strong> completed{' '}
            <strong>{activity.module_title || 'a module'}</strong>
            {activity.xp_earned > 0 && (
              <span className="text-primary-600"> (+{activity.xp_earned} XP)</span>
            )}
          </span>
        );
      case 'quiz_attempt':
        return (
          <span>
            <strong>{childName}</strong> attempted a quiz
            {activity.quiz_score !== null && (
              <span className="text-primary-600"> ({activity.quiz_score}%)</span>
            )}
          </span>
        );
      default:
        return <span>{childName} completed an activity</span>;
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
        <div className="text-center py-8 text-gray-500">Loading...</div>
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
        <div className="text-center py-8 text-gray-500">
          No recent activity. Activities will appear here as your children learn!
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
      <div className="space-y-4">
        {activities.map((activity) => (
          <div
            key={activity.id}
            className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="flex-shrink-0 mt-0.5">{getActivityIcon(activity.activity_type)}</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-900">{getActivityText(activity)}</p>
              <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatTimeAgo(activity.created_at)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


