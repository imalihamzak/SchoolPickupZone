import { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { Notification } from '@/components/shared/notifications/NotificationPanel';
import {API_BASE_URL, LOCAL_BASE} from "../api/link";

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [fadingIds, setFadingIds] = useState<string[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchLatestNotifications = () => {
    fetch(`${API_BASE_URL}/notifications`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setNotifications(data);
          setUnreadCount(data.filter(n => !n.read).length);
        } else {
          console.error('Expected array of notifications but got:', data);
          setNotifications([]);
          setUnreadCount(0);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch notifications:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    const socket: Socket = io(`${LOCAL_BASE}`);
    socket.emit('register_admin', 'admin');

    const audio = new Audio('/sounds/notification.mp3');
    audio.load();

    // 🔁 Fetch existing notifications
    fetchLatestNotifications();

    // 🔁 Listen for new ones from socket
    socket.on('pickup_event', () => {
      audio.play().catch(err => {
        console.warn('Notification sound failed:', err);
      });

      // ⬇️ Re-fetch the latest list
      fetchLatestNotifications();
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const markAsRead = (id: string) => {
    fetch(`${API_BASE_URL}/notifications/${id}/read`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    }).then(() => {
      setNotifications(current =>
        current.map(n => (n.id === id ? { ...n, read: true } : n))
      );
      setUnreadCount(current => current - 1);

      setFadingIds(current => [...current, id]);
      setTimeout(() => {
        setNotifications(current => current.filter(n => n.id !== id));
        setFadingIds(current => current.filter(i => i !== id));
      }, 1000);
    });
  };

  const markAllAsRead = () => {
    fetch(`${API_BASE_URL}/notifications/mark-all-read`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    }).then(() => {
      const idsToFade = notifications.filter(n => !n.read).map(n => n.id);

      setNotifications(current =>
        current.map(n => ({ ...n, read: true }))
      );
      setUnreadCount(0);

      setFadingIds(current => [...current, ...idsToFade]);
      setTimeout(() => {
        setNotifications(current => current.filter(n => !idsToFade.includes(n.id)));
        setFadingIds(current => current.filter(id => !idsToFade.includes(id)));
      }, 1000);
    });
  };

  const handleAction = (notification: Notification, action: 'approve' | 'deny' | 'reply') => {
    if (action === 'approve' || action === 'deny') {
      setNotifications(current => current.filter(n => n.id !== notification.id));

      if (action === 'approve') {
        const newNotification: Notification = {
          id: notification.id,
          type: 'message',
          title: 'Profile Approved',
          message: `You have approved the profile request for ${notification.message.split(' ')[0]}`,
          timestamp: new Date().toISOString(),
          read: false,
        };

        setNotifications(prev => {
          const exists = prev.some(n => n.id === newNotification.id);
          return exists ? prev : [newNotification, ...prev];
        });
      }
    } else if (action === 'reply') {
      markAsRead(notification.id);
    }
  };

  return {
    notifications,
    loading,
    markAsRead,
    markAllAsRead,
    handleAction,
    unreadCount,
  };
}
