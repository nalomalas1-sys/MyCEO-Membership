import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/hooks/useAuth';
import { ParentNavBar } from '@/components/navigation/ParentNavBar';
import { 
  CheckCircle2, 
  Sparkles, 
  Loader2, 
  Zap, 
  Shield, 
  Star, 
  HelpCircle, 
  Layout,
  Globe,
  Trophy,
  Users,
  Rocket,
  ChevronDown,
  Box,
  X,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  BadgeCheck,
  Clock,
  Target,
  ZapOff,
  Castle,
  Crown,
  Gem,
  Coins,
  Heart,
  PartyPopper,
  Wand2,
  Palette,
  Sparkle,
  IceCream,
  Pizza,
  Candy,
  Gift,
  TreePine,
  Gamepad2,
  Sword,
  Shield as ShieldIcon,
  Puzzle,
  Dice5,
  Joystick,
  Flag,
  Mountain,
  Compass,
  Award,
  BarChart3
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

// --- GAME-INSPIRED ILLUSTRATIONS ---
const FloatingTreasure = ({ type }: { type: 'coin' | 'gem' | 'star' | 'controller' }) => {
  const getEmoji = () => {
    switch(type) {
      case 'coin': return '💰';
      case 'gem': return '💎';
      case 'star': return '⭐';
      case 'controller': return '🎮';
    }
  };
  
  return (
    <div className="absolute w-12 h-12 animate-float-slow">
      <div className="w-full h-full bg-gradient-to-br from-yellow-300 to-orange-400 rounded-full shadow-lg flex items-center justify-center text-2xl">
        {getEmoji()}
      </div>
      <div className="absolute inset-0 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full blur-md opacity-50"></div>
    </div>
  );
};

const GamePath = () => (
  <div className="absolute inset-0 pointer-events-none overflow-hidden">
    <svg className="w-full h-full">
      <path 
        d="M0,50 Q100,20 200,50 T400,50 T600,50 T800,50 T1000,50" 
        stroke="url(#gameGradient)" 
        strokeWidth="4" 
        fill="none" 
        strokeDasharray="10 10"
        className="animate-dash"
      />
      <path 
        d="M0,80 Q150,60 250,80 T450,80 T650,80 T850,80" 
        stroke="url(#gameGradient2)" 
        strokeWidth="3" 
        fill="none" 
        strokeDasharray="8 12"
        className="animate-dash animation-delay-2000"
      />
      <defs>
        <linearGradient id="gameGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="50%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#3b82f6" />
        </linearGradient>
        <linearGradient id="gameGradient2" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="50%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#3b82f6" />
        </linearGradient>
      </defs>
    </svg>
  </div>
);

// Game Level Badge - FIXED VERSION
const GameLevelBadge = ({ level, label, color }: { level: number; label: string; color: string }) => (
  <div className={`relative inline-flex items-center gap-2 px-4 py-2 rounded-full ${color} text-white text-sm font-black border-2 border-white/20 shadow-lg whitespace-nowrap`}>
    <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
      <span className="text-xs font-bold">{level}</span>
    </div>
    <span className="text-xs font-bold truncate max-w-[100px]">{label}</span>
    <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-pulse flex-shrink-0"></div>
  </div>
);

interface Plan {
  id: 'basic' | 'standard' | 'premium';
  name: string;
  rank: string;
  description: string;
  monthlyPrice: number;
  annualPrice: number;
  childLimit: number | string;
  features: string[];
  popular?: boolean;
  colorTheme: string;
  icon: any;
  accentColor: string;
  badge?: string;
  progressValue?: number;
  emoji: string;
  gameLevel: number;
  unlocks: string[];
}

const plans: Plan[] = [
  {
    id: 'basic',
    name: 'Little Explorer',
    rank: 'Starter Kit',
    description: 'Perfect for first-time adventurers! Start with basic quests and learn money skills.',
    monthlyPrice: 9.99,
    annualPrice: 99.99,
    childLimit: 1,
    features: [
      '👦 1 Adventurer Profile',
      '🎨 Basic Quest Designer',
      '📊 Simple Treasure Tracker',
      '📧 Weekly Adventure Reports',
      '🛡️ Safe & Digital Environment',
      '🎯 5 Starter Quests',
      '🎮 Basic Adventure Games',
    ],
    gameLevel: 1,
    unlocks: [''],
    popular: false,
    colorTheme: 'blue',
    icon: Rocket,
    accentColor: 'from-blue-400 to-cyan-500',
    badge: 'Level 1',
    progressValue: 40,
    emoji: '🧒'
  },
  {
    id: 'standard',
    name: 'Junior Entrepreneur',
    rank: 'Growing Pack',
    description: 'For young adventurers ready to expand! More tools, more quests, more fun!',
    monthlyPrice: 19.99,
    annualPrice: 199.99,
    childLimit: 5,
    features: [
      '👨‍👩‍👧‍👦 Up to 5 Adventurers',
      '🏪 Virtual Shop Builder Pro',
      '📈 Advanced Treasure Analytics',
      '✨ Priority Support',
      '🗺️ Unlimited Quest Access',
      '🎮 Interactive Business Games',
      '📤 Export Adventure Logs',
      '🏆 Achievement System',
      '🎪 Mini-Games Collection',
    ],
    gameLevel: 2,
    unlocks: [''],
    popular: true,
    colorTheme: 'yellow',
    icon: Castle,
    accentColor: 'from-blue-400 via-yellow-400 to-blue-400',
    badge: 'Level 2',
    progressValue: 75,
    emoji: '🦸'
  },
  {
    id: 'premium',
    name: 'CEO Pro',
    rank: 'Ultimate Kingdom',
    description: 'Unlimited for the whole family! Every tool, every feature, endless adventure!',
    monthlyPrice: 29.99,
    annualPrice: 299.99,
    childLimit: 'Unlimited',
    features: [
      '👨‍👩‍👧‍👦👶 Unlimited Adventurers',
      '🏰 Full Adventure Park + Beta',
      '🤖 AI Assistant',
      '📊 Export All Adventure Data',
      '👑 Dedicated Adventure Guide',
      '🎨 Custom Quest Creator',
      '🌟 White Label Options',
      '🎪 All Mini-Games',
      '🏆 Elite Achievement System',
      '🎮 Exclusive Game Content',
    ],
    gameLevel: 3,
    unlocks: [''],
    popular: false,
    colorTheme: 'gold',
    icon: Crown,
    accentColor: 'from-yellow-400 via-orange-400 to-yellow-400',
    badge: 'Level 3',
    progressValue: 100,
    emoji: '👑'
  },
];

// Game Progress Bar Component - FIXED VERSION
const GameProgressBar = ({ value, color }: { value: number; color: string }) => {
  const getColorClass = () => {
    switch(color) {
      case 'blue': return 'from-blue-400 to-cyan-400';
      case 'yellow': return 'from-yellow-400 to-orange-400';
      case 'gold': return 'from-yellow-500 to-orange-500';
      default: return 'from-blue-400 to-cyan-400';
    }
  };

  return (
    <div className="relative w-full h-2.5 bg-gray-200 rounded-full overflow-hidden border border-gray-300 shadow-inner">
      <div 
        className={`h-full bg-gradient-to-r ${getColorClass()} transition-all duration-1000 ease-out`}
        style={{ width: `${value}%` }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-white/30 to-transparent animate-shimmer"></div>
      </div>
    </div>
  );
};

function PricingContent() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('monthly');
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [faqOpen, setFaqOpen] = useState<number | null>(null);
  const [hoveredPlan, setHoveredPlan] = useState<string | null>(null);

  const handleSelectPlan = async (planId: 'basic' | 'standard' | 'premium') => {
    if (!user) {
      navigate('/login');
      return;
    }

    setLoading(planId);
    setError(null);

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const functionUrl = `${supabaseUrl}/functions/v1/create-checkout-session`;

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          plan: planId,
          billingPeriod,
          successUrl: `${window.location.origin}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: `${window.location.origin}/pricing`,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create checkout session');
      }

      const { url } = await response.json();
      if (url) window.location.href = url;
      else throw new Error('No checkout URL returned');

    } catch (err: any) {
      console.error('Error creating checkout session:', err);
      setError(err.message || 'Oops! The checkout failed. Try again! ✨');
      setLoading(null);
    }
  };

  const getPrice = (plan: Plan) => billingPeriod === 'monthly' ? plan.monthlyPrice : plan.annualPrice;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-yellow-50/30 to-blue-50 text-blue-800 relative overflow-x-hidden font-sans selection:bg-yellow-300 selection:text-yellow-900">
      
      {/* --- GAME-INSPIRED BACKGROUND --- */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/doodles.png')] opacity-10"></div>
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-200/30 via-transparent to-transparent"></div>
        <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-yellow-200/20 via-transparent to-transparent"></div>
        
        {/* Floating Game Elements */}
        <div style={{ top: '30%', left: '5%' }} className="absolute">
          <FloatingTreasure type="coin" />
        </div>
        <div style={{ top: '15%', right: '20%' }} className="absolute">
          <FloatingTreasure type="gem" />
        </div>
        <div style={{ bottom: '25%', right: '10%' }} className="absolute">
          <FloatingTreasure type="controller" />
        </div>
        <div style={{ bottom: '40%', left: '20%' }} className="absolute">
          <FloatingTreasure type="star" />
        </div>
        
        <GamePath />
        
        {/* Pixel Art Background */}
        <div className="absolute bottom-0 left-0 right-0 h-32 opacity-5">
          <div className="flex justify-between">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="w-16 h-16 bg-gradient-to-br from-blue-400 to-yellow-400 rounded-lg m-2"></div>
            ))}
          </div>
        </div>
      </div>

      <div className="relative z-20">
        <ParentNavBar />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
        
        {/* --- GAME-STYLE HEADER --- */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
           {/* Title Section */}
           <div className="lg:col-span-8 rounded-[3rem] bg-gradient-to-br from-blue-100 to-yellow-100 p-10 md:p-12 border-4 border-yellow-300 shadow-2xl shadow-yellow-200/30 relative overflow-hidden group hover:border-blue-400 transition-all">
              {/* Game-style background */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-300/10 via-yellow-300/10 to-cyan-300/10"></div>
              <div className="absolute -top-20 -right-20 w-80 h-80 bg-gradient-to-br from-blue-300/30 to-yellow-300/20 rounded-full blur-[100px] group-hover:scale-125 transition-transform duration-1000"></div>
              
              <div className="relative z-10 space-y-8">
                 {/* Game Badge */}
                 <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-gradient-to-r from-blue-400 to-yellow-400 text-blue-900 text-base font-black uppercase tracking-widest border-2 border-white/50 shadow-lg">
                    <Gamepad2 className="w-5 h-5" />
                    <span>🎮 UPGRADE YOUR ADVENTURE 🎮</span>
                    <Sparkles className="w-4 h-4 text-yellow-300 fill-yellow-300" />
                 </div>
                 
                 {/* Title */}
                 <div className="space-y-6">
                    <div className="flex items-center gap-6">
                      <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-2xl">
                        <span className="text-4xl">🏆</span>
                      </div>
                      <h1 className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-yellow-500 to-blue-600 mb-4 leading-tight">
                         Level Up Your<br/>
                         <span className="text-6xl md:text-8xl bg-clip-text text-transparent bg-gradient-to-r from-yellow-500 via-orange-500 to-yellow-500">
                            Adventure!
                         </span>
          </h1>
                    </div>
                    
                    <div className="flex items-center gap-4">
                       <div className="w-32 h-2 bg-gradient-to-r from-blue-500 to-yellow-500 rounded-full"></div>
                       <p className="text-lg text-blue-700 max-w-2xl leading-relaxed font-bold">
                          Choose your adventure level! More tools, more quests, more fun for your little entrepreneurs!
                       </p>
                    </div>
                 </div>

                 {/* Game Stats */}
                 <div className="grid grid-cols-3 gap-4 pt-4">
                    <div className="p-4 bg-white/50 rounded-2xl border-2 border-blue-200 flex items-center gap-3">
                       <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center">
                         <CheckCircle2 className="w-5 h-5 text-white" />
                       </div>
                       <div>
                         <div className="text-xs font-black text-blue-600 uppercase">Trusted By</div>
                         <div className="font-black text-blue-800">Families</div>
                       </div>
                    </div>
                    <div className="p-4 bg-white/50 rounded-2xl border-2 border-yellow-200 flex items-center gap-3">
                       <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
                         <ShieldCheck className="w-5 h-5 text-white" />
                       </div>
                       <div>
                         <div className="text-xs font-black text-yellow-600 uppercase">100%</div>
                         <div className="font-black text-yellow-800">Kid-Safe</div>
                       </div>
                    </div>
                    <div className="p-4 bg-white/50 rounded-2xl border-2 border-cyan-200 flex items-center gap-3">
                       <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center">
                         <Award className="w-5 h-5 text-white" />
                       </div>
                       <div>
                         <div className="text-xs font-black text-cyan-600 uppercase">Amazing</div>
                         <div className="font-black text-cyan-800">Deals</div>
                       </div>
                    </div>
                 </div>
              </div>
           </div>

           {/* Game Settings Panel */}
           <div className="lg:col-span-4 h-full">
              <div className="h-full rounded-[3rem] bg-gradient-to-br from-blue-900/90 to-yellow-900/90 p-8 border-4 border-blue-700 shadow-2xl flex flex-col items-center justify-center gap-8 relative overflow-hidden group">
                 {/* Game Grid Background */}
                 <div className="absolute inset-0 opacity-10">
                   <div className="absolute inset-0 bg-grid"></div>
                 </div>
                 
                 <div className="relative z-10 text-center space-y-3">
                    <div className="text-xs font-black text-blue-300 uppercase tracking-widest flex items-center justify-center gap-3">
                       <Dice5 className="w-4 h-4" />
                       Choose Adventure Mode
                       <Dice5 className="w-4 h-4" />
                    </div>
                    <p className="text-sm text-blue-400 font-bold">Select your payment quest!</p>
                 </div>
                 
                 {/* Game Toggle Switch */}
                 <div className="relative p-2 bg-gradient-to-b from-blue-800 to-yellow-800 rounded-3xl flex items-center w-full max-w-xs shadow-inner border-2 border-blue-700">
                    <div 
                       className="absolute inset-1 rounded-2xl bg-gradient-to-r from-blue-500 to-yellow-500 shadow-lg transition-all duration-500 ease-out"
                       style={{ 
                          left: billingPeriod === 'monthly' ? '0.25rem' : '50%',
                          width: 'calc(50% - 0.25rem)'
                       }}
                    />
            <button
              onClick={() => setBillingPeriod('monthly')}
                       className={`relative z-10 flex-1 py-4 text-sm font-black transition-all duration-300 text-center ${
                          billingPeriod === 'monthly' ? 'text-white' : 'text-blue-400'
                       } group/toggle`}
                    >
                       <span className="relative inline-block">
                          Monthly Quest
                          {billingPeriod === 'monthly' && (
                            <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-16 h-1 bg-gradient-to-r from-blue-500 to-yellow-500 rounded-full"></span>
                          )}
                       </span>
            </button>
            <button
              onClick={() => setBillingPeriod('annual')}
                       className={`relative z-10 flex-1 py-4 text-sm font-black transition-all duration-300 text-center ${
                          billingPeriod === 'annual' ? 'text-white' : 'text-yellow-400'
                       } group/toggle`}
                    >
                       <span className="relative inline-block">
                          Yearly Adventure
                          {billingPeriod === 'annual' && (
                            <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-16 h-1 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full"></span>
                          )}
              </span>
            </button>
                 </div>

                 {/* Game Achievement Banner */}
                 <div className={`transition-all duration-700 transform ${billingPeriod === 'annual' ? 'opacity-100 translate-y-0 scale-100' : 'opacity-30 translate-y-4 scale-95'}`}>
                    <div className="relative">
                       <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-2xl blur-md opacity-50"></div>
                       <div className="relative bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-6 py-4 rounded-2xl shadow-2xl shadow-blue-900/20 flex items-center gap-4 group/hover border-2 border-blue-400">
                          <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-sm">
                             <Trophy className="w-5 h-5" />
                          </div>
                          <div className="text-left">
                             <div className="text-xs font-black uppercase tracking-widest">✨ YEARLY ACHIEVEMENT ✨</div>
                             <div className="text-sm font-black">Save 17% • 2 Months Free!</div>
                          </div>
                       </div>
                    </div>
                 </div>

                 {/* Game Currency */}
                 <div className="flex items-center gap-3 pt-2">
                    <div className="text-xs text-blue-300 font-bold">Game Payments:</div>
                    <div className="flex items-center gap-2">
                       <div className="w-8 h-5 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-md flex items-center justify-center text-xs">💳</div>
                       <div className="w-8 h-5 bg-gradient-to-r from-blue-500 to-yellow-500 rounded-md flex items-center justify-center text-xs">🎯</div>
                       <div className="w-8 h-5 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-md flex items-center justify-center text-xs">💰</div>
                    </div>
                 </div>
              </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="max-w-3xl mx-auto animate-in slide-in-from-top-4 duration-500">
             <div className="relative overflow-hidden rounded-3xl">
                <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-yellow-500/5 blur-xl"></div>
                <div className="relative bg-gradient-to-br from-white to-orange-50/50 border-4 border-orange-300 text-orange-800 px-8 py-6 rounded-3xl flex items-center gap-6 shadow-xl shadow-orange-200/30">
                   <div className="p-4 bg-gradient-to-br from-orange-100 to-yellow-100 rounded-2xl shadow-lg border-2 border-orange-200">
                      <Shield className="w-7 h-7 text-orange-500"/>
                   </div>
                   <div className="flex-1">
                      <h4 className="font-black text-orange-900 text-lg mb-2">Game Error! 🎮</h4>
                      <p className="text-orange-700 font-bold">{error}</p>
                   </div>
                   <button onClick={() => setError(null)} className="p-3 hover:bg-orange-100/50 rounded-2xl transition-colors">
                      <X className="w-6 h-6 text-orange-400" />
                   </button>
                </div>
             </div>
          </div>
        )}

        {/* --- GAME-LEVEL PRICING CARDS --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {plans.map((plan) => {
            const price = getPrice(plan);
            const isPopular = plan.popular;
            const Icon = plan.icon;
            const isHovered = hoveredPlan === plan.id;

            return (
              <div
                key={plan.id}
                className={`relative group transition-all duration-700 hover:scale-[1.02] ${
                  isPopular ? 'md:-translate-y-6' : ''
                }`}
                onMouseEnter={() => setHoveredPlan(plan.id)}
                onMouseLeave={() => setHoveredPlan(null)}
              >
                {/* Game Card Glow */}
                <div className={`absolute -inset-4 rounded-[3.5rem] blur-xl transition-opacity duration-500 ${
                  isPopular 
                    ? 'bg-gradient-to-br from-blue-400/30 via-yellow-400/30 to-orange-400/30 opacity-70' 
                    : 'bg-gradient-to-br from-blue-200/10 to-yellow-200/10 opacity-50'
                } ${isHovered ? 'opacity-100' : 'opacity-0'}`}></div>
                
                {/* Game Card Border */}
                <div className={`relative rounded-[3rem] p-[4px] transition-all duration-500 ${
                  isPopular 
                    ? 'bg-gradient-to-br from-blue-400 via-yellow-400 to-blue-400 shadow-2xl shadow-yellow-300/40' 
                    : plan.colorTheme === 'gold'
                      ? 'bg-gradient-to-br from-yellow-400 via-orange-400 to-yellow-400 shadow-xl shadow-yellow-200/20'
                      : 'bg-gradient-to-br from-blue-300 via-yellow-300 to-blue-300 shadow-xl shadow-blue-200/20'
                }`}>
                  {/* Game Card Content */}
                  <div className={`h-full rounded-[2.9rem] p-8 flex flex-col relative overflow-hidden backdrop-blur-sm
                     ${isPopular ? 'bg-gradient-to-b from-white via-white to-yellow-50/50' : 
                       plan.colorTheme === 'gold' ? 'bg-gradient-to-b from-white via-white to-yellow-50/30' :
                       'bg-gradient-to-b from-white via-white to-blue-50/30'}
                  `}>
                     
                     {/* Game Card Background Elements */}
                     <div className="absolute inset-0 opacity-5">
                        <div className="absolute top-0 right-0 w-48 h-48">
                           <div className="text-6xl opacity-30">{plan.emoji}</div>
                        </div>
                        {/* Pixel Dots */}
                        {Array.from({ length: 12 }).map((_, i) => (
                          <div 
                            key={i}
                            className={`absolute w-2 h-2 rounded-full ${
                              plan.colorTheme === 'blue' ? 'bg-blue-400' : 
                              plan.colorTheme === 'yellow' ? 'bg-yellow-400' : 
                              'bg-yellow-500'
                            }`}
                            style={{
                              left: `${Math.random() * 100}%`,
                              top: `${Math.random() * 100}%`,
                            }}
                          />
                        ))}
                     </div>

                     {/* Game Level Badge - MOVED POSITION */}
                     <div className="absolute top-6 right-6 z-20">
                        <GameLevelBadge 
                          level={plan.gameLevel} 
                          label={plan.badge || ''}
                          color={plan.colorTheme === 'blue' ? 'bg-gradient-to-r from-blue-500 to-cyan-500' :
                                 plan.colorTheme === 'yellow' ? 'bg-gradient-to-r from-blue-500 to-yellow-500' :
                                 'bg-gradient-to-r from-yellow-500 to-orange-500'}
                        />
                     </div>

                     {/* Card Header */}
                     <div className="mb-8 relative z-10">
                        <div className="flex items-start justify-between mb-6">
                           {/* Game Icon */}
                           <div className={`w-20 h-20 rounded-3xl flex items-center justify-center shadow-2xl transition-all duration-500 group-hover:scale-110 group-hover:rotate-12 bg-gradient-to-br ${plan.accentColor} text-white relative`}>
                              <div className="text-3xl">{plan.emoji}</div>
                              <div className="absolute inset-2 rounded-2xl bg-white/20 blur-sm"></div>
                  </div>
                           
                           {/* Game Progress - FIXED LAYOUT */}
                           <div className="flex flex-col items-end space-y-2 w-32">
                              <div className="text-xs font-black text-blue-500 uppercase tracking-widest whitespace-nowrap">
                              </div>
                              <GameProgressBar value={plan.progressValue || 0} color={plan.colorTheme} />
                              <div className="text-xs text-blue-400 font-bold text-right leading-tight">
                                 {plan.unlocks.join(' • ')}
                              </div>
                           </div>
                        </div>

                        <div className="space-y-4">
                          <div className="flex items-center gap-3 flex-wrap">
                            <span className={`text-sm font-black uppercase tracking-widest bg-gradient-to-r ${plan.accentColor} text-transparent bg-clip-text whitespace-nowrap`}>
                                🎮 {plan.rank}
                            </span>
                            <div className="w-2 h-2 bg-gradient-to-r from-blue-400 to-yellow-400 rounded-full animate-pulse"></div>
                            <span className="text-sm font-black text-blue-600 whitespace-nowrap">
                                {typeof plan.childLimit === 'number' ? `${plan.childLimit} Player${plan.childLimit > 1 ? 's' : ''}` : plan.childLimit}
                            </span>
                          </div>
                          <h3 className="text-3xl font-black text-blue-900 tracking-tight">{plan.name}</h3>
                          <p className="text-blue-700 text-sm font-bold leading-relaxed min-h-[60px]">{plan.description}</p>
                        </div>
                     </div>

                     {/* Price Section - FIXED LAYOUT */}
                     <div className="mb-8 p-5 bg-gradient-to-br from-white to-blue-50/50 rounded-3xl border-2 border-blue-200 shadow-lg group-hover:shadow-xl group-hover:border-yellow-300 transition-all duration-300 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                        <div className="relative z-10">
                           <div className="flex items-baseline justify-between mb-2">
                              <div className="flex items-baseline gap-2">
                                 <span className="text-4xl font-black text-blue-900 tracking-tighter">${price}</span>
                                 <div className="flex flex-col">
                                    <span className="text-blue-500 font-black text-xs uppercase tracking-wide">
                        /{billingPeriod === 'monthly' ? 'month' : 'year'}
                      </span>
                    </div>
                              </div>
                              {billingPeriod === 'annual' && (
                                 <div className="text-right">
                                    <div className="text-xs font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                                       BEST DEAL
                                    </div>
                                 </div>
                              )}
                           </div>
                           {billingPeriod === 'annual' && (
                              <div className="text-sm font-black text-blue-600 flex items-center gap-2">
                                 <span className="line-through text-blue-400">${(plan.monthlyPrice * 12).toFixed(2)}</span>
                                 <span className="text-blue-600">Save ${(plan.monthlyPrice * 12 - plan.annualPrice).toFixed(2)}!</span>
                              </div>
                           )}
                        </div>
                  </div>

                     {/* Game Features */}
                     <div className="space-y-3 mb-8 flex-grow">
                        <div className="text-xs font-black text-blue-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                           <Puzzle className="w-4 h-4" />
                           Game Features
                        </div>
                    {plan.features.map((feature, index) => (
                           <div key={index} className="flex items-start gap-3 group/feature">
                              <div className={`mt-1 p-1.5 rounded-full flex-shrink-0 ${
                                plan.colorTheme === 'blue' ? 'bg-gradient-to-br from-blue-100 to-cyan-100 text-blue-600' :
                                plan.colorTheme === 'yellow' ? 'bg-gradient-to-br from-yellow-100 to-orange-100 text-yellow-600' :
                                'bg-gradient-to-br from-yellow-100 to-orange-100 text-yellow-600'
                              }`}>
                                 <CheckCircle2 className="w-3 h-3" />
                              </div>
                              <span className="text-sm text-blue-700 font-medium leading-tight">{feature}</span>
                           </div>
                        ))}
                     </div>

                     {/* Game CTA Button */}
                  <button
                    onClick={() => handleSelectPlan(plan.id)}
                    disabled={loading !== null}
                        className={`w-full py-4 rounded-2xl font-black transition-all duration-500 flex items-center justify-center gap-3 relative overflow-hidden group/btn
                           ${isPopular
                              ? 'bg-gradient-to-r from-blue-600 to-yellow-600 text-white shadow-2xl shadow-blue-500/40 hover:shadow-yellow-500/50 hover:-translate-y-1'
                              : plan.colorTheme === 'gold'
                                ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-2xl shadow-yellow-500/40 hover:shadow-orange-500/50 hover:-translate-y-1'
                                : 'bg-gradient-to-r from-white to-blue-50 text-blue-700 border-4 border-blue-300 hover:border-yellow-400 hover:text-yellow-600 shadow-xl hover:-translate-y-1'
                           } disabled:opacity-50 disabled:cursor-not-allowed
                        `}
                     >
                        {isPopular && (
                           <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/0 via-yellow-500/20 to-yellow-500/0 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000"></div>
                        )}
                        
                        <div className="relative z-10 flex items-center gap-2">
                    {loading === plan.id ? (
                      <>
                                 <Loader2 className="w-5 h-5 animate-spin" />
                                 <span className="font-bold text-sm">Starting Adventure...</span>
                      </>
                    ) : (
                              <>
                                 <span className="font-bold text-sm">Start Level {plan.gameLevel}</span>
                                 {plan.gameLevel === 1 ? (
                                    <Rocket className="w-4 h-4" />
                                 ) : plan.gameLevel === 2 ? (
                                    <Gamepad2 className="w-4 h-4" />
                                 ) : (
                                    <Crown className="w-4 h-4" />
                                 )}
                              </>
                           )}
                        </div>
                  </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* --- GAME FAQ SECTION --- */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
           {/* Game FAQ */}
           <div className="rounded-[3rem] bg-gradient-to-br from-white to-blue-50/50 p-8 border-4 border-yellow-300 shadow-xl relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-64 h-64 opacity-5">
                  <div className="text-8xl opacity-10">❓</div>
               </div>
               
               <div className="relative z-10">
                  <div className="flex items-center gap-5 mb-8">
                     <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-yellow-500 rounded-3xl flex items-center justify-center text-white text-2xl shadow-xl">
                        <HelpCircle className="w-8 h-8" />
            </div>
            <div>
                        <h3 className="text-2xl font-black text-blue-800">Game Questions ❓</h3>
                        <p className="text-blue-600 text-sm font-bold">Common questions from fellow adventurers</p>
                     </div>
                  </div>
                  
                  <div className="space-y-4">
                     {[
                       { 
                         q: "Can I upgrade my game level?", 
                         a: "Yes! Upgrades are instant. New game features unlock immediately!",
                         emoji: "🚀"
                       },
                       { 
                         q: "Is my game progress safe?", 
                         a: "Absolutely! We use bank-level encryption. All data is securely saved in our game servers.",
                         emoji: "🏰"
                       },
                       { 
                         q: "What happens after trial ends?", 
                         a: "You'll return to Level 1 features. All game progress is saved for 90 days!",
                         emoji: "⏰"
                       },
                       { 
                         q: "Can I change game modes?", 
                         a: "Yes! Switch between monthly/yearly anytime. Changes apply to next adventure.",
                         emoji: "✨"
                       }
                     ].map((item, idx) => (
                       <div 
                         key={idx} 
                         className={`p-5 rounded-3xl border-2 transition-all duration-300 cursor-pointer group/faq bg-gradient-to-br from-white to-blue-50/50 hover:border-yellow-400 hover:shadow-lg ${
                           faqOpen === idx ? 'border-yellow-400 shadow-lg' : 'border-blue-200'
                         }`}
                         onClick={() => setFaqOpen(faqOpen === idx ? null : idx)}
                       >
                         <div className="flex items-center justify-between gap-4">
                           <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-100 to-yellow-100 text-blue-600 flex items-center justify-center text-lg">
                                  {item.emoji}
                              </div>
                              <h4 className="font-black text-blue-800 text-sm group-hover/faq:text-yellow-700 transition-colors">{item.q}</h4>
                           </div>
                           <ChevronDown className={`w-5 h-5 text-blue-400 transition-transform duration-300 ${faqOpen === idx ? 'rotate-180 text-yellow-500' : ''}`} />
                         </div>
                         {faqOpen === idx && (
                           <p className="text-blue-600 text-xs mt-4 pl-14 pr-4 animate-in fade-in slide-in-from-top-2 leading-relaxed font-medium bg-gradient-to-r from-blue-50 to-yellow-50 p-3 rounded-2xl">
                             {item.a}
                           </p>
                         )}
                       </div>
                     ))}
                  </div>
               </div>
           </div>

           {/* Classroom Edition */}
           <div className="relative overflow-hidden rounded-[3rem] shadow-2xl border-4 border-yellow-400">
               <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-yellow-900 to-blue-900"></div>
               
               {/* Game Grid Overlay */}
               <div className="absolute inset-0 opacity-10">
                 <div className="absolute inset-0 bg-grid-white/10"></div>
               </div>
               
               <div className="relative z-10 p-8 text-white h-full flex flex-col justify-between">
                  <div className="space-y-8">
                     <div className="flex items-center gap-6">
                        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md border-2 border-white/10 flex items-center justify-center shadow-2xl shadow-blue-500/10">
                           <div className="text-3xl">🏫</div>
            </div>
            <div>
                           <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-white/10 text-yellow-200 text-xs font-black uppercase tracking-widest mb-3">
                              <Target className="w-3 h-3" />
                              Classroom Edition
                           </div>
                           <h3 className="text-3xl font-black mb-3">Multiplayer Mode! 👨‍🏫</h3>
                           <p className="text-blue-200/80 text-sm leading-relaxed max-w-md">
                              Need game licenses for classrooms or schools? Contact our wizard team for custom adventures, group discounts, and teacher tools!
                           </p>
                        </div>
                     </div>
                     
                     <div className="grid grid-cols-2 gap-3 pt-2">
                        <div className="flex items-center gap-2">
                           <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                              <Gamepad2 className="w-3 h-3" />
                           </div>
                           <span className="text-xs font-bold">Group Discounts</span>
                        </div>
                        <div className="flex items-center gap-2">
                           <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                              <Users className="w-3 h-3" />
                           </div>
                           <span className="text-xs font-bold">Teacher Tools</span>
                        </div>
                        <div className="flex items-center gap-2">
                           <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                              <BarChart3 className="w-3 h-3" />
                           </div>
                           <span className="text-xs font-bold">Progress Tracking</span>
                        </div>
                        <div className="flex items-center gap-2">
                           <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                              <Flag className="w-3 h-3" />
                           </div>
                           <span className="text-xs font-bold">School Quests</span>
                        </div>
                     </div>
                  </div>
                  
                  <button className="group/enterprise inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-yellow-300 to-orange-400 text-yellow-900 rounded-2xl font-black text-sm hover:bg-gradient-to-r hover:from-yellow-400 hover:to-orange-500 transition-all duration-300 shadow-2xl shadow-yellow-900/20 hover:shadow-yellow-900/30 mt-8 w-fit">
                     <span>Contact Game Masters</span>
                     <div className="relative w-5 h-5">
                        <ArrowRight className="w-5 h-5 transition-transform group-hover/enterprise:translate-x-1" />
                     </div>
                  </button>
               </div>
           </div>
        </div>

        {/* Game Trust Badges */}
        <div className="text-center pt-12">
           <div className="inline-flex flex-col items-center gap-6">
              <div className="text-sm font-black text-blue-500 uppercase tracking-widest">Trusted Everywhere</div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                 <div className="p-5 bg-gradient-to-br from-blue-50 to-yellow-50 rounded-3xl border-2 border-blue-200 shadow-lg flex flex-col items-center gap-3">
                    <div className="text-2xl">🎮</div>
                    <div className="text-sm font-black text-blue-700">Fun Learning</div>
                 </div>
                 <div className="p-5 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-3xl border-2 border-blue-200 shadow-lg flex flex-col items-center gap-3">
                    <div className="text-2xl">🏆</div>
                    <div className="text-sm font-black text-blue-700">Amazing Deals</div>
                 </div>
                 <div className="p-5 bg-gradient-to-br from-blue-50 to-green-50 rounded-3xl border-2 border-blue-200 shadow-lg flex flex-col items-center gap-3">
                    <div className="text-2xl">👨‍👩‍👧‍👦</div>
                    <div className="text-sm font-black text-blue-700">Family Friendly</div>
                 </div>
                 <div className="p-5 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-3xl border-2 border-yellow-200 shadow-lg flex flex-col items-center gap-3">
                    <div className="text-2xl">✨</div>
                    <div className="text-sm font-black text-yellow-700">Fun</div>
                 </div>
            </div>
          </div>
        </div>
      </div>

      {/* Game Animation styles */}
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
        @keyframes dash {
          to { stroke-dashoffset: -1000; }
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
        .animate-dash {
          animation: dash 30s linear infinite;
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .bg-grid {
          background-image: linear-gradient(to right, currentColor 1px, transparent 1px),
                            linear-gradient(to bottom, currentColor 1px, transparent 1px);
          background-size: 20px 20px;
        }
        .bg-grid-white\\/10 {
          background-image: linear-gradient(to right, rgba(255,255,255,0.1) 1px, transparent 1px),
                            linear-gradient(to bottom, rgba(255,255,255,0.1) 1px, transparent 1px);
          background-size: 20px 20px;
        }
      `}</style>
    </div>
  );
}

export default function PricingPage() {
  return (
    <ProtectedRoute>
      <PricingContent />
    </ProtectedRoute>
  );
}
