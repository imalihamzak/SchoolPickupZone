import NotificationPanel from './NotificationPanel';
import { useNotifications } from '@/lib/hooks/useNotifications';

export default function NotificationsContainer() {
  const {
    notifications,
    markAsRead,
    markAllAsRead,
    unreadCount, // ✅ Make sure it's returned from the hook
  } = useNotifications();

  return (
    <NotificationPanel
      notifications={notifications}
      onMarkAsRead={markAsRead}
      onMarkAllAsRead={markAllAsRead}
      unreadCount={unreadCount}
    />
  );
}
