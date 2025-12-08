import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, X, Check, CheckCheck, Trash2, BookOpen, Sparkles } from 'lucide-react';
import { useNotifications, Notification } from '@/hooks/useNotifications';

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return date.toLocaleDateString();
}

interface NotificationInboxProps {
  childId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationInbox({ childId, isOpen, onClose }: NotificationInboxProps) {
  const navigate = useNavigate();
  const { notifications, loading, unreadCount, markAsRead, markAllAsRead, deleteNotification } = useNotifications(childId);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read if unread
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }

    // Navigate based on notification type
    if (notification.notification_type === 'new_module' && notification.module_id) {
      navigate(`/child/modules/${notification.module_id}`);
      onClose();
    } else if (notification.notification_type === 'achievement') {
      navigate('/child/achievements');
      onClose();
    } else {
      // For other types, just close
      onClose();
    }
  };

  const handleDelete = async (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation();
    setDeletingId(notificationId);
    await deleteNotification(notificationId);
    setDeletingId(null);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'new_module':
        return <BookOpen className="h-5 w-5 text-blue-500" />;
      case 'achievement':
        return <Sparkles className="h-5 w-5 text-yellow-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'new_module':
        return 'bg-blue-50 border-blue-200 hover:bg-blue-100';
      case 'achievement':
        return 'bg-yellow-50 border-yellow-200 hover:bg-yellow-100';
      default:
        return 'bg-gray-50 border-gray-200 hover:bg-gray-100';
    }
  };

  if (!isOpen) return null;

  const unreadNotifications = notifications.filter(n => !n.is_read);
  const readNotifications = notifications.filter(n => n.is_read);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />

      {/* Inbox Panel */}
      <div className="fixed right-0 top-0 h-full w-full sm:w-96 bg-white shadow-2xl z-50 flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-yellow-400 p-4 border-b-4 border-gray-600">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Bell className="h-6 w-6 text-white" />
              <h2 className="text-xl font-bold text-white">Notifications</h2>
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full border-2 border-white">
                  {unreadCount}
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-white" />
            </button>
          </div>

          {unreadNotifications.length > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-sm text-white hover:text-yellow-200 font-semibold flex items-center gap-1"
            >
              <CheckCheck className="h-4 w-4" />
              Mark all as read
            </button>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading notifications...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 font-semibold">No notifications yet</p>
              <p className="text-sm text-gray-500 mt-2">
                You'll see new module announcements here!
              </p>
            </div>
          ) : (
            <div className="p-4">
              {/* Unread Notifications */}
              {unreadNotifications.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">
                    New ({unreadNotifications.length})
                  </h3>
                  <div className="space-y-3">
                    {unreadNotifications.map((notification) => (
                      <div
                        key={notification.id}
                        onClick={() => handleNotificationClick(notification)}
                        className={`${getNotificationColor(notification.notification_type)} border-2 rounded-xl p-4 cursor-pointer transition-all transform hover:scale-[1.02] shadow-md relative`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 mt-1">
                            {getNotificationIcon(notification.notification_type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <h4 className="font-bold text-gray-900 text-sm">
                                {notification.title}
                              </h4>
                              <button
                                onClick={(e) => handleDelete(e, notification.id)}
                                disabled={deletingId === notification.id}
                                className="flex-shrink-0 p-1 text-gray-400 hover:text-red-500 transition-colors"
                              >
                                {deletingId === notification.id ? (
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-500"></div>
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                              </button>
                            </div>
                            <p className="text-sm text-gray-700 mt-1">
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-500 mt-2">
                              {formatTimeAgo(notification.created_at)}
                            </p>
                          </div>
                          <div className="flex-shrink-0">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Read Notifications */}
              {readNotifications.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-gray-500 mb-3 uppercase tracking-wide">
                    Earlier
                  </h3>
                  <div className="space-y-3">
                    {readNotifications.map((notification) => (
                      <div
                        key={notification.id}
                        onClick={() => handleNotificationClick(notification)}
                        className={`${getNotificationColor(notification.notification_type)} border-2 rounded-xl p-4 cursor-pointer transition-all opacity-75 hover:opacity-100 hover:scale-[1.01] shadow-sm relative`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 mt-1">
                            {getNotificationIcon(notification.notification_type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <h4 className="font-semibold text-gray-700 text-sm">
                                {notification.title}
                              </h4>
                              <button
                                onClick={(e) => handleDelete(e, notification.id)}
                                disabled={deletingId === notification.id}
                                className="flex-shrink-0 p-1 text-gray-400 hover:text-red-500 transition-colors"
                              >
                                {deletingId === notification.id ? (
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-500"></div>
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                              </button>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-400 mt-2">
                              {formatTimeAgo(notification.created_at)}
                            </p>
                          </div>
                          <div className="flex-shrink-0">
                            <Check className="h-4 w-4 text-gray-400" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}


