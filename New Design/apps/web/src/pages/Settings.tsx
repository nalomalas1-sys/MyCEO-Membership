import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/hooks/useAuth';
import { useParent } from '@/hooks/useParent';
import { ParentNavBar } from '@/components/navigation/ParentNavBar';
import { supabase } from '@/lib/supabase';
import { 
  Save, 
  User, 
  Mail, 
  Lock, 
  CreditCard, 
  ExternalLink, 
  CheckCircle2, 
  AlertCircle,
  LogOut,
  Shield,
  Sparkles,
  Zap,
  ChevronRight,
  Sliders,
  Bell,
  Key,
  Eye,
  EyeOff,
  Wallet,
  Trophy,
  Gamepad2,
  Castle,
  Crown,
  Gem,
  Heart,
  PartyPopper,
  Wand2,
  Palette,
  Sparkle,
  Target,
  Settings as SettingsIcon,
  Home,
  Award,
  Compass,
  Map,
  Star,
  ShieldCheck,
  RefreshCw,
  Users,
  Calendar,
  Clock,
  Battery,
  Wifi,
  Shield as ShieldIcon,
  Puzzle
} from 'lucide-react';

// --- PLAYFUL ILLUSTRATIONS ---
const FloatingControls = () => (
  <div className="absolute inset-0 pointer-events-none overflow-hidden">
    {/* Floating Control Knobs */}
    <div className="absolute top-10 left-10 w-16 h-16 animate-float-slow">
      <div className="w-full h-full bg-gradient-to-br from-yellow-300 to-orange-400 rounded-full shadow-lg flex items-center justify-center text-2xl border-4 border-white">
        🎛️
      </div>
    </div>
    <div className="absolute bottom-20 right-20 w-12 h-12 animate-float animation-delay-1000">
      <div className="w-full h-full bg-gradient-to-br from-blue-300 to-cyan-400 rounded-full shadow-lg flex items-center justify-center text-xl border-4 border-white">
        ⚙️
      </div>
    </div>
    <div className="absolute top-1/3 right-1/4 w-10 h-10 animate-float animation-delay-1500">
      <div className="w-full h-full bg-gradient-to-br from-yellow-300 to-blue-400 rounded-full shadow-lg flex items-center justify-center text-xl border-4 border-white">
        🎮
      </div>
    </div>
    
    {/* Control Panel Grid */}
    <div className="absolute bottom-0 left-0 right-0 h-32 opacity-5">
      <div className="flex justify-around">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="w-8 h-8 bg-gradient-to-br from-blue-400 to-yellow-400 rounded-lg m-1"></div>
        ))}
      </div>
    </div>
  </div>
);

const SettingsPath = () => (
  <div className="absolute inset-0 pointer-events-none overflow-hidden">
    <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
      <path
        d="M0,30 Q20,10 40,30 T80,30 T120,50 T160,30"
        stroke="url(#settingsGradient)"
        strokeWidth="3"
        fill="none"
        strokeDasharray="6 8"
        className="animate-trail"
      />
      <defs>
        <linearGradient id="settingsGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
          <stop offset="50%" stopColor="#fbbf24" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.4" />
        </linearGradient>
      </defs>
    </svg>
  </div>
);

