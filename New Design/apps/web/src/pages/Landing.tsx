import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { 
  Sparkles, 
  Rocket, 
  Target, 
  Trophy,
  CheckCircle2,
  ArrowRight,
  Play,
  Users,
  PieChart,
  Shield,
  Zap,
  Menu,
  X,
  Star,
  Briefcase,
  Smartphone,
  Quote,
  Heart,
  Lightbulb,
  Puzzle,
  Building2,
  Lock,
  TrendingUp,
  CreditCard,
  BarChart3,
  Globe,
  Award,
  Gamepad2,
  Coins,
  BrainCircuit,
  GraduationCap,
  Check,
  Cloud,
  Sun,
  Moon,
  Sparkle,
  Gem,
  Crown,
  Castle,
  Map,
  Compass,
  PartyPopper,
  IceCream,
  Candy,
  Pizza,
  TargetIcon,
  Flag,
  Home,
  ShoppingCart,
  Banknote,
  ChartBar,
  Megaphone,
  Users2,
  Globe2,
  CrownIcon,
  ZapIcon
} from 'lucide-react';

// --- Types & Interfaces ---

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'white' | 'glass' | 'game';

interface FunButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  to?: string;
  variant?: ButtonVariant;
  className?: string;
  icon?: React.ReactNode;
}

interface SectionHeadingProps {
  badge: string;
  title: string;
  subtitle: string;
  center?: boolean;
  light?: boolean;
}

interface PageProps {
  setPage: (page: string) => void;
}

interface NavLink {
  id: string;
  label: string;
}

// --- Hooks ---

const useOnScreen = (options: IntersectionObserverInit) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setVisible(true);
        observer.disconnect();
      }
    }, options);

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) observer.unobserve(ref.current);
    };
  }, [ref, options]);

  return [ref, isVisible] as const;
};

// --- Animated Elements ---

const FloatingCoin: React.FC<{ delay?: number; size?: number; className?: string }> = ({ delay = 0, size = 24, className = "" }) => (
  <div 
    className={`absolute ${className}`}
    style={{ 
      animation: `float-coin 3s ease-in-out infinite`,
      animationDelay: `${delay}s`,
      width: size,
      height: size
    }}
  >
    <div className="w-full h-full bg-gradient-to-br from-yellow-300 to-amber-400 rounded-full flex items-center justify-center shadow-lg border-2 border-yellow-400">
      <div className="w-3/4 h-3/4 rounded-full border-2 border-yellow-500 flex items-center justify-center">
        <span className="text-yellow-800 font-black text-xs">$</span>
      </div>
    </div>
  </div>
);

const BouncingCharacter: React.FC<{ emoji: string; className?: string }> = ({ emoji, className = "" }) => (
  <div 
    className={`text-3xl ${className}`}
    style={{ animation: `bounce 2s ease-in-out infinite` }}
  >
    {emoji}
  </div>
);

const CartoonCloud: React.FC<{ className?: string; delay?: number }> = ({ className = "", delay = 0 }) => (
  <div 
    className={`absolute ${className}`}
    style={{ animation: `cloud-float 20s linear infinite`, animationDelay: `${delay}s` }}
  >
    <div className="w-24 h-12 bg-blue-100/60 rounded-full relative">
      <div className="absolute -top-3 left-3 w-8 h-8 bg-blue-200/60 rounded-full"></div>
      <div className="absolute -top-4 right-4 w-10 h-10 bg-blue-300/50 rounded-full"></div>
      <div className="absolute top-2 left-8 w-12 h-10 bg-blue-100/70 rounded-full"></div>
    </div>
  </div>
);

// --- Game Elements ---

const XPProgress: React.FC<{ current: number; max: number; label: string }> = ({ current, max, label }) => (
  <div className="bg-white/20 backdrop-blur-sm rounded-full p-1 border-2 border-yellow-400/50">
    <div className="flex items-center justify-between px-3 py-1">
      <span className="text-yellow-300 text-sm font-black">XP: {current}/{max}</span>
      <div className="w-32 bg-white/20 rounded-full h-3 overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-yellow-400 to-amber-400 rounded-full transition-all duration-500"
          style={{ width: `${(current/max)*100}%` }}
        ></div>
      </div>
      <span className="text-white text-xs font-black">{label}</span>
    </div>
  </div>
);

const AchievementBadge: React.FC<{ icon: React.ReactNode; title: string; description: string; unlocked: boolean }> = 
  ({ icon, title, description, unlocked }) => (
  <div className={`p-4 rounded-2xl border-2 transition-all ${unlocked ? 'border-yellow-400 bg-yellow-400/10' : 'border-blue-400/30 bg-blue-400/5'}`}>
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 ${unlocked ? 'bg-yellow-400 text-yellow-900' : 'bg-blue-400/20 text-blue-400'}`}>
      {icon}
    </div>
    <h4 className={`font-black ${unlocked ? 'text-yellow-300' : 'text-blue-300'}`}>{title}</h4>
    <p className="text-sm mt-1 opacity-75">{description}</p>
    {unlocked && <div className="text-yellow-400 text-xs font-black mt-2 flex items-center gap-1">✓ UNLOCKED</div>}
  </div>
);

// --- Shared Components ---

const Reveal: React.FC<{ children: React.ReactNode; className?: string; delay?: number; direction?: 'up' | 'down' | 'left' | 'right' | 'zoom' | 'bounce' }> = ({ children, className = "", delay = 0, direction = 'up' }) => {
  const [ref, isVisible] = useOnScreen({ threshold: 0.1 });

  const getTransform = () => {
    switch(direction) {
      case 'up': return 'translateY(50px)';
      case 'down': return 'translateY(-50px)';
      case 'left': return 'translateX(50px)';
      case 'right': return 'translateX(-50px)';
      case 'zoom': return 'scale(0.8)';
      case 'bounce': return 'translateY(30px)';
      default: return 'translateY(50px)';
    }
  };

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${className}`}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? (direction === 'bounce' ? 'translateY(0)' : 'translate(0) scale(1)') : getTransform(),
        transitionDelay: `${delay}ms`
      }}
    >
      {children}
    </div>
  );
};

const Float: React.FC<{ children: React.ReactNode; delay?: number; duration?: number; className?: string }> = ({ children, delay = 0, duration = 3, className = "" }) => (
  <div 
    className={className}
    style={{ 
      animation: `float ${duration}s ease-in-out infinite`,
      animationDelay: `${delay}s`
    }}
  >
    {children}
  </div>
);

