import { useMemo, useState } from 'react';
import { Bell, CheckCircle2, Filter, RefreshCcw, Trash2 } from 'lucide-react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AdminNavBar } from '@/components/navigation/AdminNavBar';
import { useAdminNotifications, AdminNotificationType } from '@/hooks/useAdminNotifications';
import { LoadingAnimation } from '@/components/ui/LoadingAnimation';

type StatusFilter = 'all' | 'unread' | 'read';

const typeLabels: Record<AdminNotificationType, string> = {
  new_module: 'New Module',
  achievement: 'Achievement',
  streak: 'Streak',
  level_up: 'Level Up',
  system: 'System',
};

function AdminNotificationsContent() {
  const { notifications, loading, error, unreadCount, markAsRead, markAllAsRead, deleteNotification, refetch } =
    useAdminNotifications();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [typeFilter, setTypeFilter] = useState<AdminNotificationType | 'all'>('all');
  const [search, setSearch] = useState('');

  const filteredNotifications = useMemo(() => {
    return notifications.filter(notification => {
      if (statusFilter === 'unread' && notification.is_read) return false;
      if (statusFilter === 'read' && !notification.is_read) return false;
      if (typeFilter !== 'all' && notification.notification_type !== typeFilter) return false;
      if (search) {
        const text = `${notification.title} ${notification.message}`.toLowerCase();
        if (!text.includes(search.toLowerCase())) return false;
      }
      return true;
    });
  }, [notifications, statusFilter, typeFilter, search]);

  const renderBadgeColor = (type: AdminNotificationType) => {
    switch (type) {
      case 'new_module':
        return 'bg-blue-500/10 text-blue-300 border border-blue-500/30';
      case 'achievement':
        return 'bg-amber-500/10 text-amber-300 border border-amber-500/30';
      case 'streak':
        return 'bg-green-500/10 text-green-300 border border-green-500/30';
      case 'level_up':
        return 'bg-purple-500/10 text-purple-300 border border-purple-500/30';
      default:
        return 'bg-gray-500/10 text-gray-300 border border-gray-500/30';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white">
      <AdminNavBar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-sm text-gray-400">Admin</p>
            <h1 className="text-3xl font-bold">Notifications</h1>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={refetch}
              className="inline-flex items-center px-3 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 border border-gray-700 text-sm font-medium transition"
            >
              <RefreshCcw className="w-4 h-4 mr-2" />
              Refresh
            </button>
            <button
              onClick={markAllAsRead}
              className="inline-flex items-center px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={unreadCount === 0}
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Mark all read
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <p className="text-sm text-gray-400">Total notifications</p>
            <p className="text-3xl font-bold mt-1">{notifications.length}</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <p className="text-sm text-gray-400">Unread</p>
            <p className="text-3xl font-bold mt-1 text-amber-400">{unreadCount}</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <p className="text-sm text-gray-400">Filters applied</p>
            <p className="text-3xl font-bold mt-1">
              {(statusFilter !== 'all' ? 1 : 0) + (typeFilter !== 'all' ? 1 : 0) + (search ? 1 : 0)}
            </p>
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-4">
          <div className="flex flex-col md:flex-row md:items-center md:space-x-4 space-y-3 md:space-y-0">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value as StatusFilter)}
                className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All</option>
                <option value="unread">Unread</option>
                <option value="read">Read</option>
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <select
                value={typeFilter}
                onChange={e => setTypeFilter(e.target.value as AdminNotificationType | 'all')}
                className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All types</option>
                {Object.entries(typeLabels).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search title or message"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <LoadingAnimation />
          </div>
        ) : error ? (
          <div className="bg-rose-900/30 border border-rose-800 text-rose-100 rounded-xl p-4">
            <p className="font-semibold">Unable to load notifications</p>
            <p className="text-sm text-rose-200 mt-1">{error}</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-10 text-center">
            <Bell className="w-10 h-10 text-gray-500 mx-auto mb-3" />
            <p className="text-lg font-semibold">No notifications</p>
            <p className="text-gray-400 text-sm mt-1">Try adjusting filters or check back later.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredNotifications.map(notification => (
              <div
                key={notification.id}
                className={`border rounded-xl p-4 bg-gray-900 hover:bg-gray-800 transition ${
                  notification.is_read ? 'border-gray-800' : 'border-amber-500/40'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        notification.is_read ? 'bg-gray-800 text-gray-300' : 'bg-amber-500/10 text-amber-300'
                      }`}
                    >
                      <Bell className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${renderBadgeColor(notification.notification_type)}`}>
                          {typeLabels[notification.notification_type]}
                        </span>
                        {!notification.is_read && (
                          <span className="text-amber-300 text-xs font-semibold">Unread</span>
                        )}
                      </div>
                      <h3 className="text-lg font-semibold mt-2">{notification.title}</h3>
                      <p className="text-gray-300 text-sm mt-1">{notification.message}</p>
                      <div className="flex items-center space-x-4 mt-2 text-xs text-gray-400">
                        {notification.child_id && <span>Child ID: {notification.child_id}</span>}
                        {notification.created_at && (
                          <span>
                            Created: {new Date(notification.created_at).toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {!notification.is_read && (
                      <button
                        onClick={() => markAsRead(notification.id)}
                        className="px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-sm font-medium transition"
                      >
                        Mark read
                      </button>
                    )}
                    <button
                      onClick={() => deleteNotification(notification.id)}
                      className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition"
                      title="Delete notification"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminNotificationsPage() {
  return (
    <ProtectedRoute requireRole="admin">
      <AdminNotificationsContent />
    </ProtectedRoute>
  );
}