// Game-Inspired Badge Component
const SettingsBadge = ({ type, label }: { type: 'power' | 'security' | 'magic'; label: string }) => {
  const getBadgeStyles = () => {
    switch(type) {
      case 'power':
        return 'bg-gradient-to-r from-yellow-400 to-orange-400 border-yellow-500 text-yellow-900';
      case 'security':
        return 'bg-gradient-to-r from-blue-400 to-cyan-400 border-blue-500 text-blue-900';
      case 'magic':
        return 'bg-gradient-to-r from-blue-400 to-yellow-400 border-blue-500 text-blue-900';
    }
  };

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${getBadgeStyles()} border-2 shadow-lg`}>
      {type === 'power' && <Zap className="w-3 h-3" />}
      {type === 'security' && <ShieldCheck className="w-3 h-3" />}
      {type === 'magic' && <Sparkle className="w-3 h-3" />}
      <span className="text-xs font-black uppercase tracking-wider">{label}</span>
    </div>
  );
};

// Game Toggle Switch Component
const GameToggle = ({ enabled, onChange, label }: { enabled: boolean; onChange: () => void; label: string }) => (
  <div className="flex items-center justify-between p-4 bg-gradient-to-br from-white to-blue-50 rounded-2xl border-2 border-blue-200">
    <span className="text-sm font-black text-blue-800">{label}</span>
    <button
      onClick={onChange}
      className={`relative w-14 h-8 rounded-full transition-all duration-300 ${enabled ? 'bg-gradient-to-r from-blue-400 to-cyan-500' : 'bg-gradient-to-r from-gray-300 to-gray-400'}`}
    >
      <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-lg transform transition-transform duration-300 ${enabled ? 'translate-x-8' : 'translate-x-1'}`}></div>
    </button>
  </div>
);

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
  const [activeTab, setActiveTab] = useState('profile');
  const [showPassword, setShowPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Game settings toggles
  const [notifications, setNotifications] = useState(true);
  const [soundEffects, setSoundEffects] = useState(true);
  const [autoSave, setAutoSave] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    if (user) {
      setFullName(user.user_metadata?.full_name || '');
      setEmail(user.email || '');
    }
  }, [user]);

  useEffect(() => {
    if (user && refetchParent) refetchParent();
  }, [user, refetchParent]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        data: { full_name: fullName },
      });
      if (updateError) throw updateError;

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
        body: { returnUrl: `${window.location.origin}/settings` },
      });
      if (portalError) throw portalError;
      if (!data?.url) throw new Error('No portal URL returned');
      window.location.href = data.url;
    } catch (err: any) {
      setError(err.message || 'Failed to open billing portal. Please try again.');
      setPortalLoading(false);
    }
  };

  const getSubscriptionStatusBadge = (status: string) => {
    const isTrial = status === 'trialing';
    const isActive = status === 'active';
    const isProblem = ['past_due', 'canceled', 'unpaid'].includes(status);
    
    let styles = 'bg-gradient-to-r from-gray-300 to-gray-400 text-gray-800 border-gray-500';
    if (isActive) styles = 'bg-gradient-to-r from-blue-400 to-yellow-400 text-blue-900 border-blue-500';
    if (isTrial) styles = 'bg-gradient-to-r from-blue-300 to-cyan-400 text-blue-900 border-blue-500';
    if (isProblem) styles = 'bg-gradient-to-r from-orange-400 to-yellow-400 text-orange-900 border-orange-500';

    return (
      <div className={`px-4 py-2 rounded-full text-xs font-black uppercase tracking-wider border-2 ${styles} shadow-lg flex items-center gap-2`}>
        {isActive ? <CheckCircle2 className="w-3 h-3" /> : 
         isTrial ? <Zap className="w-3 h-3" /> : 
         <AlertCircle className="w-3 h-3" />}
        <span>{status.replace('_', ' ')}</span>
      </div>
    );
  };

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    setActiveTab(sectionId);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-yellow-50/30 to-blue-50 text-blue-800 relative overflow-x-hidden font-sans selection:bg-yellow-300 selection:text-yellow-900">
      
      {/* --- PLAYFUL BACKGROUND --- */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/doodles.png')] opacity-10"></div>
        <FloatingControls />
        <SettingsPath />
        
        {/* Game Controller Background */}
        <div className="absolute top-1/4 right-10 w-40 h-40 opacity-5">
          <div className="text-6xl">🎮</div>
        </div>
      </div>

      <div className="relative z-20">
        <ParentNavBar />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* --- GAME-STYLE HEADER --- */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-400 via-yellow-400 to-blue-400 rounded-3xl flex items-center justify-center text-white text-3xl shadow-2xl border-4 border-white">
                  🎛️
                </div>
                <div className="absolute -top-2 -right-2">
                  <SettingsBadge type="magic" label="Control Panel" />
                </div>
              </div>
              <div>
                <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-yellow-500 to-blue-600 tracking-tight">
                  Adventure Control Center
                </h1>
                <div className="flex items-center gap-3 mt-2">
                  <p className="text-blue-600 font-bold text-sm">
                    Control your adventure park! ✨
                  </p>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => refetchParent()} 
              className="p-3 bg-gradient-to-r from-yellow-100 to-orange-100 text-orange-600 rounded-2xl font-bold border-2 border-orange-200 hover:-translate-y-1 transition-all shadow-lg hover:shadow-xl flex items-center gap-2 group"
            >
              <RefreshCw className="w-5 h-5 group-hover:rotate-180 transition-transform" />
              <span className="hidden sm:inline">Refresh Park</span>
            </button>
            <div className="p-3 bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-600 rounded-2xl font-bold border-2 border-blue-200 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5" />
              <span className="text-sm">Park Secure</span>
            </div>
          </div>
        </div>

        {/* --- GAME TABS NAVIGATION --- */}
        <div className="sticky top-4 z-40 bg-white/80 backdrop-blur-xl rounded-[2rem] border-4 border-yellow-300 shadow-2xl p-4 mb-8">
          <div className="flex flex-wrap gap-3 justify-center">
            {[
              { id: 'profile', icon: User, label: 'Profile Data', color: 'from-blue-400 to-cyan-400' },
              { id: 'billing', icon: CreditCard, label: 'Billing & Management', color: 'from-blue-400 to-yellow-400' },
              { id: 'security', icon: Shield, label: 'Security Castle', color: 'from-blue-400 to-green-400' },
              { id: 'game', icon: Gamepad2, label: 'Game Settings', color: 'from-yellow-400 to-orange-400' },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => scrollToSection(item.id)}
                  className={`group flex items-center gap-3 px-6 py-4 rounded-2xl font-bold text-sm transition-all duration-300 shadow-lg border-2 ${
                    activeTab === item.id 
                      ? `bg-gradient-to-r ${item.color} text-white border-white scale-105 shadow-xl` 
                      : 'bg-white text-blue-600 border-blue-200 hover:border-yellow-300 hover:-translate-y-1'
                  }`}
                >
                  <div className={`p-2 rounded-xl ${
                    activeTab === item.id 
                      ? 'bg-white/20' 
                      : `bg-gradient-to-r ${item.color} text-white`
                  }`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span>{item.label}</span>
                  {activeTab === item.id && (
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* --- ALERTS --- */}
        {error && (
          <div className="animate-in slide-in-from-top-4 duration-500">
            <div className="relative overflow-hidden rounded-[2rem]">
              <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-yellow-500/5 blur-xl"></div>
              <div className="relative bg-gradient-to-br from-white to-orange-50/50 border-4 border-orange-300 text-orange-800 px-8 py-6 rounded-[2rem] flex items-center gap-6 shadow-xl shadow-orange-200/30">
                <div className="p-4 bg-gradient-to-br from-orange-100 to-yellow-100 rounded-2xl shadow-lg border-2 border-orange-200">
                  <AlertCircle className="w-7 h-7 text-orange-500"/>
                </div>
                <div className="flex-1">
                  <h4 className="font-black text-orange-900 text-lg mb-2">Game Error! 🎮</h4>
                  <p className="text-orange-700 font-bold">{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {success && (
          <div className="animate-in slide-in-from-top-4 duration-500">
            <div className="relative overflow-hidden rounded-[2rem]">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-yellow-500/5 blur-xl"></div>
              <div className="relative bg-gradient-to-br from-white to-blue-50/50 border-4 border-blue-300 text-blue-800 px-8 py-6 rounded-[2rem] flex items-center gap-6 shadow-xl shadow-blue-200/30">
                <div className="p-4 bg-gradient-to-br from-blue-100 to-yellow-100 rounded-2xl shadow-lg border-2 border-blue-200">
                  <CheckCircle2 className="w-7 h-7 text-blue-500"/>
                </div>
                <div className="flex-1">
                  <h4 className="font-black text-blue-900 text-lg mb-2">Success! ✨</h4>
                  <p className="text-blue-700 font-bold">Adventure settings updated successfully!</p>
                </div>
                <PartyPopper className="w-8 h-8 text-yellow-400 animate-bounce" />
              </div>
            </div>
          </div>
        )}

        {/* --- MAIN CONTENT GRID --- */}
        <div className="space-y-8">
          
          {/* Profile Section */}
          <div id="profile" className="scroll-mt-24">
            <div className="bg-gradient-to-br from-white to-blue-50/50 rounded-[2.5rem] border-4 border-yellow-300 shadow-2xl p-8 relative overflow-hidden group hover:border-blue-400 transition-all duration-300">
              {/* Decorative Background */}
              <div className="absolute -top-10 -right-10 w-60 h-60 bg-blue-300/20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000"></div>
              <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-yellow-300/20 rounded-full blur-3xl"></div>
              
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-3xl flex items-center justify-center text-white text-2xl shadow-2xl border-4 border-white">
                      👨‍👩‍👧‍👦
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-blue-800">Adventure Commander</h2>
                      <p className="text-blue-600 font-bold text-sm">Your identity in the park</p>
                    </div>
                  </div>
                  <SettingsBadge type="power" label="Level 5 Commander" />
                </div>

                <form onSubmit={handleUpdateProfile} className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <label htmlFor="fullName" className="block text-xs font-black text-blue-600 uppercase tracking-wider mb-2 flex items-center gap-2">
                        <User className="w-4 h-4" />
                        Commander Name
                      </label>
                      <div className="relative group/input">
                        <input
                          id="fullName"
                          type="text"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className="w-full px-6 py-5 bg-gradient-to-br from-white to-blue-50 border-4 border-blue-200 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-400 transition-all outline-none font-bold text-blue-900 placeholder:text-blue-400 shadow-lg group-hover/input:shadow-xl"
                          placeholder="Enter your adventure name..."
                        />
                        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover/input:translate-x-full transition-transform duration-1000"></div>
                      </div>
                      <p className="text-xs text-blue-500 font-bold pl-2">
                        Your display name for all park communications
                      </p>
                    </div>

                    <div className="space-y-4">
                      <label htmlFor="email" className="block text-xs font-black text-blue-600 uppercase tracking-wider mb-2 flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        Portal Address
                      </label>
                      <div className="relative">
                        <input
                          id="email"
                          type="email"
                          value={email}
                          disabled
                          className="w-full px-6 py-5 bg-gradient-to-br from-gray-100 to-gray-50 border-4 border-gray-300 rounded-2xl text-gray-700 font-medium shadow-inner cursor-not-allowed"
                        />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-gradient-to-br from-gray-200 to-gray-300 rounded-xl border-2 border-gray-400">
                          <Lock className="w-4 h-4 text-gray-600" />
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 font-bold pl-2">
                        Protected by park security wizards 🧙
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 flex justify-end">
                    <button
                      type="submit"
                      disabled={loading}
                      className="group flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-blue-500 to-yellow-500 hover:from-blue-600 hover:to-yellow-600 text-white font-black rounded-2xl shadow-2xl shadow-blue-500/30 hover:shadow-yellow-500/40 transition-all transform hover:-translate-y-1 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <Save className="h-5 w-5 group-hover:rotate-12 transition-transform" />
                          <span>Save Commander Data</span>
                          <Sparkle className="h-4 w-4 text-yellow-300" />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>

          {/* Billing Section */}
          <div id="billing" className="scroll-mt-24">
            <div className="bg-gradient-to-br from-white to-yellow-50/50 rounded-[2.5rem] border-4 border-blue-300 shadow-2xl p-8 relative overflow-hidden group hover:border-yellow-400 transition-all duration-300">
              {/* Treasure Chest Background */}
              <div className="absolute top-4 right-4 w-24 h-24 opacity-10">
                <div className="text-5xl">💰</div>
              </div>
              
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-yellow-500 rounded-3xl flex items-center justify-center text-white text-2xl shadow-2xl border-4 border-white">
                      💎
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-blue-800">Treasure Management</h2>
                      <p className="text-blue-600 font-bold text-sm">Your subscription & payments</p>
                    </div>
                  </div>
                  <SettingsBadge type="magic" label="Treasure Keeper" />
                </div>

                {parent ? (
                  <div className="space-y-8">
                    {/* Current Plan Card */}
                    <div className="p-8 bg-gradient-to-br from-white to-yellow-50/30 rounded-3xl border-4 border-blue-200 shadow-xl hover:shadow-2xl transition-all duration-300">
                      <div className="flex flex-wrap items-center justify-between gap-6 mb-6">
                        <div>
                          <div className="text-xs font-black text-blue-500 uppercase tracking-wider mb-2">Magical Clearance Level</div>
                          <div className="flex items-center gap-3">
                            <span className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-yellow-600">
                              {parent.subscription_tier ? parent.subscription_tier.charAt(0).toUpperCase() + parent.subscription_tier.slice(1) : 'Explorer'}
                            </span>
                            <Crown className="w-8 h-8 text-yellow-500" />
                          </div>
                        </div>
                        {getSubscriptionStatusBadge(parent.subscription_status)}
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="mb-6">
                        <div className="flex justify-between text-sm font-black text-blue-600 mb-2">
                          <span>Adventure Progress</span>
                          <span>{parent.subscription_status === 'active' ? '100%' : '40%'}</span>
                        </div>
                        <div className="w-full h-4 bg-gradient-to-r from-blue-100 to-yellow-100 rounded-full overflow-hidden border-2 border-blue-200 shadow-inner">
                          <div 
                            className="h-full bg-gradient-to-r from-blue-400 via-yellow-400 to-orange-400 transition-all duration-1000"
                            style={{ width: parent.subscription_status === 'active' ? '100%' : '40%' }}
                          >
                            <div className="absolute inset-0 bg-gradient-to-r from-white/30 to-transparent animate-shimmer"></div>
                          </div>
                        </div>
                      </div>
                      
                      {parent.subscription_status === 'trialing' && parent.trial_ends_at && (
                        <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl border-2 border-blue-300 mb-4">
                          <Zap className="w-5 h-5 text-blue-500" />
                          <div className="flex-1">
                            <span className="font-black text-blue-700">Trial Active!</span>
                            <p className="text-sm text-blue-600 font-bold">
                              Ends on {new Date(parent.trial_ends_at).toLocaleDateString()} - Upgrade to keep it running! ✨
                            </p>
                          </div>
                        </div>
                      )}
                      
                      <p className="text-blue-700 font-bold text-sm leading-relaxed">
                        {parent.subscription_status === 'active' 
                          ? 'Your adventure park is fully powered! All rides operational. 🎢' 
                          : 'Unlock more rides and games for your little adventurers! 🎡'}
                      </p>
                    </div>

                    {/* Billing Portal */}
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 p-6 bg-gradient-to-br from-white to-blue-100/30 rounded-3xl border-4 border-blue-300 shadow-lg">
                      <div>
                        <h3 className="font-black text-blue-800 text-lg mb-2">Treasure Vault Access</h3>
                        <p className="text-blue-600 font-bold text-sm max-w-md">
                          Manage your gems, update payments, and view past quests.
                        </p>
                      </div>
                      <button
                        onClick={handleManageBilling}
                        disabled={portalLoading || !parent.stripe_customer_id}
                        className="group flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-500 to-yellow-500 hover:from-blue-600 hover:to-yellow-600 text-white font-black rounded-2xl shadow-xl shadow-blue-500/30 hover:shadow-yellow-500/40 transition-all disabled:opacity-50"
                      >
                        {portalLoading ? (
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <>
                            <ExternalLink className="h-5 w-5 group-hover:rotate-12 transition-transform" />
                            <span>Open Treasure Vault</span>
                          </>
                        )}
                      </button>
                    </div>
                    
                    {!parent.stripe_customer_id && (
                      <div className="p-6 bg-gradient-to-br from-yellow-50 to-orange-50/50 rounded-3xl border-4 border-yellow-300 shadow-lg flex items-center gap-4">
                        <div className="p-3 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl text-white">
                          <AlertCircle className="w-6 h-6" />
                        </div>
                        <div>
                          <h4 className="font-black text-yellow-800 mb-1">No Treasure Account Found!</h4>
                          <p className="text-yellow-700 text-sm font-bold">
                            Start a subscription to unlock the treasure vault and manage your gems.
                          </p>
                        </div>
                        <button
                          onClick={() => navigate('/pricing')}
                          className="ml-auto px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-2xl font-black shadow-lg hover:-translate-y-1 transition-all"
                        >
                          Upgrade
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-12 bg-gradient-to-br from-gray-50 to-gray-100/50 border-4 border-dashed border-gray-400 rounded-3xl text-center">
                    <div className="w-20 h-20 bg-gradient-to-br from-gray-300 to-gray-400 rounded-3xl flex items-center justify-center text-3xl mb-6 mx-auto shadow-lg">
                      🏦
                    </div>
                    <h3 className="text-2xl font-black text-gray-700 mb-4">No Treasure Found! 💰</h3>
                    <p className="text-gray-600 font-bold max-w-sm mx-auto mb-8">
                      Your magical treasure vault is empty. Start a subscription to fill it with adventure gems!
                    </p>
                    <button
                      onClick={() => navigate('/pricing')}
                      className="px-10 py-5 bg-gradient-to-r from-blue-600 to-yellow-600 text-white rounded-2xl font-black shadow-2xl shadow-blue-500/30 hover:shadow-yellow-500/40 hover:-translate-y-1 transition-all"
                    >
                      Discover Magical Plans 🪄
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Security Section */}
          <div id="security" className="scroll-mt-24">
            <div className="bg-gradient-to-br from-white to-blue-50/50 rounded-[2.5rem] border-4 border-cyan-300 shadow-2xl p-8 relative overflow-hidden group hover:border-cyan-400 transition-all duration-300">
              {/* Castle Background */}
              <div className="absolute bottom-4 left-4 w-32 h-32 opacity-10">
                <div className="text-6xl">🏰</div>
              </div>
              
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-3xl flex items-center justify-center text-white text-2xl shadow-2xl border-4 border-white">
                      🛡️
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-blue-800">Security Castle</h2>
                      <p className="text-blue-600 font-bold text-sm">Protect your magical kingdom</p>
                    </div>
                  </div>
                  <SettingsBadge type="security" label="Level 10 Security" />
                </div>

                <div className="space-y-6">
                  {/* Password Reset Card */}
                  <div className="p-8 bg-gradient-to-br from-white to-blue-50/30 rounded-3xl border-4 border-blue-200 shadow-xl hover:shadow-2xl transition-all duration-300">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-2xl text-white shadow-lg">
                          <Key className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="font-black text-blue-800 text-lg mb-2">Password Reset</h3>
                          <p className="text-blue-600 font-bold text-sm max-w-md">
                            Forgot your phrase? We'll send a link to reset your password to your email!
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={handleChangePassword}
                        className="group flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-black rounded-2xl shadow-xl shadow-blue-500/30 hover:shadow-cyan-500/40 transition-all"
                      >
                        <Wand2 className="h-5 w-5 group-hover:rotate-180 transition-transform" />
                        <span>Reset Password</span>
                      </button>
                    </div>
                  </div>

                  {/* Session Management Card */}
                  <div className="p-8 bg-gradient-to-br from-white to-orange-50/30 rounded-3xl border-4 border-orange-200 shadow-xl hover:shadow-2xl transition-all duration-300">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-gradient-to-br from-orange-400 to-yellow-500 rounded-2xl text-white shadow-lg">
                          <LogOut className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="font-black text-orange-800 text-lg mb-2">Exit Adventure Park</h3>
                          <p className="text-orange-600 font-bold text-sm max-w-md">
                            Safely log out from the control panel. Your adventure progress is automatically saved! 🏰
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={async () => { await signOut(); navigate('/'); }}
                        className="group flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white font-black rounded-2xl shadow-xl shadow-orange-500/30 hover:shadow-yellow-500/40 transition-all"
                      >
                        <LogOut className="h-5 w-5 group-hover:-rotate-12 transition-transform" />
                        <span>Exit Park</span>
                      </button>
                    </div>
                  </div>

                  {/* Security Status Card */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-6 bg-gradient-to-br from-white to-blue-50/30 rounded-2xl border-4 border-blue-200 shadow-lg">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-xl text-white">
                          <ShieldCheck className="w-5 h-5" />
                        </div>
                        <span className="font-black text-blue-800 text-sm">Encryption</span>
                      </div>
                      <div className="text-2xl font-black text-blue-900">A++</div>
                      <div className="text-xs text-blue-600 font-bold">Maximum Security</div>
                    </div>
                    
                    <div className="p-6 bg-gradient-to-br from-white to-yellow-50/30 rounded-2xl border-4 border-yellow-200 shadow-lg">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl text-white">
                          <Eye className="w-5 h-5" />
                        </div>
                        <span className="font-black text-yellow-800 text-sm">2FA Ready</span>
                      </div>
                      <div className="text-2xl font-black text-yellow-900">🛡️</div>
                      <div className="text-xs text-yellow-600 font-bold">Extra Protection</div>
                    </div>
                    
                    <div className="p-6 bg-gradient-to-br from-white to-cyan-50/30 rounded-2xl border-4 border-cyan-200 shadow-lg">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-xl text-white">
                          <Clock className="w-5 h-5" />
                        </div>
                        <span className="font-black text-cyan-800 text-sm">Session</span>
                      </div>
                      <div className="text-2xl font-black text-cyan-900">Active</div>
                      <div className="text-xs text-cyan-600 font-bold">This Device</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Game Settings Section */}
          <div id="game" className="scroll-mt-24">
            <div className="bg-gradient-to-br from-white to-yellow-50/50 rounded-[2.5rem] border-4 border-yellow-300 shadow-2xl p-8 relative overflow-hidden group hover:border-yellow-400 transition-all duration-300">
              {/* Game Controller Background */}
              <div className="absolute top-4 right-4 w-28 h-28 opacity-10">
                <div className="text-6xl">🎮</div>
              </div>
              
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-3xl flex items-center justify-center text-white text-2xl shadow-2xl border-4 border-white">
                      🎮
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-yellow-800">Game Settings</h2>
                      <p className="text-yellow-600 font-bold text-sm">Customize your adventure experience</p>
                    </div>
                  </div>
                  <SettingsBadge type="power" label="Game Master" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Game Toggles */}
                  <div className="space-y-4">
                    <h3 className="font-black text-yellow-800 text-lg mb-4 flex items-center gap-2">
                      <Gamepad2 className="w-5 h-5" />
                      Adventure Controls
                    </h3>
                    <GameToggle enabled={notifications} onChange={() => setNotifications(!notifications)} label="Park Announcements" />
                    <GameToggle enabled={soundEffects} onChange={() => setSoundEffects(!soundEffects)} label="Sounds" />
                    <GameToggle enabled={autoSave} onChange={() => setAutoSave(!autoSave)} label="Auto-Save Progress" />
                    <GameToggle enabled={darkMode} onChange={() => setDarkMode(!darkMode)} label="Night Mode" />
                  </div>

                  {/* Game Stats */}
                  <div className="space-y-6">
                    <div className="p-6 bg-gradient-to-br from-white to-blue-50/30 rounded-3xl border-4 border-blue-200 shadow-lg">
                      <h3 className="font-black text-blue-800 text-lg mb-4 flex items-center gap-2">
                        <Trophy className="w-5 h-5" />
                        Adventure Stats
                      </h3>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-bold text-blue-600">Total Play Time</span>
                          <span className="font-black text-blue-800">42h 18m</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-bold text-blue-600">Quests Completed</span>
                          <span className="font-black text-blue-800">156</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-bold text-blue-600">XP Earned</span>
                          <span className="font-black text-blue-800">12,450</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-bold text-blue-600">Best Streak</span>
                          <span className="font-black text-blue-800">28 days</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-6 bg-gradient-to-br from-white to-cyan-50/30 rounded-3xl border-4 border-cyan-200 shadow-lg">
                      <h3 className="font-black text-cyan-800 text-lg mb-4 flex items-center gap-2">
                        <Sparkle className="w-5 h-5" />
                        Quick Actions
                      </h3>
                      <div className="grid grid-cols-2 gap-3">
                        <button className="p-3 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-2xl border-2 border-blue-200 hover:border-blue-300 transition-colors text-sm font-black text-blue-700">
                          Reset Progress
                        </button>
                        <button className="p-3 bg-gradient-to-br from-yellow-100 to-orange-100 rounded-2xl border-2 border-yellow-200 hover:border-yellow-300 transition-colors text-sm font-black text-yellow-700">
                          Export Data
                        </button>
                        <button className="p-3 bg-gradient-to-br from-blue-100 to-yellow-100 rounded-2xl border-2 border-blue-200 hover:border-yellow-300 transition-colors text-sm font-black text-blue-700">
                          Help Center
                        </button>
                        <button className="p-3 bg-gradient-to-br from-yellow-100 to-orange-100 rounded-2xl border-2 border-yellow-200 hover:border-orange-300 transition-colors text-sm font-black text-yellow-700">
                          Feedback
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Navigation */}
        <div className="sticky bottom-4 z-40 bg-white/90 backdrop-blur-xl rounded-[2rem] border-4 border-yellow-300 shadow-2xl p-4 mt-8">
          <div className="flex flex-wrap gap-4 justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-xl border-2 border-blue-200">
                <CheckCircle2 className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-black text-blue-800">Park Status: Operational</p>
                <p className="text-xs text-blue-600 font-bold">All systems ready for adventure! 🎢</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-2 px-5 py-3 bg-gradient-to-br from-white to-blue-50 text-blue-700 font-bold rounded-2xl border-2 border-blue-200 hover:border-yellow-300 hover:-translate-y-1 transition-all shadow-lg"
              >
                <Home className="w-4 h-4" />
                <span className="hidden sm:inline">Back to Park</span>
              </button>
              <button
                onClick={() => navigate('/pricing')}
                className="flex items-center gap-2 px-5 py-3 bg-gradient-to-br from-blue-500 to-yellow-500 text-white font-bold rounded-2xl border-2 border-blue-400 hover:border-yellow-400 hover:-translate-y-1 transition-all shadow-xl"
              >
                <Crown className="w-4 h-4" />
                <span className="hidden sm:inline">Upgrade</span>
              </button>
            </div>
          </div>
        </div>
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
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
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
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
        .animation-delay-500 {
          animation-delay: 0.5s;
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

export default function SettingsPage() {
  return (
    <ProtectedRoute>
      <SettingsContent />
    </ProtectedRoute>
  );
}