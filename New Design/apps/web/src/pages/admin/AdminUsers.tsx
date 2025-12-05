import { useState, useEffect, useCallback } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AdminNavBar } from '@/components/navigation/AdminNavBar';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { 
  Search, 
  Mail, 
  Users, 
  Calendar, 
  CreditCard, 
  ChevronDown, 
  ChevronUp, 
  Settings, 
  Clock, 
  DollarSign,
  Filter,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  UserCheck,
  UserX,
  Shield,
  Activity,
  TrendingUp,
  TrendingDown,
  BadgeCheck,
  AlertCircle,
  Download,
  RefreshCw,
  Database,
  Key
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
  last_active?: string;
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

// Optimized gradient background
const AdminUsersBackground = () => (
  <div className="fixed inset-0 pointer-events-none z-0">
    <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-gray-50/80 to-slate-100"></div>
    <div className="absolute inset-0 opacity-[0.02] bg-[linear-gradient(90deg,_transparent_79px,_#e5e7eb_80px,_transparent_81px),_linear-gradient(transparent_79px,_#e5e7eb_80px,_transparent_81px)] bg-[size:80px_80px]"></div>
  </div>
);

// Optimized Card Component
const UserCard = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div
    className={`
      relative rounded-xl bg-white/95 backdrop-blur-sm border border-slate-300/30
      shadow-md shadow-slate-200/20 overflow-hidden transition-all duration-200
      hover:shadow-lg hover:shadow-slate-300/30
      ${className}
    `}
  >
    {children}
  </div>
);

// Status Badge Component
const StatusBadge = ({ status, tier }: { status: string; tier: string | null }) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'active':
        return {
          bg: 'bg-gradient-to-r from-emerald-500 to-green-500',
          text: 'text-white',
          label: 'Active',
          icon: <UserCheck className="w-3 h-3" />
        };
      case 'trialing':
        return {
          bg: 'bg-gradient-to-r from-blue-500 to-cyan-500',
          text: 'text-white',
          label: 'Trialing',
          icon: <Clock className="w-3 h-3" />
        };
      case 'past_due':
        return {
          bg: 'bg-gradient-to-r from-amber-500 to-orange-500',
          text: 'text-white',
          label: 'Past Due',
          icon: <AlertCircle className="w-3 h-3" />
        };
      case 'canceled':
        return {
          bg: 'bg-gradient-to-r from-slate-500 to-gray-500',
          text: 'text-white',
          label: 'Canceled',
          icon: <UserX className="w-3 h-3" />
        };
      default:
        return {
          bg: 'bg-gradient-to-r from-rose-500 to-pink-500',
          text: 'text-white',
          label: 'Unpaid',
          icon: <UserX className="w-3 h-3" />
        };
    }
  };

  const config = getStatusConfig();
  const tierName = tier ? tier.charAt(0).toUpperCase() + tier.slice(1) : 'No Plan';

  return (
    <div className="flex items-center gap-2">
      <div className={`inline-flex items-center gap-2 px-2 py-1 rounded-full ${config.bg} ${config.text} text-xs font-medium`}>
        {config.icon}
        <span>{config.label}</span>
      </div>
      <div className="px-2 py-1 bg-slate-100 text-slate-700 rounded text-xs">
        {tierName}
      </div>
    </div>
  );
};

