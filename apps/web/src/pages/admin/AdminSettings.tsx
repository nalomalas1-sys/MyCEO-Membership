import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AdminNavBar } from '@/components/navigation/AdminNavBar';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { Save, User, Mail, Lock, Settings, Bell, Shield, Database, Globe, AlertCircle } from 'lucide-react';
import { LoadingAnimation } from '@/components/ui/LoadingAnimation';

function AdminSettingsContent() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    if (user) {
      setFullName(user.user_metadata?.full_name || '');
      setEmail(user.email || '');
      setFetching(false);
    }
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Update user metadata
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          full_name: fullName,
        },
      });

      if (updateError) throw updateError;

      // Update users table
      const { error: dbError } = await supabase
        .from('users')
        .update({ full_name: fullName })
        .eq('id', user?.id);

      if (dbError) throw dbError;

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    setError(null);
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (resetError) throw resetError;
      alert('Password reset email sent! Check your inbox.');
    } catch (err: any) {
      setError(err.message || 'Failed to send password reset email');
    }
  };

  if (fetching) {
    return <LoadingAnimation message="Loading settings..." variant="fullscreen" />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavBar />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">System Settings</h1>
          <p className="text-gray-600">Manage your admin account and system preferences</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center space-x-2">
            <AlertCircle className="h-5 w-5" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
            Profile updated successfully!
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Settings Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Settings */}
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <User className="h-5 w-5 text-blue-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Profile Information</h2>
              </div>

              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div>
                  <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your full name"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <div className="flex items-center space-x-2">
                    <Mail className="h-5 w-5 text-gray-400" />
                    <input
                      id="email"
                      type="email"
                      value={email}
                      disabled
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                    />
                  </div>
                  <p className="mt-1 text-sm text-gray-500">Email cannot be changed</p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-lg font-medium transition-all flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
                >
                  <Save className="h-4 w-4" />
                  <span>{loading ? 'Saving...' : 'Save Changes'}</span>
                </button>
              </form>
            </div>

            {/* Security Settings */}
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-2 bg-red-100 rounded-lg">
                  <Lock className="h-5 w-5 text-red-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Security</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Change Password</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    We'll send you an email with instructions to reset your password.
                  </p>
                  <button
                    onClick={handleChangePassword}
                    className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
                  >
                    Send Password Reset Email
                  </button>
                </div>
              </div>
            </div>

            {/* System Information */}
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Database className="h-5 w-5 text-purple-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">System Information</h2>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-gray-200">
                  <span className="text-sm text-gray-600">Role</span>
                  <span className="text-sm font-medium text-gray-900 bg-amber-100 text-amber-800 px-3 py-1 rounded-full">
                    Administrator
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-200">
                  <span className="text-sm text-gray-600">User ID</span>
                  <span className="text-sm font-mono text-gray-900">{user?.id?.substring(0, 8)}...</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-gray-600">Account Created</span>
                  <span className="text-sm text-gray-900">
                    {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar - Quick Actions */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <button
                  onClick={() => navigate('/admin/dashboard')}
                  className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors font-medium text-gray-700 flex items-center space-x-2"
                >
                  <Settings className="h-4 w-4" />
                  <span>Back to Dashboard</span>
                </button>
                <button
                  onClick={() => navigate('/admin/users')}
                  className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors font-medium text-gray-700 flex items-center space-x-2"
                >
                  <User className="h-4 w-4" />
                  <span>Manage Users</span>
                </button>
                <button
                  onClick={() => navigate('/admin/analytics')}
                  className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors font-medium text-gray-700 flex items-center space-x-2"
                >
                  <Database className="h-4 w-4" />
                  <span>View Analytics</span>
                </button>
              </div>
            </div>

            {/* Account Actions */}
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Actions</h3>
              <div className="space-y-2">
                <button
                  onClick={async () => {
                    await signOut();
                    navigate('/');
                  }}
                  className="w-full px-4 py-3 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg transition-colors font-medium flex items-center justify-center space-x-2"
                >
                  <Lock className="h-4 w-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>

            {/* Help & Support */}
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl shadow-lg p-6 border border-blue-200">
              <div className="flex items-center space-x-2 mb-3">
                <Globe className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">Need Help?</h3>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                If you need assistance with system settings or have questions, please contact support.
              </p>
              <button
                onClick={() => navigate('/admin/support')}
                className="w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                Contact Support
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminSettingsPage() {
  return (
    <ProtectedRoute requireRole="admin">
      <AdminSettingsContent />
    </ProtectedRoute>
  );
}





