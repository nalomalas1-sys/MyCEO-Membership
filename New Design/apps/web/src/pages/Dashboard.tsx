import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
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
import { 
  CheckCircle2, 
  X, 
  Sparkles, 
  Crown, 
  Zap, 
  Target, 
  Rocket, 
  Gamepad2,
  TrendingUp,
  CreditCard,
  Users,
  Settings,
  Calendar,
  ChevronRight,
  Plus,
  ArrowRight,
  Shield,
  Clock,
  Layout,
  BarChart3,
  Terminal,
  Cpu,
  Copy,
  AlertTriangle,
  RefreshCw,
  Castle,
  Star,
  Gem,
  Coins,
  Heart,
  Sparkle,
  PartyPopper,
  Home,
  Palette,
  Wand2,
  Cloud,
  Sun,
  Trophy,
  Compass,
  Map,
  Award,
  Sword,
  Shield as ShieldIcon,
  Puzzle,
  Dice5,
  Joystick,
  Flag,
  Mountain,
  Tent,
  Backpack,
  MapPin
} from 'lucide-react';

// --- PLAYFUL ILLUSTRATIONS ---
const FloatingTreasureChest = () => (
  <div className="absolute inset-0 pointer-events-none overflow-hidden">
    <div className="absolute top-10 left-10 w-20 h-20 animate-float-slow">
      <div className="w-full h-full bg-gradient-to-br from-amber-300 to-yellow-400 rounded-2xl rotate-45 shadow-lg flex items-center justify-center">
        <div className="text-white text-2xl">💰</div>
      </div>
    </div>
    <div className="absolute bottom-20 right-10 w-16 h-16 animate-float animation-delay-1000">
      <div className="w-full h-full bg-gradient-to-br from-blue-300 to-cyan-400 rounded-full shadow-lg flex items-center justify-center">
        <div className="text-white text-2xl">🏆</div>
      </div>
    </div>
    <div className="absolute top-1/3 right-1/4 w-12 h-12 animate-float animation-delay-1500">
      <div className="w-full h-full bg-gradient-to-br from-sky-300 to-blue-400 rounded-full shadow-lg flex items-center justify-center">
        <div className="text-white text-xl">✨</div>
      </div>
    </div>
  </div>
);

const MagicalSparkles = () => (
  <div className="absolute inset-0 pointer-events-none overflow-hidden">
    {Array.from({ length: 15 }).map((_, i) => (
      <div
        key={i}
        className="absolute w-1 h-1 bg-amber-300 rounded-full animate-pulse"
        style={{
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
          animationDelay: `${i * 0.3}s`,
          animationDuration: `${1 + Math.random() * 2}s`
        }}
      />
    ))}
  </div>
);

// Adventure Trail
const AdventureTrail = () => (
  <div className="absolute inset-0 pointer-events-none overflow-hidden">
    <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
      <path
        d="M0,50 Q20,30 40,50 T80,50 T120,30 T160,50"
        stroke="url(#trailGradient)"
        strokeWidth="2"
        fill="none"
        strokeDasharray="4 6"
        className="animate-trail"
      />
      <defs>
        <linearGradient id="trailGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
          <stop offset="50%" stopColor="#fbbf24" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.3" />
        </linearGradient>
      </defs>
    </svg>
  </div>
);

// --- PLAYFUL COMPONENTS ---
const DeleteConfirmationModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  loading 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onConfirm: () => void; 
  loading: boolean;
}) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-blue-900/40 backdrop-blur-sm transition-opacity" onClick={onClose} />
      <div className="relative bg-gradient-to-br from-sky-100 to-amber-50 rounded-[2.5rem] p-8 max-w-sm w-full shadow-2xl border-4 border-blue-300 animate-in zoom-in-95 duration-200">
        <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-3xl flex items-center justify-center mb-6 mx-auto shadow-lg">
          <AlertTriangle className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-2xl font-black text-amber-700 text-center mb-3">Adventure Paused? 🚫</h3>
        <p className="text-blue-700 text-center text-sm mb-8 leading-relaxed bg-white/50 p-4 rounded-2xl border-2 border-dashed border-blue-200">
          Are you sure you want to close this adventure? All earned treasure and XP will be saved for 30 days!
        </p>
        <div className="grid grid-cols-2 gap-4">
          <button onClick={onClose} className="px-6 py-4 bg-gradient-to-r from-blue-100 to-amber-100 hover:from-blue-200 hover:to-amber-200 text-blue-700 font-bold rounded-2xl transition-all border-2 border-blue-200 shadow-lg hover:-translate-y-1">
            Keep Playing! ✨
          </button>
          <button 
            onClick={onConfirm} 
            disabled={loading}
            className="px-6 py-4 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white font-bold rounded-2xl shadow-lg shadow-amber-500/30 transition-all flex items-center justify-center gap-2 hover:-translate-y-1"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                Pause Adventure
                <Heart className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// Game-Inspired Stats Card Component
