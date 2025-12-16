import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export type AdminNotificationType = 'new_module' | 'achievement' | 'streak' | 'level_up' | 'system';

export interface AdminNotification {
  id: string;
  child_id: string | null;
  notification_type: AdminNotificationType;
  title: string;
  message: string;
  module_id: string | null;
  is_read: boolean;
  read_at: string | null;
  created_at?: string;
  metadata: Record<string, any> | null;
}

export function useAdminNotifications() {
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (fetchError) throw fetchError;

      setNotifications(data || []);
      setUnreadCount(data?.filter(n => !n.is_read).length || 0);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load notifications';
      console.error('Failed to fetch admin notifications:', err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const markAsRead = async (notificationId: string) => {
    try {
      const readTimestamp = new Date().toISOString();
      const { error: updateError } = await supabase
        .from('notifications')
        .update({ is_read: true, read_at: readTimestamp })
        .eq('id', notificationId);

      if (updateError) throw updateError;

      setNotifications(prev =>
        prev.map(n => (n.id === notificationId ? { ...n, is_read: true, read_at: readTimestamp } : n))
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to mark as read';
      console.error('Failed to mark notification as read:', err);
      setError(errorMessage);
    }
  };

  const markAllAsRead = async () => {
    try {
      const readTimestamp = new Date().toISOString();
      const { error: updateError } = await supabase
        .from('notifications')
        .update({ is_read: true, read_at: readTimestamp })
        .eq('is_read', false);

      if (updateError) throw updateError;

      setNotifications(prev => prev.map(n => ({ ...n, is_read: true, read_at: readTimestamp })));
      setUnreadCount(0);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to mark all as read';
      console.error('Failed to mark all notifications as read:', err);
      setError(errorMessage);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const deletedNotification = notifications.find(n => n.id === notificationId);

      const { error: deleteError } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (deleteError) throw deleteError;

      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      if (deletedNotification && !deletedNotification.is_read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete notification';
      console.error('Failed to delete notification:', err);
      setError(errorMessage);
    }
  };

  useEffect(() => {
    fetchNotifications();

    const channel = supabase
      .channel('admin-notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications' },
        payload => {
          const newNotification = payload.new as AdminNotification;
          setNotifications(prev => [newNotification, ...prev].slice(0, 100));
          if (!newNotification.is_read) {
            setUnreadCount(prev => prev + 1);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'notifications' },
        payload => {
          const updated = payload.new as AdminNotification;
          setNotifications(prev => prev.map(n => (n.id === updated.id ? updated : n)));
          if (updated.is_read) {
            setUnreadCount(prev => Math.max(0, prev - 1));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchNotifications]);

  return {
    notifications,
    loading,
    error,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refetch: fetchNotifications,
  };
}

