import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AdminNavBar } from '@/components/navigation/AdminNavBar';
import { supabase } from '@/lib/supabase';
import {
  Server,
  Database,
  Cpu,
  Activity,
  Shield,
  Clock,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  XCircle,
  AlertCircle,
  Settings,
  Download,
  Upload,
  Lock,
  Globe,
  Terminal,
  Code,
  HardDrive,
  Network,
  Zap,
  Bell,
  Users,
  BarChart3,
  Wifi,
  ShieldCheck,
  ShieldAlert,
  FileText,
  MessageSquare,
  Eye,
  EyeOff,
  Play,
  StopCircle,
  RotateCw,
  DatabaseBackup,
  Cloud,
  ServerCog,
  HardDriveIcon,
  MemoryStick,
  Calendar,
  History,
  Trash2,
  Filter,
  Search,
  ChevronRight,
  ChevronDown,
  ExternalLink,
  Copy,
  MoreVertical
} from 'lucide-react';

interface SystemMetric {
  name: string;
  value: number;
  unit: string;
  status: 'healthy' | 'warning' | 'critical';
  trend: 'up' | 'down' | 'stable';
  max: number;
}

interface SystemLog {
  id: string;
  timestamp: string;
  level: 'info' | 'warning' | 'error' | 'critical';
  service: string;
  message: string;
  user?: string;
}

interface ServiceStatus {
  name: string;
  status: 'online' | 'degraded' | 'offline';
  uptime: string;
  responseTime: number;
  cpu: number;
  memory: number;
}