const GameStatCard = ({ 
  title, 
  value, 
  icon, 
  color, 
  progress,
  theme = 'default'
}: { 
  title: string; 
  value: string | number; 
  icon: React.ReactNode; 
  color: string; 
  progress?: number;
  theme?: 'xp' | 'level' | 'streak' | 'default';
}) => {
  const getThemeStyles = () => {
    switch(theme) {
      case 'xp':
        return {
          gradient: 'bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500',
          text: 'text-amber-700',
          bg: 'bg-amber-50'
        };
      case 'level':
        return {
          gradient: 'bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500',
          text: 'text-blue-700',
          bg: 'bg-blue-50'
        };
      case 'streak':
        return {
          gradient: 'bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-500',
          text: 'text-cyan-700',
          bg: 'bg-cyan-50'
        };
      default:
        return {
          gradient: 'bg-gradient-to-r from-blue-400 via-sky-400 to-blue-500',
          text: 'text-blue-700',
          bg: 'bg-blue-50'
        };
    }
  };

  const themeStyles = getThemeStyles();

  return (
    <div className={`relative rounded-[2rem] p-6 border-4 ${color} ${themeStyles.bg} backdrop-blur-sm shadow-xl hover:-translate-y-2 transition-transform duration-300 group overflow-hidden`}>
      {/* Animated background */}
      <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 ${themeStyles.gradient} transition-opacity duration-500`}></div>
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 rounded-2xl ${themeStyles.gradient} text-white shadow-lg group-hover:scale-110 transition-transform`}>
            {icon}
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest bg-white/80 text-blue-600 px-3 py-1 rounded-full border border-blue-200">
            {title}
          </span>
        </div>
        <div className={`text-4xl font-black ${themeStyles.text} mb-2 font-[900] tracking-tight`}>
          {value}
        </div>
        {progress !== undefined && (
          <div className="mt-6 space-y-2">
            <div className="flex justify-between text-xs font-bold text-blue-500">
              <span>Progress</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full bg-white/50 h-3 rounded-full overflow-hidden border border-blue-200 shadow-inner">
              <div 
                className={`h-full ${themeStyles.gradient} rounded-full transition-all duration-1000`} 
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </div>
      
      {/* Corner decoration */}
      <div className="absolute -top-3 -right-3 w-12 h-12 bg-white/20 rounded-full blur-xl"></div>
    </div>
  );
};

// Mini Stat Box for Dashboard
const MiniStatBox = ({ 
  title, 
  value, 
  icon, 
  color, 
  theme = 'level'
}: { 
  title: string; 
  value: string | number; 
  icon: React.ReactNode; 
  color: string; 
  theme?: 'level' | 'streak';
}) => {
  const getThemeStyles = () => {
    switch(theme) {
      case 'level':
        return {
          gradient: 'from-blue-400 to-cyan-500',
          text: 'text-blue-800',
          light: 'bg-blue-50'
        };
      case 'streak':
        return {
          gradient: 'from-cyan-400 to-blue-500',
          text: 'text-cyan-800',
          light: 'bg-cyan-50'
        };
      default:
        return {
          gradient: 'from-blue-400 to-sky-500',
          text: 'text-blue-800',
          light: 'bg-blue-50'
        };
    }
  };

  const themeStyles = getThemeStyles();

  return (
    <div className={`rounded-2xl p-4 ${color} ${themeStyles.light} backdrop-blur-sm shadow-lg hover:-translate-y-1 transition-transform duration-300 group relative overflow-hidden`}>
      <div className={`absolute inset-0 bg-gradient-to-br ${themeStyles.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}></div>
      <div className="relative z-10">
        <div className="flex items-center justify-between">
          <div className={`p-2 rounded-xl bg-gradient-to-br ${themeStyles.gradient} text-white shadow-md group-hover:scale-110 transition-transform`}>
            {icon}
          </div>
          <div className="text-right">
            <div className={`text-2xl font-black ${themeStyles.text} font-[900]`}>
              {value}
            </div>
            <div className="text-xs font-black uppercase tracking-widest text-blue-500 mt-1">
              {title}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Adventure Badge Component
const AdventureBadge = ({ type, label }: { type: 'gold' | 'silver' | 'bronze'; label: string }) => {
  const getBadgeStyles = () => {
    switch(type) {
      case 'gold':
        return 'bg-gradient-to-br from-amber-300 via-yellow-400 to-amber-400 border-amber-500 shadow-amber-500/30';
      case 'silver':
        return 'bg-gradient-to-br from-blue-200 via-blue-300 to-blue-400 border-blue-400 shadow-blue-500/30';
      case 'bronze':
        return 'bg-gradient-to-br from-amber-600 via-yellow-700 to-amber-800 border-amber-800 shadow-amber-700/30';
    }
  };

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${getBadgeStyles()} border-2 shadow-lg`}>
      <Trophy className="w-3 h-3 text-white" />
      <span className="text-xs font-black text-white uppercase tracking-wider">{label}</span>
    </div>
  );
};

function DashboardContent() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { parent, loading: parentLoading, refetch: refetchParent } = useParent();
  const { children, loading: childrenLoading, refetch } = useChildren();
  
  // State
  const [isAddChildModalOpen, setIsAddChildModalOpen] = useState(false);
  const [editingChild, setEditingChild] = useState<Child | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [childToDelete, setChildToDelete] = useState<string | null>(null);
  const [deletingLoading, setDeletingLoading] = useState(false);
  
  const [childLoginCode, setChildLoginCode] = useState('');
  const [childLoginError, setChildLoginError] = useState<string | null>(null);
  const [childLoginLoading, setChildLoginLoading] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState<string | null>(null);

  const safeChildren = children || [];
  const syncedParentIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (parent?.id && syncedParentIdRef.current !== parent.id) {
      refetch();
      syncedParentIdRef.current = parent.id;
    }
  }, [parent?.id, refetch]);

  useEffect(() => {
    if (location.hash === '#children') {
      const element = document.getElementById('children-section');
      if (element) {
        setTimeout(() => element.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
      }
    }
  }, [location.hash, safeChildren.length]);

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    if (sessionId) {
      setCheckoutSuccess(true);
      refetchParent();
      navigate('/dashboard', { replace: true });
    }
  }, [searchParams, navigate, refetchParent]);

  // Handlers
  const handleAddChildSuccess = () => refetch();

  const handleEditChild = (child: Child) => {
    setEditingChild(child);
    setIsEditModalOpen(true);
  };

  const handleEditSuccess = () => {
    refetch();
    setIsEditModalOpen(false);
    setEditingChild(null);
  };

  const initiateDeleteChild = (childId: string) => {
    setChildToDelete(childId);
    setDeleteModalOpen(true);
  };

  const confirmDeleteChild = async () => {
    if (!childToDelete) return;
    setDeletingLoading(true);
    try {
      const { error } = await supabase
        .from('children')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', childToDelete);

      if (error) throw error;
      refetch();
      setDeleteModalOpen(false);
      setChildToDelete(null);
    } catch (err: any) {
      alert('Failed to delete child: ' + (err.message || 'Unknown error'));
    } finally {
      setDeletingLoading(false);
    }
  };

  const handleViewChildDetails = (childId: string) => navigate(`/dashboard/children/${childId}`);

  const handleChildLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setChildLoginLoading(true);
    setChildLoginError(null);

    try {
      const formattedCode = childLoginCode.toUpperCase().trim();
      const { data: child, error: queryError } = await supabase
        .from('children')
        .select('id, name, access_code')
        .eq('access_code', formattedCode)
        .single();

      if (queryError || !child) {
        setChildLoginError('Oops! Wrong access code. Try again! ✨');
        return;
      }

      localStorage.setItem('child_session', JSON.stringify({
        childId: child.id,
        childName: child.name,
        accessCode: formattedCode,
      }));

      navigate('/child/dashboard');
    } catch (err) {
      console.error('Child login error:', err);
      setChildLoginError('An error occurred! 🧙');
    } finally {
      setChildLoginLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopySuccess(text);
    setTimeout(() => setCopySuccess(null), 2000);
  };

  const getSubscriptionBadge = (status: string, tier: string | null) => {
    const isTrial = status === 'trialing';
    const isActive = status === 'active';
    const tierName = tier ? tier.charAt(0).toUpperCase() + tier.slice(1) : 'Explorer';
    
    return (
      <div className={`
        relative overflow-hidden group inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-black shadow-lg backdrop-blur-sm border-2 transition-all duration-300 cursor-default hover:scale-105
        ${isActive 
          ? 'bg-gradient-to-r from-cyan-400 to-blue-500 border-cyan-300 text-white' 
          : isTrial 
            ? 'bg-gradient-to-r from-blue-400 to-cyan-500 border-blue-300 text-white'
            : 'bg-gradient-to-r from-blue-400 to-sky-500 border-blue-300 text-white'}
      `}>
        {isActive ? <CheckCircle2 className="w-4 h-4" /> : <CreditCard className="w-4 h-4" />}
        <span className="relative z-10 uppercase tracking-wider">{tierName} {isTrial && '(Trial)'}</span>
        <Sparkle className="w-3 h-3 ml-1" />
      </div>
    );
  };

  // Loading Screen
  if (parentLoading || (childrenLoading && safeChildren.length === 0)) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-sky-50 via-blue-50 to-amber-50 flex items-center justify-center relative overflow-hidden">
         {/* Animated Background */}
         <div className="absolute inset-0">
           <div className="absolute top-20 left-20 w-40 h-40 bg-blue-300/30 rounded-full animate-pulse"></div>
           <div className="absolute bottom-20 right-20 w-60 h-60 bg-amber-300/20 rounded-full animate-pulse animation-delay-1000"></div>
         </div>
         
         <div className="relative z-10 flex flex-col items-center gap-8">
           <div className="relative">
             <div className="w-24 h-24 border-4 border-blue-200 rounded-full animate-[spin_3s_linear_infinite]"></div>
             <div className="absolute inset-0 border-t-4 border-blue-500 rounded-full animate-spin"></div>
             <div className="absolute inset-0 flex items-center justify-center">
               <div className="text-4xl animate-bounce">🎪</div>
             </div>
           </div>
           <div className="text-center space-y-3">
             <h3 className="text-blue-800 font-black text-2xl tracking-tight bg-gradient-to-r from-blue-500 to-amber-500 bg-clip-text text-transparent">
               Preparing Your Adventure Park! 🎡
             </h3>
             <p className="text-blue-600 font-bold text-sm animate-pulse">
               Setting up rides and cotton candy...
             </p>
           </div>
         </div>
      </div>
    );
  }

  // Derived Stats
  const totalXP = safeChildren.reduce((sum, child) => sum + child.total_xp, 0);
  const avgLevel = safeChildren.length > 0 ? Math.round(safeChildren.reduce((sum, child) => sum + child.current_level, 0) / safeChildren.length) : 0;
  const bestStreak = safeChildren.length > 0 ? Math.max(...safeChildren.map((c) => c.current_streak), 0) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50/30 via-blue-50/30 to-amber-50/30 text-blue-800 relative overflow-x-hidden font-sans selection:bg-yellow-300 selection:text-yellow-900">
      
      {/* --- PLAYFUL BACKGROUND --- */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/doodles.png')] opacity-10"></div>
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-200/20 via-transparent to-transparent"></div>
        <FloatingTreasureChest />
        <MagicalSparkles />
        <AdventureTrail />
        
        {/* Floating Adventure Icons */}
        <div className="absolute top-20 right-20 w-16 h-16 animate-float animation-delay-500">
          <div className="w-full h-full bg-gradient-to-br from-cyan-300 to-blue-400 rounded-2xl rotate-12 shadow-lg flex items-center justify-center text-2xl">
            ⛰️
          </div>
        </div>
        <div className="absolute bottom-40 left-1/4 w-14 h-14 animate-float animation-delay-700">
          <div className="w-full h-full bg-gradient-to-br from-amber-300 to-yellow-400 rounded-full shadow-lg flex items-center justify-center text-2xl">
            🏕️
          </div>
        </div>
      </div>

      <div className="relative z-30">
        <ParentNavBar />
      </div>
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* --- GAME-STYLE HEADER --- */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-3xl flex items-center justify-center text-white text-2xl shadow-xl">
                  🎪
                </div>
                <div className="absolute -top-2 -right-2">
                  <AdventureBadge type="gold" label="HQ" />
                </div>
              </div>
              <div>
                <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-amber-600 tracking-tight">
                  Adventure Park HQ
                </h1>
                <div className="flex items-center gap-3 mt-2">
                  <p className="text-blue-600 font-bold text-sm">
                    Welcome back, Park Manager {user?.user_metadata?.full_name?.split(' ')[0]}! ✨
                  </p>
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                    <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                    <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => refetch()} 
              className="p-3 bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-600 rounded-2xl font-bold border-2 border-amber-200 hover:-translate-y-1 transition-all shadow-lg hover:shadow-xl flex items-center gap-2 group"
            >
              <RefreshCw className="w-5 h-5 group-hover:rotate-180 transition-transform" />
              <span className="hidden sm:inline">Refresh Park</span>
            </button>
            {parent && getSubscriptionBadge(parent.subscription_status, parent.subscription_tier)}
          </div>
        </div>

        {/* --- MAGICAL STATS GRID - FIXED LAYOUT --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6">
            
            {/* Welcome Card */}
            <div className="col-span-1 md:col-span-2 lg:col-span-8 rounded-[2.5rem] bg-gradient-to-br from-white to-blue-50/50 p-8 border-4 border-dashed border-blue-300 relative overflow-hidden group hover:border-solid hover:shadow-2xl transition-all duration-500">
                {/* Decorative Elements */}
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-300/20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000"></div>
                <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-cyan-300/20 rounded-full blur-3xl"></div>
                
                <div className="relative z-10 flex flex-col justify-between h-full gap-8">
                    <div className="flex items-start justify-between">
                        <div className="space-y-4">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 bg-gradient-to-br from-amber-300 to-yellow-400 rounded-2xl flex items-center justify-center text-white text-3xl shadow-xl rotate-12 group-hover:-rotate-12 transition-transform duration-500">
                                    🎯
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-blue-800 leading-tight">
                                        Today's Mission
                                    </h2>
                                    <p className="text-blue-600 font-medium">
                                        Your adventurers are waiting for new quests!
                                    </p>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl border-2 border-blue-200 shadow-sm flex items-center justify-between">
                                    <div>
                                      <div className="text-xs font-black text-blue-600 uppercase tracking-wider mb-1">Park Time</div>
                                      <div className="font-mono text-blue-800 font-black text-xl">
                                          {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                      </div>
                                    </div>
                                    <Clock className="w-6 h-6 text-blue-400" />
                                </div>
                                <div className="p-4 bg-gradient-to-br from-cyan-50 to-blue-50 rounded-2xl border-2 border-cyan-200 shadow-sm flex items-center justify-between">
                                    <div>
                                      <div className="text-xs font-black text-cyan-600 uppercase tracking-wider mb-1">Day</div>
                                      <div className="font-mono text-cyan-800 font-black text-xl">
                                          {new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                      </div>
                                    </div>
                                    <Calendar className="w-6 h-6 text-cyan-400" />
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                        <div className="flex -space-x-3">
                            {[1,2,3,4].map(i => (
                                <div key={i} className="w-10 h-10 rounded-full border-4 border-white bg-gradient-to-br from-blue-300 to-cyan-300 shadow-lg relative">
                                    <div className="w-full h-full rounded-full flex items-center justify-center text-lg">
                                        {['👦','👧','🧒','👦'][i-1]}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="text-sm font-black text-blue-700 bg-white/60 p-3 rounded-2xl border-2 border-blue-200">
                            <span className="text-amber-600">{safeChildren.length}</span> little adventurers in your park!
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Cards - FIXED LAYOUT */}
            <div className="col-span-1 md:col-span-2 lg:col-span-4 space-y-6">
                {/* XP Card */}
                <GameStatCard 
                  title="Total XP" 
                  value={totalXP.toLocaleString()} 
                  icon={<Zap className="w-6 h-6" />}
                  color="border-amber-300"
                  progress={Math.min(100, (totalXP / 10000) * 100)}
                  theme="xp"
                />
                
                {/* Mini Stats Grid */}
                <div className="grid grid-cols-2 gap-4">
                    <MiniStatBox 
                      title="Avg Level" 
                      value={avgLevel} 
                      icon={<Target className="w-5 h-5" />}
                      color="border-blue-300"
                      theme="level"
                    />
                    <MiniStatBox 
                      title="Best Streak" 
                      value={bestStreak} 
                      icon={<TrendingUp className="w-5 h-5" />}
                      color="border-cyan-300"
                      theme="streak"
                    />
                </div>
            </div>
        </div>

        {/* --- MAGIC UPGRADE BANNER --- */}
        {parent && (parent.subscription_status === 'unpaid' || !parent.subscription_tier) && (
            <div 
              className="relative overflow-hidden rounded-[2.5rem] group cursor-pointer border-4 border-dashed border-blue-300 bg-gradient-to-r from-blue-100 to-amber-100 shadow-xl hover:border-solid hover:shadow-2xl transition-all duration-300 hover:-translate-y-1" 
              onClick={() => navigate('/pricing')}
            >
                <div className="absolute -right-10 -top-20 w-60 h-60 bg-gradient-to-br from-blue-300 to-cyan-300 rounded-full blur-[80px] opacity-40 group-hover:opacity-60 transition-opacity"></div>
                <div className="p-8 flex flex-col md:flex-row items-center justify-between relative z-10 gap-6">
                    <div className="flex items-center gap-6">
                        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-amber-300 to-yellow-400 flex items-center justify-center shadow-2xl shadow-amber-500/30 group-hover:rotate-12 transition-transform duration-500">
                            <Crown className="w-10 h-10 text-white" />
                        </div>
                        <div>
                            <h3 className="font-black text-blue-800 text-2xl mb-2">✨ Unlock More Upgrades! ✨</h3>
                            <p className="text-blue-600 font-bold text-sm">
                                Upgrade to unlock unlimited adventures, tools, and special rewards!
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-2xl font-black text-lg shadow-xl shadow-blue-500/30 group-hover:scale-105 transition-all">
                        <span>See Upgrades</span>
                        <Sparkles className="w-5 h-5" />
                    </div>
                </div>
            </div>
        )}

        {/* --- MAIN ADVENTURE GRID --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start" id="children-section">
            
            {/* Left Column: Adventurers List */}
            <div className="lg:col-span-2 space-y-8">
                
                {/* Section Header */}
                <div className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-2xl flex items-center justify-center text-white text-xl shadow-lg">
                            👨‍👩‍👧‍👦
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-blue-800">Your Little Adventurers</h2>
                            <p className="text-blue-600 font-bold text-sm">Manage their journeys</p>
                        </div>
                    </div>
                    {parent && (
                        <button
                            onClick={() => setIsAddChildModalOpen(true)}
                            className="group flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-cyan-400 to-blue-500 text-white text-base font-black border-2 border-cyan-400 rounded-2xl hover:-translate-y-1 transition-all shadow-lg hover:shadow-xl"
                        >
                            <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                            <span>Add New Adventurer</span>
                        </button>
                    )}
                </div>

                {/* Adventurers Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     {safeChildren.length === 0 ? (
                        <div className="col-span-full py-20 rounded-[2.5rem] border-4 border-dashed border-blue-300 bg-gradient-to-br from-white to-blue-50/50 flex flex-col items-center justify-center text-center group hover:border-blue-400 hover:bg-white/80 transition-all">
                            <div className="w-24 h-24 bg-gradient-to-br from-blue-200 to-cyan-200 rounded-full flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-300">
                                <Rocket className="w-12 h-12 text-blue-500" />
                            </div>
                            <h3 className="text-blue-800 font-black text-2xl mb-3">No Adventurers Yet! 🏕️</h3>
                            <p className="text-blue-600 font-medium max-w-sm mb-8">
                                Your adventure park is empty. Add your first little adventurer to begin the journey!
                            </p>
                            <button onClick={() => setIsAddChildModalOpen(true)} className="px-10 py-4 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-2xl font-black text-base shadow-xl shadow-blue-500/30 hover:-translate-y-1 transition-all">
                                Create First Profile 🚀
                            </button>
                        </div>
                     ) : (
                         safeChildren.map((child) => (
                            <div key={child.id} className="relative group">
                                <div className="h-full rounded-[2rem] bg-gradient-to-br from-white to-sky-50/30 p-1.5 border-4 border-sky-200 shadow-xl hover:shadow-2xl hover:-translate-y-2 transition-all duration-300">
                                    <div className="h-full rounded-[1.8rem] bg-white/80 backdrop-blur-sm">
                                        <ChildCard
                                            child={child}
                                            onViewDetails={handleViewChildDetails}
                                            onEdit={handleEditChild}
                                        />
                                    </div>
                                </div>
                                <button
                                    onClick={() => initiateDeleteChild(child.id)}
                                    className="absolute -top-3 -right-3 w-10 h-10 flex items-center justify-center bg-gradient-to-br from-amber-400 to-yellow-500 text-white border-2 border-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 hover:scale-110 transition-all z-20"
                                    title="Pause Adventure"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                         ))
                     )}
                </div>

                {/* Recent Activity */}
                {safeChildren.length > 0 && parent && (
                    <div className="rounded-[2.5rem] bg-gradient-to-br from-white to-amber-50/30 border-4 border-amber-300 overflow-hidden shadow-xl mt-8">
                        <div className="px-8 py-6 border-b-2 border-amber-200/50 flex items-center justify-between bg-gradient-to-r from-amber-50 to-yellow-50">
                             <div className="flex items-center gap-4">
                                <div className="relative flex h-4 w-4">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-4 w-4 bg-green-500"></span>
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-amber-800">🎉 Recent Adventures</h3>
                                    <p className="text-amber-600 text-xs font-bold">Live updates from your adventurers!</p>
                                </div>
                             </div>
                             <div className="p-3 bg-gradient-to-r from-amber-300 to-yellow-400 rounded-2xl shadow-lg">
                                <Terminal className="w-5 h-5 text-white" />
                             </div>
                        </div>
                        <div className="p-4 max-h-[350px] overflow-y-auto custom-scrollbar">
                            <RecentActivityFeed parentId={parent.id} limit={6} />
                        </div>
                    </div>
                )}
            </div>

            {/* Right Column: Quick Actions */}
            <div className="lg:col-span-1 space-y-8">
                
                {/* --- MAGIC PORTAL (Child Login) --- */}
                <div className="rounded-[2.5rem] bg-gradient-to-br from-blue-900 to-cyan-900 p-2 shadow-2xl">
                    <div className="rounded-[2.2rem] bg-gradient-to-br from-blue-950 to-cyan-950 border-2 border-blue-800 relative overflow-hidden p-8">
                        {/* Magic Sparkles */}
                        <div className="absolute inset-0">
                            {Array.from({ length: 8 }).map((_, i) => (
                                <div
                                    key={i}
                                    className="absolute w-1 h-1 bg-cyan-300 rounded-full animate-pulse"
                                    style={{
                                        left: `${Math.random() * 100}%`,
                                        top: `${Math.random() * 100}%`,
                                        animationDelay: `${i * 0.5}s`
                                    }}
                                />
                            ))}
                        </div>
                        
                        <div className="relative z-10">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center shadow-xl">
                                    <Gamepad2 className="w-8 h-8 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-white font-black text-xl mb-1">Portal 🧙</h3>
                                    <p className="text-blue-300 text-sm font-bold">Enter the adventure world!</p>
                                </div>
                            </div>

                            <form onSubmit={handleChildLogin} className="space-y-6">
                                <div className="space-y-3">
                                    <label className="text-xs font-black text-blue-300 uppercase tracking-widest pl-2 flex justify-between">
                                        <span>Access Code</span>
                                        {childLoginCode.length >= 7 && (
                                            <span className="text-cyan-300 flex items-center gap-2">
                                                <Sparkle className="w-3 h-3" /> Ready!
                                            </span>
                                        )}
                                    </label>
                                    <div className="relative group">
                                        <input
                                            type="text"
                                            value={childLoginCode}
                                            onChange={(e) => {
                                                let value = e.target.value.replace(/[^A-Z0-9]/gi, '').toUpperCase();
                                                if (value.length > 3) value = value.slice(0, 3) + '-' + value.slice(3, 6);
                                                setChildLoginCode(value);
                                                setChildLoginError(null);
                                            }}
                                            placeholder="XXX-000"
                                            maxLength={7}
                                            className="w-full bg-blue-800/50 border-4 border-blue-700 text-cyan-300 font-mono text-2xl text-center py-5 rounded-2xl focus:outline-none focus:border-cyan-500 focus:shadow-[0_0_30px_rgba(6,182,212,0.3)] transition-all placeholder:text-blue-600 uppercase tracking-[0.3em]"
                                        />
                                        <button 
                                            type="button"
                                            onClick={() => copyToClipboard(childLoginCode)}
                                            disabled={!childLoginCode}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-blue-500 hover:text-cyan-300 transition-colors disabled:opacity-0"
                                            title="Copy Access Code"
                                        >
                                            {copySuccess === childLoginCode ? (
                                                <CheckCircle2 className="w-5 h-5" />
                                            ) : (
                                                <Copy className="w-5 h-5" />
                                            )}
                                        </button>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={childLoginLoading || childLoginCode.length < 7}
                                    className="w-full py-5 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white text-base font-black rounded-2xl shadow-xl shadow-cyan-900/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-3 group relative overflow-hidden"
                                >
                                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
                                    {childLoginLoading ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    ) : (
                                        <>
                                            <span className="relative z-10">✨ ENTER ADVENTURE ✨</span>
                                            <ArrowRight className="w-5 h-5 relative z-10 group-hover:translate-x-2 transition-transform" />
                                        </>
                                    )}
                                </button>
                            </form>
                            
                            {childLoginError && (
                                <div className="mt-6 p-4 bg-gradient-to-r from-amber-900/30 to-yellow-900/30 border-2 border-amber-700/30 rounded-2xl flex items-center gap-3 text-amber-300 text-sm font-bold animate-in fade-in slide-in-from-top-2">
                                    <Shield className="w-5 h-5 shrink-0" />
                                    {childLoginError}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Quick Actions Grid */}
                <div className="grid grid-cols-2 gap-4">
                     <button 
                        onClick={() => navigate('/pricing')}
                        className="p-5 rounded-2xl bg-gradient-to-br from-white to-blue-50 border-4 border-blue-300 hover:border-blue-400 shadow-lg hover:shadow-xl hover:-translate-y-2 transition-all flex flex-col items-center justify-center text-center gap-4 group"
                     >
                        <div className="p-4 bg-gradient-to-br from-blue-400 to-cyan-500 text-white rounded-2xl group-hover:scale-110 transition-transform shadow-lg">
                            <CreditCard className="w-7 h-7" />
                        </div>
                        <span className="text-sm font-black text-blue-700 group-hover:text-cyan-600 transition-colors">Upgrades</span>
                     </button>
                     
                     <button 
                        onClick={() => navigate('/dashboard/settings')}
                        className="p-5 rounded-2xl bg-gradient-to-br from-white to-sky-50 border-4 border-sky-300 hover:border-sky-400 shadow-lg hover:shadow-xl hover:-translate-y-2 transition-all flex flex-col items-center justify-center text-center gap-4 group"
                     >
                        <div className="p-4 bg-gradient-to-br from-sky-400 to-cyan-500 text-white rounded-2xl group-hover:scale-110 transition-transform shadow-lg">
                            <Settings className="w-7 h-7" />
                        </div>
                        <span className="text-sm font-black text-sky-700 group-hover:text-cyan-600 transition-colors">Park Settings</span>
                     </button>

                     <button 
                        onClick={() => navigate('/dashboard/analytics')}
                        className="col-span-2 p-6 rounded-2xl bg-gradient-to-br from-white to-amber-50 border-4 border-amber-300 hover:border-amber-400 shadow-lg hover:shadow-xl hover:-translate-y-2 transition-all flex items-center justify-between group"
                     >
                        <div className="flex items-center gap-5">
                            <div className="p-4 bg-gradient-to-br from-amber-400 to-yellow-500 text-white rounded-2xl group-hover:scale-110 transition-transform shadow-lg">
                                <BarChart3 className="w-7 h-7" />
                            </div>
                            <div className="text-left">
                                <span className="block text-base font-black text-amber-800 group-hover:text-amber-700 transition-colors">Adventure Stats</span>
                                <span className="block text-xs font-bold text-amber-600">See progress reports</span>
                            </div>
                        </div>
                        <ChevronRight className="w-6 h-6 text-amber-400 group-hover:text-amber-500 group-hover:translate-x-2 transition-transform" />
                     </button>
                </div>

                {/* System Status */}
                <div className="rounded-2xl bg-gradient-to-br from-cyan-50 to-blue-50 p-5 border-4 border-cyan-300 shadow-lg">
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-2xl shadow-lg">
                             <Cpu className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h4 className="text-xs font-black text-cyan-700 uppercase tracking-widest mb-2">Park Status</h4>
                            <div className="flex items-center gap-3">
                                <span className="relative flex h-3 w-3">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
                                </span>
                                <span className="text-sm font-black text-cyan-800">All Rides Operational! 🎢</span>
                            </div>
                            <p className="text-cyan-600 text-xs mt-2 font-bold">
                                {safeChildren.length} adventurers having fun right now!
                            </p>
                        </div>
                    </div>
                </div>

                {/* Adventure Tips */}
                <div className="rounded-2xl bg-gradient-to-br from-amber-50 to-yellow-50 p-5 border-4 border-amber-300 shadow-lg">
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-2xl shadow-lg">
                             <Compass className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h4 className="text-xs font-black text-amber-700 uppercase tracking-widest mb-2">Adventure Tip</h4>
                            <p className="text-amber-600 text-sm font-bold">
                                Set daily quests to help adventurers build consistency! 🎯
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* --- MODALS --- */}
        {parent && (
          <AddChildModal
            isOpen={isAddChildModalOpen}
            onClose={() => setIsAddChildModalOpen(false)}
            onSuccess={handleAddChildSuccess}
            parentId={parent.id}
          />
        )}

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

        <DeleteConfirmationModal
            isOpen={deleteModalOpen}
            onClose={() => setDeleteModalOpen(false)}
            onConfirm={confirmDeleteChild}
            loading={deletingLoading}
        />

         {/* Success/Error Notifications */}
         {(checkoutSuccess || checkoutError) && (
            <div className="fixed bottom-6 right-6 z-50 max-w-sm animate-in slide-in-from-right-4 duration-500">
                 {checkoutSuccess && (
                    <div className="bg-gradient-to-r from-cyan-100 to-blue-100 border-4 border-cyan-300 rounded-[2rem] p-5 shadow-2xl flex items-center gap-5">
                        <div className="p-3 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-2xl shadow-lg">
                            <CheckCircle2 className="w-6 h-6 text-white"/>
                        </div>
                        <div>
                             <h4 className="font-black text-cyan-900 text-base">✨ Upgrade Complete! ✨</h4>
                             <p className="text-cyan-700 text-sm font-bold">New tools unlocked!</p>
                        </div>
                        <button onClick={() => setCheckoutSuccess(false)} className="ml-auto text-cyan-400 hover:text-cyan-600">
                            <X className="w-5 h-5"/>
                        </button>
                    </div>
                 )}
                 {checkoutError && (
                    <div className="bg-gradient-to-r from-amber-100 to-yellow-100 border-4 border-amber-300 rounded-[2rem] p-5 shadow-2xl flex items-center gap-5">
                        <div className="p-3 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-2xl shadow-lg">
                            <AlertTriangle className="w-6 h-6 text-white"/>
                        </div>
                        <div>
                             <h4 className="font-black text-amber-900 text-base">Oops! It Failed ✨</h4>
                             <p className="text-amber-700 text-sm font-bold">{checkoutError}</p>
                        </div>
                        <button onClick={() => setCheckoutError(null)} className="ml-auto text-amber-400 hover:text-amber-600">
                            <X className="w-5 h-5"/>
                        </button>
                    </div>
                 )}
            </div>
         )}
      </div>
      
      {/* --- ANIMATION STYLES --- */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
        }
        @keyframes float-slow {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          25% { transform: translateY(-15px) rotate(90deg); }
          50% { transform: translateY(-25px) rotate(180deg); }
          75% { transform: translateY(-15px) rotate(270deg); }
        }
        @keyframes trail {
          0% { stroke-dashoffset: 0; }
          100% { stroke-dashoffset: -1000; }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .animate-float-slow {
          animation: float-slow 15s ease-in-out infinite;
        }
        .animate-trail {
          animation: trail 30s linear infinite;
        }
        .animation-delay-500 {
          animation-delay: 0.5s;
        }
        .animation-delay-700 {
          animation-delay: 0.7s;
        }
        .animation-delay-1000 {
          animation-delay: 1s;
        }
        .animation-delay-1500 {
          animation-delay: 1.5s;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(245, 158, 11, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(245, 158, 11, 0.3);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(245, 158, 11, 0.5);
        }
      `}</style>
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