import { Link, useNavigate } from 'react-router-dom';
import { 
  Home, 
  BookOpen, 
  Trophy, 
  Building2, 
  ShoppingBag, 
  LogOut, 
  Menu,
  X,
  Gamepad2,
  TrendingUp,
  Bell,
} from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';
import { NotificationInbox } from '@/components/child/NotificationInbox';
import { useNotifications } from '@/hooks/useNotifications';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';

interface ChildSession {
  childId: string;
  childName: string;
  accessCode: string;
}

export function ChildNavBar() {
  const navigate = useNavigate();
  const [childSession, setChildSession] = useState<ChildSession | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [expCoins, setExpCoins] = useState<Array<{id: number; x: number; y: number}>>([]);
  const [notificationInboxOpen, setNotificationInboxOpen] = useState(false);
  const { unreadCount } = useNotifications(childSession?.childId || null);
  const { isEnabled } = useFeatureFlags();

  const loadSession = useCallback(async () => {
    const sessionStr = localStorage.getItem('child_session');
    if (sessionStr) {
      try {
        const session = JSON.parse(sessionStr);
        setChildSession(session);
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        console.error('Failed to load child session:', error);
      } finally {
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSession();
    
    // Listen for storage changes
    const handleStorageChange = () => {
      loadSession();
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [loadSession]);

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
      <nav className="bg-blue-500 shadow-lg sticky top-0 z-50 border-b-4 border-gray-600">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 relative z-10">
          <div className="flex items-center justify-center h-20">
            <div className="flex items-center space-x-2 sm:space-x-3 animate-pulse">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-yellow-400 rounded-xl border-2 border-gray-600"></div>
              <div className="w-24 sm:w-32 h-5 sm:h-6 bg-yellow-400 rounded-lg"></div>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  if (!childSession) {
    return null;
  }

  // Define all possible nav links
  const allNavLinks = [
    { to: '/child/dashboard', icon: <Home className="h-5 w-5" />, label: 'Home', color: 'from-blue-400 to-cyan-400', featureFlag: null },
    { to: '/child/modules', icon: <BookOpen className="h-5 w-5" />, label: 'Learn', color: 'from-green-400 to-emerald-400', featureFlag: null },
    { to: '/child/company', icon: <Building2 className="h-5 w-5" />, label: 'My Company', color: 'from-yellow-400 to-orange-400', featureFlag: 'company' },
    { to: '/child/marketplace', icon: <ShoppingBag className="h-5 w-5" />, label: 'Marketplace', color: 'from-purple-400 to-pink-400', featureFlag: 'marketplace' },
    { to: '/child/achievements', icon: <Trophy className="h-5 w-5" />, label: 'Achievements', color: 'from-amber-400 to-yellow-400', featureFlag: null },
    { to: '/child/leaderboard', icon: <TrendingUp className="h-5 w-5" />, label: 'Leaderboard', color: 'from-red-400 to-orange-400', featureFlag: null },
  ];

  // Filter nav links based on feature flags
  const navLinks = allNavLinks.filter(link => {
    // If no feature flag is required, always show it
    if (!link.featureFlag) return true;
    // If feature flag is required, check if it's enabled
    return isEnabled(link.featureFlag);
  });

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
          <div className="text-xs text-center font-bold text-white">$</div>
        </div>
      ))}

      <nav className="bg-blue-500 shadow-2xl sticky top-0 z-50 border-b-4 border-gray-600">

        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 relative z-10">
          <div className="flex items-center justify-between h-20 gap-4">
            {/* Left Side - Logo */}
            <div className="flex items-center flex-shrink-0">
              <Link 
                to="/child/dashboard" 
                className="flex items-center space-x-2 sm:space-x-3 group transform hover:scale-105 transition-transform"
              >
                <div className="relative">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-yellow-400 rounded-2xl border-4 border-gray-600 flex items-center justify-center group-hover:rotate-12 transition-transform shadow-[4px_4px_0px_0px_rgba(0,0,0,0.4)] hover:brightness-110">
                    <Gamepad2 className="h-5 w-5 sm:h-7 sm:w-7 text-blue-500 drop-shadow-[1px_1px_0px_rgba(0,0,0,0.3)]" />
                  </div>
                  {/* Pixel art sparkles */}
                  <div className="absolute -top-1 -right-1 w-2 h-2 sm:w-3 sm:h-3 bg-yellow-400 rounded-full border-2 border-gray-600 shadow-sm"></div>
                  <div className="absolute -bottom-1 -left-1 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-yellow-400 rounded-full border-2 border-gray-600 shadow-sm"></div>
                </div>
                <div className="hidden sm:block">
                  <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight pixel-font drop-shadow-[3px_3px_0px_rgba(0,0,0,0.6)]">
                    MyCEO
                  </h1>
                  <p className="text-xs text-white/95 font-bold pixel-font drop-shadow-[2px_2px_0px_rgba(0,0,0,0.5)]">
                    BOSS MODE
                  </p>
                </div>
              </Link>
            </div>

            {/* Center - Desktop Navigation Links - Pixel Game Style */}
            <div className="hidden lg:flex items-center justify-center flex-1 min-w-0">
              <div className="flex items-center space-x-1 xl:space-x-1.5 2xl:space-x-2 justify-center flex-nowrap">
                {navLinks.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    className="group relative transform hover:-translate-y-1 transition-all duration-300 flex-shrink-0"
                  >
                    <div className="absolute -inset-1 bg-yellow-400 opacity-30 blur group-hover:opacity-50 transition-opacity rounded-xl"></div>
                    <div className="relative flex items-center space-x-1 xl:space-x-1.5 px-2 xl:px-2.5 py-2 xl:py-2.5 rounded-xl border-2 border-gray-600 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.4)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,0.4)] bg-yellow-400 pixel-font transition-all hover:brightness-110">
                      <div className="w-6 h-6 xl:w-7 xl:h-7 bg-blue-500 rounded-lg border-2 border-gray-600 flex items-center justify-center shadow-inner flex-shrink-0">
                        <div className="h-3.5 w-3.5 xl:h-4 xl:w-4 text-white">{link.icon}</div>
                      </div>
                      <span className="text-white font-bold text-[10px] xl:text-xs drop-shadow-[2px_2px_0px_rgba(0,0,0,0.3)] whitespace-nowrap">{link.label}</span>
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg flex-shrink-0"></div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Right Side - Notifications and Logout */}
            <div className="flex items-center space-x-2 sm:space-x-3 lg:space-x-4 flex-shrink-0 justify-end">
                {/* Notification Button - Game Style */}
                <button
                  onClick={() => setNotificationInboxOpen(true)}
                  className="group relative transform hover:scale-105 transition-all"
                  aria-label="Notifications"
                >
                  <div className="absolute -inset-1 bg-yellow-400 rounded-xl blur opacity-30 group-hover:opacity-50 transition-opacity"></div>
                  <div className="relative flex items-center justify-center w-10 h-10 lg:w-12 lg:h-12 bg-yellow-400 rounded-xl border-3 border-gray-600 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.4)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,0.4)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all pixel-font hover:brightness-110">
                    <Bell className="h-5 w-5 lg:h-6 lg:w-6 text-blue-500" />
                    {unreadCount > 0 && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 lg:w-6 lg:h-6 bg-red-500 rounded-full border-2 border-white flex items-center justify-center shadow-lg">
                        <span className="text-white text-[10px] lg:text-xs font-bold pixel-font">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      </div>
                    )}
                  </div>
                </button>

                {/* Exit Button - Game Style */}
                <button
                  onClick={handleLogout}
                  className="group relative transform hover:scale-105 transition-all"
                >
                  <div className="absolute -inset-1 bg-gray-600 rounded-xl blur opacity-30 group-hover:opacity-50 transition-opacity"></div>
                  <div className="relative flex items-center space-x-1.5 lg:space-x-2 px-3 lg:px-5 py-2 lg:py-2.5 text-xs lg:text-sm font-bold text-white bg-gray-600 rounded-xl border-3 border-gray-700 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.4)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,0.4)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all pixel-font hover:brightness-110">
                    <LogOut className="h-3.5 w-3.5 lg:h-4 lg:w-4" />
                    <span className="hidden sm:inline">EXIT GAME</span>
                    <span className="sm:hidden">EXIT</span>
                    <div className="absolute -top-2 -right-2 w-3 h-3 lg:w-4 lg:h-4 bg-yellow-400 rounded-full border border-gray-600 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"></div>
                  </div>
                </button>

                {/* Mobile Menu Button - Pixel Style */}
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="lg:hidden p-2 bg-yellow-400 text-white hover:scale-110 rounded-xl border-3 border-gray-600 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.4)] transition-all hover:brightness-110"
                  aria-label="Toggle menu"
                >
                  {mobileMenuOpen ? (
                    <X className="h-5 w-5 sm:h-6 sm:w-6 drop-shadow-[1px_1px_0px_rgba(0,0,0,0.3)]" />
                  ) : (
                    <Menu className="h-5 w-5 sm:h-6 sm:w-6 drop-shadow-[1px_1px_0px_rgba(0,0,0,0.3)]" />
                  )}
                </button>
              </div>
            </div>
          </div>

        {/* Mobile Menu - Pixel Game Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-blue-500 border-t-4 border-gray-600 shadow-inner relative">
            <div className="px-3 sm:px-4 py-4 sm:py-6 space-y-3 sm:space-y-4 relative z-10 max-w-7xl mx-auto">
              {/* Mobile Navigation Links - Game Menu */}
              <div className="space-y-2 sm:space-y-3">
                {navLinks.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center space-x-3 sm:space-x-4 px-3 sm:px-4 py-3 sm:py-4 bg-yellow-400 rounded-xl border-3 border-gray-600 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)] text-white font-bold transition-all transform hover:scale-105 pixel-font active:scale-95"
                  >
                    <div className="w-9 h-9 sm:w-10 sm:h-10 bg-blue-500 rounded-lg border-2 border-gray-600 flex items-center justify-center flex-shrink-0">
                      <div className="h-5 w-5 sm:h-6 sm:w-6 text-white">{link.icon}</div>
                    </div>
                    <span className="text-sm sm:text-base flex-1 text-white">{link.label}</span>
                    <div className="ml-auto text-base sm:text-lg text-white">▶</div>
                  </Link>
                ))}
              </div>
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

      {/* Notification Inbox */}
      {childSession && (
        <NotificationInbox
          childId={childSession.childId}
          isOpen={notificationInboxOpen}
          onClose={() => setNotificationInboxOpen(false)}
        />
      )}
    </>
  );
}
