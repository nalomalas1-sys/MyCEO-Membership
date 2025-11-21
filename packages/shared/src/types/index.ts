// Database types (will be generated from Supabase)
export type UserRole = 'parent' | 'admin' | 'child';

export type SubscriptionTier = 'basic' | 'standard' | 'premium';

export type SubscriptionStatus = 
  | 'trialing'
  | 'active'
  | 'past_due'
  | 'canceled'
  | 'unpaid';

export type ModuleTrack = 'money_basics' | 'entrepreneurship' | 'advanced';

export type LessonType = 'video' | 'text' | 'quiz';

export type ActivityType = 
  | 'module_start'
  | 'lesson_complete'
  | 'quiz_attempt'
  | 'module_complete';

export type AchievementType = 
  | 'milestone'
  | 'performance'
  | 'company'
  | 'engagement';

// Common interfaces
export interface BaseEntity {
  id: string;
  created_at: string;
  updated_at: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  pageSize: number;
  totalPages: number;
}





