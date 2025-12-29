import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { 
  Gamepad2, 
  Users, 
  Shield, 
  Mail, 
  AlertCircle, 
  Loader2,
  ArrowLeft,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import myCeoLogo from '@/Logo-MyCeo-300x200.png';

// --- Playful Background Effects ---
const BackgroundEffects = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {/* Animated clouds */}
    <div className="absolute top-10 left-10 w-40 h-20 bg-blue-100/20 rounded-full animate-float-cloud" style={{ animationDelay: '0s' }}></div>
    <div className="absolute top-40 right-20 w-60 h-30 bg-blue-100/20 rounded-full animate-float-cloud" style={{ animationDelay: '2s' }}></div>
    <div className="absolute bottom-20 left-1/4 w-50 h-25 bg-blue-100/20 rounded-full animate-float-cloud" style={{ animationDelay: '4s' }}></div>
    
    {/* Floating coins */}
    <div className="absolute top-1/4 right-1/4 w-8 h-8 bg-yellow-400 rounded-full animate-bounce-coin" style={{ animationDelay: '1s' }}></div>
    <div className="absolute top-1/3 left-1/4 w-6 h-6 bg-yellow-400 rounded-full animate-bounce-coin" style={{ animationDelay: '0.5s' }}></div>
    <div className="absolute bottom-1/3 right-1/3 w-10 h-10 bg-yellow-400 rounded-full animate-bounce-coin" style={{ animationDelay: '1.5s' }}></div>
    
    {/* Colorful blobs */}
    <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-300/20 rounded-full blur-[120px] animate-pulse duration-[6s]"></div>
    <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-300/20 rounded-full blur-[100px] animate-pulse duration-[8s]"></div>
    <div className="absolute top-1/2 left-1/2 w-[400px] h-[400px] bg-yellow-300/15 rounded-full blur-[80px] animate-pulse duration-[10s]"></div>
  </div>
);

// --- Floating Animated Characters ---
const FloatingCharacters = () => {
  const [characters] = useState([
    { emoji: '🚀', x: 10, y: 20, delay: 0 },
    { emoji: '👑', x: 85, y: 15, delay: 1 },
    { emoji: '💰', x: 20, y: 70, delay: 2 },
    { emoji: '🍋', x: 75, y: 60, delay: 3 },
    { emoji: '🎯', x: 50, y: 85, delay: 1.5 },
    { emoji: '🏆', x: 90, y: 40, delay: 0.5 },
  ]);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
      {characters.map((char, i) => (
        <div
          key={i}
          className="absolute text-3xl animate-float-slow"
          style={{
            left: `${char.x}%`,
            top: `${char.y}%`,
            animationDelay: `${char.delay}s`,
          }}
        >
          {char.emoji}
        </div>
      ))}
    </div>
  );
};

