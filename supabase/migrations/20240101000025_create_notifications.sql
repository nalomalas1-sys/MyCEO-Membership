-- Create notifications table for children
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL CHECK (notification_type IN ('new_module', 'achievement', 'streak', 'level_up', 'system')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  module_id UUID REFERENCES public.modules(id) ON DELETE CASCADE,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB -- Additional data like achievement_id, etc.
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_child_id ON public.notifications(child_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_module_id ON public.notifications(module_id);

-- Function to create notifications for all children when a module is published
CREATE OR REPLACE FUNCTION notify_children_new_module()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create notifications when a module is being published (is_published changes from false to true)
  IF NEW.is_published = true AND (OLD.is_published = false OR OLD.is_published IS NULL) THEN
    -- Insert notification for all children
    INSERT INTO public.notifications (child_id, notification_type, title, message, module_id)
    SELECT 
      c.id,
      'new_module',
      'New Module Available! 🎉',
      'A new module "' || NEW.title || '" is now available. Start learning and earn XP!',
      NEW.id
    FROM public.children c
    WHERE c.deleted_at IS NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically create notifications when modules are published
CREATE TRIGGER trigger_notify_new_module
  AFTER UPDATE OF is_published ON public.modules
  FOR EACH ROW
  WHEN (NEW.is_published = true AND (OLD.is_published = false OR OLD.is_published IS NULL))
  EXECUTE FUNCTION notify_children_new_module();

-- RLS Policies for notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Children can view their own notifications
CREATE POLICY "Children can view their own notifications"
  ON public.notifications
  FOR SELECT
  USING (
    child_id IN (
      SELECT id FROM public.children 
      WHERE access_code = current_setting('request.jwt.claims', true)::json->>'access_code'
      OR id::text = current_setting('request.jwt.claims', true)::json->>'child_id'
    )
  );

-- Children can update their own notifications (mark as read)
CREATE POLICY "Children can update their own notifications"
  ON public.notifications
  FOR UPDATE
  USING (
    child_id IN (
      SELECT id FROM public.children 
      WHERE access_code = current_setting('request.jwt.claims', true)::json->>'access_code'
      OR id::text = current_setting('request.jwt.claims', true)::json->>'child_id'
    )
  );

-- Allow anonymous access for child sessions (using access_code from localStorage)
-- This is needed because children don't use Supabase Auth
CREATE POLICY "Allow anonymous child notification access"
  ON public.notifications
  FOR SELECT
  USING (true); -- We'll filter by child_id in the application layer

CREATE POLICY "Allow anonymous child notification update"
  ON public.notifications
  FOR UPDATE
  USING (true); -- We'll filter by child_id in the application layer


