import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { ParentNavBar } from '@/components/navigation/ParentNavBar';
import { supabase } from '@/lib/supabase';
import { Child } from '@/types/child';
import { ArrowLeft, Edit, Trophy, TrendingUp, BookOpen, Clock, Award } from 'lucide-react';
import { EditChildModal } from '@/components/parent/EditChildModal';
import { ChildCodeDisplay } from '@/components/parent/ChildCodeDisplay';

interface ChildProgress {
  total_modules: number;
  completed_modules: number;
  total_lessons: number;
  completed_lessons: number;
  total_activities: number;
  recent_activities: any[];
}

interface ChildCompany {
  id: string;
  company_name: string;
  product_name: string | null;
  logo_url: string | null;
  initial_capital: number;
  current_balance: number;
  total_revenue: number;
  total_expenses: number;
}

interface ChildAchievement {
  id: string;
  achievement_id: string;
  earned_at: string;
  achievement: {
    name: string;
    description: string;
    icon_url: string | null;
    rarity: string;
  };
}

function ChildDetailContent() {
  const { childId } = useParams<{ childId: string }>();
  const navigate = useNavigate();
  const [child, setChild] = useState<Child | null>(null);
  const [progress, setProgress] = useState<ChildProgress | null>(null);
  const [company, setCompany] = useState<ChildCompany | null>(null);
  const [achievements, setAchievements] = useState<ChildAchievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [showCode, setShowCode] = useState(false);

  useEffect(() => {
    if (!childId) {
      navigate('/dashboard');
      return;
    }

    async function fetchChildDetails() {
      try {
        // Fetch child
        const { data: childData, error: childError } = await supabase
          .from('children')
          .select('*')
          .eq('id', childId)
          .is('deleted_at', null)
          .single();

        if (childError || !childData) {
          navigate('/dashboard');
          return;
        }

        setChild(childData as Child);

        // Fetch progress
        const [modulesProgress, lessonsProgress, activitiesData, companyData, achievementsData] = await Promise.all([
          // Module progress
          supabase
            .from('child_module_progress')
            .select('module_id, status')
            .eq('child_id', childId),
          // Lesson progress
          supabase
            .from('child_lesson_progress')
            .select('lesson_id, is_completed')
            .eq('child_id', childId),
          // Activities
          supabase
            .from('activities')
            .select('*')
            .eq('child_id', childId)
            .order('created_at', { ascending: false })
            .limit(10),
          // Company
          supabase
            .from('companies')
            .select('*')
            .eq('child_id', childId)
            .single(),
          // Achievements
          supabase
            .from('child_achievements')
            .select(`
              id,
              earned_at,
              achievements!inner (
                id,
                name,
                description,
                icon_url,
                rarity
              )
            `)
            .eq('child_id', childId)
            .order('earned_at', { ascending: false }),
        ]);

        const totalModules = modulesProgress.data?.length || 0;
        const completedModules = modulesProgress.data?.filter((m) => m.status === 'completed').length || 0;
        const totalLessons = lessonsProgress.data?.length || 0;
        const completedLessons = lessonsProgress.data?.filter((l) => l.is_completed).length || 0;

        setProgress({
          total_modules: totalModules,
          completed_modules: completedModules,
          total_lessons: totalLessons,
          completed_lessons: completedLessons,
          total_activities: activitiesData.data?.length || 0,
          recent_activities: activitiesData.data || [],
        });

        if (companyData.data) {
          setCompany(companyData.data as ChildCompany);
        }

        if (achievementsData.data) {
          setAchievements(
            achievementsData.data.map((a: any) => ({
              id: a.id,
              achievement_id: a.achievements.id,
              earned_at: a.earned_at,
              achievement: a.achievements,
            }))
          );
        }
      } catch (err) {
        console.error('Error fetching child details:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchChildDetails();
  }, [childId, navigate]);

  const handleEditSuccess = async () => {
    // Refetch child data
    if (!childId) return;
    const { data: childData } = await supabase
      .from('children')
      .select('*')
      .eq('id', childId)
      .single();
    if (childData) {
      setChild(childData as Child);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (!child) {
    return (
      <div className="min-h-screen bg-gray-50">
        <ParentNavBar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="card text-center py-12">
            <p className="text-gray-600">Child not found</p>
            <button onClick={() => navigate('/dashboard')} className="btn btn-primary mt-4">
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ParentNavBar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="h-5 w-5" />
          Back to Dashboard
        </button>

        {/* Header */}
        <div className="card mb-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {child.profile_picture_url ? (
                <img
                  src={child.profile_picture_url}
                  alt={child.name}
                  className="w-20 h-20 rounded-full object-cover"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-primary-100 flex items-center justify-center">
                  <span className="text-3xl">{child.name.charAt(0).toUpperCase()}</span>
                </div>
              )}
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{child.name}</h1>
                <p className="text-gray-600">
                  Level {child.current_level} • {child.total_xp} XP • {child.current_streak} day streak
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowCode(!showCode)} className="btn btn-secondary">
                {showCode ? 'Hide' : 'Show'} Access Code
              </button>
              <button onClick={() => setIsEditModalOpen(true)} className="btn btn-primary">
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </button>
            </div>
          </div>
        </div>

        {/* Access Code Display */}
        {showCode && (
          <div className="mb-6">
            <ChildCodeDisplay code={child.access_code} childName={child.name} />
          </div>
        )}

        {/* Progress Overview */}
        {progress && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <div className="card">
              <div className="flex items-center gap-3 mb-2">
                <BookOpen className="h-5 w-5 text-blue-500" />
                <h3 className="text-sm font-medium text-gray-600">Modules</h3>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {progress.completed_modules} / {progress.total_modules}
              </p>
              {progress.total_modules > 0 && (
                <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full"
                    style={{
                      width: `${(progress.completed_modules / progress.total_modules) * 100}%`,
                    }}
                  />
                </div>
              )}
            </div>

            <div className="card">
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp className="h-5 w-5 text-green-500" />
                <h3 className="text-sm font-medium text-gray-600">Lessons</h3>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {progress.completed_lessons} / {progress.total_lessons}
              </p>
              {progress.total_lessons > 0 && (
                <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full"
                    style={{
                      width: `${(progress.completed_lessons / progress.total_lessons) * 100}%`,
                    }}
                  />
                </div>
              )}
            </div>

            <div className="card">
              <div className="flex items-center gap-3 mb-2">
                <Clock className="h-5 w-5 text-purple-500" />
                <h3 className="text-sm font-medium text-gray-600">Activities</h3>
              </div>
              <p className="text-2xl font-bold text-gray-900">{progress.total_activities}</p>
              <p className="text-xs text-gray-500 mt-1">Total completed</p>
            </div>

            <div className="card">
              <div className="flex items-center gap-3 mb-2">
                <Award className="h-5 w-5 text-yellow-500" />
                <h3 className="text-sm font-medium text-gray-600">Achievements</h3>
              </div>
              <p className="text-2xl font-bold text-gray-900">{achievements.length}</p>
              <p className="text-xs text-gray-500 mt-1">Earned badges</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Company Info */}
          {company && (
            <div className="card">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-500" />
                Company
              </h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Company Name</p>
                  <p className="text-lg font-semibold">{company.company_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Current Balance</p>
                  <p className="text-2xl font-bold text-green-600">
                    ${company.current_balance.toFixed(2)}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-3 border-t">
                  <div>
                    <p className="text-sm text-gray-600">Total Revenue</p>
                    <p className="text-lg font-semibold text-green-600">
                      ${company.total_revenue.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Expenses</p>
                    <p className="text-lg font-semibold text-red-600">
                      ${company.total_expenses.toFixed(2)}
                    </p>
                  </div>
                </div>
                {company.product_name && (
                  <p className="text-sm text-gray-500 mt-2">
                    Product: {company.product_name}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Recent Achievements */}
          {achievements.length > 0 && (
            <div className="card">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Award className="h-5 w-5 text-yellow-500" />
                Recent Achievements
              </h2>
              <div className="space-y-3">
                {achievements.slice(0, 5).map((achievement) => (
                  <div
                    key={achievement.id}
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                  >
                    {achievement.achievement.icon_url ? (
                      <img
                        src={achievement.achievement.icon_url}
                        alt={achievement.achievement.name}
                        className="w-10 h-10"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
                        <Award className="h-5 w-5 text-yellow-600" />
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{achievement.achievement.name}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(achievement.earned_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Recent Activity */}
        {progress && progress.recent_activities.length > 0 && (
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
            <div className="space-y-3">
              {progress.recent_activities.map((activity: any) => (
                <div key={activity.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm">
                    <p className="font-medium">
                      {activity.activity_type.replace(/_/g, ' ').replace(/\b\w/g, (l: string) =>
                        l.toUpperCase()
                      )}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(activity.created_at).toLocaleString()}
                    </p>
                  </div>
                  {activity.xp_earned > 0 && (
                    <div className="ml-auto text-sm font-semibold text-primary-600">
                      +{activity.xp_earned} XP
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Edit Modal */}
        <EditChildModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSuccess={handleEditSuccess}
          child={child}
        />
      </div>
    </div>
  );
}

export default function ChildDetailPage() {
  return (
    <ProtectedRoute>
      <ChildDetailContent />
    </ProtectedRoute>
  );
}

