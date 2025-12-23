import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { SubscriptionSignupForm } from '@/components/auth/SubscriptionSignupForm';
import { SignupForm } from '@/components/auth/SignupForm';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';
import { 
  AlertCircle, 
  ArrowLeft,
  Crown,
  Lock,
  PartyPopper,
  Star,
  Check,
  Loader2
} from 'lucide-react';
import logoImage from '../Logo-MyCeo-300x200.png';

// --- Playful Background Effects ---
const BackgroundEffects = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {/* Animated bubbles */}
    <div className="absolute top-20 left-10 w-24 h-24 bg-gradient-to-br from-blue-300/20 to-cyan-400/20 rounded-full animate-float" style={{ animationDelay: '0s' }}></div>
    <div className="absolute top-40 right-20 w-32 h-32 bg-gradient-to-br from-blue-300/20 to-cyan-400/20 rounded-full animate-float" style={{ animationDelay: '2s' }}></div>
    <div className="absolute bottom-40 left-1/4 w-28 h-28 bg-gradient-to-br from-yellow-300/20 to-amber-400/20 rounded-full animate-float" style={{ animationDelay: '1s' }}></div>
    
    {/* Floating coins */}
    <div className="absolute top-1/4 right-1/4 w-12 h-12 bg-gradient-to-br from-yellow-300 to-amber-400 rounded-full animate-bounce-coin shadow-xl" style={{ animationDelay: '0s' }}>
      <div className="w-7 h-7 border-2 border-yellow-500 rounded-full absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"></div>
    </div>
    
    {/* Subtle grid pattern */}
    <div className="absolute inset-0 opacity-5">
      <div className="absolute inset-0" style={{
        backgroundImage: `linear-gradient(90deg, rgba(59,130,246,0.1) 1px, transparent 1px),
                         linear-gradient(rgba(59,130,246,0.1) 1px, transparent 1px)`,
        backgroundSize: '50px 50px'
      }}></div>
    </div>
  </div>
);

// --- Floating Treasure Elements ---
const FloatingTreasure = () => {
  const [elements] = useState([
    { icon: '💰', x: 5, y: 10, delay: 0, size: 'text-2xl' },
    { icon: '👑', x: 95, y: 20, delay: 0.5, size: 'text-3xl' },
    { icon: '🚀', x: 10, y: 70, delay: 1, size: 'text-4xl' },
    { icon: '🏆', x: 90, y: 60, delay: 1.5, size: 'text-3xl' },
    { icon: '✨', x: 45, y: 5, delay: 0.3, size: 'text-2xl' },
    { icon: '🎯', x: 55, y: 85, delay: 0.8, size: 'text-3xl' },
  ]);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {elements.map((el, i) => (
        <div
          key={i}
          className={`absolute ${el.size} animate-float-slower opacity-30`}
          style={{
            left: `${el.x}%`,
            top: `${el.y}%`,
            animationDelay: `${el.delay}s`,
          }}
        >
          {el.icon}
        </div>
      ))}
    </div>
  );
};

