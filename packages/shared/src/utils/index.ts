// Utility functions

/**
 * Format child access code (ABC-123)
 */
export function formatChildCode(code: string): string {
  if (code.length !== 6) return code;
  return `${code.slice(0, 3)}-${code.slice(3)}`.toUpperCase();
}

/**
 * Calculate level from total XP
 * Levels: 1-8 based on XP thresholds
 */
export function calculateLevel(totalXP: number): number {
  const thresholds = [0, 100, 250, 500, 1000, 2000, 4000, 8000];
  for (let i = thresholds.length - 1; i >= 0; i--) {
    if (totalXP >= thresholds[i]) {
      return i + 1;
    }
  }
  return 1;
}

/**
 * Calculate XP needed for next level
 */
export function xpForNextLevel(currentLevel: number, currentXP: number): number {
  const thresholds = [0, 100, 250, 500, 1000, 2000, 4000, 8000];
  if (currentLevel >= 8) return 0;
  const nextThreshold = thresholds[currentLevel];
  return nextThreshold - currentXP;
}

/**
 * Calculate XP progress percentage for current level
 */
export function xpProgressPercentage(currentLevel: number, currentXP: number): number {
  const thresholds = [0, 100, 250, 500, 1000, 2000, 4000, 8000];
  if (currentLevel >= 8) return 100;
  const currentThreshold = thresholds[currentLevel - 1] || 0;
  const nextThreshold = thresholds[currentLevel];
  const progress = currentXP - currentThreshold;
  const needed = nextThreshold - currentThreshold;
  return Math.min(100, Math.max(0, Math.round((progress / needed) * 100)));
}

/**
 * Calculate progress percentage
 */
export function calculateProgress(completed: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((completed / total) * 100);
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Generate random string for codes (excluding ambiguous characters)
 */
export function generateRandomCode(length: number = 6): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excludes O, 0, I, 1
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}





