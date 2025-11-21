import { useEffect, useState } from 'react';
import { X, Trophy, Sparkles, Star, Award } from 'lucide-react';

interface Achievement {
  id: string;
  name: string;
  xp_bonus?: number;
}

interface AchievementNotificationProps {
  isOpen: boolean;
  onClose: () => void;
  xpEarned: number;
  newAchievements?: Achievement[];
  leveledUp?: boolean;
  newLevel?: number;
  type?: 'lesson' | 'module';
}

export function AchievementNotification({
  isOpen,
  onClose,
  xpEarned,
  newAchievements = [],
  leveledUp = false,
  newLevel,
  type = 'lesson',
}: AchievementNotificationProps) {
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShowConfetti(true);
      // Hide confetti after animation
      const timer = setTimeout(() => setShowConfetti(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 relative overflow-hidden border-4 border-yellow-400">
        {/* Confetti effect */}
        {showConfetti && (
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="absolute animate-bounce"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 2}s`,
                  animationDuration: `${1 + Math.random()}s`,
                }}
              >
                <Sparkles className="w-4 h-4 text-yellow-400" />
              </div>
            ))}
          </div>
        )}

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full mb-4 animate-pulse">
            <Trophy className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            {type === 'module' ? '🎉 Module Complete!' : '🎉 Lesson Complete!'}
          </h2>
        </div>

        {/* XP Earned */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 mb-4 border-2 border-blue-200">
          <div className="flex items-center justify-center gap-2">
            <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />
            <span className="text-2xl font-bold text-gray-900">
              +{xpEarned} XP
            </span>
          </div>
        </div>

        {/* Level Up */}
        {leveledUp && newLevel && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 mb-4 border-2 border-green-300 animate-pulse">
            <div className="flex items-center justify-center gap-2">
              <Sparkles className="w-6 h-6 text-green-600" />
              <span className="text-xl font-bold text-green-800">
                Level Up! You're now Level {newLevel}!
              </span>
            </div>
          </div>
        )}

        {/* New Achievements */}
        {newAchievements.length > 0 && (
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Award className="w-5 h-5 text-yellow-600" />
              New Achievements Unlocked!
            </h3>
            <div className="space-y-2">
              {newAchievements.map((achievement) => (
                <div
                  key={achievement.id}
                  className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-3 border-2 border-yellow-300 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center">
                      <Trophy className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        {achievement.name}
                      </p>
                      {achievement.xp_bonus && achievement.xp_bonus > 0 && (
                        <p className="text-sm text-gray-600">
                          +{achievement.xp_bonus} XP bonus
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Continue button */}
        <button
          onClick={onClose}
          className="w-full py-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-bold rounded-lg hover:from-yellow-500 hover:to-orange-600 transition-all transform hover:scale-105 shadow-lg"
        >
          Continue Learning! 🚀
        </button>
      </div>
    </div>
  );
}

