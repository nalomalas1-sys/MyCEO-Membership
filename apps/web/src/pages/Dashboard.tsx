import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/hooks/useAuth';
import { useParent, useChildren } from '@/hooks/useParent';
import { AddChildModal } from '@/components/parent/AddChildModal';
import { ChildCard } from '@/components/parent/ChildCard';
import { EditChildModal } from '@/components/parent/EditChildModal';
import { ParentNavBar } from '@/components/navigation/ParentNavBar';
import { RecentActivityFeed } from '@/components/parent/RecentActivityFeed';
import { supabase } from '@/lib/supabase';
import { Child } from '@/types/child';
import { CheckCircle2, X } from 'lucide-react';

function DashboardContent() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { parent, loading: parentLoading, refetch: refetchParent } = useParent();
  const { children, loading: childrenLoading, refetch } = useChildren();
  const [isAddChildModalOpen, setIsAddChildModalOpen] = useState(false);
  const [editingChild, setEditingChild] = useState<Child | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [deletingChildId, setDeletingChildId] = useState<string | null>(null);
  const [childLoginCode, setChildLoginCode] = useState('');
  const [childLoginError, setChildLoginError] = useState<string | null>(null);
  const [childLoginLoading, setChildLoginLoading] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  // Handle checkout success
  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    if (sessionId) {
      // Checkout was successful
      setCheckoutSuccess(true);
      // Refetch parent data to get updated subscription status
      refetchParent();
      // Remove session_id from URL
      navigate('/dashboard', { replace: true });
    }
  }, [searchParams, navigate, refetchParent]);

  const handleAddChildSuccess = () => {
    refetch();
  };

  const handleEditChild = (child: Child) => {
    setEditingChild(child);
    setIsEditModalOpen(true);
  };

  const handleEditSuccess = () => {
    refetch();
    setIsEditModalOpen(false);
    setEditingChild(null);
  };

  const handleDeleteChild = async (childId: string) => {
    if (
      !confirm(
        'Are you sure you want to remove this child? They will be permanently deleted after 30 days. You can restore them before then.'
      )
    ) {
      return;
    }

    setDeletingChildId(childId);
    try {
      // Soft delete - set deleted_at timestamp
      const { error } = await supabase
        .from('children')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', childId);

      if (error) throw error;
      refetch();
    } catch (err: any) {
      alert('Failed to delete child: ' + (err.message || 'Unknown error'));
    } finally {
      setDeletingChildId(null);
    }
  };

  const handleViewChildDetails = (childId: string) => {
    navigate(`/dashboard/children/${childId}`);
  };

  const handleChildLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setChildLoginLoading(true);
    setChildLoginError(null);

    try {
      // Clear any existing Supabase auth session to ensure we use anon role
      // This is important because child sessions use access codes, not Supabase Auth
      await supabase.auth.signOut();

      // Format code (ensure uppercase, keep dashes as stored in DB)
      const formattedCode = childLoginCode.toUpperCase().trim();
      
      // Query for child with this access code
      const { data: child, error: queryError } = await supabase
        .from('children')
        .select('id, name, access_code')
        .eq('access_code', formattedCode)
        .single();

      if (queryError || !child) {
        setChildLoginError('Invalid access code. Please try again.');
        return;
      }

      // Store child session in localStorage (for child sessions)
      localStorage.setItem('child_session', JSON.stringify({
        childId: child.id,
        childName: child.name,
        accessCode: formattedCode,
      }));

      navigate('/child/dashboard');
    } catch (err) {
      setChildLoginError('An unexpected error occurred');
    } finally {
      setChildLoginLoading(false);
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
    if (!tier) return 'Free Trial';
    return tier.charAt(0).toUpperCase() + tier.slice(1);
  };

  if (parentLoading || childrenLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ParentNavBar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user?.user_metadata?.full_name || 'Parent'}!
          </h1>
          <p className="text-gray-600">Manage your children's learning journey</p>
        </div>

        {/* Checkout Success Message */}
        {checkoutSuccess && (
          <div className="mb-6 bg-green-50 border-2 border-green-200 rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-semibold text-green-900">Subscription Activated!</p>
                <p className="text-sm text-green-700">
                  Your subscription is now active. You can start adding children and accessing all features.
                </p>
              </div>
            </div>
            <button
              onClick={() => setCheckoutSuccess(false)}
              className="text-green-600 hover:text-green-800"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}

        {/* Checkout Error Message */}
        {checkoutError && (
          <div className="mb-6 bg-red-50 border-2 border-red-200 rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <X className="h-5 w-5 text-red-600" />
              <div>
                <p className="font-semibold text-red-900">Checkout Failed</p>
                <p className="text-sm text-red-700">{checkoutError}</p>
              </div>
            </div>
            <button
              onClick={() => setCheckoutError(null)}
              className="text-red-600 hover:text-red-800"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}

        {/* Subscription Status Card */}
        {parent && (
          <div className="card mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold mb-2">Subscription Status</h2>
                <div className="flex items-center gap-3">
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${getSubscriptionStatusColor(
                      parent.subscription_status
                    )}`}
                  >
                    {getSubscriptionTierName(parent.subscription_tier)} - {parent.subscription_status}
                  </span>
                  {parent.subscription_status === 'trialing' && parent.trial_ends_at && (
                    <span className="text-sm text-gray-600">
                      Trial ends: {new Date(parent.trial_ends_at).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex gap-3">
                {parent.subscription_status === 'trialing' || parent.subscription_status === 'active' ? (
                  <button
                    onClick={() => navigate('/pricing')}
                    className="btn btn-secondary"
                  >
                    Change Plan
                  </button>
                ) : (
                  <button
                    onClick={() => navigate('/pricing')}
                    className="btn btn-primary"
                  >
                    Subscribe Now
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* No Subscription - Show Upgrade Prompt */}
        {parent && (parent.subscription_status === 'unpaid' || !parent.subscription_tier) && (
          <div className="card mb-8 bg-gradient-to-r from-primary-50 to-purple-50 border-2 border-primary-200">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Upgrade to Unlock All Features</h2>
                <p className="text-gray-600">
                  Subscribe to add multiple children, access all modules, and unlock the virtual company builder.
                </p>
              </div>
              <button
                onClick={() => navigate('/pricing')}
                className="btn btn-primary whitespace-nowrap"
              >
                View Plans
              </button>
            </div>
          </div>
        )}

        {/* Child Login Section */}
        <div className="card mb-8 bg-gradient-to-br from-yellow-50 via-pink-50 to-purple-50 border-2 border-primary-200">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Child Login</h2>
              <p className="text-sm text-gray-600 mb-4">
                Let your child enter their access code to access their learning dashboard
              </p>
              <form onSubmit={handleChildLogin} className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <input
                    type="text"
                    value={childLoginCode}
                    onChange={(e) => {
                      // Auto-format as ABC-123
                      let value = e.target.value.replace(/[^A-Z0-9]/gi, '').toUpperCase();
                      if (value.length > 3) {
                        value = value.slice(0, 3) + '-' + value.slice(3, 6);
                      }
                      setChildLoginCode(value);
                      setChildLoginError(null);
                    }}
                    placeholder="ABC-123"
                    maxLength={7}
                    className="w-full px-4 py-3 text-xl text-center font-mono border-2 border-primary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
                    style={{ letterSpacing: '0.2em' }}
                  />
                  {childLoginError && (
                    <p className="mt-2 text-sm text-red-600">{childLoginError}</p>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={childLoginLoading || childLoginCode.length < 7}
                  className="px-6 py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  {childLoginLoading ? 'Entering...' : 'Enter Dashboard'}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Children Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Your Children ({children.length})</h2>
            {parent && (
              <button
                onClick={() => setIsAddChildModalOpen(true)}
                className="btn btn-primary"
              >
                + Add Child
              </button>
            )}
          </div>

          {children.length === 0 ? (
            <div className="card text-center py-12">
              <p className="text-gray-600 mb-4">You haven't added any children yet.</p>
              {parent && (
                <button
                  onClick={() => setIsAddChildModalOpen(true)}
                  className="btn btn-primary"
                >
                  Add Your First Child
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {children.map((child) => (
                <div key={child.id} className="relative">
                  <ChildCard
                    child={child}
                    onViewDetails={handleViewChildDetails}
                    onEdit={handleEditChild}
                  />
                  <button
                    onClick={() => handleDeleteChild(child.id)}
                    disabled={deletingChildId === child.id}
                    className="absolute top-2 right-2 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                    title="Delete child"
                  >
                    {deletingChildId === child.id ? '...' : '×'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Progress Overview & Recent Activity */}
        {children.length > 0 && parent && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Enhanced Progress Stats */}
            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="card">
                <h3 className="text-lg font-semibold mb-2">Total XP</h3>
                <p className="text-3xl font-bold text-primary-600">
                  {children.reduce((sum, child) => sum + child.total_xp, 0).toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Across {children.length} {children.length === 1 ? 'child' : 'children'}
                </p>
              </div>
              <div className="card">
                <h3 className="text-lg font-semibold mb-2">Average Level</h3>
                <p className="text-3xl font-bold text-primary-600">
                  {Math.round(
                    children.reduce((sum, child) => sum + child.current_level, 0) / children.length
                  )}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {children.filter((c) => c.current_level > 1).length} above level 1
                </p>
              </div>
              <div className="card">
                <h3 className="text-lg font-semibold mb-2">Active Streaks</h3>
                <p className="text-3xl font-bold text-primary-600">
                  {children.filter((child) => child.current_streak > 0).length}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Longest: {Math.max(...children.map((c) => c.current_streak), 0)} days
                </p>
              </div>
            </div>

            {/* Recent Activity Feed */}
            <div className="lg:col-span-1">
              <RecentActivityFeed parentId={parent.id} limit={5} />
            </div>
          </div>
        )}

        {/* Add Child Modal */}
        {parent && (
          <AddChildModal
            isOpen={isAddChildModalOpen}
            onClose={() => setIsAddChildModalOpen(false)}
            onSuccess={handleAddChildSuccess}
            parentId={parent.id}
          />
        )}

        {/* Edit Child Modal */}
        {editingChild && (
          <EditChildModal
            isOpen={isEditModalOpen}
            onClose={() => {
              setIsEditModalOpen(false);
              setEditingChild(null);
            }}
            onSuccess={handleEditSuccess}
            child={editingChild}
          />
        )}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}



