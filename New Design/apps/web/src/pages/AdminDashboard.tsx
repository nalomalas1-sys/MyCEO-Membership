import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AdminNavBar } from '@/components/navigation/AdminNavBar';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { 
  Users, 
  BookOpen, 
  DollarSign, 
  Activity, 
  TrendingUp,
  TrendingDown,
  CreditCard,
  Calendar,
  ArrowUpRight,
  BarChart3,
  Shield,
  Cpu,
  ChevronRight,
  Sparkles,
  Zap,
  Target,
  CheckCircle,
  AlertTriangle,
  Clock,
  Download,
  Eye,
  RefreshCw,
  Rocket,
  LineChart,
  Building,
  Globe,
  Database,
  Server,
  Cloud,
  Layers,
  PieChart,
  Grid,
  ShieldCheck,
  BarChart,
  Network,
  Terminal
} from 'lucide-react';
import { formatCurrencyWithSeparators, usdToRm } from '@/utils/currency';
import { motion, AnimatePresence } from 'framer-motion';

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
  engagementRate: number;
  avgDailyActive: number;
}

// Professional gradient backgrounds - Lightweight version
const GradientBackground = () => (
  <div className="fixed inset-0 pointer-events-none z-0">
    {/* Simple gradient background */}
    <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-gray-50/80 to-slate-100"></div>
    
    {/* Light grid pattern - less intensive */}
    <div className="absolute inset-0 opacity-[0.02] bg-[linear-gradient(90deg,_transparent_79px,_#e5e7eb_80px,_transparent_81px),_linear-gradient(transparent_79px,_#e5e7eb_80px,_transparent_81px)] bg-[size:80px_80px]"></div>
    
    {/* Simple floating elements */}
    <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl"></div>
    <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl"></div>
  </div>
);

