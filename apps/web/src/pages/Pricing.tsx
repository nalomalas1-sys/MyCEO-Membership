import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/hooks/useAuth';
import { ParentNavBar } from '@/components/navigation/ParentNavBar';
import { 
  CheckCircle2, 
  Sparkles, 
  Loader2, 
  Shield, 
  HelpCircle, 
  Trophy,
  Users,
  Rocket,
  ChevronDown,
  X,
  ArrowRight,
  ShieldCheck,
  Target,
  Castle,
  Crown,
  Puzzle,
  Dice5,
  Flag,
  Award,
  BarChart3,
  Gamepad2
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


