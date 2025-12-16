import { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AdminNavBar } from '@/components/navigation/AdminNavBar';
import { supabase } from '@/lib/supabase';
import { TrendingUp, Users, BookOpen, Award, Activity, BarChart3, Download } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { LoadingAnimation } from '@/components/ui/LoadingAnimation';

interface AnalyticsData {
  totalUsers: number;
  totalParents: number;
  totalChildren: number;
  activeSubscriptions: number;
  totalModules: number;
  publishedModules: number;
  totalLessons: number;
  moduleCompletions: number;
  averageProgress: number;
  totalXP: number;
  totalAchievements: number;
}

function AdminAnalyticsContent() {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalUsers: 0,
    totalParents: 0,
    totalChildren: 0,
    activeSubscriptions: 0,
    totalModules: 0,
    publishedModules: 0,
    totalLessons: 0,
    moduleCompletions: 0,
    averageProgress: 0,
    totalXP: 0,
    totalAchievements: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const exportToCSV = () => {
    const csvRows = [
      ['Metric', 'Value'],
      ['Total Users', analytics.totalUsers.toString()],
      ['Total Parents', analytics.totalParents.toString()],
      ['Total Children', analytics.totalChildren.toString()],
      ['Active Subscriptions', analytics.activeSubscriptions.toString()],
      ['Total Modules', analytics.totalModules.toString()],
      ['Published Modules', analytics.publishedModules.toString()],
      ['Total Lessons', analytics.totalLessons.toString()],
      ['Module Completions', analytics.moduleCompletions.toString()],
      ['Average Progress', `${analytics.averageProgress}%`],
      ['Total XP Earned', analytics.totalXP.toLocaleString()],
      ['Achievements Unlocked', analytics.totalAchievements.toString()],
    ];

    const csvContent = csvRows.map((row) => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const exportToPDF = () => {
    // For PDF export, we'll create a simple HTML report and use browser print
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Analytics Report</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #333; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
          </style>
        </head>
        <body>
          <h1>Analytics Report</h1>
          <p>Generated: ${new Date().toLocaleString()}</p>
          <table>
            <tr><th>Metric</th><th>Value</th></tr>
            <tr><td>Total Users</td><td>${analytics.totalUsers}</td></tr>
            <tr><td>Total Parents</td><td>${analytics.totalParents}</td></tr>
            <tr><td>Total Children</td><td>${analytics.totalChildren}</td></tr>
            <tr><td>Active Subscriptions</td><td>${analytics.activeSubscriptions}</td></tr>
            <tr><td>Total Modules</td><td>${analytics.totalModules}</td></tr>
            <tr><td>Published Modules</td><td>${analytics.publishedModules}</td></tr>
            <tr><td>Total Lessons</td><td>${analytics.totalLessons}</td></tr>
            <tr><td>Module Completions</td><td>${analytics.moduleCompletions}</td></tr>
            <tr><td>Average Progress</td><td>${analytics.averageProgress}%</td></tr>
            <tr><td>Total XP Earned</td><td>${analytics.totalXP.toLocaleString()}</td></tr>
            <tr><td>Achievements Unlocked</td><td>${analytics.totalAchievements}</td></tr>
          </table>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.print();
  };

  async function fetchAnalytics() {
    try {
      setLoading(true);

      // Fetch all stats in parallel
      const [
        usersResult,
        parentsResult,
        childrenResult,
        modulesResult,
        lessonsResult,
        progressResult,
        achievementsResult,
      ] = await Promise.all([
        supabase.from('users').select('id', { count: 'exact', head: true }),
        supabase.from('parents').select('id', { count: 'exact', head: true }),
        supabase.from('children').select('id', { count: 'exact', head: true }),
        supabase.from('modules').select('id, is_published', { count: 'exact' }),
        supabase.from('lessons').select('id', { count: 'exact', head: true }),
        supabase
          .from('child_module_progress')
          .select('progress_percentage, status')
          .eq('status', 'completed'),
        supabase.from('child_achievements').select('id', { count: 'exact', head: true }),
      ]);

      // Get active subscriptions
      const { data: activeParents } = await supabase
        .from('parents')
        .select('id')
        .in('subscription_status', ['active', 'trialing']);

      // Get total XP
      const { data: children } = await supabase.from('children').select('total_xp');

      const totalXP = children?.reduce((sum, child) => sum + (child.total_xp || 0), 0) || 0;

      // Calculate average progress
      const { data: allProgress } = await supabase
        .from('child_module_progress')
        .select('progress_percentage');

      const averageProgress =
        allProgress && allProgress.length > 0
          ? Math.round(
              allProgress.reduce((sum, p) => sum + (p.progress_percentage || 0), 0) /
                allProgress.length
            )
          : 0;

      const publishedModules = modulesResult.data?.filter((m) => m.is_published).length || 0;

      setAnalytics({
        totalUsers: usersResult.count || 0,
        totalParents: parentsResult.count || 0,
        totalChildren: childrenResult.count || 0,
        activeSubscriptions: activeParents?.length || 0,
        totalModules: modulesResult.count || 0,
        publishedModules,
        totalLessons: lessonsResult.count || 0,
        moduleCompletions: progressResult.data?.length || 0,
        averageProgress,
        totalXP,
        totalAchievements: achievementsResult.count || 0,
      });
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <LoadingAnimation message="Loading..." variant="fullscreen" />;
  }

  const statCards = [
    {
      title: 'Total Users',
      value: analytics.totalUsers,
      icon: Users,
      color: 'bg-blue-500',
      textColor: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Parents',
      value: analytics.totalParents,
      icon: Users,
      color: 'bg-green-500',
      textColor: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Children',
      value: analytics.totalChildren,
      icon: Users,
      color: 'bg-purple-500',
      textColor: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Active Subscriptions',
      value: analytics.activeSubscriptions,
      icon: Activity,
      color: 'bg-yellow-500',
      textColor: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
    },
    {
      title: 'Published Modules',
      value: `${analytics.publishedModules} / ${analytics.totalModules}`,
      icon: BookOpen,
      color: 'bg-orange-500',
      textColor: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
    {
      title: 'Total Lessons',
      value: analytics.totalLessons,
      icon: BookOpen,
      color: 'bg-indigo-500',
      textColor: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
    },
    {
      title: 'Module Completions',
      value: analytics.moduleCompletions,
      icon: Award,
      color: 'bg-pink-500',
      textColor: 'text-pink-600',
      bgColor: 'bg-pink-50',
    },
    {
      title: 'Average Progress',
      value: `${analytics.averageProgress}%`,
      icon: TrendingUp,
      color: 'bg-teal-500',
      textColor: 'text-teal-600',
      bgColor: 'bg-teal-50',
    },
    {
      title: 'Total XP Earned',
      value: analytics.totalXP.toLocaleString(),
      icon: Award,
      color: 'bg-cyan-500',
      textColor: 'text-cyan-600',
      bgColor: 'bg-cyan-50',
    },
    {
      title: 'Achievements Unlocked',
      value: analytics.totalAchievements,
      icon: Award,
      color: 'bg-rose-500',
      textColor: 'text-rose-600',
      bgColor: 'bg-rose-50',
    },
  ];

  const engagementChartData = [
    { name: 'Completions', value: analytics.moduleCompletions },
    { name: 'Avg Progress', value: analytics.averageProgress },
    { name: 'XP (k)', value: Math.round(analytics.totalXP / 1000) },
    { name: 'Achievements', value: analytics.totalAchievements },
  ];

  const contentChartData = [
    { name: 'Published', value: analytics.publishedModules },
    { name: 'Draft', value: Math.max(analytics.totalModules - analytics.publishedModules, 0) },
    { name: 'Lessons', value: analytics.totalLessons },
  ];

  const pieColors = ['#0ea5e9', '#22c55e', '#a855f7'];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 transition-colors">
      <AdminNavBar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics & Reports</h1>
            <p className="text-gray-600">Platform metrics and performance insights</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={exportToCSV}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </button>
            <button
              onClick={exportToPDF}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export PDF
            </button>
          </div>
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

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="h-5 w-5 text-gray-600" />
              <h2 className="text-xl font-bold text-gray-900">Engagement Overview</h2>
            </div>
            <div className="h-72 min-h-[288px] w-full">
              <ResponsiveContainer width="100%" height="100%" minHeight={288}>
                <BarChart data={engagementChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="h-5 w-5 text-gray-600" />
              <h2 className="text-xl font-bold text-gray-900">Content Mix</h2>
            </div>
            <div className="h-72 min-h-[288px] w-full">
              <ResponsiveContainer width="100%" height="100%" minHeight={288}>
                <PieChart>
                  <Pie
                    data={contentChartData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={50}
                    outerRadius={90}
                    paddingAngle={4}
                  >
                    {contentChartData.map((entry, index) => (
                      <Cell key={entry.name} fill={pieColors[index % pieColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminAnalyticsPage() {
  return (
    <ProtectedRoute requireRole="admin">
      <AdminAnalyticsContent />
    </ProtectedRoute>
  );
}

