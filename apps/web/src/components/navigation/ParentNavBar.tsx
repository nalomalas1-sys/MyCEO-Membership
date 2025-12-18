import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useParent } from '@/hooks/useParent';
import { 
  Home, 
  Users, 
  LogOut, 
  Settings,
  Menu,
  X,
  Crown,
  Zap,
} from 'lucide-react';
import { useState } from 'react';

export function ParentNavBar() {
  const { user, signOut } = useAuth();
  const { parent } = useParent();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const getSubscriptionStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-gradient-to-r from-blue-400 to-yellow-400 text-blue-900';
      case 'trialing':
        return 'bg-gradient-to-r from-blue-300 to-cyan-400 text-blue-900';
      case 'past_due':
        return 'bg-gradient-to-r from-yellow-400 to-orange-400 text-yellow-900';
      case 'canceled':
      case 'unpaid':
        return 'bg-gradient-to-r from-red-400 to-orange-400 text-red-900';
      default:
        return 'bg-gradient-to-r from-gray-400 to-gray-500 text-gray-900';
    }
  };

  const navItems = [
    { path: '/dashboard', icon: Home, label: 'Park HQ', color: 'from-blue-500 to-cyan-500' },
    { path: '/dashboard/children', icon: Users, label: 'Adventure Squad', color: 'from-blue-500 to-yellow-500' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="bg-gradient-to-r from-blue-50 via-yellow-50/50 to-blue-50 border-b-4 border-yellow-300 shadow-2xl sticky top-0 z-50 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-8">
            <Link to="/dashboard" className="flex items-center space-x-3 group">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-yellow-500 rounded-2xl flex items-center justify-center text-white text-2xl shadow-2xl border-4 border-white group-hover:rotate-12 transition-transform duration-500">
                  🎪
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full animate-pulse border-2 border-white"></div>
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-black bg-gradient-to-r from-blue-600 to-yellow-500 bg-clip-text text-transparent">
                  Park
                </span>
                <span className="text-xs font-bold text-blue-500">Parent Command Center</span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center space-x-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`group flex items-center space-x-2 px-5 py-3 rounded-2xl font-bold text-sm transition-all duration-300 border-2 shadow-lg ${
                      active
                        ? `bg-gradient-to-r ${item.color} text-white border-white scale-105`
                        : 'bg-white text-blue-700 border-blue-200 hover:border-yellow-300 hover:-translate-y-1'
                    }`}
                  >
                    <div className={`p-1.5 rounded-xl ${
                      active 
                        ? 'bg-white/20' 
                        : `bg-gradient-to-r ${item.color} text-white`
                    }`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <span>{item.label}</span>
                    {active && (
                      <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Right Side - User Info and Actions */}
          <div className="flex items-center space-x-4">
            {/* Subscription Status Badge */}
            {parent && (
              <div className={`hidden lg:flex items-center gap-2 px-4 py-2 rounded-full text-xs font-black border-2 border-white/20 shadow-lg ${getSubscriptionStatusColor(parent.subscription_status)}`}>
                {parent.subscription_status === 'active' ? <Crown className="w-3 h-3" /> : <Zap className="w-3 h-3" />}
                <span className="uppercase tracking-wider">
                  {parent.subscription_tier ? parent.subscription_tier.charAt(0).toUpperCase() + parent.subscription_tier.slice(1) : 'Explorer'}
                </span>
              </div>
            )}

            {/* User Menu */}
            <div className="flex items-center space-x-3">
              <div className="hidden lg:block text-right">
                <p className="text-sm font-black text-blue-800">
                  {user?.user_metadata?.full_name || 'Park Manager'}
                </p>
                <p className="text-xs text-blue-600 font-bold">{user?.email}</p>
              </div>
              
              <div className="flex items-center space-x-2 border-l-2 border-yellow-200 pl-4">
                <button
                  onClick={() => navigate('/dashboard/settings')}
                  className="p-2.5 text-blue-600 hover:text-blue-800 hover:bg-gradient-to-r from-blue-100 to-yellow-100 rounded-2xl transition-all border-2 border-blue-200 hover:border-yellow-300"
                  title="Park Settings"
                >
                  <Settings className="h-5 w-5" />
                </button>
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-2 px-4 py-2.5 text-sm font-black text-blue-700 hover:text-blue-900 hover:bg-gradient-to-r from-orange-100 to-yellow-100 rounded-2xl transition-all border-2 border-blue-200 hover:border-orange-300"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Exit Park</span>
                </button>
              </div>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2.5 text-blue-600 hover:text-blue-800 hover:bg-gradient-to-r from-blue-100 to-yellow-100 rounded-2xl transition-all border-2 border-blue-200"
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-gradient-to-b from-white to-blue-50/95 border-t-4 border-yellow-300 shadow-2xl">
          <div className="px-4 py-6 space-y-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center space-x-3 px-4 py-4 rounded-2xl font-bold text-sm transition-all duration-300 border-2 ${
                    active
                      ? `bg-gradient-to-r ${item.color} text-white border-white`
                      : 'bg-white text-blue-700 border-blue-200 hover:border-yellow-300'
                  }`}
                >
                  <div className={`p-2 rounded-xl ${
                    active 
                      ? 'bg-white/20' 
                      : `bg-gradient-to-r ${item.color} text-white`
                  }`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <span>{item.label}</span>
                  {active && (
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse ml-auto"></div>
                  )}
                </Link>
              );
            })}
            
            {/* Mobile User Info */}
            <div className="pt-4 border-t-2 border-yellow-200">
              <div className="px-4 py-3">
                <p className="text-sm font-black text-blue-800">
                  {user?.user_metadata?.full_name || 'Park Manager'}
                </p>
                <p className="text-xs text-blue-600 font-bold truncate">{user?.email}</p>
              </div>
              
              {parent && (
                <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-black border-2 border-white/20 mx-4 mb-4 ${getSubscriptionStatusColor(parent.subscription_status)}`}>
                  {parent.subscription_status === 'active' ? <Crown className="w-3 h-3" /> : <Zap className="w-3 h-3" />}
                  <span className="uppercase tracking-wider">
                    {parent.subscription_tier ? parent.subscription_tier.charAt(0).toUpperCase() + parent.subscription_tier.slice(1) : 'Explorer'}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}



