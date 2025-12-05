import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { 
  Home, 
  Users, 
  BookOpen, 
  BarChart3, 
  Settings, 
  LogOut, 
  Shield,
  Menu,
  X,
  Activity,
  Database,
  Bell,
  ChevronDown,
  Crown,
  Globe,
  CheckCircle,
  Server
} from 'lucide-react';
import { useState } from 'react';

export function AdminNavBar() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { 
      path: '/admin/dashboard', 
      icon: Home, 
      label: 'Dashboard',
      color: 'from-blue-500 to-cyan-500'
    },
    { 
      path: '/admin/users', 
      icon: Users, 
      label: 'Users',
      color: 'from-emerald-500 to-green-500'
    },
    { 
      path: '/admin/content', 
      icon: BookOpen, 
      label: 'Content',
      color: 'from-purple-500 to-violet-500'
    },
    { 
      path: '/admin/analytics', 
      icon: BarChart3, 
      label: 'Analytics',
      color: 'from-amber-500 to-orange-500'
    },
    { 
      path: '/admin/system', 
      icon: Database, 
      label: 'System',
      color: 'from-rose-500 to-pink-500'
    },
  ];

  return (
    <>
      {/* Status Bar */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 border-b border-gray-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-8">
            <div className="flex items-center space-x-6 text-xs">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                <span className="text-emerald-400 font-medium">System Online</span>
              </div>
              <span className="text-gray-500">|</span>
              <span className="text-cyan-300 font-medium">v2.4.1</span>
            </div>
            <div className="text-xs text-gray-500">
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'short', 
                month: 'short', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 border-b border-gray-700/50 shadow-lg sticky top-0 z-50 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo and Brand */}
            <div className="flex items-center">
              <Link to="/admin/dashboard" className="flex items-center space-x-3 group">
                <div className="relative">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-600 via-cyan-500 to-blue-700 rounded-xl flex items-center justify-center shadow-lg border-2 border-gray-800 group-hover:rotate-12 transition-transform duration-300">
                    <Shield className="h-5 w-5 text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-gradient-to-r from-yellow-400 to-amber-400 rounded-full animate-pulse border border-gray-900"></div>
                </div>
                <div className="flex flex-col">
                  <span className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                    MyCEO Admin
                  </span>
                  <span className="text-xs text-cyan-400/70">Administration Portal</span>
                </div>
              </Link>

              {/* Desktop Navigation Links */}
              <div className="hidden lg:flex items-center space-x-1 ml-12">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.path);
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`group flex flex-col items-center px-4 py-2 rounded-lg transition-all duration-200 ${
                        active
                          ? `bg-gradient-to-r ${item.color} shadow-lg`
                          : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <Icon className={`h-4 w-4 ${active ? 'text-white' : 'text-gray-400 group-hover:text-gray-300'}`} />
                        <span className={`text-sm font-medium ${active ? 'text-white' : 'group-hover:text-white'}`}>
                          {item.label}
                        </span>
                      </div>
                      {active && (
                        <div className="w-4 h-0.5 bg-white rounded-full mt-1"></div>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Right Side - User Info and Actions */}
            <div className="flex items-center space-x-4">
              {/* Admin Badge */}
              <div className="hidden lg:flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-amber-500 to-amber-600 text-amber-900 border border-amber-400/30">
                <Crown className="w-3 h-3" />
                <span className="uppercase tracking-wide">Admin</span>
              </div>

              {/* Notifications */}
              <button
                onClick={() => navigate('/admin/notifications')}
                className="relative p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                title="Notifications"
              >
                <Bell className="h-5 w-5" />
                <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-rose-500 rounded-full animate-pulse"></div>
              </button>

              {/* User Menu */}
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-700/50 transition-colors"
                >
                  <div className="w-8 h-8 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">
                      {user?.user_metadata?.full_name?.charAt(0) || 'A'}
                    </span>
                  </div>
                  <div className="hidden lg:block text-left">
                    <p className="text-sm font-medium text-white leading-tight">
                      {user?.user_metadata?.full_name || 'Admin'}
                    </p>
                    <p className="text-xs text-gray-400 truncate max-w-[160px]">{user?.email}</p>
                  </div>
                  <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* User Dropdown Menu */}
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-gray-900 border border-gray-700 rounded-xl shadow-xl z-50 overflow-hidden">
                    <div className="p-4 border-b border-gray-800">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg flex items-center justify-center">
                          <span className="text-white font-bold text-lg">
                            {user?.user_metadata?.full_name?.charAt(0) || 'A'}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white">
                            {user?.user_metadata?.full_name || 'System Admin'}
                          </p>
                          <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>Last login: Today</span>
                        <span>14:32</span>
                      </div>
                    </div>
                    
                    <div className="py-2">
                      <button
                        onClick={() => {
                          navigate('/admin/settings');
                          setUserMenuOpen(false);
                        }}
                        className="flex items-center space-x-3 w-full px-4 py-3 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
                      >
                        <Settings className="h-4 w-4" />
                        <span>System Settings</span>
                      </button>
                      
                      <button
                        onClick={() => {
                          navigate('/admin/activity');
                          setUserMenuOpen(false);
                        }}
                        className="flex items-center space-x-3 w-full px-4 py-3 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
                      >
                        <Activity className="h-4 w-4" />
                        <span>Activity Logs</span>
                      </button>
                      
                      <button
                        onClick={() => {
                          navigate('/admin/support');
                          setUserMenuOpen(false);
                        }}
                        className="flex items-center space-x-3 w-full px-4 py-3 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
                      >
                        <Globe className="h-4 w-4" />
                        <span>Support Center</span>
                      </button>
                      
                      <div className="border-t border-gray-800 my-2"></div>
                      
                      <button
                        onClick={handleLogout}
                        className="flex items-center space-x-3 w-full px-4 py-3 text-sm text-rose-400 hover:bg-gray-800 hover:text-rose-300 transition-colors"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>Logout & Secure Exit</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-gradient-to-b from-gray-900 to-gray-950 border-t border-gray-800">
            <div className="px-4 py-4 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                      active
                        ? `bg-gradient-to-r ${item.color} text-white`
                        : 'text-gray-300 hover:text-white hover:bg-gray-800'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="font-medium">{item.label}</span>
                    {active && (
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse ml-auto"></div>
                    )}
                  </Link>
                );
              })}
              
              <div className="border-t border-gray-800 pt-4 mt-4">
                <div className="px-4 py-3 space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-lg">
                        {user?.user_metadata?.full_name?.charAt(0) || 'A'}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">
                        {user?.user_metadata?.full_name || 'System Admin'}
                      </p>
                      <p className="text-xs text-cyan-300 truncate">{user?.email}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-amber-500 to-amber-600 text-amber-900">
                      <Crown className="w-3 h-3" />
                      <span className="uppercase tracking-wide">Admin</span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          navigate('/admin/settings');
                          setMobileMenuOpen(false);
                        }}
                        className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg"
                      >
                        <Settings className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => {
                          navigate('/admin/notifications');
                          setMobileMenuOpen(false);
                        }}
                        className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg"
                      >
                        <Bell className="h-5 w-5" />
                      </button>
                      <button
                        onClick={handleLogout}
                        className="p-2 text-rose-400 hover:text-rose-300 hover:bg-gray-800 rounded-lg"
                      >
                        <LogOut className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </nav>
    </>
  );
}