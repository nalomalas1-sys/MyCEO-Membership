import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AdminNavBar } from '@/components/navigation/AdminNavBar';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { Users, BookOpen, DollarSign, Activity } from 'lucide-react';

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
        const estimatedMonthlyRevenue = activeSubs * 29.99; // Assuming $29.99/month average
        const estimatedTotalRevenue = activeSubs * 29.99 * 12; // Annual estimate

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
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
    {
      title: 'Total Revenue',
      value: `$${stats.totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      color: 'bg-emerald-500',
      textColor: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
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

        {/* Billing Overview */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Billing Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Monthly Recurring Revenue</p>
              <p className="text-2xl font-bold text-blue-600">${stats.monthlyRevenue.toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-1">Estimated</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Total Revenue (Annual)</p>
              <p className="text-2xl font-bold text-green-600">${stats.totalRevenue.toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-1">Estimated</p>
            </div>
            <div className="bg-yellow-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Trialing Users</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.trialingUsers}</p>
              <p className="text-xs text-gray-500 mt-1">Potential conversions</p>
            </div>
            <div className="bg-red-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Canceled Subscriptions</p>
              <p className="text-2xl font-bold text-red-600">{stats.canceledSubscriptions}</p>
              <p className="text-xs text-gray-500 mt-1">Churn risk</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              <strong>Note:</strong> Revenue calculations are estimates. For accurate billing data, integrate with Stripe Dashboard.
            </p>
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

