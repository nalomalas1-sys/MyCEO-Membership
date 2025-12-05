import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/hooks/useAuth';
import { useParent, useChildren } from '@/hooks/useParent';
import { AddChildModal } from '@/components/parent/AddChildModal';
import { EditChildModal } from '@/components/parent/EditChildModal';
import { ChildCard } from '@/components/parent/ChildCard';
import { ParentNavBar } from '@/components/navigation/ParentNavBar';
import { supabase } from '@/lib/supabase';
import { Child } from '@/types/child';
import { 
  Users,
  Plus,
  Search,
  Filter,
  Download,
  RefreshCw,
  Crown,
  Award,
  Star,
  Target,
  TrendingUp,
  Zap,
  Gamepad2,
  Sparkles,
  Shield,
  Heart,
  PartyPopper,
  ChevronRight,
  X,
  AlertTriangle,
  CheckCircle2,
  Copy,
  Edit,
  Trash2,
  ArrowRight,
  Home,
  Settings,
  CreditCard,
  BarChart3,
  Calendar,
  Clock,
  Trophy,
  Puzzle,
  Compass,
  Map,
  Gem,
  Coins,
  Rocket,
  Castle,
  Sword,
  Shield as ShieldIcon,
  Flag,
  Mountain,
  Tent,
  Backpack,
  MapPin,
  LogOut
} from 'lucide-react';

// --- PLAYFUL ILLUSTRATIONS ---
const FloatingCharacters = () => (
  <div className="absolute inset-0 pointer-events-none overflow-hidden">
    <div className="absolute top-10 right-20 w-16 h-16 animate-float-slow">
      <div className="w-full h-full bg-gradient-to-br from-sky-300 to-blue-400 rounded-full shadow-lg flex items-center justify-center text-2xl border-4 border-white">
        👧
      </div>
    </div>
    <div className="absolute bottom-20 left-10 w-14 h-14 animate-float animation-delay-1000">
      <div className="w-full h-full bg-gradient-to-br from-amber-300 to-yellow-400 rounded-full shadow-lg flex items-center justify-center text-xl border-4 border-white">
        👦
      </div>
    </div>
    <div className="absolute top-1/3 left-1/4 w-12 h-12 animate-float animation-delay-1500">
      <div className="w-full h-full bg-gradient-to-br from-blue-300 to-cyan-400 rounded-full shadow-lg flex items-center justify-center text-xl border-4 border-white">
        🧒
      </div>
    </div>
    
    {/* Adventure Path */}
    <div className="absolute bottom-0 left-0 right-0 h-32 opacity-10">
      <div className="flex justify-around">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="w-8 h-8 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-lg m-1"></div>
        ))}
      </div>
    </div>
  </div>
);

const AdventurePath = () => (
  <div className="absolute inset-0 pointer-events-none overflow-hidden">
    <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
      <path
        d="M0,70 Q20,50 40,70 T80,70 T120,50 T160,70"
        stroke="url(#adventureGradient)"
        strokeWidth="4"
        fill="none"
        strokeDasharray="8 12"
        className="animate-trail"
      />
      <defs>
        <linearGradient id="adventureGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
          <stop offset="50%" stopColor="#fbbf24" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.3" />
        </linearGradient>
      </defs>
    </svg>
  </div>
);

// Game-Inspired Stats Card
const AdventureStatCard = ({ 
  title, 
  value, 
  icon, 
  color, 
  description 
}: { 
  title: string; 
  value: string | number; 
  icon: React.ReactNode; 
  color: string; 
  description: string;
}) => (
  <div className={`rounded-[2rem] p-6 ${color} backdrop-blur-sm shadow-xl hover:-translate-y-2 transition-transform duration-300 group overflow-hidden border-4 border-white`}>
    <div className="relative z-10">
      <div className="flex items-center justify-between mb-4">
        <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-400 to-cyan-500 text-white shadow-lg group-hover:scale-110 transition-transform">
          {icon}
        </div>
        <span className="text-[10px] font-black uppercase tracking-widest bg-white/80 text-blue-600 px-3 py-1 rounded-full border border-blue-200">
          {title}
        </span>
      </div>
      <div className="text-4xl font-black text-blue-900 mb-2 font-[900] tracking-tight">
        {value}
      </div>
      <p className="text-sm text-blue-600 font-bold leading-relaxed">
        {description}
      </p>
    </div>
    <div className="absolute -top-3 -right-3 w-16 h-16 bg-white/20 rounded-full blur-xl"></div>
  </div>
);

