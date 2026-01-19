import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AdminNavBar } from '@/components/navigation/AdminNavBar';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { Users, BookOpen, DollarSign, Activity, ToggleLeft, CreditCard, UserPlus, Loader2 } from 'lucide-react';
import { formatCurrencyWithSeparators, usdToRm } from '@/utils/currency';
import { LoadingAnimation } from '@/components/ui/LoadingAnimation';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';

interface DashboardStats {
  totalUsers: number;
  totalParents: number;
  totalChildren: number;
  totalModules: number;
  activeSubscriptions: number;
  totalRevenue: number;
  monthlyRevenue: number;
  trialingUsers: number;
  canceledSubscriptions: number;
}

function AdminDashboardContent() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { isEnabled, refetch } = useFeatureFlags();
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalParents: 0,
    totalChildren: 0,
    totalModules: 0,
    activeSubscriptions: 0,
    totalRevenue: 0,
    monthlyRevenue: 0,
    trialingUsers: 0,
    canceledSubscriptions: 0,
  });
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    async function fetchStats() {
      try {
        // Fetch all stats in parallel
        const [usersResult, parentsResult, childrenResult, modulesResult] = await Promise.all([
          supabase.from('users').select('id', { count: 'exact', head: true }),
          supabase.from('parents').select('id', { count: 'exact', head: true }),
          supabase.from('children').select('id', { count: 'exact', head: true }),
          supabase.from('modules').select('id', { count: 'exact', head: true }),
        ]);

        // Get subscription stats
        const { data: parents } = await supabase
          .from('parents')
          .select('subscription_status');

        const activeSubs = parents?.filter((p) => p.subscription_status === 'active').length || 0;
        const trialing = parents?.filter((p) => p.subscription_status === 'trialing').length || 0;
        const canceled = parents?.filter((p) => p.subscription_status === 'canceled').length || 0;

        // Calculate estimated revenue (this would come from Stripe in production)
        // For now, using placeholder calculations
        // Note: These are in USD from Stripe, but we display in RM
        const estimatedMonthlyRevenueUSD = activeSubs * 29.99; // Assuming $29.99/month average
        const estimatedTotalRevenueUSD = activeSubs * 29.99 * 12; // Annual estimate
        const estimatedMonthlyRevenue = usdToRm(estimatedMonthlyRevenueUSD);
        const estimatedTotalRevenue = usdToRm(estimatedTotalRevenueUSD);

        setStats({
          totalUsers: usersResult.count || 0,
          totalParents: parentsResult.count || 0,
          totalChildren: childrenResult.count || 0,
          totalModules: modulesResult.count || 0,
          activeSubscriptions: activeSubs,
          totalRevenue: estimatedTotalRevenue,
          monthlyRevenue: estimatedMonthlyRevenue,
          trialingUsers: trialing,
          canceledSubscriptions: canceled,
        });
      } catch (error) {
        console.error('Failed to fetch admin stats:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  const toggleStripeRegistration = async () => {
    setToggling(true);
    try {
      // First, get the current flag
      const { data: flags } = await supabase
        .from('feature_flags')
        .select('id, enabled')
        .eq('name', 'stripe_registration')
        .single();

      if (flags) {
        // Toggle the flag
        const { error } = await supabase
          .from('feature_flags')
          .update({ enabled: !flags.enabled })
          .eq('id', flags.id);

        if (error) throw error;
        await refetch();
      } else {
        // Create the flag if it doesn't exist
        const { error } = await supabase
          .from('feature_flags')
          .insert({
            name: 'stripe_registration',
            description: 'Require Stripe payment during signup',
            enabled: true
          });

        if (error) throw error;
        await refetch();
      }
    } catch (error) {
      console.error('Failed to toggle Stripe registration:', error);
      alert('Failed to toggle registration mode. Please try again.');
    } finally {
      setToggling(false);
    }
  };

  const stripeRegistrationEnabled = isEnabled('stripe_registration');

  if (loading) {
    return <LoadingAnimation message="Loading..." variant="fullscreen" />;
  }

  const statCards = [
    {
      title: 'Total Users',
      value: stats.totalUsers,
      icon: Users,
      color: 'bg-blue-500',
      textColor: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Parents',
      value: stats.totalParents,
      icon: Users,
      color: 'bg-green-500',
      textColor: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Children',
      value: stats.totalChildren,
      icon: Users,
      color: 'bg-purple-500',
      textColor: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Modules',
      value: stats.totalModules,
      icon: BookOpen,
      color: 'bg-orange-500',
      textColor: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
    {
      title: 'Active Subscriptions',
      value: stats.activeSubscriptions,
      icon: Activity,
      color: 'bg-yellow-500',
      textColor: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavBar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Admin Dashboard
          </h1>
          <p className="text-gray-600">Welcome back, {user?.user_metadata?.full_name || 'Admin'}</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {statCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={index}
                className={`${stat.bgColor} rounded-xl shadow-lg p-6 border-2 border-transparent hover:border-gray-300 transition-all`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
                    <p className={`text-3xl font-bold ${stat.textColor}`}>{stat.value}</p>
                  </div>
                  <div className={`${stat.color} p-3 rounded-lg`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Registration Settings */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Registration Settings</h2>
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-4">
              {stripeRegistrationEnabled ? (
                <CreditCard className="h-8 w-8 text-blue-600" />
              ) : (
                <UserPlus className="h-8 w-8 text-green-600" />
              )}
              <div>
                <p className="font-semibold text-gray-900">
                  {stripeRegistrationEnabled ? 'Stripe Registration' : 'Normal Registration'}
                </p>
                <p className="text-sm text-gray-600">
                  {stripeRegistrationEnabled
                    ? 'Users must complete payment during signup'
                    : 'Users can sign up without payment'}
                </p>
              </div>
            </div>
            <button
              onClick={toggleStripeRegistration}
              disabled={toggling}
              className={`relative inline-flex h-12 w-24 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${stripeRegistrationEnabled
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 focus:ring-blue-500'
                : 'bg-gray-300 focus:ring-gray-400'
                } ${toggling ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <span
                className={`inline-block h-10 w-10 transform rounded-full bg-white shadow-lg transition-transform ${stripeRegistrationEnabled ? 'translate-x-12' : 'translate-x-1'
                  }`}
              />
              {toggling && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="h-5 w-5 animate-spin text-white" />
                </div>
              )}
            </button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <button
                onClick={() => navigate('/admin/users')}
                className="w-full text-left px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium text-gray-700"
              >
                Manage Users
              </button>
              <button
                onClick={() => navigate('/admin/content')}
                className="w-full text-left px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium text-gray-700"
              >
                Manage Content
              </button>
              <button
                onClick={() => navigate('/admin/analytics')}
                className="w-full text-left px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium text-gray-700"
              >
                View Analytics
              </button>
              <button
                onClick={() => navigate('/admin/features')}
                className="w-full text-left px-4 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white rounded-lg transition-all font-medium flex items-center space-x-2 shadow-md hover:shadow-lg"
              >
                <ToggleLeft className="h-4 w-4" />
                <span>Manage Feature Flags</span>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Activity</h2>
            <div className="space-y-3">
              <div className="text-sm text-gray-600">
                <p className="font-medium">No recent activity</p>
                <p className="text-xs text-gray-500 mt-1">Activity will appear here</p>
              </div>
            </div>
          </div>
        </div>

        {/* System Status */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 mb-4">System Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-3">
              <div className="h-3 w-3 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-700">Database: Online</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="h-3 w-3 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-700">API: Operational</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="h-3 w-3 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-700">Payments: Active</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  return (
    <ProtectedRoute requireRole="admin">
      <AdminDashboardContent />
    </ProtectedRoute>
  );
}