// --- Animated Piggy Bank Mascot ---
const PiggyBankMascot = () => (
  <div className="absolute bottom-10 left-10 w-32 h-32 animate-bounce-slow z-10 hidden lg:block">
    <div className="relative">
      <div className="w-32 h-32 bg-blue-400 rounded-full relative">
        {/* Piggy body */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-20 h-20 bg-blue-300 rounded-full"></div>
        {/* Snout */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 w-12 h-8 bg-cyan-200 rounded-full"></div>
        {/* Eyes */}
        <div className="absolute top-1/3 left-1/3 w-4 h-4 bg-white rounded-full"></div>
        <div className="absolute top-1/3 right-1/3 w-4 h-4 bg-white rounded-full"></div>
        {/* Coin slot */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 w-8 h-2 bg-yellow-300 rounded-full"></div>
      </div>
      {/* Floating coins */}
      <div className="absolute -top-4 -right-4 w-8 h-8 bg-yellow-400 rounded-full animate-bounce-coin" style={{ animationDelay: '0.2s' }}></div>
      <div className="absolute -bottom-2 -left-2 w-6 h-6 bg-yellow-400 rounded-full animate-bounce-coin" style={{ animationDelay: '0.7s' }}></div>
    </div>
  </div>
);

// --- Bouncing Business Character ---
const BusinessCharacter = () => (
  <div className="absolute top-10 right-10 w-40 h-40 animate-bounce-slower z-10 hidden lg:block">
    <div className="relative">
      <div className="w-40 h-40 bg-blue-400 rounded-full relative">
        {/* Character body */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-24 h-24 bg-blue-300 rounded-full"></div>
        {/* Briefcase */}
        <div className="absolute bottom-8 right-8 w-12 h-8 bg-yellow-400 rounded-lg rotate-12">
          <div className="absolute top-1 w-8 h-1 bg-amber-500 left-2"></div>
        </div>
        {/* Calculator */}
        <div className="absolute bottom-12 left-8 w-10 h-6 bg-green-400 rounded rotate-[-12deg]">
          <div className="absolute top-1 left-1 right-1 h-4 bg-green-200 rounded-sm"></div>
        </div>
      </div>
    </div>
  </div>
);

type LoginType = 'children' | 'parents' | 'admin';

export default function EnhancedLoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // UI State
  const [activeTab, setActiveTab] = useState<LoginType>('parents');

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Verification State
  const [showVerificationMessage, setShowVerificationMessage] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState<string>('');
  const [resendingEmail, setResendingEmail] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  useEffect(() => {
    // Check for signup verification
    const fromSignup = searchParams.get('from_signup');
    const paramEmail = searchParams.get('email');
    
    if (fromSignup === 'true') {
      setShowVerificationMessage(true);
      if (paramEmail) {
        setVerificationEmail(decodeURIComponent(paramEmail));
        setEmail(decodeURIComponent(paramEmail)); // Auto-fill email
      }
      // Clean URL without refresh
      window.history.replaceState({}, '', '/login');
    }
  }, [searchParams]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (activeTab === 'children') {
        // --- Child Login Logic (PRESERVED) ---
        
        // Clear existing session to ensure anon role/clean slate
        await supabase.auth.signOut();

        // Format code
        const formattedCode = accessCode.toUpperCase().trim();
        
        // Check child and parent subscription status using database function
        const { data: result, error: queryError } = await supabase
          .rpc('check_parent_subscription_by_access_code', {
            p_access_code: formattedCode
          })
          .single();

        if (queryError || !result) {
          throw new Error('Invalid access code. Please try again.');
        }

        // Type assertion for RPC result
        const subscriptionResult = result as {
          child_id: string;
          child_name: string;
          access_code: string;
          parent_subscription_status: string;
          subscription_valid: boolean;
        };

        // Check if subscription is valid (active or trialing)
        if (!subscriptionResult.subscription_valid) {
          throw new Error('Access unavailable. Please ask your parent to renew their subscription.');
        }

        // Store child session
        localStorage.setItem('child_session', JSON.stringify({
          childId: subscriptionResult.child_id,
          childName: subscriptionResult.child_name,
          accessCode: subscriptionResult.access_code,
        }));

        navigate('/child/dashboard');
        
      } else {
        // --- Parent/Admin Login Logic (PRESERVED) ---
        const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) {
          // Provide more specific error messages
          if (signInError.message.includes('Email not confirmed') || signInError.message.includes('email_not_confirmed')) {
            throw new Error('Please verify your email address before logging in. Check your inbox for the verification link.');
          } else if (signInError.message.includes('Invalid login credentials') || signInError.message.includes('invalid_credentials')) {
            throw new Error('Invalid email or password. Please check your credentials and try again.');
          } else {
            throw signInError;
          }
        }

        if (!authData.user || !authData.session) {
          throw new Error('Login failed: No user or session returned');
        }

        // Update auth store immediately to prevent double login
        const { setUser, setSession } = useAuthStore.getState();
        setSession(authData.session);
        setUser(authData.user);

        // Wait for auth state to propagate and RLS policies to recognize the session
        await new Promise(resolve => setTimeout(resolve, 500));

        // Get user role to determine redirect
        const { data: userData } = await supabase
          .from('users')
          .select('role')
          .eq('id', authData.user.id)
          .single();

        // Redirection based on role
        if (userData?.role === 'admin' || activeTab === 'admin') {
          navigate('/admin/dashboard', { replace: true });
        } else {
          navigate('/dashboard', { replace: true });
        }
      }
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error(String(err));
      console.error('Login error:', error);
      setError(error.message || 'Failed to sign in. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!verificationEmail) return;
    setResendingEmail(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: verificationEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/login?verified=true`,
        },
      });
      if (error) throw error;
      setResendSuccess(true);
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error.message);
    } finally {
      setResendingEmail(false);
    }
  };

  const tabs = [
    {
      id: 'children' as LoginType,
      label: 'Children',
      icon: Gamepad2,
      description: 'Enter your Magic Code to play!',
      color: 'from-blue-400 to-cyan-500',

      bgColor: 'bg-blue-100'
    },
    {
      id: 'parents' as LoginType,
      label: 'Parents',
      icon: Users,
      description: 'Help your little entrepreneur grow!',
      color: 'from-blue-500 to-blue-600',

      bgColor: 'bg-blue-100'
    },
    {
      id: 'admin' as LoginType,
      label: 'Admin',
      icon: Shield,
      description: 'Keep the playground fun and safe!',
      color: 'from-emerald-400 to-teal-500',
      bgColor: 'bg-emerald-100'
    },
  ];

  return (
    <div className="min-h-screen relative flex items-center justify-center bg-blue-50 font-sans text-blue-900 overflow-hidden selection:bg-yellow-300 selection:text-yellow-900">
      
      <BackgroundEffects />
      <FloatingCharacters />
      <PiggyBankMascot />
      <BusinessCharacter />

      {/* Navigation Header - Playful Style */}
      <nav className="absolute top-0 left-0 p-6 z-20">
        <Link 
          to="/" 
          className="group flex items-center gap-3 text-blue-700 hover:text-blue-600 transition-all px-5 py-3 rounded-2xl hover:bg-white/60 backdrop-blur-sm border-2 border-blue-200 hover:border-blue-300 shadow-lg hover:scale-105"
        >
          <div className="bg-blue-400 p-2 rounded-xl group-hover:-translate-x-1 transition-transform text-white">
            <ArrowLeft className="w-5 h-5" />
          </div>
          <span className="font-bold text-base">Back to Adventure! 🏠</span>
        </Link>
      </nav>

      <div className="w-full max-w-6xl mx-auto p-4 grid lg:grid-cols-2 gap-12 items-center relative z-10">
        
        {/* Left Side - Playful Illustration & Welcome */}
        <div className="hidden lg:flex flex-col relative">
          <div className="mb-12 relative group cursor-default">
            <div className="absolute -inset-4 bg-blue-300 rounded-[2rem] blur-xl opacity-30 group-hover:opacity-50 transition-opacity duration-500"></div>
            <div className="relative">
              <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-white/70 backdrop-blur-md border-2 border-yellow-300 text-base font-black text-yellow-800 mb-8 w-fit shadow-lg animate-pulse">
                <img src={myCeoLogo} alt="MyCEO Logo" className="w-8 h-8 object-contain" />
                <span>Ready for adventure? 🚀</span>
              </div>
              
              <h1 className="text-7xl font-black mb-6 leading-[0.9] drop-shadow-lg">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-cyan-500">
                  Welcome
                </span>
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 via-amber-500 to-orange-500">
                  Back, CEO! 
                </span>
              </h1>
              
              <p className="text-2xl text-blue-700/90 max-w-lg font-bold leading-relaxed bg-white/50 p-6 rounded-3xl border-2 border-dashed border-blue-300">
                Your <span className="text-blue-600">entrepeneurship journey</span> is waiting! Log in to track coins, finish quests, and build your empire!
              </p>
            </div>
          </div>

        </div>

        {/* Right Side - Login Card */}
        <div className="w-full max-w-md mx-auto relative">
          {/* Card Glow Effect */}
          <div className="absolute inset-0 bg-blue-400/30 rounded-[2.5rem] blur-2xl transform rotate-3 animate-pulse"></div>
          
          <div className="bg-white/90 backdrop-blur-md border-4 border-white p-8 md:p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
            {/* Card Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-10 left-10 w-20 h-20 rounded-full bg-yellow-400"></div>
              <div className="absolute bottom-10 right-10 w-16 h-16 rounded-full bg-blue-400"></div>
              <div className="absolute top-1/2 left-1/4 w-12 h-12 rounded-full bg-blue-400"></div>
            </div>
            
            {/* Logo Show */}
            <div className="flex justify-center mb-6">
               <div className="rounded-2xl flex items-center justify-center">
                  <img src={myCeoLogo} alt="MyCEO Logo" className="h-32 w-auto object-contain" />
               </div>
            </div>

            <div className="text-center mb-8 relative z-10">
              <p className="text-blue-600 text-base font-bold">Choose your character to continue the adventure!</p>
            </div>

            {/* Character Selectors */}
            <div className="grid grid-cols-3 gap-3 mb-8 p-2 bg-blue-50 rounded-2xl border-2 border-blue-200 shadow-inner">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      setError(null);
                    }}
                    className={`relative flex flex-col items-center justify-center py-4 rounded-xl transition-all duration-300 group ${
                      isActive 
                      ? 'bg-white shadow-lg border-2 border-blue-300 scale-105' 
                      : 'hover:bg-white/70 hover:scale-102'
                    }`}
                  >
                    <div className={`
                      w-12 h-12 rounded-2xl flex items-center justify-center mb-3 transition-all duration-300
                      ${isActive 
                        ? `${tab.id === 'admin' ? 'bg-emerald-500' : 'bg-blue-500'} text-white shadow-lg scale-110` 
                        : 'bg-white text-blue-400 group-hover:scale-105 shadow-md'
                      }
                    `}>
                      <tab.icon className="w-6 h-6" />
                    </div>
                    <span className={`text-xs font-black ${isActive ? 'text-blue-700' : 'text-blue-500'} mb-1`}>
                      {tab.label}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Verification Message */}
            {showVerificationMessage && activeTab === 'parents' && (
              <div className="bg-blue-100 border-2 border-blue-300 rounded-2xl p-4 mb-6 animate-in slide-in-from-top-2 shadow-md">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-blue-500 rounded-lg text-white">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-blue-800 text-sm mb-1">Magic Email Sent! ✨</h3>
                    <p className="text-xs text-blue-700 mb-3">
                      We sent a special link to <span className="font-bold text-blue-700">{verificationEmail}</span>
                    </p>
                    <button 
                      onClick={handleResendVerification}
                      disabled={resendingEmail || resendSuccess}
                      className="text-xs font-bold bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-xl transition-all shadow-md hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {resendSuccess ? '✨ Sent Again!' : (resendingEmail ? 'Sending...' : 'Resend Magic Link')}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-red-100 border-2 border-red-300 rounded-2xl p-4 mb-6 flex items-start gap-3 animate-in slide-in-from-top-2 shadow-md">
                <AlertCircle className="w-6 h-6 text-red-500 shrink-0" />
                <span className="text-sm font-bold text-red-700">{error}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-5 relative z-10">
              {activeTab === 'children' ? (
                <div className="space-y-2">
                  <label className="text-sm font-black text-blue-700 uppercase tracking-wider ml-1 flex items-center gap-2">
                    <span>Magic Code</span>
                    <span className="text-lg">🔐</span>
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <div className="text-2xl">🎮</div>
                    </div>
                    <input
                      type="text"
                      required
                      value={accessCode}
                      onChange={(e) => {
                         let value = e.target.value.replace(/[^A-Z0-9]/gi, '').toUpperCase();
                         if (value.length > 3 && value.indexOf('-') === -1) {
                           value = value.slice(0, 3) + '-' + value.slice(3, 6);
                         }
                         setAccessCode(value);
                      }}
                      maxLength={7}
                      placeholder="ABC-123"
                      className="w-full pl-12 pr-4 py-4 bg-white border-2 border-blue-200 rounded-2xl text-blue-900 placeholder-blue-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition-all font-mono text-center text-xl tracking-[0.2em] outline-none shadow-inner"
                    />
                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                      <div className="text-xl">✨</div>
                    </div>
                  </div>
                  <p className="text-xs text-center text-blue-500 mt-2 flex items-center justify-center gap-2">
                    <span>🔑 Ask your parent for your special code!</span>
                  </p>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-black text-blue-700 uppercase tracking-wider ml-1 flex items-center gap-2">
                      <span>Email Address</span>
                      <span className="text-lg"></span>
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <div className="text-2xl">👑</div>
                      </div>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="parent@example.com"
                        className="w-full pl-12 pr-4 py-4 bg-white border-2 border-blue-200 rounded-2xl text-blue-900 placeholder-blue-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition-all outline-none shadow-inner"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center ml-1">
                      <label className="text-sm font-black text-blue-700 uppercase tracking-wider flex items-center gap-2">
                        <span>Password</span>
                        <span className="text-lg"></span>
                      </label>
                      <Link to="/forgot-password" className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-1">
                        Forgot your password? 
                      </Link>
                    </div>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <div className="text-2xl">🔒</div>
                      </div>
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-12 pr-4 py-4 bg-white border-2 border-blue-200 rounded-2xl text-blue-900 placeholder-blue-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition-all outline-none shadow-inner"
                      />
                    </div>
                  </div>
                </>
              )}

              <button 
                type="submit"
                disabled={loading || (activeTab === 'children' && accessCode.length < 7)}
                className={`
                  w-full py-4 rounded-2xl font-black text-lg tracking-wide shadow-xl transform transition-all duration-300
                  flex items-center justify-center gap-3 relative overflow-hidden group
                  ${activeTab === 'children' 
                    ? 'bg-blue-500 text-white hover:shadow-[0_15px_30px_rgba(59,130,246,0.4)] hover:scale-105' 
                    : 'bg-blue-500 text-white hover:shadow-[0_15px_30px_rgba(59,130,246,0.4)] hover:scale-105'
                  }
                  disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
                `}
              >
                {loading && <Loader2 className="h-5 w-5 animate-spin" />}
                <span className="flex items-center gap-2">
                  {loading 
                    ? (activeTab === 'children' ? 'Launching Rocket...' : 'Opening Treasure...') 
                    : (activeTab === 'children' ? 'Start Adventure! 🚀' : 'Login')
                  }
                </span>
                
                {/* Shine effect */}
                <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/40 to-transparent"></div>
              </button>
            </form>

            <div className="mt-8 text-center relative z-10">
              <p className="text-blue-600 text-sm font-bold">
                New to the adventure?{' '}
                <Link to="/signup" className="font-black text-blue-600 hover:text-blue-700 transition-all">
                  Join the fun! 🎉
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0); }
          50% { transform: translateY(-20px) rotate(5deg); }
        }
        @keyframes float-slow {
          0%, 100% { transform: translateY(0) rotate(0); }
          50% { transform: translateY(-15px) rotate(3deg); }
        }
        @keyframes float-cloud {
          0%, 100% { transform: translateY(0) translateX(0); }
          25% { transform: translateY(-10px) translateX(5px); }
          75% { transform: translateY(5px) translateX(-5px); }
        }
        @keyframes bounce-coin {
          0%, 100% { transform: translateY(0) rotate(0); }
          50% { transform: translateY(-20px) rotate(180deg); }
        }
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes bounce-slower {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .animate-float-slow {
          animation: float-slow 8s ease-in-out infinite;
        }
        .animate-float-cloud {
          animation: float-cloud 20s ease-in-out infinite;
        }
        .animate-bounce-coin {
          animation: bounce-coin 2s ease-in-out infinite;
        }
        .animate-bounce-slow {
          animation: bounce-slow 3s ease-in-out infinite;
        }
        .animate-bounce-slower {
          animation: bounce-slower 4s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