const TiltCard: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = "" }) => {
  const [transform, setTransform] = useState("");
  
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -5;
    const rotateY = ((x - centerX) / centerX) * 5;

    setTransform(`perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`);
  };

  const handleMouseLeave = () => {
    setTransform("perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)");
  };

  return (
    <div 
      className={`transition-transform duration-300 ease-out ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ transform }}
    >
      {children}
    </div>
  );
};

const ModernButton: React.FC<FunButtonProps> = ({ children, onClick, to, variant = 'primary', className = "", icon }) => {
  const baseStyle = "group relative inline-flex items-center justify-center px-8 py-4 text-lg font-bold tracking-wide transition-all duration-300 ease-out focus:outline-none rounded-3xl overflow-hidden transform active:scale-95 cursor-pointer";
  
  const variants: Record<ButtonVariant, string> = {
    primary: "bg-gradient-to-r from-blue-400 via-blue-500 to-cyan-400 text-white shadow-[0_10px_25px_rgba(59,130,246,0.5)] hover:shadow-[0_20px_40px_rgba(59,130,246,0.7)] hover:-translate-y-1 border-2 border-white/30",
    secondary: "bg-gradient-to-r from-yellow-300 to-amber-400 text-yellow-900 shadow-[0_10px_20px_rgba(251,191,36,0.4)] hover:-translate-y-1 border-2 border-yellow-500",
    outline: "bg-transparent text-white border-3 border-dashed border-white/40 hover:bg-white/20 hover:border-white",
    ghost: "bg-transparent text-blue-200 hover:text-white hover:bg-white/10 rounded-full",
    white: "bg-white text-blue-900 hover:bg-blue-50 shadow-2xl hover:scale-105 border-2 border-blue-100",
    glass: "bg-white/20 backdrop-blur-md border-2 border-white/30 text-white hover:bg-white/30 hover:scale-105 shadow-lg",
    game: "bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-b-4 border-blue-600 active:border-b-0 active:translate-y-1 hover:brightness-110 shadow-[0_8px_0_rgba(37,99,235,0.3)]"
  };

  const content = (
    <>
      <span className="relative z-10 flex items-center gap-3">
        {children}
        {icon && <span className="group-hover:rotate-12 transition-transform duration-300">{icon}</span>}
      </span>
      {variant !== 'game' && <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/30 to-transparent z-0"></div>}
    </>
  );

  if (to) {
    return (
      <Link to={to} className={`${baseStyle} ${variants[variant]} ${className}`}>
        {content}
      </Link>
    );
  }

  return (
    <button onClick={onClick} className={`${baseStyle} ${variants[variant]} ${className}`}>
      {content}
    </button>
  );
};

const SectionHeading: React.FC<SectionHeadingProps> = ({ badge, title, subtitle, center = true, light = true }) => (
  <Reveal direction="bounce" className={`mb-16 ${center ? 'text-center mx-auto' : ''} max-w-4xl relative z-10`}>
    <div className={`inline-flex items-center gap-3 px-6 py-3 rounded-full text-sm font-black uppercase tracking-widest mb-8 backdrop-blur-md border-2 shadow-2xl ${light ? 'bg-blue-400/30 text-blue-800 border-blue-300' : 'bg-blue-100 text-blue-600 border-blue-200'}`}>
      <Sparkles className="w-5 h-5 text-yellow-400 fill-yellow-400 animate-spin" />
      {badge}
      <Sparkles className="w-5 h-5 text-yellow-400 fill-yellow-400 animate-spin" />
    </div>
    <h2 className={`text-5xl md:text-7xl font-black mb-8 tracking-tight leading-none ${light ? 'text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500 drop-shadow-lg' : 'text-slate-900'}`}>
      {title}
    </h2>
    <p className={`text-xl md:text-2xl font-medium leading-relaxed max-w-2xl mx-auto ${light ? 'text-white-100/90' : 'text-slate-600'}`}>
      {subtitle}
    </p>
  </Reveal>
);

// 1. Final CTA - Playful Version
const FinalCTA: React.FC<{ setPage: (page: string) => void }> = ({ setPage }) => (
  <div className="py-24 px-4 relative overflow-hidden">
    {/* Background Elements */}
    <CartoonCloud className="top-10 left-10" delay={0} />
    <CartoonCloud className="top-20 right-20" delay={5} />
    <CartoonCloud className="bottom-20 left-1/4" delay={10} />
    
    <FloatingCoin delay={0} size={32} className="top-10 left-1/4" />
    <FloatingCoin delay={1} size={40} className="top-20 right-1/3" />
    <FloatingCoin delay={2} size={28} className="bottom-32 left-1/3" />
    
    <Reveal direction="up" className="max-w-5xl mx-auto bg-gradient-to-br from-blue-300 via-cyan-300 to-blue-400 rounded-[3rem] p-8 md:p-16 text-center relative overflow-hidden shadow-2xl border-4 border-white/50">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cartographer.png')] opacity-10"></div>
      
      {/* Animated Characters */}
      <BouncingCharacter emoji="🚀" className="absolute -top-6 -left-6" />
      <BouncingCharacter emoji="👑" className="absolute -top-6 -right-6" />
      <BouncingCharacter emoji="💰" className="absolute -bottom-6 left-1/4" />
      <BouncingCharacter emoji="🎯" className="absolute -bottom-6 right-1/4" />
      
      <div className="relative z-10">
        <h2 className="text-4xl md:text-6xl font-black text-white mb-8 tracking-tight drop-shadow-[0_4px_0_rgba(59,130,246,0.5)]">
          Ready to launch <br className="hidden md:block" /> your adventure? 🚀
        </h2>
        <p className="text-xl md:text-2xl text-white/90 mb-12 max-w-2xl mx-auto font-bold leading-relaxed bg-white/20 p-6 rounded-2xl">
          Join 50,000+ kids building their own dream businesses!
        </p>
        <div className="flex flex-col sm:flex-row gap-5 justify-center items-center">
          <ModernButton variant="game" to="/signup" className="w-full sm:w-auto text-lg px-12 py-5 shadow-2xl transform hover:scale-105" icon={<Rocket />}>
            Start Free Adventure!
          </ModernButton>
          <ModernButton variant="white" onClick={() => setPage('features')} className="w-full sm:w-auto text-lg px-12 py-5" icon={<Compass />}>
            Explore Magic Tools
          </ModernButton>
        </div>
        <p className="mt-10 text-white/80 text-sm font-bold tracking-widest uppercase bg-white/20 p-3 rounded-full">
          No credit card needed • Cancel anytime
        </p>
      </div>
    </Reveal>
  </div>
);

// 2. Gamified Stats Marquee
const GamifiedStats: React.FC = () => {
  const [stats, setStats] = useState([
    { icon: "🏆", value: "50,000+", label: "Young CEOs", color: "from-yellow-400 to-amber-400" },
    { icon: "💰", value: "$2.1M+", label: "Earned", color: "from-blue-400 to-cyan-500" },
    { icon: "🎯", value: "1.2M+", label: "Quests Completed", color: "from-blue-500 to-blue-600" },
    { icon: "🚀", value: "245K+", label: "Businesses Started", color: "from-blue-400 to-blue-500" },
    { icon: "⭐", value: "4.9/5", label: "Rating", color: "from-yellow-300 to-yellow-500" },
    { icon: "🏪", value: "15K+", label: "Lemonade Stands", color: "from-amber-400 to-yellow-500" },
    { icon: "👑", value: "Level 100", label: "Highest Level", color: "from-blue-400 to-cyan-400" },
    { icon: "⚡", value: "500M+", label: "XP Earned", color: "from-cyan-400 to-blue-500" },
  ]);

  return (
    <div className="py-10 bg-gradient-to-r from-blue-500/10 via-cyan-500/10 to-blue-500/10 border-y-4 border-dashed border-blue-300/50 overflow-hidden relative">
      <div className="max-w-7xl mx-auto px-4 mb-6 text-center">
        <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-black text-lg shadow-lg mb-4">
          <Trophy className="w-5 h-5" />
          Live Adventure Stats
          <Sparkles className="w-5 h-5" />
        </div>
        <p className="text-blue-700 text-sm font-bold uppercase tracking-widest">
          Watch the numbers grow as young CEOs conquer the business world!
        </p>
      </div>
      <div className="flex gap-10 animate-marquee whitespace-nowrap items-center">
        {[...Array(2)].map((_, i) => (
          <React.Fragment key={i}>
            {stats.map((stat, idx) => (
              <div key={`${i}-${idx}`} className={`flex items-center gap-4 p-5 rounded-2xl bg-gradient-to-r ${stat.color} text-white shadow-xl border-2 border-white/50`}>
                <div className="text-4xl">{stat.icon}</div>
                <div className="text-left">
                  <div className="text-2xl font-black">{stat.value}</div>
                  <div className="text-sm font-bold opacity-90">{stat.label}</div>
                </div>
              </div>
            ))}
          </React.Fragment>
        ))}
      </div>
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee { animation: marquee 30s linear infinite; }
      `}</style>
    </div>
  );
};

