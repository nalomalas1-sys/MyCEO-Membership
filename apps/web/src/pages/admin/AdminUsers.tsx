import { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AdminNavBar } from '@/components/navigation/AdminNavBar';
import { supabase } from '@/lib/supabase';
import { Search, Mail, Users, Calendar, CreditCard, ChevronDown, ChevronUp, Settings, Clock, Trash2 } from 'lucide-react';
import { LoadingAnimation } from '@/components/ui/LoadingAnimation';

interface ParentWithUser {
  id: string;
  user_id: string;
  stripe_customer_id: string | null;
  subscription_tier: string | null;
  subscription_status: string;
  trial_ends_at: string | null;
  created_at: string;
  user: {
    email: string;
    full_name: string | null;
  };
  children_count: number;
}

interface Child {
  id: string;
  name: string;
  age: number | null;
  access_code: string;
  total_xp: number;
  current_level: number;
  current_streak: number;
  created_at: string;
}

function AdminUsersContent() {
  const [parents, setParents] = useState<ParentWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [expandedParentId, setExpandedParentId] = useState<string | null>(null);
  const [childrenMap, setChildrenMap] = useState<Record<string, Child[]>>({});
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [selectedParent, setSelectedParent] = useState<ParentWithUser | null>(null);
  const [showDeleteParentConfirm, setShowDeleteParentConfirm] = useState(false);
  const [showDeleteChildConfirm, setShowDeleteChildConfirm] = useState(false);
  const [selectedChildToDelete, setSelectedChildToDelete] = useState<{ child: Child; parentId: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchParents();
  }, [statusFilter]);

  async function fetchParents() {
    try {
      setLoading(true);

      // Build query - admins can now see all parents thanks to RLS policies
      let query = supabase
        .from('parents')
        .select('id, user_id, stripe_customer_id, subscription_tier, subscription_status, trial_ends_at, created_at')
        .order('created_at', { ascending: false });

      // Apply status filter
      if (statusFilter !== 'all') {
        query = query.eq('subscription_status', statusFilter);
      }

      const { data: parentsData, error } = await query;

      if (error) throw error;

      // Fetch user data and children counts for all parents in parallel
      const parentsWithCounts = await Promise.all(
        (parentsData || []).map(async (parent) => {
          // Get user info - admins can now see all users thanks to RLS policies
          const { data: userData } = await supabase
            .from('users')
            .select('email, full_name')
            .eq('id', parent.user_id)
            .single();

          // Get children count - admins can now see all children thanks to RLS policies
          const { count } = await supabase
            .from('children')
            .select('id', { count: 'exact', head: true })
            .eq('parent_id', parent.id);

          return {
            ...parent,
            user: userData || { email: '', full_name: null },
            children_count: count || 0,
          };
        })
      );

      setParents(parentsWithCounts as ParentWithUser[]);
    } catch (error) {
      console.error('Failed to fetch parents:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchChildren(parentId: string) {
    if (childrenMap[parentId]) return; // Already loaded

    try {
      const { data, error } = await supabase
        .from('children')
        .select('id, name, age, access_code, total_xp, current_level, current_streak, created_at')
        .eq('parent_id', parentId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setChildrenMap((prev) => ({
        ...prev,
        [parentId]: data || [],
      }));
    } catch (error) {
      console.error('Failed to fetch children:', error);
    }
  }

  const handleToggleExpand = (parentId: string) => {
    if (expandedParentId === parentId) {
      setExpandedParentId(null);
    } else {
      setExpandedParentId(parentId);
      fetchChildren(parentId);
    }
  };

  const getSubscriptionStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'trialing':
        return 'bg-blue-100 text-blue-800';
      case 'past_due':
        return 'bg-yellow-100 text-yellow-800';
      case 'canceled':
        return 'bg-gray-100 text-gray-800';
      case 'unpaid':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getSubscriptionTierName = (tier: string | null) => {
    if (!tier) return 'No Plan';
    return tier.charAt(0).toUpperCase() + tier.slice(1);
  };

  const handleExtendTrial = async (parentId: string, days: number) => {
    try {
      const parent = parents.find((p) => p.id === parentId);
      if (!parent) return;

      const currentTrialEnd = parent.trial_ends_at
        ? new Date(parent.trial_ends_at)
        : new Date();
      const newTrialEnd = new Date(currentTrialEnd);
      newTrialEnd.setDate(newTrialEnd.getDate() + days);

      const { error } = await supabase
        .from('parents')
        .update({
          trial_ends_at: newTrialEnd.toISOString(),
          subscription_status: 'trialing',
        })
        .eq('id', parentId);

      if (error) throw error;

      fetchParents();
      setShowSupportModal(false);
      setSelectedParent(null);
      alert(`Trial extended by ${days} days`);
    } catch (error) {
      console.error('Failed to extend trial:', error);
      alert('Failed to extend trial');
    }
  };

  const handleUpdateSubscription = async (
    parentId: string,
    tier: string,
    status: string
  ) => {
    try {
      const { error } = await supabase
        .from('parents')
        .update({
          subscription_tier: tier || null,
          subscription_status: status,
        })
        .eq('id', parentId);

      if (error) throw error;

      fetchParents();
      setShowSubscriptionModal(false);
      setSelectedParent(null);
      alert('Subscription updated successfully');
    } catch (error) {
      console.error('Failed to update subscription:', error);
      alert('Failed to update subscription');
    }
  };

  const handleDeleteParent = async (parentId: string) => {
    setDeleting(true);
    try {
      const parent = parents.find((p) => p.id === parentId);
      if (!parent) return;

      // Delete all children first (this will cascade delete their data)
      const { data: childrenData } = await supabase
        .from('children')
        .select('id')
        .eq('parent_id', parentId);

      if (childrenData) {
        for (const child of childrenData) {
          await deleteChildData(child.id);
        }
      }

      // Delete parent record
      const { error: parentError } = await supabase
        .from('parents')
        .delete()
        .eq('id', parentId);

      if (parentError) throw parentError;

      // Delete user record (auth user will remain but profile deleted)
      const { error: userError } = await supabase
        .from('users')
        .delete()
        .eq('id', parent.user_id);

      if (userError) console.warn('Could not delete user record:', userError);

      fetchParents();
      setShowDeleteParentConfirm(false);
      setSelectedParent(null);
      alert('Parent account deleted successfully');
    } catch (error) {
      console.error('Failed to delete parent:', error);
      alert('Failed to delete parent account');
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteChild = async (childId: string, parentId: string) => {
    setDeleting(true);
    try {
      await deleteChildData(childId);

      // Remove from local state
      setChildrenMap((prev) => ({
        ...prev,
        [parentId]: prev[parentId]?.filter((c) => c.id !== childId) || [],
      }));

      // Update parent's children count
      fetchParents();
      setShowDeleteChildConfirm(false);
      setSelectedChildToDelete(null);
      alert('Child account deleted successfully');
    } catch (error) {
      console.error('Failed to delete child:', error);
      alert('Failed to delete child account');
    } finally {
      setDeleting(false);
    }
  };

  const deleteChildData = async (childId: string) => {
    // Delete child's company and transactions
    const { data: company } = await supabase
      .from('companies')
      .select('id')
      .eq('child_id', childId)
      .single();

    if (company) {
      await supabase.from('company_transactions').delete().eq('company_id', company.id);
      await supabase.from('companies').delete().eq('id', company.id);
    }

    // Delete marketplace items
    await supabase.from('marketplace_items').delete().eq('seller_child_id', childId);
    await supabase.from('marketplace_purchases').delete().eq('buyer_child_id', childId);

    // Delete progress and achievements
    await supabase.from('child_progress').delete().eq('child_id', childId);
    await supabase.from('child_achievements').delete().eq('child_id', childId);
    await supabase.from('quiz_attempts').delete().eq('child_id', childId);

    // Delete the child record
    const { error } = await supabase.from('children').delete().eq('id', childId);
    if (error) throw error;
  };

  const filteredParents = parents.filter((parent) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      parent.user.email.toLowerCase().includes(query) ||
      parent.user.full_name?.toLowerCase().includes(query) ||
      parent.stripe_customer_id?.toLowerCase().includes(query)
    );
  });

  if (loading) {
    return <LoadingAnimation message="Loading..." variant="fullscreen" />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavBar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">User Management</h1>
          <p className="text-gray-600">Manage parents, children, and subscriptions</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-gray-200">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search by email, name, or Stripe customer ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="trialing">Trialing</option>
              <option value="past_due">Past Due</option>
              <option value="canceled">Canceled</option>
              <option value="unpaid">Unpaid</option>
            </select>
          </div>
        </div>

        {/* Parents List */}
        <div className="space-y-4">
          {filteredParents.length === 0 ? (
            <div className="bg-white rounded-xl shadow-lg p-12 text-center border border-gray-200">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">No parents found</p>
            </div>
          ) : (
            filteredParents.map((parent) => (
              <div
                key={parent.id}
                className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden"
              >
                <div
                  className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => handleToggleExpand(parent.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {parent.user.full_name || 'No Name'}
                        </h3>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getSubscriptionStatusColor(
                            parent.subscription_status
                          )}`}
                        >
                          {getSubscriptionTierName(parent.subscription_tier)} - {parent.subscription_status}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Mail className="h-4 w-4" />
                          <span>{parent.user.email}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          <span>{parent.children_count} {parent.children_count === 1 ? 'child' : 'children'}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>Joined {new Date(parent.created_at).toLocaleDateString()}</span>
                        </div>
                        {parent.stripe_customer_id && (
                          <div className="flex items-center gap-1">
                            <CreditCard className="h-4 w-4" />
                            <span className="font-mono text-xs">{parent.stripe_customer_id.slice(0, 20)}...</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="ml-4 flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedParent(parent);
                          setShowSubscriptionModal(true);
                        }}
                        className="p-2 text-gray-600 hover:text-primary-600 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Manage subscription"
                      >
                        <Settings className="h-4 w-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedParent(parent);
                          setShowSupportModal(true);
                        }}
                        className="p-2 text-gray-600 hover:text-primary-600 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Support actions"
                      >
                        <Clock className="h-4 w-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedParent(parent);
                          setShowDeleteParentConfirm(true);
                        }}
                        className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete account"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                      {expandedParentId === parent.id ? (
                        <ChevronUp className="h-5 w-5 text-gray-400 cursor-pointer" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-gray-400 cursor-pointer" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded Children List */}
                {expandedParentId === parent.id && (
                  <div className="border-t border-gray-200 bg-gray-50 p-6">
                    <h4 className="text-md font-semibold text-gray-900 mb-4">Children</h4>
                    {childrenMap[parent.id]?.length === 0 ? (
                      <p className="text-gray-600 text-sm">No children added yet</p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {childrenMap[parent.id]?.map((child) => (
                          <div
                            key={child.id}
                            className="bg-white rounded-lg p-4 border border-gray-200"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <h5 className="font-semibold text-gray-900">{child.name}</h5>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-500">Level {child.current_level}</span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedChildToDelete({ child, parentId: parent.id });
                                    setShowDeleteChildConfirm(true);
                                  }}
                                  className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                  title="Delete child"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>
                            </div>
                            <div className="space-y-1 text-sm text-gray-600">
                              <div>Access Code: <span className="font-mono font-semibold">{child.access_code}</span></div>
                              {child.age && <div>Age: {child.age}</div>}
                              <div>XP: {child.total_xp.toLocaleString()}</div>
                              <div>Streak: {child.current_streak} days</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Subscription Management Modal */}
      {showSubscriptionModal && selectedParent && (
        <SubscriptionModal
          parent={selectedParent}
          onClose={() => {
            setShowSubscriptionModal(false);
            setSelectedParent(null);
          }}
          onUpdate={handleUpdateSubscription}
        />
      )}

      {/* Support Actions Modal */}
      {showSupportModal && selectedParent && (
        <SupportActionsModal
          parent={selectedParent}
          onClose={() => {
            setShowSupportModal(false);
            setSelectedParent(null);
          }}
          onExtendTrial={handleExtendTrial}
        />
      )}

      {/* Delete Parent Confirmation Modal */}
      {showDeleteParentConfirm && selectedParent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold text-red-600 mb-4">Delete Account</h2>
            <p className="text-gray-700 mb-4">
              Are you sure you want to delete <strong>{selectedParent.user.full_name || selectedParent.user.email}</strong>?
            </p>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-red-800">
                <strong>⚠️ Warning:</strong> This action is permanent and will delete:
              </p>
              <ul className="text-sm text-red-700 list-disc list-inside mt-2">
                <li>All {selectedParent.children_count} children accounts</li>
                <li>All companies and transactions</li>
                <li>All progress and achievements</li>
                <li>All marketplace items</li>
              </ul>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => {
                  setShowDeleteParentConfirm(false);
                  setSelectedParent(null);
                }}
                className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium text-gray-700 transition-colors"
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteParent(selectedParent.id)}
                disabled={deleting}
                className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleting ? 'Deleting...' : 'Delete Account'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Child Confirmation Modal */}
      {showDeleteChildConfirm && selectedChildToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold text-red-600 mb-4">Delete Child Account</h2>
            <p className="text-gray-700 mb-4">
              Are you sure you want to delete <strong>{selectedChildToDelete.child.name}</strong>?
            </p>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-red-800">
                <strong>⚠️ Warning:</strong> This action is permanent and will delete:
              </p>
              <ul className="text-sm text-red-700 list-disc list-inside mt-2">
                <li>Company and all transactions</li>
                <li>Progress and achievements</li>
                <li>Marketplace items and purchases</li>
              </ul>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => {
                  setShowDeleteChildConfirm(false);
                  setSelectedChildToDelete(null);
                }}
                className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium text-gray-700 transition-colors"
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteChild(selectedChildToDelete.child.id, selectedChildToDelete.parentId)}
                disabled={deleting}
                className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleting ? 'Deleting...' : 'Delete Child'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface SubscriptionModalProps {
  parent: ParentWithUser;
  onClose: () => void;
  onUpdate: (parentId: string, tier: string, status: string) => void;
}

function SubscriptionModal({ parent, onClose, onUpdate }: SubscriptionModalProps) {
  const [tier, setTier] = useState(parent.subscription_tier || '');
  const [status, setStatus] = useState(parent.subscription_status);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onUpdate(parent.id, tier, status);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
        <h2 className="text-2xl font-bold mb-4">Manage Subscription</h2>
        <p className="text-sm text-gray-600 mb-4">
          {parent.user.full_name || parent.user.email}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Subscription Tier
            </label>
            <select
              value={tier}
              onChange={(e) => setTier(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">No Plan</option>
              <option value="basic">Basic</option>
              <option value="standard">Standard</option>
              <option value="premium">Premium</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Subscription Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="trialing">Trialing</option>
              <option value="active">Active</option>
              <option value="past_due">Past Due</option>
              <option value="canceled">Canceled</option>
              <option value="unpaid">Unpaid</option>
            </select>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium text-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Updating...' : 'Update Subscription'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface SupportActionsModalProps {
  parent: ParentWithUser;
  onClose: () => void;
  onExtendTrial: (parentId: string, days: number) => void;
}

function SupportActionsModal({ parent, onClose, onExtendTrial }: SupportActionsModalProps) {
  const [trialDays, setTrialDays] = useState(7);
  const [loading, setLoading] = useState(false);

  const handleExtendTrial = async () => {
    setLoading(true);
    try {
      await onExtendTrial(parent.id, trialDays);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
        <h2 className="text-2xl font-bold mb-4">Support Actions</h2>
        <p className="text-sm text-gray-600 mb-6">
          {parent.user.full_name || parent.user.email}
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Extend Trial (days)
            </label>
            <input
              type="number"
              min="1"
              max="90"
              value={trialDays}
              onChange={(e) => setTrialDays(parseInt(e.target.value) || 7)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Current trial ends: {parent.trial_ends_at ? new Date(parent.trial_ends_at).toLocaleDateString() : 'N/A'}
            </p>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              <strong>Note:</strong> Refunds and other billing actions should be handled through Stripe Dashboard.
            </p>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium text-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleExtendTrial}
              disabled={loading}
              className="flex-1 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Extending...' : `Extend Trial by ${trialDays} days`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminUsersPage() {
  return (
    <ProtectedRoute requireRole="admin">
      <AdminUsersContent />
    </ProtectedRoute>
  );
}

