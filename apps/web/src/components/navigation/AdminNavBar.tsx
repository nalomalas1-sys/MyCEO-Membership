import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Sparkles, Home, Users, BookOpen, BarChart3, Settings, LogOut, Shield } from 'lucide-react';

export function AdminNavBar() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <nav className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 border-b border-gray-700 shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-8">
            <Link to="/admin/dashboard" className="flex items-center space-x-2">
              <Shield className="h-8 w-8 text-yellow-400" />
              <span className="text-xl font-bold text-white">MyCEO Admin</span>
            </Link>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center space-x-1">
              <Link
                to="/admin/dashboard"
                className="flex items-center space-x-2 px-4 py-2 rounded-lg text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
              >
                <Home className="h-4 w-4" />
                <span>Dashboard</span>
              </Link>
              <Link
                to="/admin/users"
                className="flex items-center space-x-2 px-4 py-2 rounded-lg text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
              >
                <Users className="h-4 w-4" />
                <span>Users</span>
              </Link>
              <Link
                to="/admin/content"
                className="flex items-center space-x-2 px-4 py-2 rounded-lg text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
              >
                <BookOpen className="h-4 w-4" />
                <span>Content</span>
              </Link>
              <Link
                to="/admin/analytics"
                className="flex items-center space-x-2 px-4 py-2 rounded-lg text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
              >
                <BarChart3 className="h-4 w-4" />
                <span>Analytics</span>
              </Link>
            </div>
          </div>

          {/* Right Side - User Info and Actions */}
          <div className="flex items-center space-x-4">
            {/* Admin Badge */}
            <div className="hidden lg:flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-400 text-gray-900">
              <Shield className="h-3 w-3 mr-1" />
              Admin
            </div>

            {/* User Menu */}
            <div className="flex items-center space-x-3">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium text-white">
                  {user?.user_metadata?.full_name || 'Admin'}
                </p>
                <p className="text-xs text-gray-400">{user?.email}</p>
              </div>
              
              <div className="flex items-center space-x-2 border-l border-gray-700 pl-4">
                <button
                  onClick={() => navigate('/admin/settings')}
                  className="p-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                  title="Settings"
                >
                  <Settings className="h-5 w-5" />
                </button>
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}