// 3. Quest List Showcase - Playful
const ActiveQuests: React.FC = () => (
  <div className="py-24 relative overflow-hidden bg-gradient-to-b from-blue-50/20 to-yellow-50/20">
    {/* Background Decorative Elements */}
    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/doodles.png')] opacity-10"></div>
    
    <div className="max-w-7xl mx-auto px-4 grid lg:grid-cols-2 gap-16 items-center">
      <Reveal direction="right">
        <SectionHeading 
          badge="Daily Adventures"
          title="Complete Quests, Earn Treasure! 🗺️"
          subtitle="It's not homework, it's a fun mission! Finish daily tasks to collect XP and unlock rewards."
          center={false}
        />
        <div className="space-y-6 max-w-md">
          {[
            { title: "Design Your Super Logo", xp: 50, icon: "🎨", active: false, completed: true },
            { title: "Set Lemonade Price", xp: 75, icon: "💰", active: true, completed: false },
            { title: "Hire Your First Helper", xp: 150, icon: "👥", active: false, completed: false },
            { title: "Create Awesome Sign", xp: 100, icon: "🪧", active: false, completed: false },
          ].map((quest, i) => (
            <div key={i} className={`p-6 rounded-3xl border-3 transition-all duration-300 flex items-center gap-4 shadow-lg ${quest.active ? 'bg-gradient-to-r from-yellow-100 to-amber-100 border-yellow-300 shadow-[0_0_30px_rgba(251,191,36,0.3)] scale-105' : quest.completed ? 'bg-gradient-to-r from-green-100 to-emerald-100 border-green-300' : 'bg-white/80 border-blue-200'}`}>
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-lg ${quest.completed ? 'bg-gradient-to-br from-green-400 to-emerald-500 text-white' : quest.active ? 'bg-gradient-to-br from-yellow-400 to-amber-500 text-white' : 'bg-gradient-to-br from-blue-300 to-cyan-300 text-white'}`}>
                {quest.completed ? "✅" : quest.icon}
              </div>
              <div className="flex-1">
                <h4 className={`font-black text-xl mb-2 ${quest.completed ? 'text-green-700 line-through' : quest.active ? 'text-amber-700' : 'text-blue-700'}`}>
                  {quest.title}
                </h4>
                <div className="flex gap-3 text-sm font-black">
                  <span className={`px-3 py-1 rounded-full ${quest.completed ? 'bg-green-200 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    +{quest.xp} XP
                  </span>
                  {quest.active && <span className="px-3 py-1 rounded-full bg-amber-200 text-amber-800">Active Now!</span>}
                </div>
              </div>
              {quest.active && (
                <div className="relative">
                  <div className="animate-ping w-6 h-6 bg-yellow-400 rounded-full opacity-75"></div>
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-yellow-500 rounded-full"></div>
                </div>
              )}
            </div>
          ))}
        </div>
      </Reveal>

      {/* Visual Adventure Map */}
      <Reveal direction="left" delay={200} className="relative">
        <TiltCard className="bg-white rounded-[2.5rem] p-8 shadow-2xl relative z-10 border-4 border-blue-200">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-full flex items-center justify-center text-white font-black text-2xl border-4 border-white shadow-xl">
                🏆
              </div>
              <div>
                <h4 className="font-black text-2xl text-blue-800">Junior Explorer</h4>
                <p className="text-sm text-blue-600 font-bold uppercase tracking-wider">Level 5 • 3,450 / 5,000 XP</p>
              </div>
            </div>
            <Gem className="w-10 h-10 text-blue-500 fill-blue-300" />
          </div>

          {/* Adventure Map Visual */}
          <div className="relative h-[300px] w-full bg-gradient-to-br from-blue-50 to-yellow-50 rounded-3xl border-4 border-dashed border-blue-200 p-6 overflow-hidden">
            {/* Map Background */}
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/paper.png')] opacity-20"></div>
            
            {/* Map Path */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              <path d="M60 250 C 60 150, 150 150, 150 150" stroke="#3b82f6" strokeWidth="4" fill="none" strokeDasharray="8 8" />
              <path d="M150 150 C 150 150, 240 150, 240 50" stroke="#f59e0b" strokeWidth="4" fill="none" />
              <path d="M150 150 C 150 150, 240 150, 240 250" stroke="#cbd5e1" strokeWidth="4" fill="none" strokeDasharray="6 6" />
            </svg>

            {/* Map Locations */}
            <div className="absolute bottom-6 left-6">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-400 to-cyan-400 border-4 border-white flex items-center justify-center text-white text-2xl shadow-lg z-10 relative">
                🏠
              </div>
              <div className="mt-2 text-center text-xs font-black text-blue-600 bg-white/80 p-1 rounded-lg">Home Base</div>
            </div>

            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 border-4 border-white flex items-center justify-center text-white text-2xl shadow-lg z-10 relative animate-bounce">
                ⚡
              </div>
              <div className="mt-2 text-center text-xs font-black text-amber-600 bg-white/80 p-1 rounded-lg">You Are Here!</div>
            </div>

            <div className="absolute top-8 right-8">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-300 to-green-400 border-4 border-white flex items-center justify-center text-white text-xl shadow-lg z-10 relative">
                🏰
              </div>
              <div className="mt-2 text-center text-xs font-black text-emerald-700 bg-white/80 p-1 rounded-lg">Castle</div>
            </div>

            <div className="absolute bottom-8 right-8">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-slate-300 to-gray-400 border-4 border-white flex items-center justify-center text-gray-500 text-xl shadow-lg z-10 relative">
                🔒
              </div>
              <div className="mt-2 text-center text-xs font-black text-gray-600 bg-white/80 p-1 rounded-lg">Coming Soon!</div>
            </div>
          </div>
        </TiltCard>
      </Reveal>
    </div>
  </div>
);

// 4. The Video Quest Card - Playful
const QuestShowcase: React.FC = () => (
  <div className="py-24 relative z-10 bg-gradient-to-b from-blue-50/30 to-yellow-50/30">
    <div className="max-w-7xl mx-auto px-4">
      <SectionHeading 
        badge="Magic Lessons"
        title="Learning Is an Adventure! 🎬"
        subtitle="Watch how a 5-minute lesson turns into real business magic!"
      />
      
      <Reveal direction="up" className="max-w-5xl mx-auto">
        <TiltCard className="rounded-[3rem] bg-gradient-to-br from-blue-300 via-cyan-300 to-blue-400 p-3 shadow-2xl relative group border-4 border-white/60">
          {/* Decorative Elements */}
          <div className="absolute -top-6 -right-6 w-20 h-20 bg-yellow-300 rounded-full flex items-center justify-center text-3xl animate-spin-slow">
            ✨
          </div>
          <div className="absolute -bottom-6 -left-6 w-16 h-16 bg-blue-300 rounded-full flex items-center justify-center text-2xl">
            🎯
          </div>
          
          <div className="bg-white rounded-[2.5rem] overflow-hidden relative border-4 border-white/80">
            <div className="grid md:grid-cols-2">
              {/* Left: Content Info */}
              <div className="p-10 flex flex-col justify-center relative z-10 bg-gradient-to-br from-blue-50 to-yellow-50">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-400 to-cyan-400 text-white text-sm font-black w-fit mb-6 shadow-lg">
                  <Play className="w-4 h-4 fill-current" /> ADVENTURE 1
                </div>
                <h3 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-cyan-500 mb-6 leading-tight">
                  The Lemonade Magic Formula 🍋✨
                </h3>
                <p className="text-blue-700/80 text-lg mb-8 leading-relaxed font-medium bg-white/50 p-4 rounded-2xl">
                  Discover the secrets of supply, demand, and magic profit! Watch the lesson, solve the puzzle, and earn your first treasure!
                </p>
                
                <div className="flex items-center gap-4">
                  <div className="flex -space-x-3">
                    {[1,2,3,4].map(i => (
                      <div key={i} className="w-12 h-12 rounded-full border-3 border-white bg-gradient-to-br from-blue-200 to-cyan-200 shadow-lg relative">
                        <div className="w-full h-full rounded-full flex items-center justify-center text-xl">
                          {['👦','👧','🧒','👦'][i-1]}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="text-sm font-black text-blue-700 bg-white/60 p-2 rounded-lg">
                    <span className="text-green-600">12,403</span> adventurers watched today!
                  </div>
                </div>
              </div>
              
              {/* Right: Video Placeholder */}
              <div className="relative min-h-[300px] bg-gradient-to-br from-cyan-200 to-blue-200 group-hover:from-cyan-300 group-hover:to-blue-300 transition-colors border-l-4 border-dashed border-white/50">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-28 h-28 rounded-full bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center cursor-pointer hover:scale-110 transition-all border-4 border-white shadow-[0_0_60px_rgba(59,130,246,0.3)] group/play animate-pulse">
                    <Play className="w-12 h-12 text-white ml-2 fill-white group-hover/play:scale-125 transition-transform" />
                  </div>
                </div>
                {/* Progress Bar */}
                <div className="absolute bottom-8 left-8 right-8">
                  <div className="flex justify-between text-sm font-black text-blue-800 mb-2">
                    <span>Discovering Profit Magic</span>
                    <span>01:24 / 05:00</span>
                  </div>
                  <div className="w-full h-4 bg-white/50 rounded-full overflow-hidden shadow-inner">
                    <div className="w-1/3 h-full bg-gradient-to-r from-blue-500 to-cyan-500 shadow-[0_0_15px_rgba(59,130,246,0.5)] relative rounded-full">
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-6 h-6 bg-white rounded-full shadow-md border-2 border-blue-500"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TiltCard>
      </Reveal>
    </div>
  </div>
);

// --- Pages ---

const HomePage: React.FC<PageProps> = ({ setPage }) => (
  <div className="relative overflow-x-hidden bg-gradient-to-b from-blue-50 via-yellow-50 to-amber-50">
    {/* Floating Background Elements */}
    <FloatingCoin delay={0} size={40} className="top-20 left-10" />
    <FloatingCoin delay={1} size={32} className="top-40 right-20" />
    <FloatingCoin delay={2} size={48} className="bottom-40 left-20" />
    <FloatingCoin delay={1.5} size={28} className="bottom-60 right-1/4" />
    
    <CartoonCloud className="top-32 left-1/4" delay={0} />
    <CartoonCloud className="top-64 right-1/4" delay={8} />
    <CartoonCloud className="bottom-32 left-1/3" delay={16} />
    
    {/* Animated Characters */}
    <BouncingCharacter emoji="🐱" className="absolute top-32 right-10 text-4xl" />
    <BouncingCharacter emoji="🐶" className="absolute bottom-32 left-10 text-4xl" />
    <BouncingCharacter emoji="🦊" className="absolute top-1/2 right-20 text-5xl" />
    
    {/* HERO SECTION */}
    <div className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 px-4">
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="flex flex-col items-center text-center max-w-5xl mx-auto mb-20">
          <Reveal delay={100} direction="down">
            <div className="inline-flex items-center gap-4 px-6 py-3 rounded-full bg-gradient-to-r from-blue-400 to-cyan-400 shadow-lg text-white font-black text-lg mb-10 hover:scale-105 transition-transform cursor-pointer group border-2 border-white/50">
              <span className="relative flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-green-500"></span>
              </span>
              <span className="group-hover:text-yellow-200 transition-colors">Join 50,000+ Young CEOs!</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
            </div>
          </Reveal>

          <Reveal delay={200} direction="bounce">
            <h1 className="text-6xl md:text-8xl font-black mb-8 leading-[0.9] drop-shadow-[0_6px_0_rgba(59,130,246,0.3)]">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-600">
                Build Your
              </span>
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500">
                Dream Empire! 🏰
              </span>
            </h1>
          </Reveal>

          <Reveal delay={400}>
            <p className="text-2xl md:text-3xl text-blue-700 mb-12 max-w-3xl leading-relaxed mx-auto font-bold bg-white/60 p-8 rounded-3xl border-4 border-dashed border-blue-300">
              Turn <span className="text-blue-600 font-black bg-blue-100 px-3 py-1 rounded-full">screen time</span> into <span className="text-yellow-600 font-black bg-yellow-100 px-3 py-1 rounded-full">CEO time</span>!
              Start real businesses in a digital safe world!
            </p>
          </Reveal>

          <Reveal delay={600} className="flex flex-col sm:flex-row gap-6 w-full justify-center relative z-20">
            <ModernButton variant="game" to="/signup" className="w-full sm:w-auto text-xl px-12 py-5 shadow-2xl hover:scale-105" icon={<Rocket className="w-7 h-7" />}>
              Start Your Adventure! 🚀
            </ModernButton>
            <ModernButton variant="primary" onClick={() => setPage('how-it-works')} className="w-full sm:w-auto text-xl px-12 py-5" icon={<Play className="w-6 h-6" />}>
              Watch Live Demo ✨
            </ModernButton>
          </Reveal>
        </div>

        {/* Playful Dashboard Preview */}
        <Reveal delay={800} direction="up" className="relative mx-auto max-w-6xl mb-24">
          <div className="absolute -inset-4 bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500 rounded-[2.5rem] blur-2xl opacity-30 animate-pulse"></div>
          <div className="relative bg-white rounded-[2rem] border-4 border-blue-300 shadow-2xl overflow-hidden group hover:shadow-[0_40px_80px_rgba(59,130,246,0.3)] transition-shadow">
            <div className="h-16 bg-gradient-to-r from-blue-400 to-cyan-400 flex items-center px-8 gap-4">
              <div className="flex gap-2">
                {['🔴', '🟡', '🟢'].map((color, i) => (
                  <div key={i} className="text-lg">{color}</div>
                ))}
              </div>
              <div className="ml-4 flex-1 max-w-xl h-10 bg-white/30 rounded-full flex items-center px-6 text-sm text-white font-mono font-bold border-2 border-white/40">
                myceo.app/dashboard/lemonade-magic
              </div>
            </div>
            <div className="p-8 grid grid-cols-1 md:grid-cols-12 gap-8 bg-gradient-to-br from-blue-50 to-cyan-50">
              <div className="hidden md:flex col-span-2 flex-col gap-6">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-2xl flex items-center justify-center text-white shadow-xl text-2xl">
                  🚀
                </div>
                <div className="space-y-4">
                  {['📊', '💰', '👥', '🏆'].map((icon, i) => (
                    <div key={i} className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl ${i===0 ? 'bg-gradient-to-br from-blue-400 to-cyan-400 text-white shadow-lg' : 'bg-white/60 text-gray-500 hover:bg-white'}`}>
                      {icon}
                    </div>
                  ))}
                </div>
              </div>
              <div className="col-span-12 md:col-span-7 space-y-8">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                  <div>
                    <h3 className="text-blue-600 text-lg font-black uppercase tracking-wider mb-2">Your Treasure Chest</h3>
                    <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center gap-3">
                      $1,240.50
                      <span className="text-base bg-gradient-to-r from-green-400 to-emerald-500 text-white px-3 py-1 rounded-full font-bold">+12% 🎉</span>
                    </div>
                  </div>
                  <button className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white px-8 py-4 rounded-2xl font-black transition-all shadow-lg hover:scale-105 text-lg">
                    + Add New Sale 🛍️
                  </button>
                </div>
                <div className="h-64 bg-white/70 rounded-3xl p-6 border-4 border-blue-200 relative overflow-hidden group/chart">
                  <div className="h-full flex items-end justify-between gap-2 md:gap-4 relative z-10">
                    {[35, 55, 45, 70, 60, 85, 75].map((h, i) => (
                      <div key={i} className="flex-1 bg-gradient-to-t from-blue-400/30 to-cyan-400/30 rounded-t-2xl relative overflow-hidden group/bar transition-all duration-300 hover:-translate-y-4">
                        <div className="absolute bottom-0 w-full bg-gradient-to-t from-blue-400 to-cyan-400 rounded-t-2xl transition-all duration-1000 group-hover/bar:brightness-125" style={{ height: `${h}%` }}></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="col-span-12 md:col-span-3 space-y-6">
                <div className="bg-gradient-to-br from-yellow-300 to-amber-400 rounded-3xl p-6 text-yellow-900 shadow-xl transform rotate-3 hover:rotate-0 transition-transform cursor-pointer border-4 border-yellow-400">
                  <div className="flex items-center gap-3 mb-4">
                    <Trophy className="w-8 h-8 text-yellow-900" />
                    <span className="font-black text-2xl">Next Goal</span>
                  </div>
                  <div className="w-full bg-yellow-900/20 h-4 rounded-full overflow-hidden mb-2">
                    <div className="bg-gradient-to-r from-yellow-500 to-amber-400 h-full w-3/4 rounded-full shadow-lg"></div>
                  </div>
                  <div className="flex justify-between font-black text-sm">
                    <span>Sell 50 Cups</span>
                    <span>38/50</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </div>

    {/* Gamified Stats Marquee */}
    <GamifiedStats />

    {/* VIDEO QUEST */}
    <QuestShowcase />

    {/* NEW: Active Quests & Skill Tree */}
    <ActiveQuests />

    {/* TESTIMONIALS */}
    <div className="py-24 bg-gradient-to-b from-blue-100/50 to-cyan-100/50 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        <SectionHeading 
          badge="Happy CEOs"
          title="Wall of Fame 🏆"
          subtitle="Real stories from families having adventures!"
        />

        <div className="flex flex-col lg:flex-row gap-8 mt-16">
          {[
            {
              text: "My son used to play silly games all day. Now he's teaching ME about profit magic! It's incredible! ✨",
              author: "Sarah Jenkins",
              role: "Mom of Alex (10)",
              color: "bg-gradient-to-br from-blue-400 to-cyan-400",
              emoji: "👩‍👦"
            },
            {
              text: "I saved enough for a new bike with my lemonade stand! I learned real magic money skills! 🚴‍♂️",
              author: "Timmy",
              role: "Age 9, CEO of 'Tim's Treats'",
              color: "bg-gradient-to-br from-blue-500 to-blue-600",
              emoji: "👦"
            },
            {
              text: "Finally an app that's both fun AND teaches real value! My daughter loves her business! 💖",
              author: "Michael Chen",
              role: "Dad of Emma (12)",
              color: "bg-gradient-to-br from-yellow-400 to-amber-400",
              emoji: "👨‍👧"
            }
          ].map((t, i) => (
            <Reveal key={i} direction="up" delay={i * 200}>
              <div className="flex-1 bg-white rounded-[2rem] p-8 border-4 border-dashed hover:border-solid transition-all hover:-translate-y-3 cursor-default hover:shadow-2xl group" style={{borderColor: t.color.includes('blue') ? '#3b82f6' : t.color.includes('yellow') ? '#fbbf24' : '#3b82f6'}}>
                <div className="flex gap-1 mb-6">
                  {[1,2,3,4,5].map(s => <Star key={s} className="w-6 h-6 fill-yellow-400 text-yellow-400" />)}
                </div>
                <p className="text-xl text-blue-800 font-bold leading-relaxed mb-8 group-hover:text-blue-900 transition-colors">"{t.text}"</p>
                <div className="flex items-center gap-4">
                  <div className={`w-16 h-16 rounded-full ${t.color} flex items-center justify-center text-white font-black text-2xl shadow-xl border-4 border-white`}>
                    {t.emoji}
                  </div>
                  <div>
                    <div className="text-blue-900 font-black text-xl">{t.author}</div>
                    <div className="text-blue-600 font-bold">{t.role}</div>
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </div>

    {/* TEASER CTA FOR OTHER PAGES */}
    <div className="py-24 px-4 bg-gradient-to-b from-yellow-50/50 to-amber-50/50">
      <div className="max-w-7xl mx-auto text-center">
        <h2 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-cyan-500 mb-16 drop-shadow-lg">
          Explore the Empire! ✨
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div onClick={() => setPage('features')} className="cursor-pointer group bg-gradient-to-br from-blue-100 to-cyan-100 p-10 rounded-[2rem] border-4 border-dashed border-blue-300 hover:border-solid transition-all hover:-translate-y-3 hover:shadow-2xl">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-2xl flex items-center justify-center text-white text-3xl mb-6 mx-auto group-hover:scale-110 transition-transform shadow-lg">
              🎮
            </div>
            <h3 className="text-3xl font-black text-blue-800 mb-3">The Adventure Zone</h3>
            <p className="text-blue-600 mb-8 font-medium">Tools and fun games!</p>
            <span className="text-blue-600 font-black flex items-center justify-center gap-2 group-hover:gap-4 transition-all text-lg">
              See Features <ArrowRight className="w-5 h-5"/>
            </span>
          </div>
          <div onClick={() => setPage('how-it-works')} className="cursor-pointer group bg-gradient-to-br from-blue-100 to-teal-100 p-10 rounded-[2rem] border-4 border-dashed border-blue-300 hover:border-solid transition-all hover:-translate-y-3 hover:shadow-2xl">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-teal-400 rounded-2xl flex items-center justify-center text-white text-3xl mb-6 mx-auto group-hover:scale-110 transition-transform shadow-lg">
              🗺️
            </div>
            <h3 className="text-3xl font-black text-blue-800 mb-3">How It Works</h3>
            <p className="text-blue-600 mb-8 font-medium">Your journey from zero to hero!</p>
            <span className="text-blue-600 font-black flex items-center justify-center gap-2 group-hover:gap-4 transition-all text-lg">
              View Adventure Map <ArrowRight className="w-5 h-5"/>
            </span>
          </div>
          <div onClick={() => setPage('pricing')} className="cursor-pointer group bg-gradient-to-br from-yellow-100 to-amber-100 p-10 rounded-[2rem] border-4 border-dashed border-yellow-300 hover:border-solid transition-all hover:-translate-y-3 hover:shadow-2xl">
            <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-amber-400 rounded-2xl flex items-center justify-center text-white text-3xl mb-6 mx-auto group-hover:scale-110 transition-transform shadow-lg">
              💎
            </div>
            <h3 className="text-3xl font-black text-amber-800 mb-3">Treasure Plans</h3>
            <p className="text-amber-600 mb-8 font-medium">Plans for every adventurer!</p>
            <span className="text-amber-600 font-black flex items-center justify-center gap-2 group-hover:gap-4 transition-all text-lg">
              View Treasure Chest <ArrowRight className="w-5 h-5"/>
            </span>
          </div>
        </div>
      </div>
    </div>

    {/* RESTORED FINAL CTA */}
    <FinalCTA setPage={setPage} />
  </div>
);

const FeaturesPage: React.FC = () => (
  <div className="py-32 px-4 relative min-h-screen bg-gradient-to-b from-blue-50 via-yellow-50 to-amber-50">
    {/* Background Elements */}
    <CartoonCloud className="top-20 left-10" delay={0} />
    <CartoonCloud className="top-40 right-20" delay={5} />
    <BouncingCharacter emoji="🐱" className="absolute top-1/4 right-10 text-5xl" />
    <BouncingCharacter emoji="🦉" className="absolute bottom-1/4 left-10 text-6xl" />
    
    <div className="max-w-7xl mx-auto relative z-10">
      <SectionHeading 
        badge="Tools"
        title="The Adventurer's Toolkit 🧰"
        subtitle="Everything you need for your business adventure, all in one colorful dashboard!"
      />

      <div className="grid grid-cols-1 md:grid-cols-6 gap-6 grid-rows-[auto]">
          {/* Card 1: AI Coach - Large */}
          <Reveal direction="left" className="md:col-span-4 rounded-[2.5rem] bg-gradient-to-br from-blue-200 via-cyan-200 to-blue-300 p-10 relative overflow-hidden group border-4 border-white/70 hover:border-blue-300 shadow-2xl">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-300/50 rounded-full blur-3xl"></div>
            
            <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center h-full">
                <div className="flex-1 text-left">
                  <div className="w-20 h-20 bg-white/70 rounded-3xl flex items-center justify-center mb-6 border-4 border-blue-300 shadow-lg text-3xl">
                    🤖
                  </div>
                  <h3 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-cyan-500 mb-4">Meet Your AI Friend! 🤖</h3>
                  <p className="text-blue-700 text-xl leading-relaxed mb-8 font-bold bg-white/50 p-6 rounded-2xl">
                      Your business helper! Stuck on pricing? Need a logo idea? Chief is here 24/7 with fun advice!
                  </p>
                  <div className="flex gap-3">
                      <span className="bg-gradient-to-r from-blue-400 to-cyan-400 text-white px-5 py-3 rounded-xl text-base font-black border-2 border-white">Strategy 🧠</span>
                      <span className="bg-gradient-to-r from-yellow-400 to-amber-400 text-white px-5 py-3 rounded-xl text-base font-black border-2 border-white">Creative 🎨</span>
                  </div>
                </div>
                
                {/* Chat UI Mockup */}
                <div className="flex-1 w-full max-w-sm bg-white/80 backdrop-blur-xl rounded-3xl p-6 border-4 border-cyan-300 shadow-2xl">
                  <div className="space-y-4">
                      <div className="flex gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-full flex items-center justify-center text-base font-black text-white shrink-0">You</div>
                        <div className="bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-800 p-4 rounded-2xl rounded-tl-none text-base font-bold border-2 border-blue-300">
                          Should I sell cookies too? 🍪
                        </div>
                      </div>
                      <div className="flex gap-3 flex-row-reverse">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-full flex items-center justify-center text-base font-black text-white shrink-0">🤖</div>
                        <div className="bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-900 p-4 rounded-2xl rounded-tr-none text-base font-bold border-2 border-blue-300">
                          Great idea! That's called "upselling"! Try a Cookie + Lemonade combo deal! 🍪+🍋=🎉
                        </div>
                      </div>
                  </div>
                </div>
            </div>
          </Reveal>

          {/* Card 2: Gamification - Tall */}
          <Reveal direction="down" delay={100} className="md:col-span-2 md:row-span-2 rounded-[2.5rem] bg-gradient-to-b from-yellow-300 to-amber-400 p-8 text-yellow-900 relative overflow-hidden group hover:-translate-y-3 transition-transform shadow-2xl border-4 border-yellow-400">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/confetti.png')] opacity-20"></div>
            <div className="relative z-10 flex flex-col h-full">
                <div className="w-20 h-20 bg-white/50 backdrop-blur-sm rounded-3xl flex items-center justify-center mb-6 shadow-lg text-3xl">
                  🎮
                </div>
                <h3 className="text-3xl font-black mb-4">Play to Learn! 🎯</h3>
                <p className="font-black opacity-90 mb-8 text-xl">
                  Turn profits into XP! Compete on leaderboards and unlock skins!
                </p>
                
                <div className="mt-auto space-y-4">
                  {[
                    { badge: 'Top Seller 🏆', color: 'from-yellow-400 to-amber-400' },
                    { badge: 'Marketing Guru 📣', color: 'from-blue-400 to-cyan-400' },
                    { badge: 'Team Player 🤝', color: 'from-blue-500 to-blue-600' }
                  ].map((badge, i) => (
                      <div key={i} className={`bg-gradient-to-r ${badge.color} backdrop-blur-md p-4 rounded-2xl flex items-center gap-4 shadow-lg border-2 border-white/50 transform hover:scale-105 transition-transform cursor-pointer`}>
                        <div className="w-12 h-12 bg-white/80 rounded-full flex items-center justify-center text-xl shadow-sm">
                          {['🏆','📣','🤝'][i]}
                        </div>
                        <span className="font-black text-white text-lg">{badge.badge}</span>
                      </div>
                  ))}
                </div>
            </div>
          </Reveal>

          {/* Card 3: Finance - Medium */}
          <Reveal direction="up" delay={200} className="md:col-span-2 rounded-[2.5rem] bg-gradient-to-br from-green-100 to-emerald-100 p-8 relative overflow-hidden group hover:border-emerald-400 transition-colors border-4 border-emerald-300 shadow-xl">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-300/30 rounded-full blur-3xl group-hover:bg-emerald-300/50 transition-colors"></div>
            <div className="relative z-10">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-green-500 rounded-3xl flex items-center justify-center mb-6 text-white text-2xl">
                  💰
                </div>
                <h3 className="text-2xl font-black text-emerald-800 mb-2">Smart Money</h3>
                <p className="text-emerald-700 font-bold">Real financial fun: profit, savings, and goals!</p>
            </div>
          </Reveal>

          {/* Card 4: Safety - Medium */}
          <Reveal direction="up" delay={300} className="md:col-span-2 rounded-[2.5rem] bg-gradient-to-br from-blue-100 to-indigo-100 p-8 relative overflow-hidden group hover:border-blue-400 transition-colors border-4 border-blue-300 shadow-xl">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-300/30 rounded-full blur-3xl group-hover:bg-blue-300/50 transition-colors"></div>
            <div className="relative z-10">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-3xl flex items-center justify-center mb-6 text-white text-2xl">
                  🛡️
                </div>
                <h3 className="text-2xl font-black text-blue-800 mb-2">100% Safe & Fun</h3>
                <p className="text-blue-700 font-bold">COPPA friendly. No ads, fully protected!</p>
            </div>
          </Reveal>
      </div>
    </div>
  </div>
);

// Interactive Game Component for How It Works
const AdventureGame: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [xp, setXp] = useState(0);
  const [level, setLevel] = useState(1);
  const [achievements, setAchievements] = useState([
    { id: 1, title: "First Idea", unlocked: true },
    { id: 2, title: "Logo Design", unlocked: false },
    { id: 3, title: "First Sale", unlocked: false },
    { id: 4, title: "Hire Helper", unlocked: false },
    { id: 5, title: "Level Up", unlocked: false },
  ]);

  const steps = [
    {
      title: "Dream Big! ✨",
      description: "Choose your business idea from lemonade stand to cookie empire!",
      icon: "💡",
      action: "Pick Your Adventure",
      xp: 50,
      color: "from-yellow-200 to-amber-200"
    },
    {
      title: "Build Your Shop 🛠️",
      description: "Design your logo, set prices, and create your first product!",
      icon: "🏪",
      action: "Design & Create",
      xp: 75,
      color: "from-blue-200 to-cyan-200"
    },
    {
      title: "Launch & Sell! 🚀",
      description: "Make your first sale and watch the profits roll in!",
      icon: "💰",
      action: "Make First Sale",
      xp: 100,
      color: "from-blue-200 to-blue-300"
    },
    {
      title: "Grow Empire 🌍",
      description: "Hire helpers, expand products, and reach new customers!",
      icon: "👑",
      action: "Expand Business",
      xp: 150,
      color: "from-blue-300 to-cyan-300"
    }
  ];

  const handleStepClick = (stepIndex: number) => {
    if (stepIndex === currentStep) {
      const newXp = xp + steps[stepIndex].xp;
      setXp(newXp);
      
      // Level up every 200 XP
      const newLevel = Math.floor(newXp / 200) + 1;
      if (newLevel > level) {
        setLevel(newLevel);
      }
      
      // Unlock achievements
      const newAchievements = [...achievements];
      if (stepIndex < achievements.length && !achievements[stepIndex].unlocked) {
        newAchievements[stepIndex].unlocked = true;
        setAchievements(newAchievements);
      }
      
      // Move to next step
      if (currentStep < steps.length - 1) {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 to-yellow-50 rounded-[2.5rem] p-8 border-4 border-blue-300 shadow-2xl">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Game Stats */}
        <div className="md:w-1/3 space-y-6">
          <div className="bg-gradient-to-r from-blue-400 to-cyan-400 rounded-2xl p-6 text-white text-center">
            <div className="text-3xl font-black">Level {level}</div>
            <div className="text-sm opacity-90">CEO Adventure</div>
          </div>
          
          <XPProgress current={xp} max={200 * level} label={`${xp} XP`} />
          
          <div className="bg-white/80 rounded-2xl p-6 border-2 border-yellow-300">
            <h4 className="font-black text-blue-800 mb-4">Achievements 🏆</h4>
            <div className="space-y-3">
              {achievements.map((ach) => (
                <div key={ach.id} className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${ach.unlocked ? 'bg-yellow-400 text-yellow-900' : 'bg-blue-300 text-blue-500'}`}>
                    {ach.unlocked ? "✓" : "?"}
                  </div>
                  <span className={`font-bold ${ach.unlocked ? 'text-blue-700' : 'text-blue-400'}`}>
                    {ach.title}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Game Board */}
        <div className="md:w-2/3">
          <h3 className="text-3xl font-black text-blue-800 mb-6 text-center">Your Adventure Map 🗺️</h3>
          
          <div className="relative">
            {/* Adventure Path */}
            <div className="absolute top-1/2 left-0 right-0 h-2 bg-gradient-to-r from-yellow-300 via-blue-300 to-cyan-300 -translate-y-1/2 rounded-full z-0"></div>
            
            {/* Steps */}
            <div className="relative z-10 flex justify-between">
              {steps.map((step, index) => (
                <div key={index} className="flex flex-col items-center">
                  <button
                    onClick={() => handleStepClick(index)}
                    disabled={index > currentStep}
                    className={`w-20 h-20 rounded-full border-4 flex items-center justify-center text-3xl shadow-xl transition-all duration-300 ${
                      index < currentStep
                        ? 'bg-gradient-to-br from-green-400 to-emerald-500 border-green-500 cursor-default'
                        : index === currentStep
                        ? 'bg-gradient-to-br from-yellow-400 to-amber-400 border-yellow-500 cursor-pointer hover:scale-110 animate-pulse'
                        : 'bg-gradient-to-br from-blue-300 to-blue-400 border-blue-400 cursor-not-allowed'
                    }`}
                  >
                    {step.icon}
                  </button>
                  <div className={`mt-4 p-4 rounded-xl w-48 text-center border-2 ${
                    index === currentStep ? 'border-blue-300 bg-white shadow-lg' : 'border-transparent'
                  }`}>
                    <h4 className="font-black text-lg mb-1">{step.title}</h4>
                    <p className="text-sm text-gray-600 mb-2">{step.description}</p>
                    {index === currentStep && (
                      <button
                        onClick={() => handleStepClick(index)}
                        className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-4 py-2 rounded-full text-sm font-black hover:scale-105 transition-transform"
                      >
                        {step.action} → +{step.xp} XP
                      </button>
                    )}
                    {index < currentStep && (
                      <div className="text-green-600 text-sm font-black flex items-center justify-center gap-1">
                        ✓ Completed +{step.xp} XP
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Area */}
          {currentStep < steps.length && (
            <div className="mt-12 bg-gradient-to-r from-blue-100 to-cyan-100 rounded-2xl p-6 border-2 border-blue-300">
              <h4 className="font-black text-xl text-blue-800 mb-3">Current Mission: {steps[currentStep].title}</h4>
              <p className="text-blue-700 mb-4">{steps[currentStep].description}</p>
              <div className="flex gap-4">
                <button
                  onClick={() => handleStepClick(currentStep)}
                  className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-6 py-3 rounded-xl font-black hover:scale-105 transition-transform shadow-lg"
                >
                  Complete Mission! +{steps[currentStep].xp} XP
                </button>
                <button className="bg-gradient-to-r from-blue-400 to-cyan-400 text-white px-6 py-3 rounded-xl font-black hover:scale-105 transition-transform">
                  Get Help from AI 🤖
                </button>
              </div>
            </div>
          )}

          {currentStep === steps.length - 1 && xp >= steps[currentStep].xp && (
            <div className="mt-8 bg-gradient-to-r from-yellow-300 to-amber-400 rounded-2xl p-6 text-center border-4 border-yellow-500 animate-bounce">
              <div className="text-4xl mb-3">🎉 CONGRATULATIONS! 🎉</div>
              <p className="text-xl font-black text-yellow-900">You've built your business empire!</p>
              <p className="text-yellow-800">Total XP Earned: {xp}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Enhanced How It Works Page
const HowItWorksPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'game' | 'steps' | 'achievements'>('game');

  return (
    <div className="py-32 bg-gradient-to-b from-blue-50/50 via-cyan-50/50 to-yellow-50/50 relative overflow-hidden min-h-screen">
      {/* Background Elements */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-300/20 rounded-full blur-[150px]"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-yellow-300/20 rounded-full blur-[120px]"></div>
      
      <BouncingCharacter emoji="🐰" className="absolute top-20 left-20 text-6xl" />
      <BouncingCharacter emoji="🐢" className="absolute bottom-20 right-20 text-5xl" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        <SectionHeading 
            badge="The Adventure Begins"
            title="Your Journey to CEO Stardom! 🦸"
            subtitle="Follow the path from idea to empire. It's not just learning; it's a fun quest!"
        />

        {/* Interactive Game Section */}
        <div className="mb-20">
          <AdventureGame />
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-12">
          <div className="inline-flex bg-gradient-to-r from-blue-100 to-cyan-100 rounded-full p-2 border-2 border-blue-300">
            {[
              { id: 'game', label: 'Play Game 🎮', icon: '🎲' },
              { id: 'steps', label: 'Learn Steps 📚', icon: '📝' },
              { id: 'achievements', label: 'Get Rewards 🏆', icon: '✨' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-8 py-3 rounded-full text-lg font-black transition-all flex items-center gap-2 ${
                  activeTab === tab.id 
                    ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg' 
                    : 'text-blue-700 hover:bg-white/50'
                }`}
              >
                <span>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content Based on Tab */}
        {activeTab === 'steps' && (
          <div className="grid md:grid-cols-4 gap-8">
            {[
              {
                step: 1,
                title: "Dream & Discover",
                description: "Choose your business adventure from our catalog",
                icon: "💡",
                color: "from-yellow-300 to-amber-400",
                tasks: ["Pick business type", "Name your shop", "Choose colors"]
              },
              {
                step: 2,
                title: "Build & Create",
                description: "Design your shop and create your first products",
                icon: "🏗️",
                color: "from-blue-300 to-cyan-400",
                tasks: ["Design logo", "Set prices", "Create inventory"]
              },
              {
                step: 3,
                title: "Launch & Sell",
                description: "Open your shop and make your first sale",
                icon: "🚀",
                color: "from-blue-400 to-blue-500",
                tasks: ["First customer", "Collect payment", "Track profit"]
              },
              {
                step: 4,
                title: "Grow & Expand",
                description: "Level up your business and reach new heights",
                icon: "📈",
                color: "from-blue-500 to-cyan-400",
                tasks: ["Hire helpers", "Add products", "Go global"]
              }
            ].map((step) => (
              <Reveal key={step.step} direction="up" delay={step.step * 100}>
                <div className={`bg-gradient-to-br ${step.color} rounded-[2rem] p-8 text-white relative overflow-hidden shadow-2xl border-4 border-white/50`}>
                  <div className="absolute -top-4 -right-4 w-20 h-20 bg-white/20 rounded-full blur-xl"></div>
                  <div className="relative z-10">
                    <div className="w-16 h-16 bg-white/30 rounded-2xl flex items-center justify-center text-3xl mb-6">
                      {step.icon}
                    </div>
                    <div className="text-2xl font-black mb-2">Step {step.step}</div>
                    <h3 className="text-2xl font-black mb-3">{step.title}</h3>
                    <p className="mb-6 opacity-90">{step.description}</p>
                    <div className="space-y-2">
                      {step.tasks.map((task, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                          <span className="text-sm">{task}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        )}

        {activeTab === 'achievements' && (
          <div className="bg-gradient-to-br from-blue-50 to-yellow-50 rounded-[2.5rem] p-10 border-4 border-blue-300 shadow-2xl">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
              {[
                { icon: <Trophy className="w-8 h-8" />, title: "First Sale", xp: 100, description: "Make your first sale" },
                { icon: <Crown className="w-8 h-8" />, title: "Business Boss", xp: 500, description: "Reach Level 5 CEO status" },
                { icon: <Zap className="w-8 h-8" />, title: "Speed Demon", xp: 250, description: "Complete 10 quests in one day" },
                { icon: <Users className="w-8 h-8" />, title: "Team Leader", xp: 300, description: "Hire your first helper" },
                { icon: <Globe className="w-8 h-8" />, title: "Global CEO", xp: 1000, description: "Make sales in 5 categories" },
              ].map((ach, i) => (
                <div key={i} className="bg-white rounded-2xl p-6 text-center border-2 border-yellow-300 hover:border-blue-400 transition-colors">
                  <div className="w-16 h-16 bg-gradient-to-br from-yellow-300 to-amber-400 rounded-2xl flex items-center justify-center text-white mx-auto mb-4">
                    {ach.icon}
                  </div>
                  <h4 className="font-black text-blue-800 mb-1">{ach.title}</h4>
                  <div className="text-yellow-600 font-black mb-2">+{ach.xp} XP</div>
                  <p className="text-sm text-gray-600">{ach.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Start Guide */}
        <Reveal direction="up" className="mt-20">
          <div className="bg-gradient-to-r from-blue-400 to-cyan-400 rounded-[2.5rem] p-10 text-white shadow-2xl border-4 border-white/50">
            <h3 className="text-3xl font-black mb-6 text-center">Ready to Start Your Adventure? 🚀</h3>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white/20 backdrop-blur-md rounded-2xl p-6 border-2 border-white/30">
                <div className="text-4xl mb-4">1️⃣</div>
                <h4 className="font-black text-xl mb-2">Sign Up Free</h4>
                <p>Create your CEO profile in seconds</p>
              </div>
              <div className="bg-white/20 backdrop-blur-md rounded-2xl p-6 border-2 border-white/30">
                <div className="text-4xl mb-4">2️⃣</div>
                <h4 className="font-black text-xl mb-2">Pick Your Business</h4>
                <p>Choose from lemonade, cookies, or create your own!</p>
              </div>
              <div className="bg-white/20 backdrop-blur-md rounded-2xl p-6 border-2 border-white/30">
                <div className="text-4xl mb-4">3️⃣</div>
                <h4 className="font-black text-xl mb-2">Start Earning</h4>
                <p>Complete quests and watch your business grow!</p>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </div>
  );
};

const PricingPage: React.FC = () => (
  <div className="py-32 px-4 relative overflow-hidden min-h-screen bg-gradient-to-b from-blue-50/50 via-cyan-50/50 to-yellow-50/50">
    {/* Background Elements */}
    <FloatingCoin delay={0} size={48} className="top-20 left-1/4" />
    <FloatingCoin delay={1} size={40} className="top-40 right-1/3" />
    <FloatingCoin delay={0.5} size={56} className="bottom-40 left-1/3" />
    
    <BouncingCharacter emoji="🦄" className="absolute top-1/4 right-20 text-7xl" />
    <BouncingCharacter emoji="🐲" className="absolute bottom-1/4 left-20 text-6xl" />
    
    <div className="max-w-5xl mx-auto relative z-10">
      <SectionHeading 
          badge="Treasure Plans"
          title="Start Your Adventure! 🗺️"
          subtitle="Choose the plan that fits your future hero!"
      />

      <div className="grid md:grid-cols-3 gap-10 items-center mt-16">
          {/* Free Tier */}
          <div className="bg-gradient-to-br from-blue-100 to-cyan-100 rounded-[2.5rem] p-10 border-4 border-blue-300 text-center hover:bg-gradient-to-br hover:from-blue-200 hover:to-cyan-200 transition-all shadow-2xl hover:-translate-y-3">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-2xl flex items-center justify-center text-white text-3xl mb-6 mx-auto shadow-lg">
              🧒
            </div>
            <h3 className="text-2xl font-black text-blue-800 mb-3">Little Explorer</h3>
            <div className="text-5xl font-black text-blue-900 mb-2">$0</div>
            <p className="text-blue-700 text-sm mb-8">Forever free!</p>
            <ul className="text-blue-700 space-y-4 mb-10 text-base font-bold mx-auto max-w-[200px]">
                <li className="flex items-center gap-3">✅ 1 Business Type</li>
                <li className="flex items-center gap-3">✅ Basic Magic Lessons</li>
                <li className="flex items-center gap-3">✅ Public Profile</li>
            </ul>
            <ModernButton variant="outline" to="/signup" className="w-full text-lg">Start Free Adventure</ModernButton>
          </div>

          {/* Pro Tier - Highlighted */}
          <div className="bg-gradient-to-b from-blue-400 via-cyan-400 to-blue-500 rounded-[3rem] p-12 text-center relative transform md:scale-110 shadow-2xl border-4 border-white/70 z-10">
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-gradient-to-r from-yellow-300 to-amber-400 text-yellow-900 px-6 py-3 rounded-b-2xl text-base font-black uppercase tracking-widest shadow-lg">
              Most Popular! 🎉
            </div>
            <div className="w-24 h-24 bg-gradient-to-br from-yellow-300 to-amber-400 rounded-3xl flex items-center justify-center text-white text-4xl mb-6 mx-auto shadow-xl border-4 border-white">
              🦸
            </div>
            <h3 className="text-3xl font-black text-white mb-3">Super Hero</h3>
            <div className="text-7xl font-black text-white mb-2">$12<span className="text-2xl opacity-80 font-medium">/mo</span></div>
            <p className="text-white/90 text-base mb-10">Billed yearly (save 20%)</p>
            <ul className="text-white space-y-4 mb-12 font-black text-left mx-auto max-w-[220px] text-lg">
                <li className="flex items-center gap-3">✨ Unlimited Businesses</li>
                <li className="flex items-center gap-3">✨ AI Friend Access</li>
                <li className="flex items-center gap-3">✨ Global Markets</li>
                <li className="flex items-center gap-3">✨ Magic Rewards</li>
            </ul>
            <ModernButton variant="game" to="/signup" className="w-full text-lg shadow-2xl hover:scale-105">Start Journey</ModernButton>
          </div>

          {/* Family Tier */}
          <div className="bg-gradient-to-br from-yellow-100 to-amber-100 rounded-[2.5rem] p-10 border-4 border-yellow-300 text-center hover:bg-gradient-to-br hover:from-yellow-200 hover:to-amber-200 transition-all shadow-2xl hover:-translate-y-3">
            <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-2xl flex items-center justify-center text-white text-3xl mb-6 mx-auto shadow-lg">
              👨‍👩‍👧‍👦
            </div>
            <h3 className="text-2xl font-black text-amber-800 mb-3">Family Kingdom</h3>
            <div className="text-5xl font-black text-amber-900 mb-2">$29</div>
            <p className="text-amber-700 text-sm mb-8">For the whole family!</p>
            <ul className="text-amber-700 space-y-4 mb-10 text-base font-bold mx-auto max-w-[200px]">
                <li className="flex items-center gap-3">👥 Up to 5 Adventurers</li>
                <li className="flex items-center gap-3">👨‍👩‍👧‍👦 Parent Dashboard</li>
                <li className="flex items-center gap-3">🌟 Priority Support</li>
            </ul>
            <ModernButton variant="outline" to="/signup" className="w-full text-lg">Start Family Quest</ModernButton>
          </div>
      </div>
    </div>
  </div>
);

// --- Main Layout ---

export default function LandingPage() {
  const [activePage, setActivePage] = useState<string>('home');
  const [scrolled, setScrolled] = useState<boolean>(false);
  const [mobileMenu, setMobileMenu] = useState<boolean>(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [activePage]);

  const navLinks: NavLink[] = [
    { id: 'home', label: 'Home 🏠' },
    { id: 'features', label: 'Features ✨' },
    { id: 'how-it-works', label: 'How It Works 🗺️' },
    { id: 'pricing', label: 'Pricing 💎' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-yellow-50 to-amber-50 font-sans text-blue-800 selection:bg-yellow-300 selection:text-yellow-900 overflow-x-hidden">
      
      {/* Playful Navigation */}
      <nav 
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${
          scrolled || mobileMenu ? 'bg-white/90 backdrop-blur-xl border-b-4 border-blue-300 shadow-lg py-4' : 'bg-transparent py-6'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between">
          <div 
            className="flex items-center gap-4 cursor-pointer group"
            onClick={() => setActivePage('home')}
          >
            <img 
              src="https://scontent.fkul8-3.fna.fbcdn.net/v/t39.30808-6/347852338_1298442111077474_8795534666084721020_n.jpg?_nc_cat=107&ccb=1-7&_nc_sid=6ee11a&_nc_ohc=QfpWZPJif_AQ7kNvwGKNb55&_nc_oc=Adm_CnAHBkE12PRbo4qtp9tP53duvVkizda7HHizTMgpaNmdltCZk21SZibUI2cwl5o&_nc_zt=23&_nc_ht=scontent.fkul8-3.fna&_nc_gid=lRznnaEwmgK-bGCapfEKKA&oh=00_Aflfx4QlygdIVEU46_xQSk5DfFW_-7xH8Qtz6j-q78o8wg&oe=6935F299"
              alt="MyCEO Logo"
              className="w-12 h-12 rounded-2xl object-cover shadow-xl group-hover:rotate-12 transition-transform duration-300"
            />
            <span className="text-3xl font-black tracking-tight">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-cyan-500">
                My
              </span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 to-amber-500">
                CEO
              </span>
              <span className="text-yellow-500 text-2xl">✨</span>
            </span>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-2 bg-gradient-to-r from-blue-100 to-cyan-100 rounded-full p-2 border-4 border-white shadow-lg">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => setActivePage(link.id)}
                className={`px-8 py-3 rounded-full text-base font-black transition-all duration-300 ${
                  activePage === link.id ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg' : 'text-blue-700 hover:text-blue-600 hover:bg-white/50'
                }`}
              >
                {link.label}
              </button>
            ))}
          </div>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center gap-6">
            <Link 
              to="/login"
              className="text-base font-black text-blue-700 hover:text-blue-600 transition-colors hover:scale-105"
            >
              Log In 👤
            </Link>
            <ModernButton variant="game" className="!px-8 !py-3 !text-base !rounded-2xl" to="/signup">
              Start Free! 🎮
            </ModernButton>
          </div>

          <button 
            className="md:hidden p-3 text-blue-700 hover:text-blue-600 hover:bg-blue-100 rounded-2xl transition-colors border-2 border-blue-200"
            onClick={() => setMobileMenu(!mobileMenu)}
          >
            {mobileMenu ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenu && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-gradient-to-b from-white to-blue-50 border-b-4 border-blue-300 p-6 shadow-2xl flex flex-col gap-3 animate-in slide-in-from-top-5">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => { setActivePage(link.id); setMobileMenu(false); }}
                className={`p-5 rounded-2xl text-left font-black text-lg transition-colors ${
                  activePage === link.id ? 'bg-gradient-to-r from-blue-400 to-cyan-400 text-white shadow-lg' : 'text-blue-700 hover:bg-blue-100'
                }`}
              >
                {link.label}
              </button>
            ))}
            <div className="h-1 bg-gradient-to-r from-blue-300 to-cyan-300 my-4 rounded-full"></div>
            <Link 
              to="/login"
              className="block p-5 rounded-2xl text-center font-black bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-800 border-2 border-blue-300"
            >
              Log In 👤
            </Link>
            <Link 
              to="/signup"
              className="block p-5 rounded-2xl text-center font-black bg-gradient-to-r from-yellow-300 to-amber-400 text-yellow-900 shadow-lg border-2 border-yellow-400"
            >
              Start Adventure! 🚀
            </Link>
          </div>
        )}
      </nav>

      {/* Main Content Area */}
      <main className="min-h-screen pt-20">
        {activePage === 'home' && <HomePage setPage={setActivePage} />}
        {activePage === 'features' && <FeaturesPage />}
        {activePage === 'how-it-works' && <HowItWorksPage />}
        {activePage === 'pricing' && <PricingPage />}
      </main>

      {/* Playful Footer */}
      <footer className="bg-gradient-to-r from-blue-100 via-cyan-100 to-yellow-100 border-t-4 border-blue-300 pt-20 pb-10 shadow-[0_-20px_40px_rgba(59,130,246,0.1)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10 md:gap-16 mb-16">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-4 mb-8">
                <img 
                  src="https://scontent.fkul8-3.fna.fbcdn.net/v/t39.30808-6/347852338_1298442111077474_8795534666084721020_n.jpg?_nc_cat=107&ccb=1-7&_nc_sid=6ee11a&_nc_ohc=QfpWZPJif_AQ7kNvwGKNb55&_nc_oc=Adm_CnAHBkE12PRbo4qtp9tP53duvVkizda7HHizTMgpaNmdltCZk21SZibUI2cwl5o&_nc_zt=23&_nc_ht=scontent.fkul8-3.fna&_nc_gid=lRznnaEwmgK-bGCapfEKKA&oh=00_Aflfx4QlygdIVEU46_xQSk5DfFW_-7xH8Qtz6j-q78o8wg&oe=6935F299"
                  alt="MyCEO Logo"
                  className="w-12 h-12 rounded-xl object-cover shadow-lg"
                />
                <span className="text-2xl font-black bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">MyCEO.</span>
              </div>
              <p className="text-blue-600 text-base leading-relaxed mb-8 font-medium bg-white/50 p-4 rounded-2xl border-2 border-dashed border-blue-200">
                Helping kids think BIG, start SMALL, and learn FAST! The playground for future heroes.
              </p>
            </div>
            
            <div>
              <h4 className="font-black text-xl text-blue-800 mb-8 flex items-center gap-2">Product 🛠️</h4>
              <ul className="space-y-4 text-base text-blue-600 font-bold">
                <li><button onClick={() => setActivePage('features')} className="hover:text-blue-600 transition-colors text-left w-full flex items-center gap-2">✨ Features</button></li>
                <li><button onClick={() => setActivePage('pricing')} className="hover:text-blue-600 transition-colors text-left w-full flex items-center gap-2">💎 Pricing</button></li>
                <li><button onClick={() => setActivePage('how-it-works')} className="hover:text-blue-600 transition-colors text-left w-full flex items-center gap-2">🗺️ How it Works</button></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-black text-xl text-blue-800 mb-8 flex items-center gap-2">Company 🏢</h4>
              <ul className="space-y-4 text-base text-blue-600 font-bold">
                <li><a href="#" className="hover:text-blue-600 transition-colors flex items-center gap-2">📖 About Us</a></li>
                <li><a href="#" className="hover:text-blue-600 transition-colors flex items-center gap-2">📝 Blog</a></li>
                <li><a href="#" className="hover:text-blue-600 transition-colors flex items-center gap-2">📞 Contact</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-black text-xl text-blue-800 mb-8 flex items-center gap-2">Safety & Rules 📜</h4>
              <ul className="space-y-4 text-base text-blue-600 font-bold">
                <li><a href="#" className="hover:text-blue-600 transition-colors flex items-center gap-2">🔒 Privacy</a></li>
                <li><a href="#" className="hover:text-blue-600 transition-colors flex items-center gap-2">📃 Terms</a></li>
                <li><a href="#" className="hover:text-blue-600 transition-colors flex items-center gap-2">👪 Safety</a></li>
              </ul>
            </div>
          </div>
          
          <div className="pt-8 border-t-2 border-dashed border-blue-300 flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-blue-600 text-base font-bold">
              © 2025 MyCEO Education. Made with <Heart className="w-4 h-4 inline text-red-500 fill-red-500 mx-1 animate-pulse" /> for awesome kids.
            </p>
            <div className="flex gap-6 text-2xl">
              {['🐱', '🐶', '🦊', '🐰', '🐻'].map((emoji, i) => (
                <span key={i} className="hover:scale-125 transition-transform cursor-pointer">{emoji}</span>
              ))}
            </div>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
        }
        @keyframes float-coin {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          25% { transform: translateY(-15px) rotate(90deg); }
          50% { transform: translateY(-25px) rotate(180deg); }
          75% { transform: translateY(-15px) rotate(270deg); }
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-25px); }
        }
        @keyframes cloud-float {
          0% { transform: translateX(-100px); }
          100% { transform: translateX(calc(100vw + 100px)); }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}