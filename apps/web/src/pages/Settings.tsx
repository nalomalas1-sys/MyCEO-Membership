import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/hooks/useAuth';
import { useParent } from '@/hooks/useParent';
import { ParentNavBar } from '@/components/navigation/ParentNavBar';
import { supabase } from '@/lib/supabase';
import { Save, User, Mail, Lock, CreditCard, ExternalLink } from 'lucide-react';

function SettingsContent() {
  const { user, signOut } = useAuth();
  const { parent, refetch: refetchParent } = useParent();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setFullName(user.user_metadata?.full_name || '');
      setEmail(user.email || '');
    }
  }, [user]);

  // Refetch parent data when component mounts (e.g., after returning from portal)
  useEffect(() => {
    if (user && refetchParent) {
      refetchParent();
    }
  }, [user, refetchParent]);

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

  const handleManageBilling = async () => {
    setPortalLoading(true);
    setError(null);
    try {
      const { data, error: portalError } = await supabase.functions.invoke('create-portal-session', {
        body: {
          returnUrl: `${window.location.origin}/dashboard/settings`,
        },
      });

      if (portalError) throw portalError;
      if (!data?.url) throw new Error('No portal URL returned');

      // Redirect to Stripe Customer Portal
      window.location.href = data.url;
    } catch (err: any) {
      setError(err.message || 'Failed to open billing portal. Please try again.');
      setPortalLoading(false);
    }
  };

  const getSubscriptionStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-600 bg-green-50';
      case 'trialing':
        return 'text-blue-600 bg-blue-50';
      case 'past_due':
        return 'text-yellow-600 bg-yellow-50';
      case 'canceled':
      case 'unpaid':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getSubscriptionTierName = (tier: string | null) => {
    if (!tier) return 'No Plan';
    return tier.charAt(0).toUpperCase() + tier.slice(1);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <ParentNavBar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
          <p className="text-gray-600">Manage your account settings and preferences</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
            Profile updated successfully!
          </div>
        )}

        <div className="space-y-6">
          {/* Profile Settings */}
          <div className="card">
            <div className="flex items-center space-x-3 mb-6">
              <User className="h-6 w-6 text-primary-600" />
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
                className="btn btn-primary flex items-center space-x-2"
              >
                <Save className="h-4 w-4" />
                <span>{loading ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </form>
          </div>

          {/* Billing & Subscription */}
          <div className="card">
            <div className="flex items-center space-x-3 mb-6">
              <CreditCard className="h-6 w-6 text-primary-600" />
              <h2 className="text-xl font-semibold text-gray-900">Billing & Subscription</h2>
            </div>

            {parent ? (
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-1">Current Plan</h3>
                      <p className="text-lg font-semibold text-gray-900">
                        {getSubscriptionTierName(parent.subscription_tier)}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${getSubscriptionStatusColor(
                        parent.subscription_status
                      )}`}
                    >
                      {parent.subscription_status}
                    </span>
                  </div>
                  {parent.subscription_status === 'trialing' && parent.trial_ends_at && (
                    <p className="text-sm text-gray-600 mb-2">
                      Trial ends: {new Date(parent.trial_ends_at).toLocaleDateString()}
                    </p>
                  )}
                  {parent.subscription_status === 'active' && (
                    <p className="text-sm text-gray-600">
                      Your subscription is active and will renew automatically.
                    </p>
                  )}
                </div>

                <div>
                  <p className="text-sm text-gray-600 mb-4">
                    Manage your subscription, update payment methods, view invoices, and more in the Stripe Customer Portal.
                  </p>
                  <button
                    onClick={handleManageBilling}
                    disabled={portalLoading || !parent.stripe_customer_id}
                    className="btn btn-primary flex items-center space-x-2 disabled:opacity-50"
                  >
                    <ExternalLink className="h-4 w-4" />
                    <span>{portalLoading ? 'Opening...' : 'Manage Billing'}</span>
                  </button>
                  {!parent.stripe_customer_id && (
                    <p className="mt-2 text-sm text-yellow-600">
                      No billing account found. Please subscribe to a plan first.
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-4">
                  No subscription information available. Please subscribe to a plan to access billing management.
                </p>
                <button
                  onClick={() => navigate('/pricing')}
                  className="btn btn-primary"
                >
                  View Plans
                </button>
              </div>
            )}
          </div>

          {/* Security Settings */}
          <div className="card">
            <div className="flex items-center space-x-3 mb-6">
              <Lock className="h-6 w-6 text-primary-600" />
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
                  className="btn btn-secondary"
                >
                  Send Password Reset Email
                </button>
              </div>
            </div>
          </div>

          {/* Account Actions */}
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Account Actions</h2>
            <div className="space-y-4">
              <button
                onClick={async () => {
                  await signOut();
                  navigate('/');
                }}
                className="btn btn-secondary w-full sm:w-auto"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <ProtectedRoute>
      <SettingsContent />
    </ProtectedRoute>
  );
}