// User Metrics Card
const UserMetrics = ({ label, value, change, positive }: { 
  label: string; 
  value: string; 
  change: string; 
  positive: boolean 
}) => (
  <div className="p-4 rounded-lg bg-slate-50/50 border border-slate-300/30">
    <div className="text-sm text-slate-600 mb-1">{label}</div>
    <div className="flex items-end justify-between">
      <div className="text-xl font-bold text-slate-800">{value}</div>
      <div className={`flex items-center gap-1 text-xs ${positive ? 'text-emerald-600' : 'text-rose-600'}`}>
        {positive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
        <span>{change}</span>
      </div>
    </div>
  </div>
);

function AdminUsersContent() {
  const { user } = useAuth();
  const [parents, setParents] = useState<ParentWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [tierFilter, setTierFilter] = useState<string>('all');
  const [expandedParentId, setExpandedParentId] = useState<string | null>(null);
  const [childrenMap, setChildrenMap] = useState<Record<string, Child[]>>({});
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [selectedParent, setSelectedParent] = useState<ParentWithUser | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    trialing: 0,
    canceled: 0,
    premium: 0,
  });

  const fetchParents = useCallback(async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('parents')
        .select('id, user_id, stripe_customer_id, subscription_tier, subscription_status, trial_ends_at, created_at')
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('subscription_status', statusFilter);
      }
      if (tierFilter !== 'all') {
        query = query.eq('subscription_tier', tierFilter);
      }

      const { data: parentsData, error } = await query;

      if (error) throw error;

      const parentsWithDetails = await Promise.all(
        (parentsData || []).map(async (parent) => {
          const { data: userData } = await supabase
            .from('users')
            .select('email, full_name')
            .eq('id', parent.user_id)
            .single();

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

      setParents(parentsWithDetails as ParentWithUser[]);
      
      const active = parentsWithDetails.filter(p => p.subscription_status === 'active').length;
      const trialing = parentsWithDetails.filter(p => p.subscription_status === 'trialing').length;
      const canceled = parentsWithDetails.filter(p => p.subscription_status === 'canceled').length;
      const premium = parentsWithDetails.filter(p => p.subscription_tier === 'premium').length;
      
      setStats({
        total: parentsWithDetails.length,
        active,
        trialing,
        canceled,
        premium,
      });
    } catch (error) {
      console.error('Failed to fetch parents:', error);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, tierFilter]);

  useEffect(() => {
    fetchParents();
  }, [fetchParents]);

  const fetchChildren = useCallback(async (parentId: string) => {
    if (childrenMap[parentId]) return;

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
  }, [childrenMap]);

  const handleToggleExpand = useCallback((parentId: string) => {
    if (expandedParentId === parentId) {
      setExpandedParentId(null);
    } else {
      setExpandedParentId(parentId);
      fetchChildren(parentId);
    }
  }, [expandedParentId, fetchChildren]);

  const handleExtendTrial = useCallback(async (parentId: string, days: number) => {
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
    } catch (error) {
      console.error('Failed to extend trial:', error);
    }
  }, [parents, fetchParents]);

  const handleUpdateSubscription = useCallback(async (
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
    } catch (error) {
      console.error('Failed to update subscription:', error);
    }
  }, [fetchParents]);

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
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50/80 to-slate-100 flex items-center justify-center">
        <AdminUsersBackground />
        <div className="relative z-10 text-center">
          <div className="relative mb-6">
            <div className="w-16 h-16 border-4 border-slate-200/50 border-t-blue-500 rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Database className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          <p className="text-slate-600 font-medium">
            Loading user database...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50/80 to-slate-100 relative overflow-hidden">
      <AdminUsersBackground />
      
      <div className="relative z-10">
        <AdminNavBar />
      </div>
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">
                User Management
              </h1>
              <p className="text-slate-600 mt-1">Manage parents, children, and subscriptions</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => fetchParents()}
                className="px-3 py-2 bg-white/80 backdrop-blur-sm border border-slate-300/50 rounded-lg hover:bg-white transition-all shadow-sm flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4 text-slate-600" />
                <span className="font-medium text-slate-700 text-sm">Refresh</span>
              </button>
              <button
                className="px-3 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg shadow hover:shadow-md transition-all flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span className="font-medium text-sm">Export CSV</span>
              </button>
            </div>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
            <UserCard>
              <div className="p-4">
                <div className="text-sm text-slate-600 mb-1">Total Users</div>
                <div className="text-xl font-bold text-slate-800">{stats.total}</div>
                <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                  <TrendingUp className="w-3 h-3 text-emerald-600" />
                  <span>+12% from last month</span>
                </div>
              </div>
            </UserCard>
            
            <UserCard>
              <div className="p-4">
                <div className="text-sm text-slate-600 mb-1">Active</div>
                <div className="text-xl font-bold text-slate-800">{stats.active}</div>
                <div className="text-xs text-emerald-600 font-medium mt-1">
                  {stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0}% of total
                </div>
              </div>
            </UserCard>
            
            <UserCard>
              <div className="p-4">
                <div className="text-sm text-slate-600 mb-1">Trialing</div>
                <div className="text-xl font-bold text-slate-800">{stats.trialing}</div>
                <div className="text-xs text-blue-600 font-medium mt-1">
                  Potential conversions
                </div>
              </div>
            </UserCard>
            
            <UserCard>
              <div className="p-4">
                <div className="text-sm text-slate-600 mb-1">Canceled</div>
                <div className="text-xl font-bold text-slate-800">{stats.canceled}</div>
                <div className="text-xs text-rose-600 font-medium mt-1">
                  {stats.total > 0 ? Math.round((stats.canceled / stats.total) * 100) : 0}% churn rate
                </div>
              </div>
            </UserCard>
            
            <UserCard>
              <div className="p-4">
                <div className="text-sm text-slate-600 mb-1">Premium Tier</div>
                <div className="text-xl font-bold text-slate-800">{stats.premium}</div>
                <div className="text-xs text-purple-600 font-medium mt-1">
                  Highest revenue segment
                </div>
              </div>
            </UserCard>
          </div>
        </div>

        {/* Filters */}
        <UserCard className="mb-6">
          <div className="p-5">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search by email, name, or Stripe ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white/50 border border-slate-300/50 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm"
                />
              </div>
              
              <div className="flex gap-3">
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="pl-9 pr-7 py-2.5 bg-white/50 border border-slate-300/50 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 appearance-none text-sm"
                  >
                    <option value="all">All Statuses</option>
                    <option value="active">Active</option>
                    <option value="trialing">Trialing</option>
                    <option value="past_due">Past Due</option>
                    <option value="canceled">Canceled</option>
                    <option value="unpaid">Unpaid</option>
                  </select>
                </div>
                
                <select
                  value={tierFilter}
                  onChange={(e) => setTierFilter(e.target.value)}
                  className="px-3 py-2.5 bg-white/50 border border-slate-300/50 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                >
                  <option value="all">All Tiers</option>
                  <option value="basic">Basic</option>
                  <option value="standard">Standard</option>
                  <option value="premium">Premium</option>
                </select>
              </div>
            </div>
          </div>
        </UserCard>

        {/* Users List */}
        <div className="space-y-3">
          {filteredParents.length === 0 ? (
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-8 text-center border border-slate-300/50 shadow-sm">
              <Users className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-600 font-medium">No users found</p>
              <p className="text-slate-500 text-sm mt-1">Try adjusting your filters</p>
            </div>
          ) : (
            filteredParents.map((parent) => (
              <div key={parent.id}>
                <UserCard>
                  {/* Parent Header */}
                  <div
                    className="p-5 cursor-pointer hover:bg-slate-50/50 transition-colors"
                    onClick={() => handleToggleExpand(parent.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="relative">
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                              <Users className="w-5 h-5 text-white" />
                            </div>
                            {parent.children_count > 0 && (
                              <div className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center border border-white">
                                <span className="text-xs font-bold text-white">{parent.children_count}</span>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-slate-800">
                                {parent.user.full_name || 'Unnamed User'}
                              </h3>
                              <StatusBadge status={parent.subscription_status} tier={parent.subscription_tier} />
                            </div>
                            
                            <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
                              <div className="flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                <span>{parent.user.email}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                <span>Joined {new Date(parent.created_at).toLocaleDateString()}</span>
                              </div>
                              {parent.stripe_customer_id && (
                                <div className="flex items-center gap-1">
                                  <Key className="h-3 w-3" />
                                  <span className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">
                                    {parent.stripe_customer_id.slice(0, 10)}...
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="ml-3 flex items-center gap-1">
                        <button
                          onClick={(e: React.MouseEvent) => {
                            e.stopPropagation();
                            setSelectedParent(parent);
                            setShowSubscriptionModal(true);
                          }}
                          className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded transition-colors"
                          title="Manage subscription"
                        >
                          <Settings className="h-4 w-4" />
                        </button>
                        <button
                          onClick={(e: React.MouseEvent) => {
                            e.stopPropagation();
                            setSelectedParent(parent);
                            setShowSupportModal(true);
                          }}
                          className="p-1.5 text-slate-600 hover:text-emerald-600 hover:bg-slate-100 rounded transition-colors"
                          title="Support actions"
                        >
                          <Clock className="h-4 w-4" />
                        </button>
                        <div
                          className={`transform transition-transform ${
                            expandedParentId === parent.id ? 'rotate-180' : ''
                          }`}
                        >
                          <ChevronDown className="h-4 w-4 text-slate-400 cursor-pointer" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Children Section */}
                  {expandedParentId === parent.id && (
                    <div className="border-t border-slate-300/50 bg-slate-50/50 p-5">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-md bg-gradient-to-br from-emerald-500 to-green-500">
                            <Users className="w-4 h-4 text-white" />
                          </div>
                          <h4 className="font-semibold text-slate-800">Children Profiles</h4>
                        </div>
                        <span className="text-sm text-slate-600">
                          {childrenMap[parent.id]?.length || 0} profile{childrenMap[parent.id]?.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                      
                      {childrenMap[parent.id]?.length === 0 ? (
                        <div className="text-center py-4">
                          <Users className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                          <p className="text-slate-600 text-sm">No children profiles yet</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {childrenMap[parent.id]?.map((child) => (
                            <div
                              key={child.id}
                              className="bg-white/80 rounded-lg p-3 border border-slate-300/50"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 rounded-md bg-gradient-to-br from-blue-100 to-cyan-100 flex items-center justify-center">
                                    <span className="text-sm">👤</span>
                                  </div>
                                  <div>
                                    <h5 className="font-medium text-slate-800 text-sm">{child.name}</h5>
                                    {child.age && (
                                      <p className="text-xs text-slate-600">Age {child.age}</p>
                                    )}
                                  </div>
                                </div>
                                <div className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded text-xs font-medium">
                                  Level {child.current_level}
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-3 gap-2 text-xs">
                                <div className="text-center p-1.5 bg-slate-100/50 rounded">
                                  <div className="font-semibold text-slate-800">{child.total_xp.toLocaleString()}</div>
                                  <div className="text-slate-600">XP</div>
                                </div>
                                <div className="text-center p-1.5 bg-slate-100/50 rounded">
                                  <div className="font-semibold text-slate-800">{child.current_streak}</div>
                                  <div className="text-slate-600">Day Streak</div>
                                </div>
                                <div className="text-center p-1.5 bg-slate-100/50 rounded">
                                  <div className="font-semibold text-slate-800 font-mono">{child.access_code}</div>
                                  <div className="text-slate-600">Access Code</div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </UserCard>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modals */}
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
    </div>
  );
}

// Updated Modals
function SubscriptionModal({ parent, onClose, onUpdate }: any) {
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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 max-w-md w-full border border-slate-300/50 shadow-xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500">
            <Settings className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">Manage Subscription</h2>
            <p className="text-slate-600 text-sm">{parent.user.email}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-3">
              Subscription Tier
            </label>
            <div className="grid grid-cols-3 gap-2">
              {['basic', 'standard', 'premium'].map((t) => (
                <button
                  type="button"
                  key={t}
                  onClick={() => setTier(t)}
                  className={`p-2.5 rounded-lg border transition-all text-sm ${
                    tier === t
                      ? 'border-blue-500 bg-blue-50 text-blue-700 font-medium'
                      : 'border-slate-300/50 hover:border-slate-400 text-slate-700'
                  }`}
                >
                  <div className="capitalize">{t}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-3">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2.5 bg-white/50 border border-slate-300/50 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm"
            >
              <option value="trialing">Trialing</option>
              <option value="active">Active</option>
              <option value="past_due">Past Due</option>
              <option value="canceled">Canceled</option>
              <option value="unpaid">Unpaid</option>
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-lg font-medium transition-all disabled:opacity-50 text-sm"
            >
              {loading ? 'Updating...' : 'Update'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function SupportActionsModal({ parent, onClose, onExtendTrial }: any) {
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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 max-w-md w-full border border-slate-300/50 shadow-xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 rounded-lg bg-gradient-to-br from-emerald-500 to-green-500">
            <Clock className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">Support Actions</h2>
            <p className="text-slate-600 text-sm">{parent.user.email}</p>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-3">
              Extend Trial Period
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="1"
                max="90"
                value={trialDays}
                onChange={(e) => setTrialDays(parseInt(e.target.value))}
                className="flex-1"
              />
              <div className="w-16 text-center">
                <div className="text-xl font-bold text-slate-800">{trialDays}</div>
                <div className="text-xs text-slate-600">days</div>
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Current trial ends: {parent.trial_ends_at ? new Date(parent.trial_ends_at).toLocaleDateString() : 'N/A'}
            </p>
          </div>

          <div className="bg-gradient-to-r from-amber-50/50 to-orange-50/50 border border-amber-200/50 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              <p className="text-sm text-amber-800">
                <span className="font-medium">Note:</span> Billing actions should be handled through Stripe Dashboard.
              </p>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleExtendTrial}
              disabled={loading}
              className="flex-1 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white rounded-lg font-medium transition-all disabled:opacity-50 text-sm"
            >
              {loading ? 'Processing...' : `Extend by ${trialDays} days`}
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