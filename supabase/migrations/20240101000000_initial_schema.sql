-- Initial database schema for MyCEO LMS
-- This migration creates all core tables

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'parent' CHECK (role IN ('parent', 'admin', 'child')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Parents table (subscription and billing info)
CREATE TABLE IF NOT EXISTS public.parents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  stripe_customer_id TEXT UNIQUE,
  subscription_tier TEXT CHECK (subscription_tier IN ('basic', 'standard', 'premium')),
  subscription_status TEXT DEFAULT 'trialing' CHECK (subscription_status IN ('trialing', 'active', 'past_due', 'canceled', 'unpaid')),
  trial_ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Children table
CREATE TABLE IF NOT EXISTS public.children (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  parent_id UUID NOT NULL REFERENCES public.parents(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  age INTEGER CHECK (age >= 6 AND age <= 16),
  gender TEXT CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
  profile_picture_url TEXT,
  access_code TEXT UNIQUE NOT NULL,
  total_xp INTEGER DEFAULT 0,
  current_level INTEGER DEFAULT 1 CHECK (current_level >= 1 AND current_level <= 8),
  current_streak INTEGER DEFAULT 0,
  last_activity_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Modules table
CREATE TABLE IF NOT EXISTS public.modules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  track TEXT NOT NULL CHECK (track IN ('money_basics', 'entrepreneurship', 'advanced')),
  order_index INTEGER NOT NULL,
  difficulty_level INTEGER DEFAULT 1 CHECK (difficulty_level >= 1 AND difficulty_level <= 5),
  xp_reward INTEGER DEFAULT 100,
  is_published BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Module prerequisites (many-to-many)
CREATE TABLE IF NOT EXISTS public.module_prerequisites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  module_id UUID NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  prerequisite_module_id UUID NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(module_id, prerequisite_module_id)
);

-- Lessons table
CREATE TABLE IF NOT EXISTS public.lessons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  module_id UUID NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  lesson_type TEXT NOT NULL CHECK (lesson_type IN ('video', 'text', 'quiz')),
  content_url TEXT,
  order_index INTEGER NOT NULL,
  duration_minutes INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Quiz questions (for quiz lessons)
CREATE TABLE IF NOT EXISTS public.quiz_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  options JSONB NOT NULL, -- Array of answer options
  correct_answer_index INTEGER NOT NULL,
  explanation TEXT,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Activities table (child progress tracking)
CREATE TABLE IF NOT EXISTS public.activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('module_start', 'lesson_complete', 'quiz_attempt', 'module_complete')),
  module_id UUID REFERENCES public.modules(id) ON DELETE SET NULL,
  lesson_id UUID REFERENCES public.lessons(id) ON DELETE SET NULL,
  quiz_score INTEGER, -- For quiz attempts (0-100)
  xp_earned INTEGER DEFAULT 0,
  metadata JSONB, -- Additional data
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Child module progress
CREATE TABLE IF NOT EXISTS public.child_module_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  xp_earned INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(child_id, module_id)
);

-- Child lesson progress
CREATE TABLE IF NOT EXISTS public.child_lesson_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  quiz_score INTEGER, -- For quiz lessons
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(child_id, lesson_id)
);

-- Achievements table (badge definitions)
CREATE TABLE IF NOT EXISTS public.achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  icon_url TEXT,
  achievement_type TEXT NOT NULL CHECK (achievement_type IN ('milestone', 'performance', 'company', 'engagement')),
  rarity TEXT DEFAULT 'common' CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
  xp_bonus INTEGER DEFAULT 0,
  criteria JSONB, -- Criteria for earning (e.g., {"modules_completed": 10})
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Child achievements (earned badges)
CREATE TABLE IF NOT EXISTS public.child_achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(child_id, achievement_id)
);

-- Companies table (virtual company data)
CREATE TABLE IF NOT EXISTS public.companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  child_id UUID UNIQUE NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  product_name TEXT,
  logo_url TEXT,
  initial_capital DECIMAL(10, 2) DEFAULT 1000.00,
  current_balance DECIMAL(10, 2) DEFAULT 1000.00,
  total_revenue DECIMAL(10, 2) DEFAULT 0.00,
  total_expenses DECIMAL(10, 2) DEFAULT 0.00,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Company transactions
CREATE TABLE IF NOT EXISTS public.company_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('revenue', 'expense', 'purchase', 'sale')),
  amount DECIMAL(10, 2) NOT NULL,
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Subscriptions table (Stripe subscription tracking)
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  parent_id UUID NOT NULL REFERENCES public.parents(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT UNIQUE NOT NULL,
  stripe_price_id TEXT NOT NULL,
  status TEXT NOT NULL,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Marketplace items
CREATE TABLE IF NOT EXISTS public.marketplace_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL CHECK (price > 0),
  image_url TEXT,
  status TEXT DEFAULT 'available' CHECK (status IN ('available', 'sold', 'removed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Marketplace purchases
CREATE TABLE IF NOT EXISTS public.marketplace_purchases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  buyer_child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES public.marketplace_items(id) ON DELETE CASCADE,
  purchase_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  transaction_id UUID REFERENCES public.company_transactions(id) ON DELETE SET NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_children_parent_id ON public.children(parent_id);
CREATE INDEX IF NOT EXISTS idx_children_access_code ON public.children(access_code);
CREATE INDEX IF NOT EXISTS idx_activities_child_id ON public.activities(child_id);
CREATE INDEX IF NOT EXISTS idx_activities_module_id ON public.activities(module_id);
CREATE INDEX IF NOT EXISTS idx_child_module_progress_child_id ON public.child_module_progress(child_id);
CREATE INDEX IF NOT EXISTS idx_child_module_progress_module_id ON public.child_module_progress(module_id);
CREATE INDEX IF NOT EXISTS idx_lessons_module_id ON public.lessons(module_id);
CREATE INDEX IF NOT EXISTS idx_modules_track ON public.modules(track);
CREATE INDEX IF NOT EXISTS idx_modules_published ON public.modules(is_published);
CREATE INDEX IF NOT EXISTS idx_parents_user_id ON public.parents(user_id);
CREATE INDEX IF NOT EXISTS idx_parents_stripe_customer_id ON public.parents(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_parent_id ON public.subscriptions(parent_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_subscription_id ON public.subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_items_seller ON public.marketplace_items(seller_child_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_items_status ON public.marketplace_items(status);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_parents_updated_at BEFORE UPDATE ON public.parents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_children_updated_at BEFORE UPDATE ON public.children
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_modules_updated_at BEFORE UPDATE ON public.modules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lessons_updated_at BEFORE UPDATE ON public.lessons
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON public.companies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_marketplace_items_updated_at BEFORE UPDATE ON public.marketplace_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();