function AdminSystemContent() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [systemMetrics, setSystemMetrics] = useState<SystemMetric[]>([
    { name: 'CPU Usage', value: 42, unit: '%', status: 'healthy', trend: 'down', max: 100 },
    { name: 'Memory Usage', value: 68, unit: '%', status: 'warning', trend: 'up', max: 100 },
    { name: 'Disk Usage', value: 85, unit: '%', status: 'warning', trend: 'stable', max: 100 },
    { name: 'Database Connections', value: 156, unit: '', status: 'healthy', trend: 'stable', max: 500 },
    { name: 'API Latency', value: 42, unit: 'ms', status: 'healthy', trend: 'down', max: 200 },
    { name: 'Cache Hit Rate', value: 95, unit: '%', status: 'healthy', trend: 'up', max: 100 },
  ]);

  const [services, setServices] = useState<ServiceStatus[]>([
    { name: 'Authentication API', status: 'online', uptime: '99.99%', responseTime: 23, cpu: 15, memory: 42 },
    { name: 'Database Server', status: 'online', uptime: '99.95%', responseTime: 8, cpu: 38, memory: 68 },
    { name: 'File Storage', status: 'degraded', uptime: '99.87%', responseTime: 45, cpu: 22, memory: 31 },
    { name: 'Email Service', status: 'online', uptime: '99.98%', responseTime: 78, cpu: 8, memory: 24 },
    { name: 'Analytics Engine', status: 'online', uptime: '99.99%', responseTime: 12, cpu: 45, memory: 52 },
    { name: 'Real-time WS', status: 'online', uptime: '99.97%', responseTime: 32, cpu: 28, memory: 37 },
  ]);

  const [recentLogs, setRecentLogs] = useState<SystemLog[]>([
    { id: '1', timestamp: '2024-01-15 14:32:18', level: 'info', service: 'auth-api', message: 'User session created for admin@myceo.test' },
    { id: '2', timestamp: '2024-01-15 14:31:45', level: 'info', service: 'database', message: 'Database backup completed successfully' },
    { id: '3', timestamp: '2024-01-15 14:30:12', level: 'warning', service: 'storage', message: 'File upload rate exceeded threshold' },
    { id: '4', timestamp: '2024-01-15 14:28:33', level: 'info', service: 'analytics', message: 'Daily analytics report generated' },
    { id: '5', timestamp: '2024-01-15 14:27:51', level: 'error', service: 'email', message: 'Failed to send welcome email to new user' },
    { id: '6', timestamp: '2024-01-15 14:26:09', level: 'info', service: 'api-gateway', message: 'API request rate: 1242 req/min' },
    { id: '7', timestamp: '2024-01-15 14:25:37', level: 'info', service: 'cdn', message: 'Cache purge completed for updated assets' },
    { id: '8', timestamp: '2024-01-15 14:24:15', level: 'critical', service: 'database', message: 'High CPU usage detected on primary node' },
  ]);

  const [activeTab, setActiveTab] = useState<'overview' | 'services' | 'logs' | 'backups'>('overview');
  const [logFilter, setLogFilter] = useState<'all' | 'error' | 'warning'>('all');
  const [showLogDetails, setShowLogDetails] = useState<string | null>(null);

  const fetchSystemData = useCallback(async () => {
    try {
      setRefreshing(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // In a real app, you would fetch from your backend
      // const { data } = await supabase.from('system_metrics').select('*');
      
      // Update metrics with random variation
      setSystemMetrics(prev => prev.map(metric => ({
        ...metric,
        value: Math.max(10, Math.min(metric.max, metric.value + (Math.random() * 10 - 5))),
        trend: Math.random() > 0.5 ? 'up' : 'down',
        status: metric.value > 80 ? 'critical' : metric.value > 60 ? 'warning' : 'healthy'
      })));
      
      // Update services with random variation
      setServices(prev => prev.map(service => ({
        ...service,
        responseTime: Math.max(5, Math.min(100, service.responseTime + (Math.random() * 20 - 10))),
        cpu: Math.max(5, Math.min(90, service.cpu + (Math.random() * 20 - 10))),
        memory: Math.max(20, Math.min(95, service.memory + (Math.random() * 20 - 10))),
        status: Math.random() > 0.9 ? 'degraded' : 'online'
      })));
      
    } catch (error) {
      console.error('Failed to fetch system data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchSystemData();
    // Set up polling for real-time updates
    const interval = setInterval(fetchSystemData, 30000); // Every 30 seconds
    return () => clearInterval(interval);
  }, [fetchSystemData]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
      case 'healthy':
        return 'bg-emerald-500';
      case 'degraded':
      case 'warning':
        return 'bg-amber-500';
      case 'offline':
      case 'critical':
        return 'bg-rose-500';
      default:
        return 'bg-slate-500';
    }
  };

  const getStatusBgColor = (status: string) => {
    switch (status) {
      case 'online':
      case 'healthy':
        return 'bg-emerald-50 border-emerald-200';
      case 'degraded':
      case 'warning':
        return 'bg-amber-50 border-amber-200';
      case 'offline':
      case 'critical':
        return 'bg-rose-50 border-rose-200';
      default:
        return 'bg-slate-50 border-slate-200';
    }
  };

  const getLogLevelColor = (level: string) => {
    switch (level) {
      case 'info':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'warning':
        return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'error':
        return 'text-rose-600 bg-rose-50 border-rose-200';
      case 'critical':
        return 'text-rose-700 bg-rose-100 border-rose-300';
      default:
        return 'text-slate-600 bg-slate-50 border-slate-200';
    }
  };

  const getLogLevelIcon = (level: string) => {
    switch (level) {
      case 'info':
        return <CheckCircle className="h-4 w-4" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4" />;
      case 'error':
        return <XCircle className="h-4 w-4" />;
      case 'critical':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <CheckCircle className="h-4 w-4" />;
    }
  };

  const filteredLogs = logFilter === 'all' 
    ? recentLogs 
    : recentLogs.filter(log => log.level === logFilter);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50/80 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-gray-600">Loading system data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50/80 to-slate-100">
      <AdminNavBar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-gradient-to-br from-slate-700 to-slate-900 shadow-lg">
                <Server className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-800">System Management</h1>
                <p className="text-slate-600">Monitor and manage platform infrastructure</p>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-3">
              <button
                onClick={fetchSystemData}
                disabled={refreshing}
                className="px-4 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg font-medium transition-all flex items-center gap-2 disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </button>
              
              <div className="flex gap-2">
                <button className="px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-lg font-medium transition-all flex items-center gap-2 shadow-md hover:shadow-lg">
                  <DatabaseBackup className="h-4 w-4" />
                  Backup
                </button>
                <button className="px-4 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-lg font-medium transition-all flex items-center gap-2 shadow-md hover:shadow-lg">
                  <Settings className="h-4 w-4" />
                  Settings
                </button>
              </div>
            </div>
          </div>
          
          {/* System Status Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl p-5 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">System Health</p>
                  <p className="text-2xl font-bold">94%</p>
                </div>
                <ShieldCheck className="h-8 w-8 opacity-90" />
              </div>
            </div>
            <div className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl p-5 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Uptime</p>
                  <p className="text-2xl font-bold">99.9%</p>
                </div>
                <Clock className="h-8 w-8 opacity-90" />
              </div>
            </div>
            <div className="bg-gradient-to-r from-slate-700 to-slate-800 rounded-xl p-5 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Active Services</p>
                  <p className="text-2xl font-bold">12/14</p>
                </div>
                <ServerCog className="h-8 w-8 opacity-90" />
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2 border-b border-slate-200">
            {['overview', 'services', 'logs', 'backups'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`px-5 py-3 font-medium rounded-t-lg transition-colors relative ${
                  activeTab === tab
                    ? 'text-blue-600 bg-white border border-slate-300 border-b-white -mb-px'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                {activeTab === tab && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500"></div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Content based on active tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* System Metrics */}
            <div className="bg-white rounded-xl border border-slate-300/30 shadow-sm overflow-hidden">
              <div className="border-b border-slate-200 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500">
                      <Activity className="h-5 w-5 text-white" />
                    </div>
                    <h2 className="text-lg font-bold text-slate-800">System Metrics</h2>
                  </div>
                  <span className="text-sm text-slate-600">Real-time monitoring</span>
                </div>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {systemMetrics.map((metric, index) => (
                    <div key={index} className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-2.5 h-2.5 rounded-full ${getStatusColor(metric.status)}`}></div>
                          <span className="font-medium text-slate-700">{metric.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold text-slate-800">{metric.value}{metric.unit}</span>
                          {metric.trend === 'up' ? (
                            <span className="text-xs font-medium px-2 py-1 rounded-full bg-rose-100 text-rose-700 flex items-center gap-1">
                              <Zap className="h-3 w-3" /> Up
                            </span>
                          ) : metric.trend === 'down' ? (
                            <span className="text-xs font-medium px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 flex items-center gap-1">
                              <Zap className="h-3 w-3" /> Down
                            </span>
                          ) : (
                            <span className="text-xs font-medium px-2 py-1 rounded-full bg-slate-100 text-slate-700">
                              Stable
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="relative">
                        <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${
                              metric.status === 'healthy' ? 'bg-gradient-to-r from-emerald-400 to-green-500' :
                              metric.status === 'warning' ? 'bg-gradient-to-r from-amber-400 to-orange-500' :
                              'bg-gradient-to-r from-rose-400 to-pink-500'
                            }`}
                            style={{ width: `${(metric.value / metric.max) * 100}%` }}
                          ></div>
                        </div>
                        <div className="flex justify-between text-xs text-slate-500 mt-1">
                          <span>0{metric.unit}</span>
                          <span>{metric.max}{metric.unit}</span>
                        </div>
                      </div>
                      
                      <div className="text-xs text-slate-600">
                        <div className="flex justify-between">
                          <span>Status</span>
                          <span className={`font-medium ${
                            metric.status === 'healthy' ? 'text-emerald-600' :
                            metric.status === 'warning' ? 'text-amber-600' :
                            'text-rose-600'
                          }`}>
                            {metric.status.charAt(0).toUpperCase() + metric.status.slice(1)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl border border-slate-300/30 shadow-sm p-6">
                <h3 className="text-lg font-bold text-slate-800 mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  {[
                    { icon: DatabaseBackup, label: 'Create System Backup', description: 'Backup all databases and files', color: 'emerald' },
                    { icon: RotateCw, label: 'Restart Services', description: 'Gracefully restart all services', color: 'blue' },
                    { icon: Trash2, label: 'Clear Cache', description: 'Clear all system caches', color: 'amber' },
                    { icon: Shield, label: 'Security Scan', description: 'Run full security audit', color: 'purple' },
                  ].map((action, index) => (
                    <button
                      key={index}
                      className="w-full p-3 rounded-lg hover:bg-slate-50 border border-slate-300/30 transition-colors flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${
                          action.color === 'emerald' ? 'bg-emerald-500/10 text-emerald-600' :
                          action.color === 'blue' ? 'bg-blue-500/10 text-blue-600' :
                          action.color === 'amber' ? 'bg-amber-500/10 text-amber-600' :
                          'bg-purple-500/10 text-purple-600'
                        }`}>
                          <action.icon className="h-4 w-4" />
                        </div>
                        <div className="text-left">
                          <div className="font-medium text-slate-800">{action.label}</div>
                          <div className="text-xs text-slate-600">{action.description}</div>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-slate-600" />
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="bg-white rounded-xl border border-slate-300/30 shadow-sm p-6">
                <h3 className="text-lg font-bold text-slate-800 mb-4">Recent Events</h3>
                <div className="space-y-4">
                  {recentLogs.slice(0, 4).map((log) => (
                    <div
                      key={log.id}
                      className="flex items-start gap-3 p-3 rounded-lg bg-slate-50/50 border border-slate-300/30"
                    >
                      <div className={`p-1.5 rounded-md ${getLogLevelColor(log.level)}`}>
                        {getLogLevelIcon(log.level)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-slate-800 text-sm">{log.service}</span>
                          <span className="text-xs text-slate-500">{log.timestamp.split(' ')[1]}</span>
                        </div>
                        <p className="text-sm text-slate-600 mt-1 truncate">{log.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => setActiveTab('logs')}
                  className="w-full mt-4 py-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md font-medium transition-colors border border-blue-200 text-sm"
                >
                  View All Logs
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'services' && (
          <div className="bg-white rounded-xl border border-slate-300/30 shadow-sm overflow-hidden">
            <div className="border-b border-slate-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-violet-500">
                    <ServerCog className="h-5 w-5 text-white" />
                  </div>
                  <h2 className="text-lg font-bold text-slate-800">Service Status</h2>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                    <span className="text-slate-600">Online</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                    <span className="text-slate-600">Degraded</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 bg-rose-500 rounded-full"></div>
                    <span className="text-slate-600">Offline</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                {services.map((service, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-xl border-2 ${getStatusBgColor(service.status)}`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-2.5 h-2.5 rounded-full ${getStatusColor(service.status)}`}></div>
                        <div>
                          <h3 className="font-bold text-slate-800">{service.name}</h3>
                          <div className="flex items-center gap-4 text-sm text-slate-600 mt-1">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Uptime: {service.uptime}
                            </span>
                            <span className="flex items-center gap-1">
                              <Activity className="h-3 w-3" />
                              Response: {service.responseTime}ms
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-xs text-slate-500 mb-1">CPU / Memory</div>
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-2 bg-slate-200 rounded-full overflow-hidden">
                              <div 
                                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-500"
                                style={{ width: `${service.cpu}%` }}
                              ></div>
                            </div>
                            <div className="w-16 h-2 bg-slate-200 rounded-full overflow-hidden">
                              <div 
                                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-green-500"
                                style={{ width: `${service.memory}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                        <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg">
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <div className="text-xs text-slate-500 mb-1">CPU Usage</div>
                        <div className="text-lg font-bold text-slate-800">{service.cpu}%</div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-500 mb-1">Memory Usage</div>
                        <div className="text-lg font-bold text-slate-800">{service.memory}%</div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-500 mb-1">Status</div>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${getStatusColor(service.status)}`}></div>
                          <span className="font-medium text-slate-800 capitalize">{service.status}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="space-y-6">
            {/* Log Filters */}
            <div className="bg-white rounded-xl border border-slate-300/30 shadow-sm p-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => setLogFilter('all')}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      logFilter === 'all'
                        ? 'bg-blue-100 text-blue-700 border border-blue-200'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    All Logs
                  </button>
                  <button
                    onClick={() => setLogFilter('error')}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      logFilter === 'error'
                        ? 'bg-rose-100 text-rose-700 border border-rose-200'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    Errors Only
                  </button>
                  <button
                    onClick={() => setLogFilter('warning')}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      logFilter === 'warning'
                        ? 'bg-amber-100 text-amber-700 border border-amber-200'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    Warnings Only
                  </button>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search logs..."
                      className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <button className="px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-lg font-medium transition-all flex items-center gap-2">
                    <Download className="h-4 w-4" />
                    Export
                  </button>
                </div>
              </div>
            </div>

            {/* Log Table */}
            <div className="bg-white rounded-xl border border-slate-300/30 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                        Level
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                        Timestamp
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                        Service
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                        Message
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {filteredLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={`flex items-center gap-2 px-2 py-1 rounded-md text-xs font-medium w-fit ${getLogLevelColor(log.level)}`}>
                            {getLogLevelIcon(log.level)}
                            <span className="capitalize">{log.level}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                          {log.timestamp}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                            {log.service}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-800 max-w-xs truncate">
                          {log.message}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setShowLogDetails(showLogDetails === log.id ? null : log.id)}
                              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded">
                              <Copy className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Pagination */}
              <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between">
                <div className="text-sm text-slate-600">
                  Showing <span className="font-medium">1</span> to <span className="font-medium">{filteredLogs.length}</span> of{' '}
                  <span className="font-medium">{filteredLogs.length}</span> results
                </div>
                <div className="flex items-center gap-2">
                  <button className="px-3 py-1.5 border border-slate-300 rounded text-sm text-slate-600 hover:bg-slate-50">
                    Previous
                  </button>
                  <button className="px-3 py-1.5 border border-slate-300 rounded text-sm text-slate-600 hover:bg-slate-50">
                    Next
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'backups' && (
          <div className="bg-white rounded-xl border border-slate-300/30 shadow-sm p-6">
            <div className="text-center py-12">
              <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mb-4">
                <DatabaseBackup className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">Backup Management</h3>
              <p className="text-slate-600 mb-6 max-w-md mx-auto">
                Configure automated backups, manage restore points, and monitor backup health
              </p>
              <div className="flex flex-wrap gap-3 justify-center">
                <button className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-lg font-medium transition-all flex items-center gap-2">
                  <DatabaseBackup className="h-4 w-4" />
                  Create New Backup
                </button>
                <button className="px-5 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg font-medium transition-all flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Configure Schedule
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminSystemPage() {
  return (
    <ProtectedRoute requireRole="admin">
      <AdminSystemContent />
    </ProtectedRoute>
  );
}