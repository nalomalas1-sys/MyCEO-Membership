import { Link, useNavigate } from 'react-router-dom';
import { 
  Sparkles, 
  Home, 
  BookOpen, 
  Trophy, 
  Building2, 
  ShoppingBag, 
  LogOut, 
  Award,
  User,
  Wallet,
  Target,
  Zap,
  Menu,
  X,
  Coins,
  Crown,
  Gamepad2,
  TrendingUp
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface ChildSession {
  childId: string;
  childName: string;
  accessCode: string;
}

interface ChildStats {
  total_xp: number;
  current_level: number;
  balance: number;
}

export function ChildNavBar() {
  const navigate = useNavigate();
  const [childSession, setChildSession] = useState<ChildSession | null>(null);
  const [childStats, setChildStats] = useState<ChildStats | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [expCoins, setExpCoins] = useState<Array<{id: number; x: number; y: number}>>([]);

  useEffect(() => {
    const loadSessionAndStats = async () => {
      const sessionStr = localStorage.getItem('child_session');
      if (sessionStr) {
        try {
          const session = JSON.parse(sessionStr);
          setChildSession(session);
          
          // Fetch child stats
          const { data, error } = await supabase
            .from('children')
            .select('total_xp, current_level, balance')
            .eq('id', session.childId)
            .eq('access_code', session.accessCode)
            .single();
            
          if (data && !error) {
            setChildStats(data);
          }
        } catch (err) {
          console.error('Failed to load child session or stats:', err);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    loadSessionAndStats();
    
    // Listen for storage changes
    const handleStorageChange = () => {
      loadSessionAndStats();
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Create exploding coins effect
  const createExplodingCoins = () => {
    const coins = [];
    for (let i = 0; i < 8; i++) {
      coins.push({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100
      });
    }
    setExpCoins(coins);
    setTimeout(() => setExpCoins([]), 1000);
  };

  const handleLogout = () => {
    createExplodingCoins();
    setTimeout(() => {
      localStorage.removeItem('child_session');
      navigate('/dashboard');
    }, 500);
  };

  if (loading) {
    return (
      <nav className="bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-400 shadow-lg sticky top-0 z-50 pixel-bg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center space-x-2 animate-pulse">
              <div className="w-10 h-10 bg-white/30 rounded-xl border-2 border-black"></div>
              <div className="w-32 h-6 bg-white/30 rounded-lg"></div>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  const navLinks = [
    { to: '/child/dashboard', icon: <Home className="h-5 w-5" />, label: 'Home', color: 'from-blue-400 to-cyan-400' },
    { to: '/child/modules', icon: <BookOpen className="h-5 w-5" />, label: 'Learn', color: 'from-green-400 to-emerald-400' },
    { to: '/child/company', icon: <Building2 className="h-5 w-5" />, label: 'My Company', color: 'from-yellow-400 to-orange-400' },
    { to: '/child/marketplace', icon: <ShoppingBag className="h-5 w-5" />, label: 'Marketplace', color: 'from-purple-400 to-pink-400' },
    { to: '/child/achievements', icon: <Trophy className="h-5 w-5" />, label: 'Achievements', color: 'from-amber-400 to-yellow-400' },
    { to: '/child/leaderboard', icon: <TrendingUp className="h-5 w-5" />, label: 'Leaderboard', color: 'from-red-400 to-orange-400' },
  ];

  return (
    <>
      {/* Exploding coins animation */}
      {expCoins.map(coin => (
        <div
          key={coin.id}
          className="fixed z-50 w-4 h-4 bg-yellow-400 rounded-full border border-yellow-600 animate-bounce"
          style={{
            left: `${coin.x}vw`,
            top: `${coin.y}vh`,
            animation: `explode 0.8s ease-out forwards`,
            animationDelay: `${coin.id * 0.1}s`
          }}
        >
          <div className="text-xs text-center font-bold">$</div>
        </div>
      ))}

      <nav className="bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-400 shadow-2xl sticky top-0 z-50 pixel-bg border-b-4 border-black">
        {/* Animated pixel pattern overlay */}
        <div className="absolute inset-0 opacity-10" 
             style={{
               backgroundImage: `
                 linear-gradient(45deg, transparent 45%, rgba(255,255,255,0.3) 50%, transparent 55%),
                 linear-gradient(-45deg, transparent 45%, rgba(255,255,255,0.3) 50%, transparent 55%)
               `,
               backgroundSize: '20px 20px'
             }}
        ></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex items-center justify-between h-20">
            {/* Logo and Brand - Pixel Art Style */}
            <div className="flex items-center">
              <Link 
                to="/child/dashboard" 
                className="flex items-center space-x-3 group transform hover:scale-105 transition-transform"
              >
                <div className="relative">
                  <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl border-4 border-black flex items-center justify-center group-hover:rotate-12 transition-transform shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)]">
                    <Gamepad2 className="h-7 w-7 text-white" />
                  </div>
                  {/* Pixel art sparkles */}
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-400 rounded-full border border-white"></div>
                  <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-pink-400 rounded-full border border-white"></div>
                </div>
                <div>
                  <h1 className="text-2xl font-black text-white tracking-tight pixel-font" style={{ textShadow: '3px 3px 0px rgba(0,0,0,0.5)' }}>
                    MyCEO
                  </h1>
                  <p className="text-xs text-white/90 font-bold pixel-font" style={{ textShadow: '1px 1px 0px rgba(0,0,0,0.5)' }}>
                    BOSS MODE
                  </p>
                </div>
              </Link>

              {/* Desktop Navigation Links - Pixel Game Style */}
              <div className="hidden lg:flex items-center ml-10 space-x-2">
                {navLinks.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    className="group relative transform hover:-translate-y-1 transition-all duration-300"
                  >
                    <div className="absolute -inset-1 bg-gradient-to-r opacity-30 blur group-hover:opacity-50 transition-opacity rounded-xl"></div>
                    <div className={`relative flex items-center space-x-2 px-4 py-3 rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,0.3)] bg-gradient-to-r ${link.color} pixel-font`}>
                      <div className="w-8 h-8 bg-white/20 rounded-lg border border-white/50 flex items-center justify-center">
                        {link.icon}
                      </div>
                      <span className="text-white font-bold text-sm">{link.label}</span>
                      <div className="w-2 h-2 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Right Side - Stats and Logout */}
            <div className="flex items-center space-x-4">
              {/* Desktop Stats - Pixel Game HUD */}
              <div className="hidden md:flex items-center space-x-4">
                {childStats && (
                  <>
                    {/* Level Badge */}
                    <div className="group relative">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-xl border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)] flex flex-col items-center justify-center pixel-font">
                        <span className="text-xs text-white font-bold">LVL</span>
                        <span className="text-lg font-black text-white" style={{ textShadow: '1px 1px 0px rgba(0,0,0,0.5)' }}>
                          {childStats.current_level}
                        </span>
                      </div>
                      <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-green-500 rounded-full border-2 border-black flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-xs font-bold">↑</span>
                      </div>
                    </div>

                    {/* XP Display */}
                    <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)] p-3">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-yellow-400 rounded-lg border-2 border-yellow-600 flex items-center justify-center">
                          <Zap className="h-4 w-4 text-black" />
                        </div>
                        <div>
                          <div className="text-xs text-white/80 font-bold pixel-font">XP</div>
                          <div className="text-sm font-black text-white pixel-font" style={{ textShadow: '1px 1px 0px rgba(0,0,0,0.5)' }}>
                            {childStats.total_xp?.toLocaleString() || 0}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Coins Display */}
                    <div className="bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)] p-3">
                      <div className="flex items-center space-x-2">
                        <div className="relative">
                          <div className="w-8 h-8 bg-yellow-300 rounded-full border-2 border-yellow-700 flex items-center justify-center">
                            <Coins className="h-4 w-4 text-yellow-800" />
                          </div>
                          <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full border border-yellow-600"></div>
                        </div>
                        <div>
                          <div className="text-xs text-white/80 font-bold pixel-font">COINS</div>
                          <div className="text-sm font-black text-white pixel-font" style={{ textShadow: '1px 1px 0px rgba(0,0,0,0.5)' }}>
                            ${childStats.balance?.toLocaleString() || 0}
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Child Info and Logout */}
              <div className="flex items-center space-x-4">
                {childSession && (
                  <div className="hidden sm:flex items-center space-x-3 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)] px-4 py-2 group hover:scale-105 transition-transform">
                    <div className="relative">
                      <div className="w-10 h-10 bg-gradient-to-br from-white to-gray-200 rounded-lg border-2 border-black flex items-center justify-center">
                        <User className="h-5 w-5 text-cyan-600" />
                      </div>
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-pink-500 rounded-full border border-white"></div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-white pixel-font" style={{ textShadow: '1px 1px 0px rgba(0,0,0,0.3)' }}>
                        {childSession.childName}
                      </p>
                      <p className="text-xs text-white/90 font-bold pixel-font flex items-center">
                        <Crown className="h-3 w-3 mr-1" />
                        CEO
                      </p>
                    </div>
                  </div>
                )}
                
                {/* Exit Button - Game Style */}
                <button
                  onClick={handleLogout}
                  className="group relative transform hover:scale-105 transition-all"
                >
                  <div className="absolute -inset-1 bg-gradient-to-r from-red-500 to-orange-500 rounded-xl blur opacity-30 group-hover:opacity-50 transition-opacity"></div>
                  <div className="relative flex items-center space-x-2 px-5 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-red-600 to-orange-500 rounded-xl border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,0.3)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all pixel-font">
                    <LogOut className="h-4 w-4" />
                    <span>EXIT GAME</span>
                    <div className="absolute -top-2 -right-2 w-4 h-4 bg-yellow-400 rounded-full border border-yellow-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  </div>
                </button>

                {/* Mobile Menu Button - Pixel Style */}
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="lg:hidden p-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:scale-110 rounded-xl border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)] transition-all"
                >
                  {mobileMenuOpen ? (
                    <X className="h-6 w-6" />
                  ) : (
                    <Menu className="h-6 w-6" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Menu - Pixel Game Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-gradient-to-b from-cyan-500 to-purple-600 border-t-4 border-black shadow-inner">
            <div className="px-4 py-6 space-y-4">
              {/* Mobile Stats - Game HUD */}
              {childStats && childSession && (
                <div className="grid grid-cols-3 gap-3 mb-6">
                  <div className="bg-gradient-to-b from-blue-500 to-cyan-400 p-4 rounded-xl border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)] text-center">
                    <div className="text-xs text-white/90 font-bold pixel-font mb-1">LEVEL</div>
                    <div className="text-2xl font-black text-white pixel-font" style={{ textShadow: '2px 2px 0px rgba(0,0,0,0.5)' }}>
                      {childStats.current_level}
                    </div>
                  </div>
                  <div className="bg-gradient-to-b from-purple-500 to-pink-500 p-4 rounded-xl border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)] text-center">
                    <div className="text-xs text-white/90 font-bold pixel-font mb-1">XP</div>
                    <div className="text-2xl font-black text-white pixel-font" style={{ textShadow: '2px 2px 0px rgba(0,0,0,0.5)' }}>
                      {childStats.total_xp?.toLocaleString() || 0}
                    </div>
                  </div>
                  <div className="bg-gradient-to-b from-yellow-500 to-orange-500 p-4 rounded-xl border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)] text-center">
                    <div className="text-xs text-white/90 font-bold pixel-font mb-1">COINS</div>
                    <div className="text-2xl font-black text-white pixel-font" style={{ textShadow: '2px 2px 0px rgba(0,0,0,0.5)' }}>
                      ${childStats.balance?.toLocaleString() || 0}
                    </div>
                  </div>
                </div>
              )}

              {/* Mobile Navigation Links - Game Menu */}
              <div className="space-y-3">
                {navLinks.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center space-x-4 px-4 py-4 bg-gradient-to-r ${link.color} rounded-xl border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)] text-white font-bold transition-all transform hover:scale-105 pixel-font`}
                  >
                    <div className="w-10 h-10 bg-white/20 rounded-lg border-2 border-white/50 flex items-center justify-center">
                      {link.icon}
                    </div>
                    <span>{link.label}</span>
                    <div className="ml-auto text-lg">▶</div>
                  </Link>
                ))}
              </div>

              {/* Child Info Mobile - Pixel Style */}
              {childSession && (
                <div className="pt-4 border-t-2 border-white/30">
                  <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl border-3 border-black">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-white to-gray-200 rounded-lg border-2 border-black flex items-center justify-center">
                        <User className="h-6 w-6 text-cyan-600" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white pixel-font">
                          {childSession.childName}
                        </p>
                        <p className="text-xs text-white/90 pixel-font flex items-center">
                          <Crown className="h-3 w-3 mr-1" />
                          YOUNG CEO
                        </p>
                      </div>
                    </div>
                    <div className="w-6 h-6 bg-green-400 rounded-full border-2 border-green-600"></div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Add CSS for animations */}
      <style>{`
        @keyframes explode {
          0% {
            transform: translate(0, 0) scale(1);
            opacity: 1;
          }
          100% {
            transform: translate(var(--tx), var(--ty)) scale(0);
            opacity: 0;
          }
        }
        
        .pixel-bg {
          background-image: 
            radial-gradient(circle at 10% 20%, rgba(255,255,255,0.1) 1px, transparent 1px),
            radial-gradient(circle at 90% 80%, rgba(255,255,255,0.1) 1px, transparent 1px);
          background-size: 20px 20px;
        }
        
        .pixel-font {
          font-family: 'Press Start 2P', cursive, monospace;
          letter-spacing: -0.5px;
        }
        
        .border-3 {
          border-width: 3px;
        }
      `}</style>
    </>
  );
}