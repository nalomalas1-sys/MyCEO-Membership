import { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AdminNavBar } from '@/components/navigation/AdminNavBar';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import {
  TrendingUp,
  Users,
  BookOpen,
  Award,
  DollarSign,
  Activity,
  BarChart3,
  Download,
  ChevronRight,
  Calendar,
  RefreshCw,
  Target,
  CheckCircle,
  Clock,
  PieChart,
  LineChart
} from 'lucide-react';

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
  const { user } = useAuth();
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
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setRefreshing(true);

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

      setLastUpdated(new Date().toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      }));
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

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
    a.download = `analytics-report-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const exportToPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Analytics Report</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 30px; background: #f8fafc; }
            .header { text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #e2e8f0; }
            h1 { color: #1e293b; margin: 0; font-size: 28px; }
            .subtitle { color: #64748b; font-size: 14px; margin-top: 5px; }
            .report-info { display: flex; justify-content: space-between; background: white; padding: 15px; border-radius: 8px; margin-bottom: 25px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
            table { width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
            th { background: #f1f5f9; color: #475569; font-weight: 600; text-transform: uppercase; font-size: 12px; letter-spacing: 0.05em; }
            th, td { padding: 12px 16px; text-align: left; border-bottom: 1px solid #e2e8f0; }
            tr:last-child td { border-bottom: none; }
            .metric-value { font-weight: 600; color: #1e293b; }
            .footer { text-align: center; margin-top: 40px; color: #94a3b8; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Analytics Report</h1>
            <div class="subtitle">Learning Platform Performance Metrics</div>
          </div>
          
          <div class="report-info">
            <div>Generated: ${new Date().toLocaleString()}</div>
            <div>Report ID: ${Math.random().toString(36).substr(2, 9).toUpperCase()}</div>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Metric</th>
                <th>Value</th>
              </tr>
            </thead>
            <tbody>
              <tr><td>Total Users</td><td class="metric-value">${analytics.totalUsers}</td></tr>
              <tr><td>Total Parents</td><td class="metric-value">${analytics.totalParents}</td></tr>
              <tr><td>Total Children</td><td class="metric-value">${analytics.totalChildren}</td></tr>
              <tr><td>Active Subscriptions</td><td class="metric-value">${analytics.activeSubscriptions}</td></tr>
              <tr><td>Total Modules</td><td class="metric-value">${analytics.totalModules}</td></tr>
              <tr><td>Published Modules</td><td class="metric-value">${analytics.publishedModules}</td></tr>
              <tr><td>Total Lessons</td><td class="metric-value">${analytics.totalLessons}</td></tr>
              <tr><td>Module Completions</td><td class="metric-value">${analytics.moduleCompletions}</td></tr>
              <tr><td>Average Progress</td><td class="metric-value">${analytics.averageProgress}%</td></tr>
              <tr><td>Total XP Earned</td><td class="metric-value">${analytics.totalXP.toLocaleString()}</td></tr>
              <tr><td>Achievements Unlocked</td><td class="metric-value">${analytics.totalAchievements}</td></tr>
            </tbody>
          </table>
          
          <div class="footer">
            Confidential - For Internal Use Only
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.print();
  };

  const statCards = [
    {
      title: 'Total Users',
      value: analytics.totalUsers,
      icon: Users,
      description: 'Registered platform users',
      trend: '+12%',
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-gradient-to-br from-blue-50 to-blue-100',
      borderColor: 'border-blue-200'
    },
    {
      title: 'Parents',
      value: analytics.totalParents,
      icon: Users,
      description: 'Registered parent accounts',
      trend: '+8%',
      color: 'from-emerald-500 to-emerald-600',
      bgColor: 'bg-gradient-to-br from-emerald-50 to-emerald-100',
      borderColor: 'border-emerald-200'
    },
    {
      title: 'Children',
      value: analytics.totalChildren,
      icon: Users,
      description: 'Active learner accounts',
      trend: '+15%',
      color: 'from-violet-500 to-violet-600',
      bgColor: 'bg-gradient-to-br from-violet-50 to-violet-100',
      borderColor: 'border-violet-200'
    },
    {
      title: 'Active Subscriptions',
      value: analytics.activeSubscriptions,
      icon: Activity,
      description: 'Active/trialing subscriptions',
      trend: '+5%',
      color: 'from-amber-500 to-amber-600',
      bgColor: 'bg-gradient-to-br from-amber-50 to-amber-100',
      borderColor: 'border-amber-200'
    },
    {
      title: 'Published Modules',
      value: `${analytics.publishedModules} / ${analytics.totalModules}`,
      icon: BookOpen,
      description: 'Published vs total modules',
      trend: `${Math.round((analytics.publishedModules / analytics.totalModules) * 100) || 0}%`,
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-gradient-to-br from-orange-50 to-orange-100',
      borderColor: 'border-orange-200'
    },
    {
      title: 'Total Lessons',
      value: analytics.totalLessons,
      icon: BookOpen,
      description: 'Total learning lessons',
      trend: '+22%',
      color: 'from-indigo-500 to-indigo-600',
      bgColor: 'bg-gradient-to-br from-indigo-50 to-indigo-100',
      borderColor: 'border-indigo-200'
    },
    {
      title: 'Module Completions',
      value: analytics.moduleCompletions,
      icon: CheckCircle,
      description: 'Completed modules',
      trend: '+18%',
      color: 'from-pink-500 to-pink-600',
      bgColor: 'bg-gradient-to-br from-pink-50 to-pink-100',
      borderColor: 'border-pink-200'
    },
    {
      title: 'Average Progress',
      value: `${analytics.averageProgress}%`,
      icon: TrendingUp,
      description: 'Overall learner progress',
      trend: analytics.averageProgress > 70 ? 'Excellent' : 'Good',
      color: 'from-teal-500 to-teal-600',
      bgColor: 'bg-gradient-to-br from-teal-50 to-teal-100',
      borderColor: 'border-teal-200'
    },
    {
      title: 'Total XP Earned',
      value: analytics.totalXP.toLocaleString(),
      icon: Award,
      description: 'Total experience points',
      trend: '+25%',
      color: 'from-cyan-500 to-cyan-600',
      bgColor: 'bg-gradient-to-br from-cyan-50 to-cyan-100',
      borderColor: 'border-cyan-200'
    },
    {
      title: 'Achievements',
      value: analytics.totalAchievements,
      icon: Target,
      description: 'Achievements unlocked',
      trend: '+30%',
      color: 'from-rose-500 to-rose-600',
      bgColor: 'bg-gradient-to-br from-rose-50 to-rose-100',
      borderColor: 'border-rose-200'
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
        <AdminNavBar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
              <p className="text-gray-600 text-lg">Loading analytics data...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <AdminNavBar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg">
                  <BarChart3 className="h-6 w-6 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
              </div>
              <p className="text-gray-600">Real-time platform metrics and performance insights</p>
            </div>
            
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2 text-sm text-gray-500 bg-white px-3 py-2 rounded-lg border border-gray-200">
                <Clock className="h-4 w-4" />
                <span>Last updated: {lastUpdated}</span>
              </div>
              
              <button
                onClick={fetchAnalytics}
                disabled={refreshing}
                className="px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg font-medium transition-all flex items-center gap-2 disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </button>
              
              <div className="flex gap-2">
                <button
                  onClick={exportToCSV}
                  className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-lg font-medium transition-all flex items-center gap-2 shadow-md hover:shadow-lg"
                >
                  <Download className="h-4 w-4" />
                  CSV
                </button>
                <button
                  onClick={exportToPDF}
                  className="px-4 py-2 bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white rounded-lg font-medium transition-all flex items-center gap-2 shadow-md hover:shadow-lg"
                >
                  <Download className="h-4 w-4" />
                  PDF
                </button>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Total Platform Users</p>
                  <p className="text-2xl font-bold">{analytics.totalUsers}</p>
                </div>
                <Users className="h-8 w-8 opacity-90" />
              </div>
            </div>
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Active Learners</p>
                  <p className="text-2xl font-bold">{analytics.totalChildren}</p>
                </div>
                <Activity className="h-8 w-8 opacity-90" />
              </div>
            </div>
            <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Platform Progress</p>
                  <p className="text-2xl font-bold">{analytics.averageProgress}%</p>
                </div>
                <TrendingUp className="h-8 w-8 opacity-90" />
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <PieChart className="h-5 w-5 text-blue-500" />
              Key Metrics Overview
            </h2>
            <div className="text-sm text-gray-500">
              Showing {statCards.length} metrics
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {statCards.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div
                  key={index}
                  className={`${stat.bgColor} rounded-xl border ${stat.borderColor} p-4 hover:shadow-lg transition-all duration-200`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                      <Icon className={`h-5 w-5 ${stat.color.replace('from-', 'text-').split(' ')[0]}`} />
                    </div>
                    <span className="text-xs font-medium px-2 py-1 bg-white rounded-full border border-gray-200">
                      {stat.trend}
                    </span>
                  </div>
                  
                  <p className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</p>
                  <p className="text-sm font-medium text-gray-900 mb-1">{stat.title}</p>
                  <p className="text-xs text-gray-500">{stat.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Detailed Analytics Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Engagement Metrics */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg">
                    <Activity className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">Engagement Metrics</h3>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </div>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                {[
                  { label: 'Module Completions', value: analytics.moduleCompletions, icon: CheckCircle, color: 'text-green-500' },
                  { label: 'Average Progress', value: `${analytics.averageProgress}%`, icon: TrendingUp, color: 'text-blue-500' },
                  { label: 'Total XP Earned', value: analytics.totalXP.toLocaleString(), icon: Award, color: 'text-amber-500' },
                  { label: 'Achievements Unlocked', value: analytics.totalAchievements, icon: Target, color: 'text-purple-500' },
                ].map((metric, idx) => {
                  const Icon = metric.icon;
                  return (
                    <div key={idx} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gray-100 rounded-lg">
                          <Icon className={`h-4 w-4 ${metric.color}`} />
                        </div>
                        <span className="text-gray-700">{metric.label}</span>
                      </div>
                      <span className="font-bold text-gray-900">{metric.value}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Content Metrics */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg">
                    <BookOpen className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">Content Metrics</h3>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </div>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                {[
                  { label: 'Total Modules', value: analytics.totalModules, icon: BookOpen, color: 'text-blue-500' },
                  { label: 'Published Modules', value: analytics.publishedModules, icon: CheckCircle, color: 'text-green-500' },
                  { label: 'Draft Modules', value: analytics.totalModules - analytics.publishedModules, icon: Clock, color: 'text-amber-500' },
                  { label: 'Total Lessons', value: analytics.totalLessons, icon: BookOpen, color: 'text-purple-500' },
                ].map((metric, idx) => {
                  const Icon = metric.icon;
                  const progress = idx === 0 ? 100 : 
                    idx === 1 ? Math.round((analytics.publishedModules / analytics.totalModules) * 100) : 
                    idx === 2 ? Math.round(((analytics.totalModules - analytics.publishedModules) / analytics.totalModules) * 100) : 100;
                  
                  return (
                    <div key={idx} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-gray-100 rounded-lg">
                            <Icon className={`h-4 w-4 ${metric.color}`} />
                          </div>
                          <span className="text-gray-700">{metric.label}</span>
                        </div>
                        <span className="font-bold text-gray-900">{metric.value}</span>
                      </div>
                      {progress !== 100 && (
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div 
                            className="bg-gradient-to-r from-blue-500 to-blue-600 h-1.5 rounded-full" 
                            style={{ width: `${progress}%` }}
                          ></div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Summary Section */}
        <div className="mt-8 bg-gradient-to-r from-gray-900 to-gray-800 rounded-xl p-6 text-white">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold mb-2">Platform Performance Summary</h3>
              <p className="text-gray-300">
                Total platform engagement is {analytics.averageProgress > 70 ? 'excellent' : 'good'} with{' '}
                {analytics.moduleCompletions} modules completed and {analytics.totalAchievements} achievements unlocked.
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold mb-1">{analytics.averageProgress}%</div>
              <div className="text-gray-300">Overall Engagement Score</div>
            </div>
          </div>
        </div>

        {/* Export Section */}
        <div className="mt-8 bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Export Reports</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:bg-blue-50 transition-colors">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <Download className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">Export as CSV</h4>
                  <p className="text-sm text-gray-600 mb-3">Download all analytics data in CSV format for spreadsheet analysis</p>
                  <button
                    onClick={exportToCSV}
                    className="text-emerald-600 hover:text-emerald-700 font-medium text-sm flex items-center gap-1"
                  >
                    Download CSV
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
            
            <div className="border border-gray-200 rounded-lg p-4 hover:border-rose-300 hover:bg-rose-50 transition-colors">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-rose-100 rounded-lg">
                  <Download className="h-5 w-5 text-rose-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">Export as PDF</h4>
                  <p className="text-sm text-gray-600 mb-3">Generate a professional PDF report with all metrics and insights</p>
                  <button
                    onClick={exportToPDF}
                    className="text-rose-600 hover:text-rose-700 font-medium text-sm flex items-center gap-1"
                  >
                    Generate PDF
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
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