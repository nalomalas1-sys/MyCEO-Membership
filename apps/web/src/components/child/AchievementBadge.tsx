import { Trophy, Award, Star, Crown } from 'lucide-react';

interface AchievementBadgeProps {
  name: string;
  description: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  iconUrl?: string | null;
  earned?: boolean;
  earnedAt?: string;
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
}

const rarityColors = {
  common: {
    bg: 'bg-gray-100',
    border: 'border-gray-300',
    text: 'text-gray-700',
    icon: 'text-gray-500',
    glow: '',
    label: 'Common',
  },
  rare: {
    bg: 'bg-blue-100',
    border: 'border-blue-400',
    text: 'text-blue-700',
    icon: 'text-blue-500',
    glow: 'shadow-blue-300',
    label: 'Rare',
  },
  epic: {
    bg: 'bg-purple-100',
    border: 'border-purple-400',
    text: 'text-purple-700',
    icon: 'text-purple-500',
    glow: 'shadow-purple-300',
    label: 'Epic',
  },
  legendary: {
    bg: 'bg-gradient-to-br from-yellow-100 via-orange-100 to-yellow-200',
    border: 'border-yellow-500',
    text: 'text-yellow-800',
    icon: 'text-yellow-600',
    glow: 'shadow-yellow-400 shadow-lg',
    label: 'Legendary',
  },
};

const rarityIcons = {
  common: Trophy,
  rare: Award,
  epic: Star,
  legendary: Crown,
};

const sizeClasses = {
  sm: 'w-16 h-16 text-xs',
  md: 'w-24 h-24 text-sm',
  lg: 'w-32 h-32 text-base',
};

export function AchievementBadge({
  name,
  description,
  rarity,
  iconUrl,
  earned = false,
  earnedAt,
  size = 'md',
  onClick,
}: AchievementBadgeProps) {
  const colors = rarityColors[rarity];
  const Icon = rarityIcons[rarity];
  const sizeClass = sizeClasses[size];

  return (
    <div className="relative flex flex-col items-center">
      <div
        className={`
          relative rounded-full border-4 ${colors.border} ${colors.bg}
          ${sizeClass} flex flex-col items-center justify-center
          transition-all duration-300
          ${earned ? `opacity-100 scale-100 ${colors.glow}` : 'opacity-40 scale-90'}
          ${onClick ? 'cursor-pointer hover:scale-110' : ''}
          ${!earned ? 'grayscale' : ''}
          ${rarity === 'legendary' && earned ? 'animate-pulse' : ''}
        `}
        onClick={onClick}
        title={earned ? `${name} - Earned ${earnedAt ? new Date(earnedAt).toLocaleDateString() : ''}` : `${name} - Not earned yet`}
      >
        {iconUrl ? (
          <img src={iconUrl} alt={name} className="w-full h-full object-cover rounded-full" />
        ) : (
          <Icon className={`w-1/2 h-1/2 ${colors.icon}`} />
        )}
        {earned && (
          <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-md">
            <span className="text-white text-xs font-bold">✓</span>
          </div>
        )}
        {!earned && rarity !== 'common' && (
          <div className={`absolute -top-2 -right-2 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${colors.bg} ${colors.border} border-2`}>
            {colors.label}
          </div>
        )}
      </div>
      {size === 'lg' && (
        <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 w-full text-center">
          <p className={`font-semibold ${colors.text} truncate`}>{name}</p>
        </div>
      )}
    </div>
  );
}