// Optimized Professional Card Component
const ProfessionalCard = ({ 
  children, 
  className = '',
  hover = true 
}: { 
  children: React.ReactNode; 
  className?: string;
  hover?: boolean;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    whileHover={hover ? { y: -2, transition: { duration: 0.2 } } : {}}
    className={`
      relative rounded-xl bg-white/95 backdrop-blur-sm border border-slate-300/30
      shadow-md shadow-slate-200/20 overflow-hidden transition-all duration-200
      hover:shadow-lg hover:shadow-slate-300/30
      ${className}
    `}
  >
    <div className="relative z-10">{children}</div>
  </motion.div>
);

// Simple Metric Chart
const MetricChart = ({ value, max = 100, color = "blue" }: { value: number; max?: number; color?: string }) => {
  const percentage = Math.min((value / max) * 100, 100);
  const colorClasses = {
    blue: "bg-gradient-to-r from-blue-500 to-cyan-500",
    green: "bg-gradient-to-r from-emerald-500 to-green-500",
    purple: "bg-gradient-to-r from-purple-500 to-violet-500",
    amber: "bg-gradient-to-r from-amber-500 to-orange-500",
    rose: "bg-gradient-to-r from-rose-500 to-pink-500"
  };

  return (
    <div className="w-full h-2 bg-slate-200/50 rounded-full overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${percentage}%` }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className={`h-full rounded-full ${colorClasses[color as keyof typeof colorClasses]}`}
      />
    </div>
  );
};

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
    engagementRate: 0,
    avgDailyActive: 0,
  });
  const [loading, setLoading] = useState(true);
  const [greeting, setGreeting] = useState('');
  const [timeOfDay, setTimeOfDay] = useState('');

  // Memoized fetch function to prevent recreations
  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      
      await new Promise(resolve => setTimeout(resolve, 200)); // Reduced delay

      const [usersResult, parentsResult, childrenResult, modulesResult] = await Promise.all([
        supabase.from('users').select('id', { count: 'exact', head: true }),
        supabase.from('parents').select('id', { count: 'exact', head: true }),
        supabase.from('children').select('id', { count: 'exact', head: true }),
        supabase.from('modules').select('id', { count: 'exact', head: true }),
      ]);

      const { data: parents } = await supabase
        .from('parents')
        .select('subscription_status, created_at');

      const activeSubs = parents?.filter((p) => p.subscription_status === 'active').length || 0;
      const trialing = parents?.filter((p) => p.subscription_status === 'trialing').length || 0;
      const canceled = parents?.filter((p) => p.subscription_status === 'canceled').length || 0;

      const totalParentsCount = parentsResult.count || 0;
      const engagementRate = totalParentsCount > 0 
        ? Math.round((activeSubs + trialing) / totalParentsCount * 100)
        : 0;

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const recentParents = parents?.filter(p => 
        new Date(p.created_at) > thirtyDaysAgo
      ).length || 0;
      const avgDailyActive = Math.round(recentParents / 30);

      const estimatedMonthlyRevenueUSD = activeSubs * 29.99;
      const estimatedTotalRevenueUSD = activeSubs * 29.99 * 12;
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
        engagementRate,
        avgDailyActive,
      });
    } catch (error) {
      console.error('Failed to fetch admin stats:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) {
      setGreeting('Good morning');
      setTimeOfDay('morning');
    } else if (hour < 18) {
      setGreeting('Good afternoon');
      setTimeOfDay('afternoon');
    } else {
      setGreeting('Good evening');
      setTimeOfDay('evening');
    }

    fetchStats();
  }, [fetchStats]);

  const statCards = [
    {
      title: 'Total Users',
      value: stats.totalUsers.toLocaleString(),
      icon: Users,
      color: 'from-blue-500 to-cyan-500',
      trend: '+12%',
      trendPositive: true,
      metric: 85,
      delay: 0.1,
    },
    {
      title: 'Active Parents',
      value: stats.totalParents.toLocaleString(),
      icon: Building,
      color: 'from-emerald-500 to-green-500',
      trend: '+8%',
      trendPositive: true,
      metric: 72,
      delay: 0.2,
    },
    {
      title: 'Children',
      value: stats.totalChildren.toLocaleString(),
      icon: Users,
      color: 'from-violet-500 to-purple-500',
      trend: '+15%',
      trendPositive: true,
      metric: 90,
      delay: 0.3,
    },
    {
      title: 'Active Subscriptions',
      value: stats.activeSubscriptions.toLocaleString(),
      icon: CreditCard,
      color: 'from-amber-500 to-orange-500',
      trend: '+5%',
      trendPositive: true,
      metric: 68,
      delay: 0.4,
    },
    {
      title: 'Monthly Revenue',
      value: `RM ${formatCurrencyWithSeparators(stats.monthlyRevenue)}`,
      icon: DollarSign,
      color: 'from-rose-500 to-pink-500',
      trend: '+18%',
      trendPositive: true,
      metric: 92,
      delay: 0.5,
    },
    {
      title: 'Engagement Rate',
      value: `${stats.engagementRate}%`,
      icon: Activity,
      color: 'from-indigo-500 to-blue-500',
      trend: '+3%',
      trendPositive: true,
      metric: stats.engagementRate,
      delay: 0.6,
    },
  ];

  const quickActions = [
    {
      title: 'User Management',
      description: 'Manage parents, children, and subscriptions',
      icon: Users,
      color: 'from-blue-500 to-cyan-500',
      path: '/admin/users',
      delay: 0.2,
    },
    {
      title: 'Content Management',
      description: 'Create and organize learning modules',
      icon: BookOpen,
      color: 'from-emerald-500 to-green-500',
      path: '/admin/content',
      delay: 0.3,
    },
    {
      title: 'Analytics',
      description: 'View detailed platform insights',
      icon: BarChart,
      color: 'from-violet-500 to-purple-500',
      path: '/admin/analytics',
      delay: 0.4,
    },
    {
      title: 'System Status',
      description: 'Monitor platform health',
      icon: Server,
      color: 'from-amber-500 to-orange-500',
      path: '/admin/system',
      delay: 0.5,
    },
  ];

  const systemMetrics = [
    { label: 'API Response', value: '42ms', status: 'excellent', icon: Terminal },
    { label: 'Database Load', value: '24%', status: 'good', icon: Database },
    { label: 'Cache Rate', value: '95%', status: 'excellent', icon: Layers },
    { label: 'Uptime', value: '99.9%', status: 'excellent', icon: ShieldCheck },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50/80 to-slate-100 flex items-center justify-center">
        <GradientBackground />
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative z-10 text-center"
        >
          <div className="relative mb-8">
            <div className="w-20 h-20 border-4 border-slate-200/50 border-t-blue-500 rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Network className="w-10 h-10 text-blue-500" />
            </div>
          </div>
          <p className="text-slate-600 font-medium">
            Loading platform analytics...
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50/80 to-slate-100 relative overflow-hidden">
      <GradientBackground />
      
      <div className="relative z-10">
        <AdminNavBar />
      </div>
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section - Optimized with less animations */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg flex items-center justify-center">
                  <Terminal className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-slate-800">
                    {greeting}, {user?.user_metadata?.full_name?.split(' ')[0] || 'Admin'} 👋
                  </h1>
                  <p className="text-slate-600 mt-1 flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4" />
                    {new Date().toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button 
                onClick={() => fetchStats()}
                className="px-4 py-2.5 bg-white/80 backdrop-blur-sm border border-slate-300/50 rounded-lg hover:bg-white transition-all shadow-sm hover:shadow flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4 text-slate-600" />
                <span className="font-medium text-slate-700">Refresh</span>
              </button>
              
              <button 
                className="px-4 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg shadow hover:shadow-md transition-all flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span className="font-medium">Export</span>
              </button>
            </div>
          </div>
          
          {/* System Status Bar - Simplified */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
            {systemMetrics.map((metric, index) => (
              <div
                key={index}
                className="bg-white/80 backdrop-blur-sm rounded-lg p-4 border border-slate-300/30 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      metric.status === 'excellent' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-blue-500/10 text-blue-600'
                    }`}>
                      <metric.icon className="w-4 h-4" />
                    </div>
                    <div className="text-sm font-medium text-slate-700">{metric.label}</div>
                  </div>
                  <div className="text-lg font-bold text-slate-800">{metric.value}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Left Column - Stats & Actions */}
          <div className="lg:col-span-2 space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {statCards.map((stat, index) => (
                <ProfessionalCard key={index} hover={true}>
                  <div className="p-5">
                    <div className="flex items-center justify-between mb-4">
                      <div className={`p-3 rounded-lg bg-gradient-to-br ${stat.color} shadow-md`}>
                        <stat.icon className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-slate-100">
                        {stat.trendPositive ? (
                          <TrendingUp className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <TrendingDown className="w-3 h-3 text-rose-600" />
                        )}
                        <span className={`text-xs font-medium ${stat.trendPositive ? 'text-emerald-700' : 'text-rose-700'}`}>
                          {stat.trend}
                        </span>
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <div className="text-2xl font-bold text-slate-800">{stat.value}</div>
                      <div className="text-sm text-slate-600 mt-1">{stat.title}</div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs text-slate-500">
                        <span>Performance</span>
                        <span>{stat.metric}%</span>
                      </div>
                      <MetricChart value={stat.metric} color={stat.trendPositive ? 'green' : 'rose'} />
                    </div>
                  </div>
                </ProfessionalCard>
              ))}
            </div>

            {/* Revenue & Analytics Section */}
            <ProfessionalCard>
              <div className="p-5">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 shadow-md">
                      <LineChart className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-slate-800">Revenue Analytics</h2>
                      <p className="text-sm text-slate-600">Monthly performance overview</p>
                    </div>
                  </div>
                  <div className="text-sm text-slate-600 flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>Last 30 days</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <div className="p-4 rounded-lg bg-blue-50/50 border border-blue-200/50">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-slate-700">Monthly Revenue</span>
                        <Sparkles className="w-4 h-4 text-blue-500" />
                      </div>
                      <div className="text-2xl font-bold text-slate-800 mb-1">
                        RM {formatCurrencyWithSeparators(stats.monthlyRevenue)}
                      </div>
                      <div className="flex items-center gap-1 text-sm text-slate-600">
                        <TrendingUp className="w-3 h-3 text-emerald-600" />
                        <span>+18.2% from last month</span>
                      </div>
                    </div>
                    
                    <div className="p-4 rounded-lg bg-emerald-50/50 border border-emerald-200/50">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-slate-700">Annual Projection</span>
                        <Target className="w-4 h-4 text-emerald-500" />
                      </div>
                      <div className="text-2xl font-bold text-slate-800 mb-1">
                        RM {formatCurrencyWithSeparators(stats.totalRevenue)}
                      </div>
                      <div className="text-sm text-slate-600">Based on current growth rate</div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="p-4 rounded-lg bg-amber-50/50 border border-amber-200/50">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-slate-700">Conversion Rate</span>
                        <Zap className="w-4 h-4 text-amber-500" />
                      </div>
                      <div className="text-2xl font-bold text-slate-800 mb-1">8.2%</div>
                      <div className="flex items-center gap-1 text-sm text-slate-600">
                        <TrendingUp className="w-3 h-3 text-emerald-600" />
                        <span>+1.5% from last quarter</span>
                      </div>
                    </div>
                    
                    <div className="p-4 rounded-lg bg-rose-50/50 border border-rose-200/50">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-slate-700">Churn Rate</span>
                        <AlertTriangle className="w-4 h-4 text-rose-500" />
                      </div>
                      <div className="text-2xl font-bold text-slate-800 mb-1">2.4%</div>
                      <div className="flex items-center gap-1 text-sm text-slate-600">
                        <TrendingDown className="w-3 h-3 text-emerald-600" />
                        <span>-0.8% improvement</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </ProfessionalCard>
          </div>

          {/* Right Column - Quick Actions & System */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <ProfessionalCard>
              <div className="p-5">
                <div className="flex items-center gap-3 mb-5">
                  <div className="p-3 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 shadow-md">
                    <Zap className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-800">Quick Actions</h2>
                    <p className="text-sm text-slate-600">Frequently accessed tools</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  {quickActions.map((action, index) => (
                    <button
                      key={index}
                      onClick={() => navigate(action.path)}
                      className="w-full p-3 rounded-lg bg-slate-50/50 hover:bg-slate-100/50 border border-slate-300/30 transition-colors flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-md bg-gradient-to-br ${action.color} shadow-sm`}>
                          <action.icon className="w-4 h-4 text-white" />
                        </div>
                        <div className="text-left">
                          <div className="font-medium text-slate-800">{action.title}</div>
                          <div className="text-xs text-slate-600">{action.description}</div>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 group-hover:translate-x-0.5 transition-all" />
                    </button>
                  ))}
                </div>
              </div>
            </ProfessionalCard>

            {/* Global Stats */}
            <ProfessionalCard>
              <div className="p-5">
                <div className="flex items-center gap-3 mb-5">
                  <div className="p-3 rounded-lg bg-gradient-to-br from-slate-700 to-slate-900 shadow-md">
                    <Globe className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-800">Global Performance</h2>
                    <p className="text-sm text-slate-600">Platform-wide metrics</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  {[
                    { label: 'Daily Active Users', value: stats.avgDailyActive.toLocaleString(), change: '+12%' },
                    { label: 'Engagement Rate', value: `${stats.engagementRate}%`, change: '+3.2%' },
                    { label: 'Avg Session Duration', value: '24 min', change: '+8%' },
                    { label: 'Platform Uptime', value: '99.9%', change: 'Stable' },
                  ].map((stat, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 rounded-md bg-slate-50/50"
                    >
                      <span className="font-medium text-slate-700 text-sm">{stat.label}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800">{stat.value}</span>
                        <span className="text-xs font-medium px-2 py-1 rounded-full bg-emerald-100 text-emerald-700">
                          {stat.change}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </ProfessionalCard>

            {/* Performance Banner - Simplified */}
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 shadow-lg">
              <div className="relative z-10 p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-white/10 backdrop-blur-sm rounded-lg">
                    <Rocket className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">System Performance</h3>
                    <p className="text-blue-100/80 text-sm">All systems optimal</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center">
                    <div className="text-xl font-bold text-white">42ms</div>
                    <div className="text-xs text-blue-100/80">Response Time</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-white">99.9%</div>
                    <div className="text-xs text-blue-100/80">Uptime</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-white">A+</div>
                    <div className="text-xs text-blue-100/80">Health Score</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <ProfessionalCard>
          <div className="p-5">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-gradient-to-br from-rose-500 to-pink-500 shadow-md">
                  <Activity className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800">Recent Platform Activity</h2>
                  <p className="text-sm text-slate-600">Live updates and events</p>
                </div>
              </div>
              <button
                onClick={() => navigate('/admin/analytics')}
                className="px-3 py-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md font-medium transition-colors border border-blue-200 text-sm"
              >
                View All
              </button>
            </div>
            
            <div className="space-y-3">
              {[
                { 
                  icon: Users, 
                  title: 'New Parent Registration', 
                  description: 'John Doe registered as parent', 
                  time: '2 minutes ago',
                  color: 'blue'
                },
                { 
                  icon: CreditCard, 
                  title: 'Subscription Upgrade', 
                  description: 'Jane Smith upgraded to Premium', 
                  time: '15 minutes ago',
                  color: 'emerald'
                },
                { 
                  icon: BookOpen, 
                  title: 'Module Completion', 
                  description: 'Child completed "Math Adventures"', 
                  time: '1 hour ago',
                  color: 'amber'
                },
              ].map((activity, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 rounded-lg bg-slate-50/50 border border-slate-300/30"
                >
                  <div className={`p-2 rounded-md ${
                    activity.color === 'blue' ? 'bg-blue-500/10 text-blue-600' :
                    activity.color === 'emerald' ? 'bg-emerald-500/10 text-emerald-600' :
                    'bg-amber-500/10 text-amber-600'
                  }`}>
                    <activity.icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-slate-800 text-sm">{activity.title}</h4>
                      <span className="text-xs text-slate-500">{activity.time}</span>
                    </div>
                    <p className="text-sm text-slate-600 mt-1">{activity.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </ProfessionalCard>
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