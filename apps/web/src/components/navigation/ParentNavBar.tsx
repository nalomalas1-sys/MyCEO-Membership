import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useParent } from '@/hooks/useParent';
import { Sparkles, Home, Users, CreditCard, LogOut, Settings } from 'lucide-react';

export function ParentNavBar() {
  const { user, signOut } = useAuth();
  const { parent } = useParent();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const getSubscriptionStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'trialing':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'past_due':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'canceled':
      case 'unpaid':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-8">
            <Link to="/dashboard" className="flex items-center space-x-2">
              <Sparkles className="h-8 w-8 text-primary-600" />
              <span className="text-xl font-bold text-gray-900">MyCEO</span>
            </Link>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center space-x-1">
              <Link
                to="/dashboard"
                className="flex items-center space-x-2 px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <Home className="h-4 w-4" />
                <span>Dashboard</span>
              </Link>
              <Link
                to="/dashboard"
                className="flex items-center space-x-2 px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <Users className="h-4 w-4" />
                <span>Children</span>
              </Link>
              <Link
                to="/pricing"
                className="flex items-center space-x-2 px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <CreditCard className="h-4 w-4" />
                <span>Billing</span>
              </Link>
            </div>
          </div>

          {/* Right Side - User Info and Actions */}
          <div className="flex items-center space-x-4">
            {/* Subscription Status Badge */}
            {parent && (
              <div className={`hidden lg:flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getSubscriptionStatusColor(parent.subscription_status)}`}>
                {parent.subscription_tier ? parent.subscription_tier.charAt(0).toUpperCase() + parent.subscription_tier.slice(1) : 'Trial'} - {parent.subscription_status}
              </div>
            )}

            {/* User Menu */}
            <div className="flex items-center space-x-3">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium text-gray-900">
                  {user?.user_metadata?.full_name || 'Parent'}
                </p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
              
              <div className="flex items-center space-x-2 border-l border-gray-200 pl-4">
                <button
                  onClick={() => navigate('/dashboard/settings')}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Settings"
                >
                  <Settings className="h-5 w-5" />
                </button>
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
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



