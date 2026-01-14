-- Add 'sale' to notification_type enum for product sale notifications
-- Drop and recreate the check constraint to include 'sale' type
ALTER TABLE public.notifications 
DROP CONSTRAINT IF EXISTS notifications_notification_type_check;

ALTER TABLE public.notifications 
ADD CONSTRAINT notifications_notification_type_check 
CHECK (notification_type IN ('new_module', 'achievement', 'streak', 'level_up', 'system', 'sale'));

-- Allow inserting notifications (needed for sale notifications from application)
CREATE POLICY "Allow insert notifications for sales"
  ON public.notifications
  FOR INSERT
  WITH CHECK (true);