// Delete Confirmation Modal
const DeleteConfirmationModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  loading,
  childName 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onConfirm: () => void; 
  loading: boolean;
  childName: string;
}) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-blue-900/40 backdrop-blur-sm transition-opacity" onClick={onClose} />
      <div className="relative bg-gradient-to-br from-sky-100 to-yellow-50 rounded-[2.5rem] p-8 max-w-sm w-full shadow-2xl border-4 border-blue-300 animate-in zoom-in-95 duration-200">
        <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-3xl flex items-center justify-center mb-6 mx-auto shadow-lg">
          <AlertTriangle className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-2xl font-black text-amber-700 text-center mb-3">Delete Adventure? 🚫</h3>
        <p className="text-blue-700 text-center text-sm mb-8 leading-relaxed bg-white/50 p-4 rounded-2xl border-2 border-dashed border-blue-200">
          Are you sure you want to delete <span className="font-black text-amber-600">{childName}'s</span> adventure? 
          All earned XP and treasures will be saved for 30 days!
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
                Delete Adventure
                <Heart className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

function ChildrenContent() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { parent, loading: parentLoading, refetch: refetchParent } = useParent();
  const { children, loading: childrenLoading, refetch } = useChildren();
  
  // State
  const [isAddChildModalOpen, setIsAddChildModalOpen] = useState(false);
  const [editingChild, setEditingChild] = useState<Child | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [childToDelete, setChildToDelete] = useState<string | null>(null);
  const [deletingLoading, setDeletingLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  
  const safeChildren = children || [];
  const syncedParentIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (parent?.id && syncedParentIdRef.current !== parent.id) {
      refetch();
      syncedParentIdRef.current = parent.id;
    }
  }, [parent?.id, refetch]);

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

  const initiateDeleteChild = (childId: string, childName: string) => {
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

  const copyAccessCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const filteredChildren = safeChildren.filter(child =>
    child.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    child.access_code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Loading Screen
  if (parentLoading || (childrenLoading && safeChildren.length === 0)) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-sky-50 via-blue-50 to-amber-50 flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-40 h-40 bg-blue-300/30 rounded-full animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-60 h-60 bg-amber-300/20 rounded-full animate-pulse animation-delay-1000"></div>
        </div>
        
        <div className="relative z-10 flex flex-col items-center gap-8">
          <div className="relative">
            <div className="w-24 h-24 border-4 border-blue-200 rounded-full animate-[spin_3s_linear_infinite]"></div>
            <div className="absolute inset-0 border-t-4 border-blue-500 rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-4xl animate-bounce">👨‍👩‍👧‍👦</div>
            </div>
          </div>
          <div className="text-center space-y-3">
            <h3 className="text-blue-800 font-black text-2xl tracking-tight bg-gradient-to-r from-blue-500 to-amber-500 bg-clip-text text-transparent">
              Gathering Little Adventurers! 🏕️
            </h3>
            <p className="text-blue-600 font-bold text-sm animate-pulse">
              Preparing profiles and adventure gear...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Derived Stats
  const totalAdventurers = safeChildren.length;
  const totalXP = safeChildren.reduce((sum, child) => sum + child.total_xp, 0);
  const avgLevel = safeChildren.length > 0 ? Math.round(safeChildren.reduce((sum, child) => sum + child.current_level, 0) / safeChildren.length) : 0;
  const bestStreak = safeChildren.length > 0 ? Math.max(...safeChildren.map((c) => c.current_streak), 0) : 0;
  const activeAdventurers = safeChildren.filter(c => c.current_streak > 0).length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50/30 via-blue-50/30 to-amber-50/30 text-blue-800 relative overflow-x-hidden font-sans selection:bg-yellow-300 selection:text-yellow-900">
      
      {/* --- PLAYFUL BACKGROUND --- */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/doodles.png')] opacity-10"></div>
        <FloatingCharacters />
        <AdventurePath />
        
        {/* Adventure Icons */}
        <div className="absolute top-1/4 left-20 w-14 h-14 animate-float animation-delay-500">
          <div className="w-full h-full bg-gradient-to-br from-cyan-300 to-blue-400 rounded-2xl rotate-12 shadow-lg flex items-center justify-center text-2xl border-4 border-white">
            🎒
          </div>
        </div>
        <div className="absolute bottom-1/3 right-1/4 w-12 h-12 animate-float animation-delay-700">
          <div className="w-full h-full bg-gradient-to-br from-amber-300 to-yellow-400 rounded-full shadow-lg flex items-center justify-center text-2xl border-4 border-white">
            🗺️
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
                <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-3xl flex items-center justify-center text-white text-3xl shadow-2xl border-4 border-white">
                  👨‍👩‍👧‍👦
                </div>
                <div className="absolute -top-2 -right-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-400 to-yellow-400 border-2 border-amber-500 text-amber-900 shadow-lg">
                    <Crown className="w-3 h-3" />
                    <span className="text-xs font-black uppercase tracking-wider">Adventure Squad</span>
                  </div>
                </div>
              </div>
              <div>
                <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-cyan-600 to-amber-600 tracking-tight">
                  Adventure Squad
                </h1>
                <div className="flex items-center gap-3 mt-2">
                  <p className="text-blue-600 font-bold text-sm">
                    Manage your little adventurers and their journeys! ✨
                  </p>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                    <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                    <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
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
              <span className="hidden sm:inline">Refresh Squad</span>
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="p-3 bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-600 rounded-2xl font-bold border-2 border-blue-200 hover:-translate-y-1 transition-all shadow-lg hover:shadow-xl flex items-center gap-2 group"
            >
              <Home className="w-5 h-5" />
              <span className="hidden sm:inline">Back to Park</span>
            </button>
          </div>
        </div>

        {/* --- ADVENTURE STATS --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <AdventureStatCard 
            title="Total Adventurers" 
            value={totalAdventurers} 
            icon={<Users className="w-6 h-6" />}
            color="bg-gradient-to-br from-blue-50 to-cyan-50"
            description="Little explorers in your squad"
          />
          <AdventureStatCard 
            title="Total XP" 
            value={totalXP.toLocaleString()} 
            icon={<Zap className="w-6 h-6" />}
            color="bg-gradient-to-br from-amber-50 to-yellow-50"
            description="Combined adventure experience"
          />
          <AdventureStatCard 
            title="Average Level" 
            value={avgLevel} 
            icon={<Target className="w-6 h-6" />}
            color="bg-gradient-to-br from-sky-50 to-blue-50"
            description="Squad's average adventure level"
          />
          <AdventureStatCard 
            title="Active Streak" 
            value={`${activeAdventurers}/${totalAdventurers}`} 
            icon={<TrendingUp className="w-6 h-6" />}
            color="bg-gradient-to-br from-cyan-50 to-blue-50"
            description="Adventurers on daily quests"
          />
        </div>

        {/* --- SQUAD MANAGEMENT HEADER --- */}
        <div className="rounded-[2.5rem] bg-gradient-to-br from-white to-blue-50/50 p-8 border-4 border-blue-300 shadow-2xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-3xl flex items-center justify-center text-white text-2xl shadow-2xl">
                🎪
              </div>
              <div>
                <h2 className="text-2xl font-black text-blue-800">Manage Your Squad</h2>
                <p className="text-blue-600 font-bold text-sm">Add, edit, and organize your little adventurers</p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search Bar */}
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-blue-400" />
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search adventurers..."
                  className="w-full pl-12 pr-4 py-3 bg-gradient-to-br from-white to-blue-50 border-4 border-blue-200 rounded-2xl focus:border-blue-400 focus:outline-none font-bold text-blue-800 placeholder:text-blue-400 shadow-lg"
                />
              </div>
              
              {/* Add Adventurer Button */}
              <button
                onClick={() => setIsAddChildModalOpen(true)}
                className="group flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-cyan-400 to-blue-500 text-white text-base font-black border-2 border-cyan-400 rounded-2xl hover:-translate-y-1 transition-all shadow-lg hover:shadow-xl"
              >
                <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                <span>Add New Adventurer</span>
              </button>
            </div>
          </div>

          {/* --- ADVENTURERS GRID --- */}
          {filteredChildren.length === 0 ? (
            <div className="py-20 rounded-3xl border-4 border-dashed border-blue-300 bg-gradient-to-br from-white to-blue-50/50 flex flex-col items-center justify-center text-center group hover:border-blue-400 hover:bg-white/80 transition-all">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-200 to-cyan-200 rounded-full flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-300 border-4 border-white">
                <Rocket className="w-12 h-12 text-blue-500" />
              </div>
              <h3 className="text-blue-800 font-black text-2xl mb-3">No Adventurers Found! 🏕️</h3>
              <p className="text-blue-600 font-medium max-w-sm mb-8">
                {searchTerm ? 'No adventurers match your search. Try different keywords!' : 'Your adventure squad is empty. Add your first little adventurer to begin the journey!'}
              </p>
              <div className="flex gap-4">
                {searchTerm && (
                  <button 
                    onClick={() => setSearchTerm('')}
                    className="px-6 py-3 bg-gradient-to-r from-blue-100 to-amber-100 text-blue-700 rounded-2xl font-bold border-2 border-blue-200 hover:-translate-y-1 transition-all"
                  >
                    Clear Search
                  </button>
                )}
                <button 
                  onClick={() => setIsAddChildModalOpen(true)} 
                  className="px-10 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-2xl font-bold shadow-xl shadow-blue-500/30 hover:-translate-y-1 transition-all"
                >
                  Create First Profile 🚀
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredChildren.map((child) => (
                <div key={child.id} className="group relative">
                  {/* Main Card */}
                  <div className="h-full rounded-[2rem] bg-gradient-to-br from-white to-sky-50/30 p-1.5 border-4 border-sky-200 shadow-xl hover:shadow-2xl hover:-translate-y-2 transition-all duration-300">
                    <div className="h-full rounded-[1.8rem] bg-white/80 backdrop-blur-sm p-6">
                      {/* Card Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center text-white text-xl">
                          </div>
                          <div>
                            <h3 className="font-black text-blue-800 text-lg">{child.name}</h3>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-blue-600">Level {child.current_level}</span>
                              <div className="w-1 h-1 bg-blue-400 rounded-full"></div>
                              <span className="text-xs font-bold text-blue-600">{child.total_xp} XP</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end">
                          <div className="text-[10px] font-black uppercase tracking-widest text-blue-500 mb-1">
                            Access Code
                          </div>
                          <button
                            onClick={() => copyAccessCode(child.access_code)}
                            className="font-mono text-sm font-black text-blue-700 bg-gradient-to-r from-blue-100 to-amber-100 px-3 py-1 rounded-full border-2 border-blue-200 hover:border-blue-300 transition-colors flex items-center gap-2"
                          >
                            {child.access_code}
                            {copiedCode === child.access_code ? (
                              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                            ) : (
                              <Copy className="w-3 h-3 text-blue-400" />
                            )}
                          </button>
                        </div>
                      </div>
                      
                      {/* Progress Section */}
                      <div className="mb-6">
                        <div className="flex justify-between text-xs font-bold text-blue-600 mb-2">
                          <span>Adventure Progress</span>
                          <span>{Math.min(100, (child.total_xp / 1000) * 100).toFixed(0)}%</span>
                        </div>
                        <div className="w-full h-2 bg-gradient-to-r from-blue-100 to-amber-100 rounded-full overflow-hidden border border-blue-200">
                          <div 
                            className="h-full bg-gradient-to-r from-blue-400 via-cyan-400 to-amber-400 transition-all duration-1000"
                            style={{ width: `${Math.min(100, (child.total_xp / 1000) * 100)}%` }}
                          />
                        </div>
                      </div>
                      
                      {/* Stats Grid */}
                      <div className="grid grid-cols-3 gap-3 mb-6">
                        <div className="text-center">
                          <div className="text-xs font-black text-blue-500 uppercase tracking-wider mb-1">Streak</div>
                          <div className="text-lg font-black text-blue-800">{child.current_streak} 🔥</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs font-black text-blue-500 uppercase tracking-wider mb-1">Quests</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs font-black text-blue-500 uppercase tracking-wider mb-1">Coins</div>
                        </div>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          onClick={() => handleViewChildDetails(child.id)}
                          className="py-2 bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700 rounded-xl font-bold text-xs hover:-translate-y-1 transition-all border-2 border-blue-200 hover:border-blue-300"
                        >
                          View Details
                        </button>
                        <button
                          onClick={() => handleEditChild(child)}
                          className="py-2 bg-gradient-to-r from-blue-100 to-amber-100 text-blue-700 rounded-xl font-bold text-xs hover:-translate-y-1 transition-all border-2 border-blue-200 hover:border-blue-300"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => initiateDeleteChild(child.id, child.name)}
                          className="py-2 bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-700 rounded-xl font-bold text-xs hover:-translate-y-1 transition-all border-2 border-amber-200 hover:border-amber-300"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Badge for Active Streak */}
                  {child.current_streak >= 7 && (
                    <div className="absolute -top-2 -left-2">
                      <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gradient-to-r from-amber-400 to-yellow-400 text-amber-900 text-[10px] font-black uppercase tracking-wider border-2 border-amber-300 shadow-lg">
                        <Zap className="w-3 h-3" />
                        {child.current_streak} Day Streak!
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* --- QUICK TIPS SECTION --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="rounded-2xl bg-gradient-to-br from-cyan-50 to-blue-50 p-6 border-4 border-cyan-300 shadow-lg">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-2xl shadow-lg">
                <Trophy className="w-6 h-6 text-white" />
              </div>
              <div>
                <h4 className="text-xs font-black text-cyan-700 uppercase tracking-widest mb-2">Adventure Tip</h4>
                <p className="text-cyan-600 text-sm font-bold">
                  Set daily quests to help adventurers build consistency! Daily streaks earn extra XP!
                </p>
              </div>
            </div>
          </div>
          
          <div className="rounded-2xl bg-gradient-to-br from-sky-50 to-blue-50 p-6 border-4 border-sky-300 shadow-lg">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-gradient-to-br from-sky-400 to-cyan-500 rounded-2xl shadow-lg">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h4 className="text-xs font-black text-sky-700 uppercase tracking-widest mb-2">Safety First</h4>
                <p className="text-sky-600 text-sm font-bold">
                  Each adventurer gets a unique access code. Keep it safe for them to enter the adventure world!
                </p>
              </div>
            </div>
          </div>
          
          <div className="rounded-2xl bg-gradient-to-br from-blue-50 to-amber-50 p-6 border-4 border-blue-300 shadow-lg">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-2xl shadow-lg">
                <PartyPopper className="w-6 h-6 text-white" />
              </div>
              <div>
                <h4 className="text-xs font-black text-blue-700 uppercase tracking-widest mb-2">Celebrate!</h4>
                <p className="text-blue-600 text-sm font-bold">
                  Reward adventurers with virtual coins for completing quests! They can spend them in the shop!
                </p>
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
          childName={childToDelete ? safeChildren.find(c => c.id === childToDelete)?.name || 'Adventurer' : 'Adventurer'}
        />
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
      `}</style>
    </div>
  );
}

export default function ChildrenPage() {
  return (
    <ProtectedRoute>
      <ChildrenContent />
    </ProtectedRoute>
  );
}