export default function SignupPage() {
  const [searchParams] = useSearchParams();
  const canceled = searchParams.get('canceled') === 'true';
  const { isEnabled, loading: flagsLoading } = useFeatureFlags();
  
  const stripeRegistrationEnabled = isEnabled('stripe_registration');

  // Show loading state while checking feature flags
  if (flagsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 via-yellow-50/30 to-amber-50/30">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600 font-bold">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative flex bg-gradient-to-b from-blue-50 via-yellow-50/30 to-amber-50/30 font-sans text-blue-900 overflow-hidden selection:bg-yellow-300 selection:text-yellow-900">
      
      <BackgroundEffects />
      <FloatingTreasure />

      {/* Navigation Header */}
      <nav className="absolute top-0 left-0 p-6 z-20 w-full">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link 
            to="/" 
            className="group flex items-center gap-3 text-blue-700 hover:text-blue-600 transition-all px-5 py-3 rounded-2xl hover:bg-white/60 backdrop-blur-sm border-2 border-blue-200 hover:border-blue-300 shadow-lg hover:scale-105"
          >
            <div className="bg-gradient-to-br from-blue-300 to-cyan-400 p-2 rounded-xl group-hover:-translate-x-1 transition-transform text-white">
              <ArrowLeft className="w-5 h-5" />
            </div>
            <span className="font-bold text-base">Back to Adventure! 🏠</span>
          </Link>

          <Link to="/" className="flex items-center space-x-2 md:hidden group">
            <img 
              src={logoImage}
              alt="MyCEO Logo"
              className="h-10 w-auto object-contain shadow-lg group-hover:rotate-12 transition-transform"
            />
            <span className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-cyan-500">MyCEO</span>
          </Link>
        </div>
      </nav>

      <div className="w-full max-w-7xl mx-auto p-4 flex flex-col lg:flex-row gap-8 items-center justify-center relative z-10 min-h-screen pt-24 lg:pt-0">
        
        {/* Left Side - Clean & Organized Content */}
        <div className="hidden lg:flex flex-col w-1/2 pr-12">
          <div className="relative mb-12">
            {/* Logo */}
            <div className="mb-10">
              <Link to="/" className="inline-flex items-center space-x-4 group">
                <img 
                  src={logoImage}
                  alt="MyCEO Logo"
                  className="h-16 w-auto object-contain shadow-xl group-hover:rotate-12 transition-transform duration-500"
                />
                <div>
                  <div className="text-4xl font-black tracking-tight">
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-cyan-500">My</span>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 to-amber-500">CEO</span>
                  </div>
                  <p className="text-sm text-blue-600 font-bold mt-1">Where Kids Build Empires! 👑</p>
                </div>
              </Link>
            </div>

            {/* Hero Section */}
            <div className="mb-12">
              <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-gradient-to-r from-green-100 to-emerald-100 border-2 border-green-300 text-sm font-black text-green-800 mb-8 shadow-lg">
                <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                <span>Start Your FREE Adventure Today!</span>
                <PartyPopper className="w-5 h-5 text-blue-500" />
              </div>
              
              <h1 className="text-5xl font-black tracking-tight mb-6 leading-[1.1]">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-500 via-emerald-500 to-cyan-500">
                  Launch Your
                </span>
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-600 text-6xl">
                  First Business! 
                </span>
              </h1>
              
              <p className="text-xl text-blue-700/90 leading-relaxed font-bold bg-white/60 p-6 rounded-3xl border-2 border-dashed border-blue-300 shadow-sm">
                Turn screen time into CEO time! Join thousands of kids learning entrepreneurship in a fun, safe environment.
              </p>
            </div>

            {/* Feature Highlights */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-50/50 to-cyan-50/50 rounded-2xl border border-blue-200">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-xl flex items-center justify-center text-white">
                  <Check className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-blue-800">1-day FREE trial</p>
                  <p className="text-sm text-blue-600">No credit card required to start!</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-50/50 to-cyan-50/50 rounded-2xl border border-blue-200">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-xl flex items-center justify-center text-white">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-blue-800">100% Safe & COPPA Compliant</p>
                  <p className="text-sm text-blue-600">No ads, fully protected!</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Form Container (WIDER for Plans) */}
        <div className="w-full lg:w-1/2 flex items-center justify-center">
          <div className="w-full max-w-3xl relative">
             {/* Card Glow Effect */}
             <div className="absolute inset-0 bg-gradient-to-b from-green-400/20 via-emerald-400/15 to-cyan-400/10 rounded-[3rem] blur-2xl transform -rotate-2 animate-pulse"></div>

             <div className="bg-white/95 backdrop-blur-sm border-4 border-white p-5 rounded-[3rem] shadow-2xl relative overflow-hidden">
                {/* Form Background Pattern */}
                <div className="absolute inset-0 opacity-5">
                  <div className="absolute top-10 left-10 w-32 h-32 rounded-full bg-gradient-to-br from-green-300/30 to-emerald-400/30"></div>
                  <div className="absolute bottom-10 right-10 w-40 h-40 rounded-full bg-gradient-to-br from-blue-300/30 to-cyan-400/30"></div>
                </div>
                
                <div className="mb-10 relative z-10">
                  <div className="text-center mb-8">
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-2xl flex items-center justify-center text-white shadow-xl mx-auto mb-6">
                      <Crown className="w-10 h-10" />
                    </div>
                    <h2 className="text-4xl font-black bg-gradient-to-r from-green-500 to-emerald-500 bg-clip-text text-transparent mb-4">
                      Start Your Quest! 🗺️
                    </h2>
                    <p className="text-blue-600 font-bold text-lg mb-2">
                      {stripeRegistrationEnabled 
                        ? 'Choose your adventure plan:'
                        : 'Create your account:'}
                    </p>
                    <p className="text-blue-500 text-center text-sm mb-6">
                      Already have an account?{' '}
                      <Link to="/login" className="font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 transition-all">
                        Sign in here! 🚀
                      </Link>
                    </p>
                  </div>
                </div>

                {canceled && (
                  <div className="p-6 bg-gradient-to-r from-yellow-100 to-amber-100 border-2 border-yellow-300 rounded-2xl text-yellow-800 flex items-start mb-10 animate-in slide-in-from-top-2 shadow-lg relative z-10">
                    <AlertCircle className="h-8 w-8 mr-4 flex-shrink-0 text-yellow-600" />
                    <div>
                      <p className="font-black mb-2 text-yellow-900 text-xl">Adventure Paused! ⏸️</p>
                      <p className="opacity-90">Ready to continue your business quest?</p>
                    </div>
                  </div>
                )}
                
                {/* Conditionally render form based on feature flag */}
                <div className="signup-form-wrapper relative z-10">
                  {stripeRegistrationEnabled ? (
                    <SubscriptionSignupForm />
                  ) : (
                    <SignupForm />
                  )}
                </div>

                {/* Safety & Trust Badges - Bigger */}
                <div className="mt-12 grid grid-cols-2 gap-6 relative z-10">
                  <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-3xl p-6 border-2 border-blue-200 text-center shadow-sm">
                    <div className="text-3xl mb-4">🔒</div>
                    <p className="text-lg font-black text-blue-800">100% Safe</p>
                    <p className="text-sm text-blue-600 font-bold">COPPA Friendly</p>
                  </div>
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-3xl p-6 border-2 border-green-200 text-center shadow-sm">
                    <div className="text-3xl mb-4">👪</div>
                    <p className="text-lg font-black text-green-800">Parent Approved</p>
                    <p className="text-sm text-green-600 font-bold">No Ads Ever</p>
                  </div>
                </div>

                {/* Money Back Guarantee */}
                <div className="mt-10 p-6 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-3xl border-2 border-blue-200 text-center relative z-10 shadow-sm">
                  <div className="flex items-center justify-center gap-3 mb-3">
                    <div className="text-2xl">🎉</div>
                    <p className="text-lg font-black text-blue-800">Start with 1-day FREE trial!</p>
                    <div className="text-2xl">🎮</div>
                  </div>
                  <p className="text-blue-600 font-bold">
                    No credit card needed • Cancel anytime • 100% satisfaction guarantee
                  </p>
                </div>
             </div>
          </div>
        </div>
      </div>

      {/* Enhanced CSS for the Imported Form - FOCUS ON MAKING PLANS BIGGER */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0); }
          50% { transform: translateY(-25px) rotate(5deg); }
        }
        @keyframes float-slower {
          0%, 100% { transform: translateY(0) rotate(0); }
          50% { transform: translateY(-20px) rotate(3deg); }
        }
        @keyframes bounce-coin {
          0%, 100% { transform: translateY(0) rotate(0); }
          50% { transform: translateY(-30px) rotate(180deg); }
        }
        .animate-float {
          animation: float 8s ease-in-out infinite;
        }
        .animate-float-slower {
          animation: float-slower 10s ease-in-out infinite;
        }
        .animate-bounce-coin {
          animation: bounce-coin 4s ease-in-out infinite;
        }

        /* ======================== */
        /* MAJOR CHANGES START HERE */
        /* ======================== */

        /* Make the entire form wrapper take full width */
        .signup-form-wrapper {
          width: 100% !important;
          max-width: 100% !important;
        }

        /* Make the form container itself MUCH BIGGER */
        .signup-form-wrapper > div {
          background: rgba(255, 255, 255, 0.95) !important;
          backdrop-filter: blur(15px) !important;
          border-radius: 2.5rem !important;
          padding: 3rem !important;
          border: 3px solid rgba(59, 130, 246, 0.15) !important;
          box-shadow: 0 25px 50px rgba(0, 0, 0, 0.1) !important;
          width: 100% !important;
          max-width: 100% !important;
          margin: 0 auto !important;
        }

        /* Make the "Choose Your Plan" section HEADER bigger */
        .signup-form-wrapper h2,
        .signup-form-wrapper h3,
        .signup-form-wrapper [class*="title"] {
          font-size: 2rem !important;
          font-weight: 900 !important;
          text-align: center !important;
          margin-bottom: 2rem !important;
          color: #1e3a8a !important;
        }

        /* Make the billing toggle (Monthly/Annual) BIGGER */
        .signup-form-wrapper [class*="toggle"],
        .signup-form-wrapper [class*="billing"],
        .signup-form-wrapper [class*="switch"] {
          padding: 1rem !important;
          border-radius: 1.5rem !important;
          margin-bottom: 3rem !important;
          background: #f8fafc !important;
          border: 3px solid #e2e8f0 !important;
        }

        .signup-form-wrapper [class*="toggle"] button,
        .signup-form-wrapper [class*="billing"] button {
          padding: 1rem 2rem !important;
          font-size: 1.1rem !important;
          font-weight: 800 !important;
          border-radius: 1rem !important;
        }

        /* ============================================== */
        /* CRITICAL: Make the plan cards HUGE and spacious */
        /* ============================================== */

        /* Target plan cards container */
        .signup-form-wrapper [class*="plan-container"],
        .signup-form-wrapper [class*="planContainer"],
        .signup-form-wrapper [class*="plans"],
        .signup-form-wrapper [class*="pricing-container"] {
          display: grid !important;
          grid-template-columns: repeat(3, 1fr) !important;
          gap: 2rem !important;
          margin-bottom: 3rem !important;
        }

        /* Make individual plan cards MUCH BIGGER */
        .signup-form-wrapper [class*="plan-option"],
        .signup-form-wrapper [class*="planOption"],
        .signup-form-wrapper [class*="pricing-card"],
        .signup-form-wrapper [class*="plan-card"] {
          padding: 2.5rem !important;
          border-radius: 2rem !important;
          border: 3px solid #e2e8f0 !important;
          min-height: 450px !important;
          display: flex !important;
          flex-direction: column !important;
          justify-content: space-between !important;
          transition: all 0.3s ease !important;
          cursor: pointer !important;
          background: white !important;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05) !important;
        }

        /* Make selected plan stand out more */
        .signup-form-wrapper [class*="selected"],
        .signup-form-wrapper [class*="active"] {
          border-color: #3b82f6 !important;
          border-width: 4px !important;
          box-shadow: 0 20px 40px rgba(59, 130, 246, 0.2) !important;
          transform: translateY(-10px) !important;
        }

        /* Plan titles - BIG and clear */
        .signup-form-wrapper [class*="plan-title"],
        .signup-form-wrapper [class*="planName"],
        .signup-form-wrapper [class*="pricing-title"] {
          font-size: 2rem !important;
          font-weight: 900 !important;
          margin-bottom: 1rem !important;
          color: #1e3a8a !important;
        }

        /* Plan descriptions - bigger */
        .signup-form-wrapper [class*="plan-description"],
        .signup-form-wrapper [class*="description"] {
          font-size: 1.1rem !important;
          line-height: 1.6 !important;
          margin-bottom: 2rem !important;
          color: #64748b !important;
        }

        /* =========================================== */
        /* CRITICAL: Make PRICES HUGE and easy to read */
        /* =========================================== */

        .signup-form-wrapper [class*="plan-price"],
        .signup-form-wrapper [class*="price"],
        .signup-form-wrapper [class*="amount"] {
          font-size: 3.5rem !important;
          font-weight: 900 !important;
          margin: 1.5rem 0 !important;
          color: #1e3a8a !important;
        }

        .signup-form-wrapper [class*="price"] span:first-child {
          font-size: 3.5rem !important;
          font-weight: 900 !important;
        }

        .signup-form-wrapper [class*="price-period"],
        .signup-form-wrapper [class*="month"] {
          font-size: 1.2rem !important;
          font-weight: 600 !important;
          color: #64748b !important;
        }

        /* Savings badge - bigger */
        .signup-form-wrapper [class*="savings"],
        .signup-form-wrapper [class*="save"] {
          background: linear-gradient(to right, #10b981, #14b8a6) !important;
          color: white !important;
          padding: 0.75rem 1.5rem !important;
          border-radius: 2rem !important;
          font-weight: 800 !important;
          font-size: 1rem !important;
          display: inline-block !important;
          margin-bottom: 1.5rem !important;
        }

        /* ================================================ */
        /* CRITICAL: Make feature lists BIGGER and readable */
        /* ================================================ */

        .signup-form-wrapper [class*="features"],
        .signup-form-wrapper [class*="feature-list"],
        .signup-form-wrapper [class*="benefits"] {
          margin-top: 2rem !important;
        }

        .signup-form-wrapper [class*="features"] li,
        .signup-form-wrapper [class*="feature"] {
          font-size: 1.1rem !important;
          line-height: 1.8 !important;
          margin-bottom: 1rem !important;
          padding-left: 2rem !important;
          position: relative !important;
        }

        .signup-form-wrapper [class*="features"] li:before,
        .signup-form-wrapper [class*="feature"]:before {
          content: "✓" !important;
          position: absolute !important;
          left: 0 !important;
          color: #10b981 !important;
          font-weight: bold !important;
          font-size: 1.2rem !important;
        }

        /* Most Popular badge - bigger */
        .signup-form-wrapper [class*="popular"],
        .signup-form-wrapper [class*="best-value"],
        .signup-form-wrapper [class*="recommended"] {
          background: linear-gradient(to right, #f59e0b, #f97316) !important;
          color: white !important;
          padding: 0.75rem 1.5rem !important;
          border-radius: 2rem !important;
          font-weight: 800 !important;
          font-size: 1rem !important;
          position: absolute !important;
          top: -15px !important;
          left: 50% !important;
          transform: translateX(-50%) !important;
          box-shadow: 0 10px 20px rgba(245, 158, 11, 0.3) !important;
        }

        /* ========================================= */
        /* Form inputs - bigger */
        .signup-form-wrapper input, 
        .signup-form-wrapper select, 
        .signup-form-wrapper textarea {
          background-color: white !important;
          border: 3px solid rgba(59, 130, 246, 0.2) !important;
          color: #1e3a8a !important;
          border-radius: 1rem !important;
          padding: 1.25rem 1.5rem !important;
          width: 100% !important;
          outline: none !important;
          transition: all 0.3s !important;
          font-weight: 600 !important;
          font-size: 1.1rem !important;
          box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.05) !important;
          margin-bottom: 1.5rem !important;
        }

        .signup-form-wrapper input:focus, 
        .signup-form-wrapper select:focus {
          border-color: #34d399 !important;
          box-shadow: 0 0 0 4px rgba(52, 211, 153, 0.2) !important;
          transform: scale(1.02) !important;
        }

        .signup-form-wrapper label {
          color: #3b82f6 !important;
          font-weight: 900 !important;
          font-size: 1rem !important;
          text-transform: uppercase !important;
          letter-spacing: 0.05em !important;
          margin-bottom: 0.75rem !important;
          display: block !important;
        }

        /* Submit button - bigger */
        .signup-form-wrapper button[type="submit"] {
          background: linear-gradient(to right, #10b981, #14b8a6) !important;
          color: white !important;
          font-weight: 900 !important;
          padding: 1.5rem !important;
          border-radius: 1.5rem !important;
          width: 100% !important;
          margin-top: 3rem !important;
          text-transform: uppercase !important;
          letter-spacing: 0.05em !important;
          transition: all 0.3s !important;
          border: none !important;
          box-shadow: 0 20px 40px rgba(16, 185, 129, 0.3) !important;
          position: relative !important;
          overflow: hidden !important;
          font-size: 1.25rem !important;
        }
        .signup-form-wrapper button[type="submit"]:hover {
          transform: translateY(-5px) !important;
          box-shadow: 0 25px 50px rgba(16, 185, 129, 0.4) !important;
        }

        /* Add plan names with emojis like landing page */
        .signup-form-wrapper [class*="plan-option"]:nth-child(1) [class*="plan-title"]::after {
          content: " 🦸" !important;
        }
        .signup-form-wrapper [class*="plan-option"]:nth-child(2) [class*="plan-title"]::after {
          content: " 👨‍👩‍👧‍👦" !important;
        }
        .signup-form-wrapper [class*="plan-option"]:nth-child(3) [class*="plan-title"]::after {
          content: " 🏫" !important;
        }

        /* Responsive adjustments for mobile */
        @media (max-width: 1024px) {
          .signup-form-wrapper [class*="plan-container"],
          .signup-form-wrapper [class*="planContainer"],
          .signup-form-wrapper [class*="plans"] {
            grid-template-columns: 1fr !important;
            gap: 2rem !important;
          }
          
          .signup-form-wrapper [class*="plan-option"],
          .signup-form-wrapper [class*="planOption"] {
            min-height: 400px !important;
            padding: 2rem !important;
          }
          
          .signup-form-wrapper [class*="plan-price"],
          .signup-form-wrapper [class*="price"] {
            font-size: 2.5rem !important;
          }
        }

        @media (max-width: 640px) {
          .signup-form-wrapper > div {
            padding: 2rem !important;
            border-radius: 2rem !important;
          }
          
          .signup-form-wrapper [class*="plan-option"],
          .signup-form-wrapper [class*="planOption"] {
            padding: 1.5rem !important;
            min-height: 350px !important;
          }
          
          .signup-form-wrapper [class*="plan-title"] {
            font-size: 1.5rem !important;
          }
          
          .signup-form-wrapper [class*="plan-price"] {
            font-size: 2rem !important;
          }
        }
      `}</style>
    </div>
  );
}
