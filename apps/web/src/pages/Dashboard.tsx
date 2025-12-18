import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/hooks/useAuth';
import { useParent, useChildren, useDeletedChildren } from '@/hooks/useParent';
import { AddChildModal } from '@/components/parent/AddChildModal';
import { ChildCard } from '@/components/parent/ChildCard';
import { EditChildModal } from '@/components/parent/EditChildModal';
import { ParentNavBar } from '@/components/navigation/ParentNavBar';
import { RecentActivityFeed } from '@/components/parent/RecentActivityFeed';
import { LoadingAnimation } from '@/components/ui/LoadingAnimation';
import { supabase } from '@/lib/supabase';
import { Child } from '@/types/child';
import { CheckCircle2, X, Sparkles, Users, TrendingUp, Award, Zap, RotateCcw, Trash2 } from 'lucide-react';
import { BackgroundEffects, FloatingCharacters, BusinessCharacter, FloatingBackgroundStyles } from '@/components/ui/FloatingBackground';

function DashboardContent() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { parent, loading: parentLoading, refetch: refetchParent } = useParent();
  const { children, loading: childrenLoading, refetch } = useChildren();
  const { deletedChildren, refetch: refetchDeleted, restoreChild } = useDeletedChildren();
  const [isAddChildModalOpen, setIsAddChildModalOpen] = useState(false);
  const [editingChild, setEditingChild] = useState<Child | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [deletingChildId, setDeletingChildId] = useState<string | null>(null);
  const [childLoginCode, setChildLoginCode] = useState('');
  const [childLoginError, setChildLoginError] = useState<string | null>(null);
  const [childLoginLoading, setChildLoginLoading] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [subscription, setSubscription] = useState<{
    current_period_start: string | null;
    current_period_end: string | null;
  } | null>(null);

  // Track viewport size to trim heavy visuals on mobile and improve performance
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  // Fetch subscription billing period
  useEffect(() => {
    if (!parent) return;

    async function fetchSubscription() {
      try {
        const { data, error } = await supabase
          .from('subscriptions')
          .select('current_period_start, current_period_end')
          .eq('parent_id', parent!.id)
          .in('status', ['active', 'trialing'])
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching subscription:', error);
          return;
        }

        if (data) {
          setSubscription(data);
        }
      } catch (err) {
        console.error('Failed to fetch subscription:', err);
      }
    }

    fetchSubscription();
  }, [parent]);

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
      refetchDeleted();
    } catch (err: any) {
      alert('Failed to delete child: ' + (err.message || 'Unknown error'));
    } finally {
      setDeletingChildId(null);
    }
  };

  const handleRestoreChild = async (childId: string) => {
    const result = await restoreChild(childId);
    if (result.success) {
      refetch();
      refetchDeleted();
    } else {
      alert('Failed to restore child: ' + (result.error || 'Unknown error'));
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
      
      // Check child and parent subscription status using database function
      const { data: result, error: queryError } = await supabase
        .rpc('check_parent_subscription_by_access_code', {
          p_access_code: formattedCode
        })
        .single();

      if (queryError || !result) {
        setChildLoginError('Invalid access code. Please try again.');
        return;
      }

      // Type assertion for RPC result
      const subscriptionResult = result as {
        child_id: string;
        child_name: string;
        access_code: string;
        parent_subscription_status: string;
        subscription_valid: boolean;
      };

      // Check if subscription is valid (active or trialing)
      if (!subscriptionResult.subscription_valid) {
        setChildLoginError('Access unavailable. Please ask your parent to renew their subscription.');
        return;
      }

      // Store child session in localStorage (for child sessions)
      localStorage.setItem('child_session', JSON.stringify({
        childId: subscriptionResult.child_id,
        childName: subscriptionResult.child_name,
        accessCode: subscriptionResult.access_code,
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
    return <LoadingAnimation message="Loading dashboard..." variant="fullscreen" />;
  }

  return (
    <div className="min-h-screen relative bg-gradient-to-b from-blue-100 via-yellow-50 to-amber-50 font-sans text-blue-900 overflow-hidden selection:bg-yellow-300 selection:text-yellow-900">
      {!isMobile && (
        <>
          <BackgroundEffects />
          <FloatingCharacters />
          <BusinessCharacter />
          <FloatingBackgroundStyles />
        </>
      )}
      
      <ParentNavBar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <Sparkles className="h-8 w-8 text-blue-600" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-yellow-500 to-pink-500 bg-clip-text text-transparent">
              Welcome back, {user?.user_metadata?.full_name || 'Parent'}! 🎉
          </h1>
          </div>
          <p className="text-lg text-gray-700">Manage your children's learning journey at the Park</p>
        </div>

        {/* Checkout Success Message */}
        {checkoutSuccess && (
          <div className="mb-6 bg-gradient-to-r from-green-100 to-emerald-100 border-2 border-green-300 rounded-xl p-5 flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 bg-green-500 rounded-full flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="font-bold text-green-900 text-lg">🎉 Subscription Activated!</p>
                <p className="text-sm text-green-800">
                  Your subscription is now active. You can start adding children and accessing all features.
                </p>
              </div>
            </div>
            <button
              onClick={() => setCheckoutSuccess(false)}
              className="text-green-600 hover:text-green-800 hover:bg-green-100 rounded-lg p-2 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}

        {/* Checkout Error Message */}
        {checkoutError && (
          <div className="mb-6 bg-gradient-to-r from-red-100 to-rose-100 border-2 border-red-300 rounded-xl p-5 flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 bg-red-500 rounded-full flex items-center justify-center">
                <X className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="font-bold text-red-900 text-lg">Checkout Failed</p>
                <p className="text-sm text-red-800">{checkoutError}</p>
              </div>
            </div>
            <button
              onClick={() => setCheckoutError(null)}
              className="text-red-600 hover:text-red-800 hover:bg-red-100 rounded-lg p-2 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}

        {/* Subscription Status Card */}
        {parent && (
          <div className="bg-white rounded-2xl p-6 mb-8 shadow-lg border-2 border-blue-200">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <Award className="h-6 w-6 text-yellow-500" />
                  Subscription Status
                </h2>
                <div className="flex flex-wrap items-center gap-3">
                  <span
                    className={`px-4 py-2 rounded-full text-sm font-bold ${getSubscriptionStatusColor(
                      parent.subscription_status
                    )} shadow-md`}
                  >
                    {getSubscriptionTierName(parent.subscription_tier)} - {parent.subscription_status}
                  </span>
                  {parent.subscription_status === 'trialing' && parent.trial_ends_at && (
                    <span className="text-sm text-gray-700 font-medium">
                      ⏰ Trial ends: {new Date(parent.trial_ends_at).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex gap-3">
                {parent.subscription_status === 'trialing' || parent.subscription_status === 'active' ? (
                  <button
                    onClick={() => navigate('/pricing')}
                    className="px-6 py-3 bg-gray-100 text-gray-900 font-semibold rounded-xl hover:bg-gray-200 transition-all shadow-md hover:shadow-lg"
                  >
                    Change Plan
                  </button>
                ) : (
                  <button
                    onClick={() => navigate('/pricing')}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-yellow-500 text-white font-bold rounded-xl hover:from-blue-700 hover:to-yellow-600 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
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
          <div className="bg-white rounded-xl p-6 mb-8 border border-gray-200 shadow-sm">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Upgrade Your Plan
                </h2>
                <p className="text-gray-600">
                  Subscribe to unlock all features and add multiple children.
                </p>
              </div>
              <button
                onClick={() => navigate('/pricing')}
                className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
              >
                View Plans
              </button>
            </div>
          </div>
        )}

        {/* Billing Period Info */}
        {parent && (parent.subscription_status === 'active' || parent.subscription_status === 'trialing') && (
          <div className="bg-white rounded-xl p-5 mb-8 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Billing Period</h3>
                {subscription?.current_period_start && subscription?.current_period_end ? (
                  <p className="text-base text-gray-900">
                    {new Date(subscription.current_period_start).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })} - {new Date(subscription.current_period_end).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </p>
                ) : parent.trial_ends_at ? (
                  <p className="text-base text-gray-900">
                    Trial ends: {new Date(parent.trial_ends_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </p>
                ) : (
                  <p className="text-base text-gray-900">Active subscription</p>
                )}
              </div>
              <button
                onClick={() => navigate('/settings')}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Manage Billing
              </button>
            </div>
          </div>
        )}

        {/* Child Login Section */}
        <div className="bg-gradient-to-br from-yellow-100 via-pink-100 to-purple-100 rounded-2xl p-6 mb-8 border-2 border-yellow-300 shadow-xl">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                <Users className="h-6 w-6 text-pink-500" />
                Child Login Portal 🎮
              </h2>
              <p className="text-gray-700 mb-4 text-lg">
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
                    className="w-full px-4 py-3 text-2xl text-center font-mono border-2 border-blue-400 rounded-xl focus:ring-4 focus:ring-blue-300 focus:border-blue-500 bg-white shadow-lg"
                    style={{ letterSpacing: '0.2em' }}
                  />
                  {childLoginError && (
                    <p className="mt-2 text-sm text-red-600 font-semibold">{childLoginError}</p>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={childLoginLoading || childLoginCode.length < 7}
                  className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-blue-600 to-yellow-500 text-white font-bold rounded-xl hover:from-blue-700 hover:to-yellow-600 focus:outline-none focus:ring-4 focus:ring-blue-300 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none whitespace-nowrap"
                >
                  {childLoginLoading ? 'Entering...' : 'Enter Dashboard 🚀'}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Children Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-yellow-500 to-pink-500 bg-clip-text text-transparent flex items-center gap-3">
              <Users className="h-8 w-8 text-blue-600" />
              Your Children ({children.length}) 👨‍👩‍👧‍👦
            </h2>
            {parent && (
              <button
                onClick={() => setIsAddChildModalOpen(true)}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-yellow-500 text-white font-bold rounded-xl hover:from-blue-700 hover:to-yellow-600 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center gap-2"
              >
                <Sparkles className="h-5 w-5" />
                + Add Child
              </button>
            )}
          </div>

          {children.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center shadow-lg border-2 border-blue-200">
              <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-xl text-gray-600 mb-6 font-semibold">You haven't added any children yet.</p>
              {parent && (
                <button
                  onClick={() => setIsAddChildModalOpen(true)}
                  className="px-8 py-4 bg-gradient-to-r from-blue-600 to-yellow-500 text-white font-bold rounded-xl hover:from-blue-700 hover:to-yellow-600 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  Add Your First Child 🎉
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
                    className="absolute top-2 right-2 p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50 bg-white shadow-md"
                    title="Delete child"
                  >
                    {deletingChildId === child.id ? '...' : '×'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Deleted Children Section */}
        {deletedChildren.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-700 flex items-center gap-3">
                <Trash2 className="h-6 w-6 text-gray-500" />
                Deleted Children ({deletedChildren.length})
              </h2>
              <p className="text-sm text-gray-500">
                These children will be permanently deleted after 30 days
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {deletedChildren.map((child) => {
                const deletedDate = child.deleted_at ? new Date(child.deleted_at) : null;
                const daysUntilPermanent = deletedDate 
                  ? Math.ceil((30 - (Date.now() - deletedDate.getTime()) / (1000 * 60 * 60 * 24)))
                  : 0;
                
                return (
                  <div key={child.id} className="relative bg-gray-100 rounded-2xl p-6 shadow-lg border-2 border-gray-300 opacity-75">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-gray-700 mb-1">{child.name}</h3>
                        <p className="text-sm text-gray-500">Access Code: {child.access_code}</p>
                        {deletedDate && (
                          <p className="text-xs text-gray-500 mt-2">
                            Deleted: {deletedDate.toLocaleDateString()}
                            {daysUntilPermanent > 0 && (
                              <span className="ml-2 text-orange-600 font-semibold">
                                ({daysUntilPermanent} days until permanent deletion)
                              </span>
                            )}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-4">
                      <button
                        onClick={() => handleRestoreChild(child.id)}
                        className="flex-1 px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                        title="Restore child"
                      >
                        <RotateCcw className="h-4 w-4" />
                        Restore
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Progress Overview & Recent Activity */}
        {children.length > 0 && parent && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Enhanced Progress Stats */}
            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-blue-200 hover:shadow-xl transition-all">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="h-6 w-6 text-blue-600" />
                  <h3 className="text-lg font-bold text-gray-900">Total XP</h3>
                </div>
                <p className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-yellow-500 bg-clip-text text-transparent">
                  {children.reduce((sum, child) => sum + child.total_xp, 0).toLocaleString()}
                </p>
                <p className="text-sm text-gray-600 mt-2 font-medium">
                  Across {children.length} {children.length === 1 ? 'child' : 'children'}
                </p>
              </div>
              <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-yellow-200 hover:shadow-xl transition-all">
                <div className="flex items-center gap-2 mb-3">
                  <Award className="h-6 w-6 text-yellow-600" />
                  <h3 className="text-lg font-bold text-gray-900">Average Level</h3>
                </div>
                <p className="text-4xl font-bold bg-gradient-to-r from-yellow-500 to-pink-500 bg-clip-text text-transparent">
                  {Math.round(
                    children.reduce((sum, child) => sum + child.current_level, 0) / children.length
                  )}
                </p>
                <p className="text-sm text-gray-600 mt-2 font-medium">
                  {children.filter((c) => c.current_level > 1).length} above level 1
                </p>
              </div>
              <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-pink-200 hover:shadow-xl transition-all">
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="h-6 w-6 text-pink-600" />
                  <h3 className="text-lg font-bold text-gray-900">Active Streaks</h3>
                </div>
                <p className="text-4xl font-bold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
                  {children.filter((child) => child.current_streak > 0).length}
                </p>
                <p className="text-sm text-gray-600 mt-2 font-medium">
                  Longest: {Math.max(...children.map((c) => c.current_streak), 0)} days 🔥
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



