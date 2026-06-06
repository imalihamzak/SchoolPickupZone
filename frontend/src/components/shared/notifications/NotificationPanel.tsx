import { Fragment, useEffect, useMemo, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import {
  Bell,
  Check,
  CheckCheck,
  FileCheck2,
  Inbox,
  MessageSquareText,
  QrCode,
  ShieldAlert,
  ShieldCheck,
  UserRoundCheck,
  X,
} from "lucide-react";
import { format as timeago } from "timeago.js";
import { format as dateFormat } from "date-fns";

export type NotificationType =
  | "profile_request"
  | "message"
  | "qr_scan"
  | "document_review"
  | "safety_alert"
  | "parent_message"
  | "pickup_success"
  | "unauthorized"
  | "invalid_qr"
  | "payment_reminder"
  | "payment_failed"
  | "billing_retry";

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

type NotificationFilter = "all" | "unread";

const NOTIFICATION_DRAWER_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,300&display=swap');

.pz-notify-trigger {
  width: 38px;
  height: 38px;
  border: 1px solid #E2E6EE;
  border-radius: 10px;
  background: #FFFFFF;
  color: #4A5568;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  position: relative;
  cursor: pointer;
  transition: border-color 0.18s ease, background 0.18s ease, color 0.18s ease, transform 0.18s ease;
}

.pz-notify-trigger:hover {
  color: #1B6ECC;
  border-color: rgba(27,110,204,0.36);
  background: #EFF6FF;
  transform: translateY(-1px);
}

.pz-notify-trigger svg {
  width: 18px;
  height: 18px;
  stroke-width: 2.1;
}

.pz-notify-dot {
  position: absolute;
  top: -5px;
  right: -5px;
  min-width: 20px;
  height: 20px;
  padding: 0 5px;
  border-radius: 999px;
  background: #E24B4A;
  color: #FFFFFF;
  border: 2px solid #FFFFFF;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font: 800 10px/1 'Inter', 'Segoe UI', Arial, sans-serif;
  box-shadow: 0 6px 14px rgba(226,75,74,0.24);
}

.pz-notify-dot::before {
  content: "";
  position: absolute;
  inset: -4px;
  border-radius: inherit;
  background: rgba(226,75,74,0.18);
  animation: pzNotifyPulse 1.6s ease-out infinite;
  z-index: -1;
}

@keyframes pzNotifyPulse {
  0% { transform: scale(0.8); opacity: 0.9; }
  100% { transform: scale(1.8); opacity: 0; }
}

.pz-notify-overlay {
  position: fixed;
  inset: 0;
  background: rgba(7,29,59,0.42);
  backdrop-filter: blur(5px);
}

.pz-notify-overlay-enter,
.pz-notify-overlay-leave {
  transition: opacity 0.22s ease;
}

.pz-notify-overlay-enter-from,
.pz-notify-overlay-leave-to {
  opacity: 0;
}

.pz-notify-overlay-enter-to,
.pz-notify-overlay-leave-from {
  opacity: 1;
}

.pz-notify-shell {
  position: fixed;
  inset: 0;
  height: 100dvh;
  overflow: hidden;
}

.pz-notify-panel-wrap {
  pointer-events: none;
  position: fixed;
  inset-y: 0;
  right: 0;
  display: flex;
  min-height: 0;
  max-width: 100%;
  padding-left: 16px;
}

.pz-notify-panel-enter,
.pz-notify-panel-leave {
  transition: transform 0.28s cubic-bezier(.2,.8,.2,1), opacity 0.28s ease;
}

.pz-notify-panel-enter-from,
.pz-notify-panel-leave-to {
  transform: translateX(32px);
  opacity: 0;
}

.pz-notify-panel-enter-to,
.pz-notify-panel-leave-from {
  transform: translateX(0);
  opacity: 1;
}

.pz-notify-panel {
  pointer-events: auto;
  width: min(440px, 100vw);
  height: 100dvh;
  min-height: 0;
  max-height: 100dvh;
  background: #F4F6FA;
  box-shadow: -24px 0 60px rgba(7,29,59,0.18);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  font-family: 'DM Sans', 'Inter', 'Segoe UI', Arial, sans-serif;
  color: #0A1628;
  border-left: 1px solid rgba(226,230,238,0.82);
}

.pz-notify-hero {
  background: #071D3B;
  color: #FFFFFF;
  padding: 22px 22px 18px;
  position: relative;
  overflow: hidden;
}

.pz-notify-hero::after {
  content: "";
  position: absolute;
  width: 220px;
  height: 220px;
  right: -82px;
  top: -92px;
  background: radial-gradient(circle, rgba(45,201,143,0.18) 0%, transparent 64%);
  pointer-events: none;
}

.pz-notify-hero-top {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.pz-notify-kicker {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  color: #2DC98F;
  font: 800 11px/1 'Inter', 'Segoe UI', Arial, sans-serif;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  margin-bottom: 10px;
}

.pz-notify-kicker::before {
  content: "";
  width: 18px;
  height: 2px;
  border-radius: 999px;
  background: currentColor;
}

.pz-notify-title {
  margin: 0;
  font: 800 24px/1.05 'Inter', 'Segoe UI', Arial, sans-serif;
  letter-spacing: 0;
}

.pz-notify-subtitle {
  margin-top: 8px;
  color: rgba(255,255,255,0.62);
  font-size: 13px;
  line-height: 1.5;
}

.pz-notify-close {
  width: 34px;
  height: 34px;
  border: 1px solid rgba(255,255,255,0.13);
  border-radius: 10px;
  background: rgba(255,255,255,0.07);
  color: rgba(255,255,255,0.8);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.18s ease;
}

.pz-notify-close:hover {
  background: rgba(255,255,255,0.13);
  color: #FFFFFF;
}

.pz-notify-summary {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  margin-top: 20px;
}

.pz-notify-summary-item {
  border: 1px solid rgba(255,255,255,0.1);
  background: rgba(255,255,255,0.06);
  border-radius: 12px;
  padding: 10px 11px;
}

.pz-notify-summary-value {
  font: 800 22px/1 'Inter', 'Segoe UI', Arial, sans-serif;
  font-variant-numeric: tabular-nums;
}

.pz-notify-summary-label {
  margin-top: 4px;
  font-size: 11px;
  color: rgba(255,255,255,0.5);
  white-space: nowrap;
}

.pz-notify-toolbar {
  padding: 14px 18px;
  display: flex;
  align-items: center;
  gap: 10px;
  border-bottom: 1px solid #E2E6EE;
  background: #FFFFFF;
}

.pz-notify-tabs {
  flex: 1;
  display: inline-flex;
  gap: 4px;
  padding: 4px;
  border-radius: 11px;
  background: #F4F6FA;
  border: 1px solid #E2E6EE;
}

.pz-notify-tab {
  flex: 1;
  height: 32px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: #8A96A8;
  cursor: pointer;
  font: 800 12px/1 'DM Sans', 'Segoe UI', Arial, sans-serif;
  transition: all 0.18s ease;
}

.pz-notify-tab.active {
  background: #FFFFFF;
  color: #0A1628;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
}

.pz-notify-mark-all {
  height: 40px;
  border: 1px solid #1A9E75;
  border-radius: 10px;
  background: #1A9E75;
  color: #FFFFFF;
  padding: 0 12px;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  cursor: pointer;
  font: 800 12px/1 'DM Sans', 'Segoe UI', Arial, sans-serif;
  transition: all 0.18s ease;
  white-space: nowrap;
}

.pz-notify-mark-all:hover {
  background: #2DC98F;
  border-color: #2DC98F;
  transform: translateY(-1px);
}

.pz-notify-mark-all:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.pz-notify-list {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
  padding: 14px 14px 20px;
  scrollbar-width: thin;
  scrollbar-color: #CAD2DF transparent;
}

.pz-notify-list::-webkit-scrollbar {
  width: 6px;
}

.pz-notify-list::-webkit-scrollbar-thumb {
  background: #CAD2DF;
  border-radius: 999px;
}

.pz-notify-day {
  margin: 12px 4px 8px;
  color: #8A96A8;
  font: 800 11px/1 'Inter', 'Segoe UI', Arial, sans-serif;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.pz-notify-card {
  position: relative;
  display: grid;
  grid-template-columns: 42px minmax(0, 1fr) auto;
  gap: 12px;
  align-items: start;
  padding: 14px;
  border: 1px solid #E2E6EE;
  background: #FFFFFF;
  border-radius: 14px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.04);
  margin-bottom: 10px;
  transition: opacity 0.26s ease, transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease;
}

.pz-notify-card:hover {
  transform: translateY(-1px);
  border-color: rgba(27,110,204,0.28);
  box-shadow: 0 10px 28px rgba(7,29,59,0.08);
}

.pz-notify-card.unread {
  border-color: rgba(26,158,117,0.25);
  background: linear-gradient(135deg, #FFFFFF 0%, #F7FFFC 100%);
}

.pz-notify-card.fading {
  opacity: 0;
  transform: translateX(18px);
}

.pz-notify-card.unread::before {
  content: "";
  position: absolute;
  left: -1px;
  top: 15px;
  bottom: 15px;
  width: 3px;
  border-radius: 999px;
  background: #1A9E75;
}

.pz-notify-icon {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.pz-notify-icon.profile_request {
  background: #E1F5EE;
  color: #1A9E75;
}

.pz-notify-icon.qr_scan {
  background: #EFF6FF;
  color: #1B6ECC;
}

.pz-notify-icon.document_review {
  background: #E1F5EE;
  color: #1A9E75;
}

.pz-notify-icon.safety_alert {
  background: #FDEAEA;
  color: #E24B4A;
}

.pz-notify-icon.parent_message {
  background: #E1F5EE;
  color: #1A9E75;
}

.pz-notify-icon.pickup_success {
  background: #E1F5EE;
  color: #1A9E75;
}

.pz-notify-icon.message {
  background: #FEF3DC;
  color: #EF9F27;
}

.pz-notify-icon.unauthorized {
  background: #FDEAEA;
  color: #E24B4A;
}

.pz-notify-icon.invalid_qr {
  background: #FEF3DC;
  color: #B45309;
}

.pz-notify-icon.payment_reminder,
.pz-notify-icon.billing_retry {
  background: #EFF6FF;
  color: #1B6ECC;
}

.pz-notify-icon.payment_failed {
  background: #FDEAEA;
  color: #E24B4A;
}

.pz-notify-icon svg {
  width: 19px;
  height: 19px;
  stroke-width: 2.25;
}

.pz-notify-card-main {
  min-width: 0;
}

.pz-notify-card-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.pz-notify-card-title {
  color: #0A1628;
  font-size: 13.5px;
  font-weight: 800;
  line-height: 1.35;
}

.pz-notify-card.read .pz-notify-card-title {
  color: #4A5568;
}

.pz-notify-card-time {
  color: #8A96A8;
  font-size: 11px;
  white-space: nowrap;
  margin-top: 2px;
}

.pz-notify-message {
  color: #4A5568;
  font-size: 12.5px;
  line-height: 1.55;
  margin-top: 6px;
  word-break: break-word;
}

.pz-notify-message strong {
  color: #0A1628;
}

.pz-notify-type {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: 10px;
  padding: 4px 8px;
  border-radius: 999px;
  background: #F4F6FA;
  color: #8A96A8;
  font-size: 11px;
  font-weight: 800;
}

.pz-notify-read-btn {
  width: 30px;
  height: 30px;
  border: 1px solid #E2E6EE;
  border-radius: 9px;
  background: #FFFFFF;
  color: #8A96A8;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.18s ease;
}

.pz-notify-read-btn:hover {
  background: #E1F5EE;
  border-color: rgba(26,158,117,0.25);
  color: #1A9E75;
}

.pz-notify-empty {
  min-height: 360px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 10px;
  color: #8A96A8;
  padding: 32px 24px;
}

.pz-notify-empty-icon {
  width: 62px;
  height: 62px;
  border-radius: 18px;
  background: #FFFFFF;
  border: 1px solid #E2E6EE;
  color: #1A9E75;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 10px 28px rgba(7,29,59,0.06);
}

.pz-notify-empty-title {
  color: #0A1628;
  font-weight: 800;
  font-size: 15px;
}

.pz-notify-empty-copy {
  max-width: 280px;
  font-size: 13px;
  line-height: 1.55;
}

@media (max-width: 520px) {
  .pz-notify-panel-wrap {
    padding-left: 0;
  }
  .pz-notify-panel {
    width: 100vw;
  }
  .pz-notify-summary {
    grid-template-columns: 1fr;
  }
  .pz-notify-toolbar {
    align-items: stretch;
    flex-direction: column;
  }
  .pz-notify-card {
    grid-template-columns: 38px minmax(0, 1fr);
  }
  .pz-notify-read-btn {
    grid-column: 2;
    justify-self: start;
  }
}

@media (prefers-reduced-motion: reduce) {
  .pz-notify-dot::before {
    animation: none;
  }
}
`;

export default function NotificationPanel({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  unreadCount,
}: NotificationPanelProps) {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<NotificationFilter>("all");
  const [fadingNotifications, setFadingNotifications] = useState<string[]>([]);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, []);

  const sortedNotifications = useMemo(
    () =>
      [...notifications].sort((a, b) => {
        if (a.read === b.read) {
          return getTimestamp(b.timestamp) - getTimestamp(a.timestamp);
        }
        return a.read ? 1 : -1;
      }),
    [notifications]
  );

  const visibleNotifications = useMemo(
    () => sortedNotifications.filter((notification) => filter === "all" || !notification.read),
    [filter, sortedNotifications]
  );

  const grouped = useMemo(
    () =>
      visibleNotifications.reduce(
        (acc, notification) => {
          const day = getDayKey(notification.timestamp);
          if (!acc[day]) acc[day] = [];
          acc[day].push(notification);
          return acc;
        },
        {} as Record<string, Notification[]>
      ),
    [visibleNotifications]
  );

  const handleMarkAll = () => {
    const unread = notifications.filter((notification) => !notification.read).map((notification) => notification.id);
    setFadingNotifications(unread);
    setTimeout(() => {
      onMarkAllAsRead();
      setFadingNotifications([]);
    }, 260);
  };

  const handleMarkSingle = (id: string) => {
    setFadingNotifications([id]);
    setTimeout(() => {
      onMarkAsRead(id);
      setFadingNotifications([]);
    }, 260);
  };

  return (
    <>
      <style>{NOTIFICATION_DRAWER_CSS}</style>
      <button type="button" onClick={() => setOpen(true)} className="pz-notify-trigger">
        <span className="sr-only">View notifications</span>
        <Bell aria-hidden="true" />
        {unreadCount > 0 && (
          <span className="pz-notify-dot">{unreadCount > 9 ? "9+" : unreadCount}</span>
        )}
      </button>

      <Transition.Root show={open} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={setOpen}>
          <Transition.Child
            as={Fragment}
            enter="pz-notify-overlay-enter"
            enterFrom="pz-notify-overlay-enter-from"
            enterTo="pz-notify-overlay-enter-to"
            leave="pz-notify-overlay-leave"
            leaveFrom="pz-notify-overlay-leave-from"
            leaveTo="pz-notify-overlay-leave-to"
          >
            <div className="pz-notify-overlay" />
          </Transition.Child>

          <div className="pz-notify-shell">
            <div className="pz-notify-panel-wrap">
              <Transition.Child
                as={Fragment}
                enter="pz-notify-panel-enter"
                enterFrom="pz-notify-panel-enter-from"
                enterTo="pz-notify-panel-enter-to"
                leave="pz-notify-panel-leave"
                leaveFrom="pz-notify-panel-leave-from"
                leaveTo="pz-notify-panel-leave-to"
              >
                <Dialog.Panel className="pz-notify-panel">
                  <div className="pz-notify-hero">
                    <div className="pz-notify-hero-top">
                      <div>
                        <div className="pz-notify-kicker">Alerts</div>
                        <Dialog.Title className="pz-notify-title">Notifications</Dialog.Title>
                        <div className="pz-notify-subtitle">
                          {unreadCount === 0
                            ? "You are all caught up. New pickup activity will appear here."
                            : `${unreadCount} unread update${unreadCount === 1 ? "" : "s"} need attention.`}
                        </div>
                      </div>
                      <button type="button" className="pz-notify-close" onClick={() => setOpen(false)}>
                        <span className="sr-only">Close panel</span>
                        <X size={18} aria-hidden="true" />
                      </button>
                    </div>

                    <div className="pz-notify-summary">
                      <div className="pz-notify-summary-item">
                        <div className="pz-notify-summary-value">{notifications.length}</div>
                        <div className="pz-notify-summary-label">Total</div>
                      </div>
                      <div className="pz-notify-summary-item">
                        <div className="pz-notify-summary-value">{unreadCount}</div>
                        <div className="pz-notify-summary-label">Unread</div>
                      </div>
                      <div className="pz-notify-summary-item">
                        <div className="pz-notify-summary-value">{notifications.length - unreadCount}</div>
                        <div className="pz-notify-summary-label">Cleared</div>
                      </div>
                    </div>
                  </div>

                  <div className="pz-notify-toolbar">
                    <div className="pz-notify-tabs" aria-label="Notification filters">
                      <button
                        type="button"
                        className={`pz-notify-tab ${filter === "all" ? "active" : ""}`}
                        onClick={() => setFilter("all")}
                      >
                        All
                      </button>
                      <button
                        type="button"
                        className={`pz-notify-tab ${filter === "unread" ? "active" : ""}`}
                        onClick={() => setFilter("unread")}
                      >
                        Unread
                      </button>
                    </div>
                    <button
                      type="button"
                      className="pz-notify-mark-all"
                      onClick={handleMarkAll}
                      disabled={unreadCount === 0}
                    >
                      <CheckCheck size={15} aria-hidden="true" />
                      Mark all
                    </button>
                  </div>

                  <div className="pz-notify-list">
                    {Object.entries(grouped).length === 0 ? (
                      <EmptyState filter={filter} />
                    ) : (
                      Object.entries(grouped).map(([day, items]) => (
                        <div key={day}>
                          <div className="pz-notify-day">{formatDayLabel(day)}</div>
                          {items.map((notification) => (
                            <NotificationCard
                              key={notification.id}
                              notification={notification}
                              fading={fadingNotifications.includes(notification.id)}
                              onMarkSingle={handleMarkSingle}
                            />
                          ))}
                        </div>
                      ))
                    )}
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition.Root>
    </>
  );
}

function NotificationCard({
  notification,
  fading,
  onMarkSingle,
}: {
  notification: Notification;
  fading: boolean;
  onMarkSingle: (id: string) => void;
}) {
  const Icon = iconForType(notification.type);

  return (
    <article
      className={`pz-notify-card ${notification.read ? "read" : "unread"} ${fading ? "fading" : ""}`}
    >
      <div className={`pz-notify-icon ${notification.type}`}>
        <Icon aria-hidden="true" />
      </div>
      <div className="pz-notify-card-main">
        <div className="pz-notify-card-head">
          <div className="pz-notify-card-title">{notification.title}</div>
          <div className="pz-notify-card-time">{formatRelative(notification.timestamp)}</div>
        </div>
        <div className="pz-notify-message">{notification.message}</div>
        <div className="pz-notify-type">
          <ShieldCheck size={12} aria-hidden="true" />
          {labelForType(notification.type)}
        </div>
      </div>
      {!notification.read && (
        <button
          type="button"
          onClick={() => onMarkSingle(notification.id)}
          className="pz-notify-read-btn"
          title="Mark as read"
        >
          <Check size={15} aria-hidden="true" />
          <span className="sr-only">Mark as read</span>
        </button>
      )}
    </article>
  );
}

function EmptyState({ filter }: { filter: NotificationFilter }) {
  return (
    <div className="pz-notify-empty">
      <div className="pz-notify-empty-icon">
        <Inbox size={24} aria-hidden="true" />
      </div>
      <div className="pz-notify-empty-title">
        {filter === "unread" ? "No unread notifications" : "No notifications yet"}
      </div>
      <div className="pz-notify-empty-copy">
        {filter === "unread"
          ? "Every visible update has already been handled."
          : "Pickup scan alerts, profile requests, and admin messages will show up here."}
      </div>
    </div>
  );
}

function iconForType(type: NotificationType) {
  if (type === "profile_request") return UserRoundCheck;
  if (type === "qr_scan") return QrCode;
  if (type === "document_review") return FileCheck2;
  if (type === "safety_alert") return ShieldAlert;
  if (type === "parent_message") return MessageSquareText;
  if (type === "pickup_success") return ShieldCheck;
  if (type === "unauthorized" || type === "invalid_qr") return ShieldAlert;
  if (type === "payment_failed") return ShieldAlert;
  return MessageSquareText;
}

function labelForType(type: NotificationType) {
  if (type === "profile_request") return "Profile request";
  if (type === "qr_scan") return "QR scan";
  if (type === "document_review") return "Document review";
  if (type === "safety_alert") return "Safety alert";
  if (type === "parent_message") return "Parent message";
  if (type === "pickup_success") return "Pickup update";
  if (type === "unauthorized") return "Unauthorized scan";
  if (type === "invalid_qr") return "Invalid QR";
  if (type === "payment_reminder") return "Payment reminder";
  if (type === "payment_failed") return "Payment failed";
  if (type === "billing_retry") return "Billing retry";
  return "Message";
}

function getTimestamp(value: string) {
  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function getDayKey(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return dateFormat(new Date(), "yyyy-MM-dd");
  return dateFormat(date, "yyyy-MM-dd");
}

function formatDayLabel(day: string) {
  const today = dateFormat(new Date(), "yyyy-MM-dd");
  const yesterday = dateFormat(new Date(Date.now() - 86400000), "yyyy-MM-dd");
  if (day === today) return "Today";
  if (day === yesterday) return "Yesterday";
  return dateFormat(new Date(day), "EEEE, MMM d");
}

function formatRelative(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Just now";
  return timeago(value);
}
