import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, BellIcon, CheckIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import { format as timeago } from 'timeago.js';
import { format as dateFormat } from 'date-fns';

export type NotificationType = 'profile_request' | 'message' | 'qr_scan';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

interface NotificationPanelProps {
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  unreadCount: number;
}

export default function NotificationPanel({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  unreadCount,
}: NotificationPanelProps) {
  const [open, setOpen] = useState(false);
  const [fadingNotifications, setFadingNotifications] = useState<string[]>([]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, []);

  const handleMarkAll = () => {
    const unread = notifications.filter(n => !n.read).map(n => n.id);
    setFadingNotifications(unread);
    setTimeout(() => {
      onMarkAllAsRead();
      setFadingNotifications([]);
    }, 300);
  };

  const handleMarkSingle = (id: string) => {
    setFadingNotifications([id]);
    setTimeout(() => {
      onMarkAsRead(id);
      setFadingNotifications([]);
    }, 300);
  };

  const getNotificationIcon = () => (
    <div className="flex-shrink-0 rounded-full bg-purple-100 p-2">
      <BellIcon className="h-6 w-6 text-purple-600" />
    </div>
  );

  // Sort unread on top, then by newest first
  const sortedNotifications = [...notifications].sort((a, b) => {
    if (a.read === b.read) {
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    }
    return a.read ? 1 : -1;
  });

  // Group by day (yyyy-MM-dd)
  const grouped = sortedNotifications.reduce((acc, noti) => {
    const day = dateFormat(new Date(noti.timestamp), 'yyyy-MM-dd');
    if (!acc[day]) acc[day] = [];
    acc[day].push(noti);
    return acc;
  }, {} as Record<string, Notification[]>);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="relative p-2 text-gray-400 hover:text-gray-500 focus:outline-none"
      >
        <span className="sr-only">View notifications</span>
        <BellIcon className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 flex h-5 w-5 -mt-1 -mr-1">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-5 w-5 bg-red-500 text-xs text-white items-center justify-center font-medium">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          </span>
        )}
      </button>

      <Transition.Root show={open} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={setOpen}>
          <Transition.Child
            as={Fragment}
            enter="ease-in-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in-out duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-30 transition-opacity" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-hidden">
            <div className="absolute inset-0 overflow-hidden">
              <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
                <Transition.Child
                  as={Fragment}
                  enter="transform transition ease-in-out duration-300"
                  enterFrom="translate-x-full"
                  enterTo="translate-x-0"
                  leave="transform transition ease-in-out duration-300"
                  leaveFrom="translate-x-0"
                  leaveTo="translate-x-full"
                >
                  <Dialog.Panel className="pointer-events-auto w-screen max-w-md">
                    <div className="flex h-full flex-col overflow-y-scroll bg-white shadow-xl">
                      <div className="bg-indigo-600 py-6 px-4 sm:px-6">
                        <div className="flex items-center justify-between">
                          <Dialog.Title className="text-lg font-medium text-white">
                            Notifications
                          </Dialog.Title>
                          <div className="flex items-center space-x-4">
                            {unreadCount > 0 && (
                              <button
                                type="button"
                                className="rounded-md bg-indigo-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-800"
                                onClick={handleMarkAll}
                              >
                                Mark all as read
                              </button>
                            )}
                            <button
                              type="button"
                              className="rounded-md bg-indigo-600 p-1 text-white hover:bg-indigo-700"
                              onClick={() => setOpen(false)}
                            >
                              <span className="sr-only">Close panel</span>
                              <XMarkIcon className="h-6 w-6" />
                            </button>
                          </div>
                        </div>
                        <div className="mt-1 text-sm text-indigo-100">
                          {unreadCount === 0
                            ? "You have no new notifications"
                            : `You have ${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`}
                        </div>
                      </div>

                      <ul className="divide-y divide-gray-200 overflow-y-auto">
                        {Object.entries(grouped).length === 0 ? (
                          <li className="p-4 text-center text-gray-500">No notifications</li>
                        ) : (
                          Object.entries(grouped).map(([day, items]) => (
                            <div key={day}>
                              <div className="bg-gray-50 text-gray-500 text-sm px-4 py-2">
                                {day === dateFormat(new Date(), 'yyyy-MM-dd')
                                  ? 'Today'
                                  : dateFormat(new Date(day), 'eeee, MMM d')}
                              </div>
                              {items.map((notification) => (
                                <li
                                  key={notification.id}
                                  className={cn(
                                    "p-4 hover:bg-gray-50 transition-opacity duration-300",
                                    notification.read ? "opacity-60" : "bg-blue-50",
                                    fadingNotifications.includes(notification.id) && "opacity-0"
                                  )}
                                >
                                  <div className="flex items-start space-x-4">
                                    {getNotificationIcon()}
                                    <div className="flex-1 min-w-0">
                                      <div className="flex justify-between">
                                        <p className={cn(
                                          "text-sm font-medium text-gray-900",
                                          !notification.read && "font-semibold"
                                        )}>
                                          {notification.title}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                          {timeago(notification.timestamp)}
                                        </p>
                                      </div>
                                      <p className="mt-1 text-sm text-gray-600 whitespace-pre-line"   dangerouslySetInnerHTML={{ __html: notification.message }}
                                      >

</p>



                                    </div>
                                    {!notification.read && (
                                      <button
                                        onClick={() => handleMarkSingle(notification.id)}
                                        className="flex-shrink-0 text-gray-400 hover:text-gray-500"
                                        title="Mark as read"
                                      >
                                        <CheckIcon className="h-5 w-5" />
                                      </button>
                                    )}
                                  </div>
                                </li>
                              ))}
                            </div>
                          ))
                        )}
                      </ul>
                    </div>
                  </Dialog.Panel>
                </Transition.Child>
              </div>
            </div>
          </div>
        </Dialog>
      </Transition.Root>
    </>
  );
}
