import { base44 } from '@/api/base44Client';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';

const notificationIcons = {
  new_conversation_assigned: '📬',
  conversation_transferred_to_me: '↩️',
  sla_warning: '⚠️',
  sla_breach: '🚨',
  queue_full: '📊',
  all_agents_offline: '🚫',
  supervisor_mention: '@',
  new_message: '💬',
};

export default function NotificationPanel({ notifications, onClose }) {
  const markAsRead = async (notificationId) => {
    await base44.entities.Notification.update(notificationId, { is_read: true });
  };

  const markAllAsRead = async () => {
    for (const notif of notifications) {
      if (!notif.is_read) {
        await base44.entities.Notification.update(notif.id, { is_read: true });
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-end">
      <div className="w-96 h-screen bg-card shadow-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="font-bold">Notifications</h2>
          <button onClick={onClose}>
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto divide-y">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <p>No new notifications</p>
            </div>
          ) : (
            notifications.map(notif => (
              <div
                key={notif.id}
                className="p-4 hover:bg-muted transition-colors cursor-pointer"
                onClick={() => markAsRead(notif.id)}
              >
                <div className="flex items-start gap-3">
                  <span className="text-xl shrink-0">
                    {notificationIcons[notif.type] || '📢'}
                  </span>

                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">{notif.title}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {notif.message}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {formatDistanceToNow(new Date(notif.created_date), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>

                  {!notif.is_read && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full shrink-0 mt-1" />
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="border-t p-4">
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={markAllAsRead}
            >
              Mark all as read
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}