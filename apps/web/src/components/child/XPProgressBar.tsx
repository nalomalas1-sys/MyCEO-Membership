import { xpProgressPercentage, xpForNextLevel } from '@myceo/shared';

interface XPProgressBarProps {
  currentLevel: number;
  currentXP: number;
  showDetails?: boolean;
}

export function XPProgressBar({ currentLevel, currentXP, showDetails = true }: XPProgressBarProps) {
  const progress = xpProgressPercentage(currentLevel, currentXP);
  const xpNeeded = xpForNextLevel(currentLevel, currentXP);

  return (
    <div className="w-full">
      {showDetails && (
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-gray-900">Level {currentLevel}</span>
            <span className="text-sm text-gray-600">{currentXP} XP</span>
          </div>
          {currentLevel < 8 && (
            <span className="text-sm text-gray-600">
              {xpNeeded} XP to Level {currentLevel + 1}
            </span>
          )}
        </div>
      )}
      <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-primary-500 via-purple-500 to-pink-500 transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
      {currentLevel >= 8 && (
        <p className="text-xs text-gray-500 mt-1 text-center">Max Level Reached! 🎉</p>
      )}
    </div>
  );
}






