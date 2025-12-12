import { useState } from 'react';

// --- Playful Background Effects ---
export const BackgroundEffects = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {/* Animated clouds */}
    <div className="absolute top-10 left-10 w-40 h-20 bg-blue-100/20 rounded-full animate-float-cloud" style={{ animationDelay: '0s' }}></div>
    <div className="absolute top-40 right-20 w-60 h-30 bg-blue-100/20 rounded-full animate-float-cloud" style={{ animationDelay: '2s' }}></div>
    <div className="absolute bottom-20 left-1/4 w-50 h-25 bg-blue-100/20 rounded-full animate-float-cloud" style={{ animationDelay: '4s' }}></div>
    
    {/* Floating coins */}
    <div className="absolute top-1/4 right-1/4 w-8 h-8 bg-gradient-to-br from-yellow-300 to-amber-400 rounded-full animate-bounce-coin" style={{ animationDelay: '1s' }}></div>
    <div className="absolute top-1/3 left-1/4 w-6 h-6 bg-gradient-to-br from-yellow-300 to-amber-400 rounded-full animate-bounce-coin" style={{ animationDelay: '0.5s' }}></div>
    <div className="absolute bottom-1/3 right-1/3 w-10 h-10 bg-gradient-to-br from-yellow-300 to-amber-400 rounded-full animate-bounce-coin" style={{ animationDelay: '1.5s' }}></div>
    
    {/* Colorful blobs */}
    <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-300/20 rounded-full blur-[120px] animate-pulse duration-[6s]"></div>
    <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-300/20 rounded-full blur-[100px] animate-pulse duration-[8s]"></div>
    <div className="absolute top-1/2 left-1/2 w-[400px] h-[400px] bg-yellow-300/15 rounded-full blur-[80px] animate-pulse duration-[10s]"></div>
  </div>
);

// --- Floating Animated Characters ---
export const FloatingCharacters = () => {
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
export const PiggyBankMascot = () => (
  <div className="absolute bottom-10 left-10 w-32 h-32 animate-bounce-slow z-10 hidden lg:block">
    <div className="relative">
      <div className="w-32 h-32 bg-gradient-to-br from-blue-300 to-cyan-400 rounded-full relative">
        {/* Piggy body */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-20 h-20 bg-gradient-to-br from-blue-200 to-cyan-300 rounded-full"></div>
        {/* Snout */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 w-12 h-8 bg-cyan-200 rounded-full"></div>
        {/* Eyes */}
        <div className="absolute top-1/3 left-1/3 w-4 h-4 bg-white rounded-full"></div>
        <div className="absolute top-1/3 right-1/3 w-4 h-4 bg-white rounded-full"></div>
        {/* Coin slot */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 w-8 h-2 bg-yellow-300 rounded-full"></div>
      </div>
      {/* Floating coins */}
      <div className="absolute -top-4 -right-4 w-8 h-8 bg-gradient-to-br from-yellow-300 to-amber-400 rounded-full animate-bounce-coin" style={{ animationDelay: '0.2s' }}></div>
      <div className="absolute -bottom-2 -left-2 w-6 h-6 bg-gradient-to-br from-yellow-300 to-amber-400 rounded-full animate-bounce-coin" style={{ animationDelay: '0.7s' }}></div>
    </div>
  </div>
);

// --- Bouncing Business Character ---
export const BusinessCharacter = () => (
  <div className="absolute top-10 right-10 w-40 h-40 animate-bounce-slower z-10 hidden lg:block">
    <div className="relative">
      <div className="w-40 h-40 bg-gradient-to-br from-blue-300 to-cyan-400 rounded-full relative">
        {/* Character body */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-24 h-24 bg-gradient-to-br from-blue-200 to-cyan-300 rounded-full"></div>
        {/* Briefcase */}
        <div className="absolute bottom-8 right-8 w-12 h-8 bg-gradient-to-br from-yellow-300 to-amber-400 rounded-lg rotate-12">
          <div className="absolute top-1 w-8 h-1 bg-amber-500 left-2"></div>
        </div>
        {/* Calculator */}
        <div className="absolute bottom-12 left-8 w-10 h-6 bg-gradient-to-br from-green-300 to-emerald-400 rounded rotate-[-12deg]">
          <div className="absolute top-1 left-1 right-1 h-4 bg-green-200 rounded-sm"></div>
        </div>
      </div>
    </div>
  </div>
);

// --- Floating Background Styles ---
export const FloatingBackgroundStyles = () => (
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
);





