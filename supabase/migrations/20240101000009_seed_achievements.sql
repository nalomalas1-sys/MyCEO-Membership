-- Seed achievement definitions
-- This migration creates all achievement types with their criteria

-- Milestone Achievements
INSERT INTO public.achievements (name, description, achievement_type, rarity, xp_bonus, criteria) VALUES
('First Steps', 'Complete your first module!', 'milestone', 'common', 100, '{"modules_completed": 1}'),
('Getting Started', 'Complete 5 modules', 'milestone', 'common', 200, '{"modules_completed": 5}'),
('Dedicated Learner', 'Complete 10 modules', 'milestone', 'rare', 500, '{"modules_completed": 10}'),
('Knowledge Seeker', 'Complete 25 modules', 'milestone', 'rare', 1000, '{"modules_completed": 25}'),
('Module Master', 'Complete 50 modules', 'milestone', 'epic', 2000, '{"modules_completed": 50}'),
('Learning Legend', 'Complete 100 modules', 'milestone', 'legendary', 5000, '{"modules_completed": 100}');

-- Performance Achievements
INSERT INTO public.achievements (name, description, achievement_type, rarity, xp_bonus, criteria) VALUES
('Perfect Score', 'Get 100% on a quiz', 'performance', 'common', 50, '{"perfect_quizzes": 1}'),
('Quiz Master', 'Get 100% on 5 quizzes', 'performance', 'rare', 300, '{"perfect_quizzes": 5}'),
('Perfectionist', 'Get 100% on 10 quizzes', 'performance', 'epic', 750, '{"perfect_quizzes": 10}'),
('Flawless', 'Get 100% on 25 quizzes', 'performance', 'legendary', 2000, '{"perfect_quizzes": 25}'),
('Speed Learner', 'Complete a module in record time', 'performance', 'rare', 400, '{"speed_learner": true}');

-- Company Achievements
INSERT INTO public.achievements (name, description, achievement_type, rarity, xp_bonus, criteria) VALUES
('First Sale', 'Make your first sale!', 'company', 'common', 200, '{"revenue_threshold": 1}'),
('Business Starter', 'Reach $100 in revenue', 'company', 'common', 300, '{"revenue_threshold": 100}'),
('Growing Business', 'Reach $500 in revenue', 'company', 'rare', 500, '{"revenue_threshold": 500}'),
('Business Growth', 'Reach $1,000 in revenue', 'company', 'rare', 750, '{"revenue_threshold": 1000}'),
('Successful Venture', 'Reach $5,000 in revenue', 'company', 'epic', 2000, '{"revenue_threshold": 5000}'),
('Money Maker', 'Reach $10,000 in revenue', 'company', 'epic', 3000, '{"revenue_threshold": 10000}'),
('Tycoon', 'Reach $50,000 in revenue', 'company', 'legendary', 5000, '{"revenue_threshold": 50000}');

-- Engagement Achievements (Streaks)
INSERT INTO public.achievements (name, description, achievement_type, rarity, xp_bonus, criteria) VALUES
('Committed', 'Maintain a 7-day learning streak', 'engagement', 'common', 200, '{"streak_days": 7}'),
('Dedicated', 'Maintain a 14-day learning streak', 'engagement', 'rare', 500, '{"streak_days": 14}'),
('Persistent', 'Maintain a 30-day learning streak', 'engagement', 'epic', 1500, '{"streak_days": 30}'),
('Unstoppable', 'Maintain a 60-day learning streak', 'engagement', 'legendary', 3000, '{"streak_days": 60}');






