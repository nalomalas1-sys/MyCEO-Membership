-- Row Level Security (RLS) Policies
-- Enable RLS on all tables

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.children ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.child_module_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.child_lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.child_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.module_prerequisites ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view their own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

-- Parents policies
CREATE POLICY "Parents can view their own data"
  ON public.parents FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Parents can update their own data"
  ON public.parents FOR UPDATE
  USING (user_id = auth.uid());

-- Children policies
CREATE POLICY "Parents can view their own children"
  ON public.children FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.parents
      WHERE parents.id = children.parent_id
      AND parents.user_id = auth.uid()
    )
  );

CREATE POLICY "Parents can insert their own children"
  ON public.children FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.parents
      WHERE parents.id = children.parent_id
      AND parents.user_id = auth.uid()
    )
  );

CREATE POLICY "Parents can update their own children"
  ON public.children FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.parents
      WHERE parents.id = children.parent_id
      AND parents.user_id = auth.uid()
    )
  );

-- Children can view their own data (via access code session)
-- This will be handled by application logic, not RLS
-- RLS allows authenticated users to view children they own

-- Modules policies (published modules are public, unpublished only for admins)
CREATE POLICY "Anyone can view published modules"
  ON public.modules FOR SELECT
  USING (is_published = true);

CREATE POLICY "Admins can view all modules"
  ON public.modules FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can insert modules"
  ON public.modules FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can update modules"
  ON public.modules FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Lessons policies (follow module visibility)
CREATE POLICY "Anyone can view lessons of published modules"
  ON public.lessons FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.modules
      WHERE modules.id = lessons.module_id
      AND modules.is_published = true
    )
  );

CREATE POLICY "Admins can view all lessons"
  ON public.lessons FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can manage lessons"
  ON public.lessons FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Quiz questions (same as lessons)
CREATE POLICY "Anyone can view quiz questions of published modules"
  ON public.quiz_questions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.lessons
      JOIN public.modules ON modules.id = lessons.module_id
      WHERE lessons.id = quiz_questions.lesson_id
      AND modules.is_published = true
    )
  );

CREATE POLICY "Admins can manage quiz questions"
  ON public.quiz_questions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Activities policies
CREATE POLICY "Parents can view activities of their children"
  ON public.activities FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.children
      JOIN public.parents ON parents.id = children.parent_id
      WHERE children.id = activities.child_id
      AND parents.user_id = auth.uid()
    )
  );

CREATE POLICY "System can insert activities"
  -- Activities are inserted by application logic
  -- This policy allows authenticated users to insert (will be restricted by application)
  ON public.activities FOR INSERT
  WITH CHECK (true);

-- Child module progress policies
CREATE POLICY "Parents can view progress of their children"
  ON public.child_module_progress FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.children
      JOIN public.parents ON parents.id = children.parent_id
      WHERE children.id = child_module_progress.child_id
      AND parents.user_id = auth.uid()
    )
  );

CREATE POLICY "System can manage child module progress"
  ON public.child_module_progress FOR ALL
  USING (true); -- Application logic will restrict this

-- Child lesson progress policies
CREATE POLICY "Parents can view lesson progress of their children"
  ON public.child_lesson_progress FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.children
      JOIN public.parents ON parents.id = children.parent_id
      WHERE children.id = child_lesson_progress.child_id
      AND parents.user_id = auth.uid()
    )
  );

CREATE POLICY "System can manage child lesson progress"
  ON public.child_lesson_progress FOR ALL
  USING (true);

-- Achievements policies (public read, admin write)
CREATE POLICY "Anyone can view achievements"
  ON public.achievements FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage achievements"
  ON public.achievements FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Child achievements policies
CREATE POLICY "Parents can view achievements of their children"
  ON public.child_achievements FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.children
      JOIN public.parents ON parents.id = children.parent_id
      WHERE children.id = child_achievements.child_id
      AND parents.user_id = auth.uid()
    )
  );

CREATE POLICY "System can manage child achievements"
  ON public.child_achievements FOR ALL
  USING (true);

-- Companies policies
CREATE POLICY "Parents can view companies of their children"
  ON public.companies FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.children
      JOIN public.parents ON parents.id = children.parent_id
      WHERE children.id = companies.child_id
      AND parents.user_id = auth.uid()
    )
  );

CREATE POLICY "System can manage companies"
  ON public.companies FOR ALL
  USING (true);

-- Company transactions policies
CREATE POLICY "Parents can view transactions of their children's companies"
  ON public.company_transactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.companies
      JOIN public.children ON children.id = companies.child_id
      JOIN public.parents ON parents.id = children.parent_id
      WHERE companies.id = company_transactions.company_id
      AND parents.user_id = auth.uid()
    )
  );

CREATE POLICY "System can manage company transactions"
  ON public.company_transactions FOR ALL
  USING (true);

-- Subscriptions policies
CREATE POLICY "Parents can view their own subscriptions"
  ON public.subscriptions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.parents
      WHERE parents.id = subscriptions.parent_id
      AND parents.user_id = auth.uid()
    )
  );

CREATE POLICY "System can manage subscriptions"
  ON public.subscriptions FOR ALL
  USING (true);

-- Marketplace items policies
CREATE POLICY "Anyone can view available marketplace items"
  ON public.marketplace_items FOR SELECT
  USING (status = 'available');

CREATE POLICY "Children can view their own listings"
  ON public.marketplace_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.children
      WHERE children.id = marketplace_items.seller_child_id
      -- Application logic will verify child session
    )
  );

CREATE POLICY "System can manage marketplace items"
  ON public.marketplace_items FOR ALL
  USING (true);

-- Marketplace purchases policies
CREATE POLICY "Parents can view purchases of their children"
  ON public.marketplace_purchases FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.children
      JOIN public.parents ON parents.id = children.parent_id
      WHERE children.id = marketplace_purchases.buyer_child_id
      AND parents.user_id = auth.uid()
    )
  );

CREATE POLICY "System can manage marketplace purchases"
  ON public.marketplace_purchases FOR ALL
  USING (true);

-- Module prerequisites policies (same as modules)
CREATE POLICY "Anyone can view prerequisites of published modules"
  ON public.module_prerequisites FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.modules
      WHERE modules.id = module_prerequisites.module_id
      AND modules.is_published = true
    )
  );

CREATE POLICY "Admins can manage module prerequisites"
  ON public.module_prerequisites FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );





