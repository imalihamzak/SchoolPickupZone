import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  ChartPieIcon,
  UsersIcon,
  QrCodeIcon,
  ClockIcon,
  Bars3Icon,
  XMarkIcon,
  CreditCardIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  BuildingOfficeIcon,
  UserGroupIcon,
  ClipboardDocumentListIcon,
  LockClosedIcon,
  EnvelopeIcon,
} from "@heroicons/react/24/outline";
import { toast } from '@/components/ui/toast';
import { fetchWithBlockHandler } from '@/utils/fetchWithBlockHandler';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

import { NotificationsContainer } from "@/components/shared/notifications";
// import { UserManagementMenu } from "@/components/shared/menus";
import { API_BASE_URL, LOCAL_BASE } from "@/lib/api/link";
// import { useNotifications } from "@/lib/hooks/useNotifications";

type SidebarItem = {
  name: string;
  icon: typeof ChartPieIcon;
  href: string;
};

type FeatureToggleKey =
  | "qr_verification"
  | "guardian_management"
  | "pickup_logs"
  | "analytics"
  | "document_uploads"
  | "notifications"
  | "device_authorization";

type FeatureToggles = Partial<Record<FeatureToggleKey, boolean>>;

type PlanOption = {
  id: number;
  name: string;
  price: number;
  monthly_price?: number;
  yearly_price?: number;
  billing_interval: string;
};

type AdminLayoutCache = {
  user: any;
  subscriptionStatus: string | null;
  schoolStatus: string | null;
  gracePeriodDays: number;
  subscriptionEndDate: string | null;
  gracePeriodEndsAt: string | null;
  cancelAtPeriodEnd: boolean;
  accountAge: number;
  plans: PlanOption[];
  selectedPlanId: number | null;
  isBlocked: boolean;
  featureToggles: FeatureToggles | null;
};

let adminLayoutCache: AdminLayoutCache | null = null;

function hasPaidPeriodAccess(
  subscriptionStatus: string | null,
  cancelAtPeriodEnd: boolean,
  subscriptionEndDate: string | null
) {
  return (
    subscriptionStatus === "Cancelled" &&
    cancelAtPeriodEnd &&
    Boolean(subscriptionEndDate) &&
    new Date(subscriptionEndDate as string).getTime() >= Date.now()
  );
}

function hasPastDueGraceAccess(subscriptionStatus: string | null, gracePeriodEndsAt: string | null) {
  return (
    subscriptionStatus === "Expiring Soon" &&
    Boolean(gracePeriodEndsAt) &&
    new Date(gracePeriodEndsAt as string).getTime() >= Date.now()
  );
}

const parentNavigation: SidebarItem[] = [
  { name: "Dashboard", href: "/parent", icon: ChartPieIcon },
  { name: "Profiles", href: "/parent/profiles", icon: UsersIcon },
  { name: "Documents", href: "/parent/documents", icon: ClipboardDocumentListIcon },
  { name: "Second Parent", href: "/parent/sub-parents", icon: UserGroupIcon },
  { name: "QR Codes", href: "/parent/qr-codes", icon: QrCodeIcon },
];

const adminNavigation: SidebarItem[] = [
  { name: "Dashboard", href: "/admin", icon: ChartPieIcon },
  { name: "Profiles", href: "/admin/profiles", icon: UsersIcon },
  { name: "Documents", href: "/admin/documents", icon: ClipboardDocumentListIcon },
  { name: "Users", href: "/admin/users", icon: UserGroupIcon },
  { name: "QR Codes", href: "/admin/qr-codes", icon: QrCodeIcon },
  { name: "Activity", href: "/admin/activity", icon: ClockIcon },
  { name: "Scanner", href: "/admin/scanner", icon: QrCodeIcon },
  { name: "Duty Roster", href: "/admin/duty-roster", icon: ClipboardDocumentListIcon },
  { name: "Billing", href: "/admin/billing", icon: CreditCardIcon },
];

const superAdminNavigation: SidebarItem[] = [
  { name: "Dashboard", href: "/super-admin", icon: ChartPieIcon },
  { name: "Schools", href: "/super-admin/schools", icon: BuildingOfficeIcon },
  { name: "Admins", href: "/super-admin/admins", icon: UsersIcon },
  { name: "Inquiries", href: "/super-admin/inquiries", icon: EnvelopeIcon },
  { name: "Audit Logs", href: "/super-admin/audit-logs", icon: ClipboardDocumentListIcon },
  {
    name: "Subscriptions",
    href: "/super-admin/subscriptions",
    icon: CreditCardIcon,
  },
];

const adminFeatureRoutes: Array<{
  href: string;
  feature: FeatureToggleKey;
  label: string;
}> = [
  { href: "/admin", feature: "analytics", label: "Analytics" },
  { href: "/admin/documents", feature: "document_uploads", label: "Document review" },
  { href: "/admin/qr-codes", feature: "qr_verification", label: "QR verification" },
  { href: "/admin/activity", feature: "pickup_logs", label: "Pickup logs" },
  { href: "/admin/scanner", feature: "qr_verification", label: "QR verification" },
  { href: "/admin/duty-roster", feature: "guardian_management", label: "Duty roster" },
  { href: "/admin/users", feature: "guardian_management", label: "Guardian management" },
  { href: "/register-device", feature: "device_authorization", label: "Device authorization" },
];

function getFeatureForPath(pathname: string) {
  return adminFeatureRoutes
    .filter((item) =>
      item.href === "/admin"
        ? pathname === item.href
        : pathname === item.href || pathname.startsWith(`${item.href}/`)
    )
    .sort((a, b) => b.href.length - a.href.length)[0] || null;
}

function isFeatureEnabled(featureToggles: FeatureToggles | null, feature: FeatureToggleKey) {
  if (!featureToggles) return true;
  return featureToggles[feature] !== false;
}

const ADMIN_SHELL_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,300&display=swap');

.pz-admin-shell {
  --navy: #071D3B;
  --navy-mid: #0B2E5A;
  --navy-light: #123B75;
  --blue: #1B6ECC;
  --teal: #1A9E75;
  --teal-light: #2DC98F;
  --red: #E24B4A;
  --white: #FFFFFF;
  --surface: #F4F6FA;
  --border: #E2E6EE;
  --border-dark: rgba(255,255,255,0.08);
  --text-1: #0A1628;
  --text-2: #4A5568;
  --text-3: #8A96A8;
  --sidebar-w: 240px;
  --topbar-h: 60px;
  --font-d: 'Inter', sans-serif;
  --font-b: 'DM Sans', sans-serif;
  min-height: 100vh;
  display: flex;
  background: var(--surface);
  color: var(--text-1);
  font-family: var(--font-b);
  overflow: hidden;
}

.pz-admin-shell,
.pz-admin-shell * {
  box-sizing: border-box;
}

.pz-admin-sidebar {
  width: var(--sidebar-w);
  height: 100vh;
  background: var(--navy);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  position: relative;
  z-index: 50;
  overflow: hidden;
  transition: width 0.22s ease, transform 0.24s ease;
}

.pz-admin-sidebar::before {
  content: "";
  position: absolute;
  top: -80px;
  left: -80px;
  width: 280px;
  height: 280px;
  background: radial-gradient(circle, rgba(26,158,117,0.12) 0%, transparent 65%);
  pointer-events: none;
}

.pz-admin-sidebar-logo {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 20px 20px 24px;
  border-bottom: 1px solid var(--border-dark);
  position: relative;
}

.pz-admin-logo-copy,
.pz-admin-nav-text,
.pz-admin-account-text,
.pz-admin-school-details {
  min-width: 0;
}

.pz-admin-logo-icon {
  width: 34px;
  height: 34px;
  background: var(--teal);
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.pz-admin-logo-text {
  font-family: var(--font-d);
  font-size: 16px;
  font-weight: 700;
  color: var(--white);
  letter-spacing: -0.02em;
}

.pz-admin-logo-sub {
  font-size: 10px;
  color: rgba(255,255,255,0.4);
  margin-top: 1px;
}

.pz-admin-sidebar-close {
  margin-left: auto;
  width: 30px;
  height: 30px;
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: 8px;
  background: rgba(255,255,255,0.06);
  color: var(--white);
  display: none;
  align-items: center;
  justify-content: center;
}

.pz-admin-sidebar-nav {
  flex: 1;
  overflow-y: auto;
  padding-bottom: 12px;
  position: relative;
}

.pz-admin-sidebar-nav::-webkit-scrollbar {
  display: none;
}

.pz-admin-section-label {
  font-size: 10px;
  font-weight: 500;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: rgba(255,255,255,0.25);
  padding: 20px 20px 8px;
}

.pz-admin-nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 20px;
  margin: 1px 10px;
  border-radius: 9px;
  transition: all 0.18s;
  color: rgba(255,255,255,0.5);
  font-size: 13.5px;
  font-weight: 400;
  position: relative;
  user-select: none;
  text-decoration: none;
}

.pz-admin-nav-item:hover {
  background: rgba(255,255,255,0.06);
  color: rgba(255,255,255,0.85);
}

.pz-admin-nav-item.active {
  background: rgba(26,158,117,0.18);
  color: var(--white);
  font-weight: 500;
}

.pz-admin-nav-item.active::before {
  content: "";
  position: absolute;
  left: -10px;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 20px;
  background: var(--teal);
  border-radius: 2px;
}

.pz-admin-nav-icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  stroke-width: 2;
}

.pz-admin-sidebar-school {
  padding: 16px 20px;
  border-top: 1px solid var(--border-dark);
  display: flex;
  align-items: center;
  gap: 10px;
  position: relative;
}

.pz-admin-sidebar-account {
  padding: 12px 10px;
  border-top: 1px solid var(--border-dark);
  position: relative;
}

.pz-admin-account-label {
  font-size: 10px;
  font-weight: 500;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: rgba(255,255,255,0.25);
  padding: 0 10px 8px;
}

.pz-admin-account-action {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 10px;
  border: 0;
  border-radius: 9px;
  background: transparent;
  color: rgba(255,255,255,0.6);
  font-size: 13.5px;
  font-weight: 400;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.18s;
  font-family: var(--font-b);
}

.pz-admin-account-action:hover {
  background: rgba(255,255,255,0.06);
  color: var(--white);
}

.pz-admin-account-action.active {
  background: rgba(26,158,117,0.18);
  color: var(--white);
  font-weight: 500;
}

.pz-admin-account-action.danger {
  color: #ff8a88;
}

.pz-admin-account-action.danger:hover {
  background: rgba(226,75,74,0.12);
  color: #ffb2b0;
}

.pz-admin-account-action svg {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

.pz-admin-school-avatar {
  width: 34px;
  height: 34px;
  border-radius: 9px;
  background: var(--navy-light);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: var(--white);
  font-family: var(--font-d);
  font-size: 12px;
  font-weight: 800;
  overflow: hidden;
}

.pz-admin-school-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.pz-admin-school-name {
  font-size: 12px;
  font-weight: 500;
  color: var(--white);
  max-width: 145px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pz-admin-school-role {
  font-size: 10px;
  color: rgba(255,255,255,0.35);
  margin-top: 2px;
}

.pz-admin-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  height: 100vh;
  overflow: hidden;
}

.pz-admin-topbar {
  height: var(--topbar-h);
  background: var(--white);
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  padding: 0 28px;
  gap: 16px;
  flex-shrink: 0;
  z-index: 20;
}

.pz-admin-mobile-menu-btn {
  display: none;
  width: 36px;
  height: 36px;
  border: 1px solid var(--border);
  border-radius: 9px;
  background: var(--surface);
  color: var(--text-2);
  align-items: center;
  justify-content: center;
}

.pz-admin-desktop-collapse-btn {
  display: flex;
  width: 36px;
  height: 36px;
  border: 1px solid var(--border);
  border-radius: 9px;
  background: var(--surface);
  color: var(--text-2);
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: border-color 0.18s ease, background 0.18s ease, color 0.18s ease;
}

.pz-admin-desktop-collapse-btn:hover {
  border-color: var(--blue);
  background: #EFF6FF;
  color: var(--blue);
}

.pz-admin-topbar-title {
  font-family: var(--font-d);
  font-size: 18px;
  font-weight: 700;
  color: var(--text-1);
  flex: 1;
  min-width: 120px;
}

.pz-admin-topbar-title span {
  color: var(--text-3);
  font-weight: 400;
  font-size: 14px;
  font-family: var(--font-b);
  margin-left: 8px;
}

.pz-admin-search-box {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 9px;
  padding: 7px 14px;
  min-width: 220px;
  transition: border-color 0.2s;
}

.pz-admin-search-box:focus-within {
  border-color: var(--blue);
}

.pz-admin-search-box input {
  border: none;
  background: transparent;
  font-family: var(--font-b);
  font-size: 13px;
  color: var(--text-1);
  outline: none;
  width: 100%;
}

.pz-admin-search-box input::placeholder {
  color: var(--text-3);
}

.pz-admin-topbar-action {
  width: 36px;
  height: 36px;
  border-radius: 9px;
  background: var(--surface);
  border: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  position: relative;
  transition: all 0.18s;
}

.pz-admin-topbar-action:hover {
  border-color: var(--blue);
  background: #EFF6FF;
}

.pz-admin-content {
  flex: 1;
  overflow-y: auto;
  padding: 24px 28px;
}

.pz-admin-content::-webkit-scrollbar {
  width: 5px;
}

.pz-admin-content::-webkit-scrollbar-thumb {
  background: #CAD2DF;
  border-radius: 999px;
}

.pz-admin-content::-webkit-scrollbar-track {
  background: transparent;
}

.pz-admin-grace-banner {
  margin-bottom: 18px;
  background: #FFFBEB;
  border: 1px solid #FDE68A;
  border-left: 4px solid #EF9F27;
  color: #92400E;
  padding: 14px 16px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
}

.pz-admin-grace-banner strong {
  font-weight: 700;
}

.pz-admin-pay-btn {
  border: none;
  border-radius: 9px;
  background: #EF9F27;
  color: var(--white);
  padding: 8px 14px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
}

.pz-admin-feature-block {
  min-height: min(560px, calc(100vh - 190px));
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 28px;
}

.pz-admin-feature-panel {
  width: min(100%, 720px);
  background: var(--white);
  border: 1px solid var(--border);
  border-radius: 18px;
  box-shadow: 0 18px 46px rgba(7,29,59,0.10);
  padding: 32px;
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 22px;
  position: relative;
  overflow: hidden;
}

.pz-admin-feature-panel::before {
  content: "";
  position: absolute;
  inset: 0 0 auto;
  height: 4px;
  background: linear-gradient(90deg, var(--teal), var(--blue));
}

.pz-admin-feature-icon {
  width: 58px;
  height: 58px;
  border-radius: 16px;
  background: #E1F5EE;
  color: var(--teal);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.pz-admin-feature-icon svg {
  width: 28px;
  height: 28px;
}

.pz-admin-feature-kicker {
  color: var(--teal);
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0;
  text-transform: uppercase;
  margin-bottom: 8px;
}

.pz-admin-feature-block h2 {
  font-family: var(--font-d);
  font-size: 28px;
  line-height: 1.12;
  letter-spacing: 0;
  margin: 0 0 10px;
  color: var(--text-1);
}

.pz-admin-feature-block p {
  margin: 0;
  color: var(--text-2);
  font-size: 15px;
  line-height: 1.7;
  max-width: 560px;
}

.pz-admin-feature-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin: 20px 0 24px;
}

.pz-admin-feature-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 32px;
  padding: 0 12px;
  border-radius: 999px;
  background: #F4F6FA;
  border: 1px solid var(--border);
  color: var(--text-2);
  font-size: 12px;
  font-weight: 600;
}

.pz-admin-feature-pill strong {
  color: var(--text-1);
  font-weight: 800;
}

.pz-admin-feature-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.pz-admin-feature-button {
  min-height: 40px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 9px;
  background: var(--teal);
  color: var(--white);
  padding: 0 16px;
  font-size: 13px;
  font-weight: 800;
  text-decoration: none;
}

.pz-admin-feature-note {
  min-height: 40px;
  display: inline-flex;
  align-items: center;
  color: var(--text-3);
  font-size: 13px;
}

.pz-admin-blocked-view {
  position: relative;
  width: 100%;
  min-height: 100vh;
  background: var(--surface);
}

.pz-admin-blocked-underlay {
  min-height: 100vh;
  filter: blur(7px);
  transform: scale(1.01);
  pointer-events: none;
  user-select: none;
}

.pz-admin-blocked-placeholder {
  display: grid;
  gap: 16px;
  max-width: 980px;
  opacity: 0.72;
}

.pz-admin-blocked-line,
.pz-admin-blocked-card {
  border-radius: 14px;
  background: var(--white);
  border: 1px solid var(--border);
  box-shadow: 0 14px 38px rgba(7,29,59,0.08);
}

.pz-admin-blocked-line {
  height: 76px;
}

.pz-admin-blocked-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}

.pz-admin-blocked-card {
  height: 150px;
}

.pz-admin-blocked-overlay {
  position: fixed;
  inset: 0;
  z-index: 90;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(7,29,59,0.20);
  backdrop-filter: blur(4px);
}

.pz-admin-blocked-modal {
  width: min(100%, 540px);
  background: var(--white);
  border: 1px solid rgba(226,75,74,0.30);
  border-radius: 18px;
  box-shadow: 0 24px 70px rgba(7,29,59,0.22);
  padding: 30px;
  text-align: center;
}

.pz-admin-blocked-icon {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  margin: 0 auto 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #FDEAEA;
  color: var(--red);
}

.pz-admin-blocked-modal h2 {
  font-family: var(--font-d);
  color: var(--text-1);
  font-size: 26px;
  margin: 0 0 10px;
}

.pz-admin-blocked-modal p {
  color: var(--text-2);
  font-size: 14px;
  line-height: 1.65;
  margin: 0;
}

.pz-admin-blocked-actions {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 22px;
}

.pz-admin-blocked-action {
  min-height: 42px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  padding: 0 16px;
  font-size: 13px;
  font-weight: 800;
  text-decoration: none;
  border: 1px solid var(--border);
  color: var(--text-1);
  background: var(--white);
}

.pz-admin-blocked-action.primary {
  background: var(--teal);
  border-color: var(--teal);
  color: var(--white);
}

@media (max-width: 640px) {
  .pz-admin-feature-block {
    min-height: auto;
    padding: 10px 0;
  }

  .pz-admin-feature-panel {
    grid-template-columns: 1fr;
    padding: 26px 22px;
  }

  .pz-admin-feature-block h2 {
    font-size: 24px;
  }
}

.pz-admin-mobile-backdrop {
  display: none;
}

@media (min-width: 1025px) {
  .pz-admin-sidebar.collapsed {
    width: 72px;
  }

  .pz-admin-sidebar.collapsed .pz-admin-sidebar-logo {
    justify-content: center;
    padding: 20px 10px 18px;
  }

  .pz-admin-sidebar.collapsed .pz-admin-logo-copy,
  .pz-admin-sidebar.collapsed .pz-admin-section-label,
  .pz-admin-sidebar.collapsed .pz-admin-nav-text,
  .pz-admin-sidebar.collapsed .pz-admin-account-label,
  .pz-admin-sidebar.collapsed .pz-admin-account-text,
  .pz-admin-sidebar.collapsed .pz-admin-school-details {
    display: none;
  }

  .pz-admin-sidebar.collapsed .pz-admin-sidebar-nav {
    padding-top: 12px;
  }

  .pz-admin-sidebar.collapsed .pz-admin-nav-item {
    justify-content: center;
    gap: 0;
    margin: 4px 12px;
    padding: 11px 0;
  }

  .pz-admin-sidebar.collapsed .pz-admin-nav-item.active::before {
    left: -12px;
  }

  .pz-admin-sidebar.collapsed .pz-admin-sidebar-account {
    padding: 12px 10px;
  }

  .pz-admin-sidebar.collapsed .pz-admin-account-action {
    justify-content: center;
    gap: 0;
    padding: 10px 0;
  }

  .pz-admin-sidebar.collapsed .pz-admin-sidebar-school {
    justify-content: center;
    padding: 14px 10px;
  }

  .pz-admin-sidebar.collapsed .pz-admin-school-name {
    max-width: 0;
  }
}

@media (max-width: 1024px) {
  .pz-admin-shell {
    display: block;
    overflow: hidden;
  }

  .pz-admin-sidebar {
    position: fixed;
    inset: 0 auto 0 0;
    transform: translateX(-100%);
    transition: transform 0.24s ease;
    box-shadow: 24px 0 80px rgba(0,0,0,0.25);
  }

  .pz-admin-sidebar.open {
    transform: translateX(0);
  }

  .pz-admin-sidebar-close,
  .pz-admin-mobile-menu-btn {
    display: flex;
  }

  .pz-admin-desktop-collapse-btn {
    display: none;
  }

  .pz-admin-mobile-backdrop {
    display: block;
    position: fixed;
    inset: 0;
    background: rgba(7,29,59,0.56);
    z-index: 40;
  }

  .pz-admin-main {
    height: 100vh;
  }
}

@media (max-width: 760px) {
  .pz-admin-topbar {
    padding: 0 14px;
    gap: 10px;
  }

  .pz-admin-search-box {
    display: none;
  }

  .pz-admin-topbar-title span {
    display: none;
  }

  .pz-admin-content {
    padding: 18px 14px;
  }

  .pz-admin-grace-banner {
    align-items: flex-start;
    flex-direction: column;
  }
}
`;

export default function DashboardLayout({
  children,
  role = "parent",
}: {
  children: React.ReactNode;
  role?: "parent" | "admin" | "super-admin";
}) {
  const cachedAdminLayout = role === "admin" ? adminLayoutCache : null;
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(`pickupzone:${role}:sidebar-collapsed`) === "true";
  });
  const [profileOpen, setProfileOpen] = useState(false);
  const [user, setUser] = useState<any>(cachedAdminLayout?.user ?? null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<string | null>(
    cachedAdminLayout?.subscriptionStatus ?? null
  );
  const [schoolStatus, setSchoolStatus] = useState<string | null>(
    cachedAdminLayout?.schoolStatus ?? null
  );
  const [gracePeriodDays, setGracePeriodDays] = useState<number>(
    cachedAdminLayout?.gracePeriodDays ?? 7
  );
  const [subscriptionEndDate, setSubscriptionEndDate] = useState<string | null>(
    cachedAdminLayout?.subscriptionEndDate ?? null
  );
  const [gracePeriodEndsAt, setGracePeriodEndsAt] = useState<string | null>(
    cachedAdminLayout?.gracePeriodEndsAt ?? null
  );
  const [cancelAtPeriodEnd, setCancelAtPeriodEnd] = useState<boolean>(
    cachedAdminLayout?.cancelAtPeriodEnd ?? false
  );
  const [accountAge, setAccountAge] = useState<number>(
    cachedAdminLayout?.accountAge ?? 0
  );
  const [plans, setPlans] = useState<PlanOption[]>(
    cachedAdminLayout?.plans ?? []
  );
  const [featureToggles, setFeatureToggles] = useState<FeatureToggles | null>(
    cachedAdminLayout?.featureToggles ?? null
  );
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(
    cachedAdminLayout?.selectedPlanId ?? null
  );
  
  const location = useLocation();
  const navigate = useNavigate();
  const [loadingSubscription, setLoadingSubscription] = useState(
    role === "admin" && !cachedAdminLayout
  );
  const [isBlocked, setIsBlocked] = useState(
    cachedAdminLayout?.isBlocked ?? false
  );

  const navigation = {
    parent: parentNavigation,
    admin: adminNavigation,
    "super-admin": superAdminNavigation,
  }[role];
  const baseVisibleNavigation =
    role === "admin"
      ? navigation.filter((item) => {
          const routeFeature = getFeatureForPath(item.href);
          return !routeFeature || isFeatureEnabled(featureToggles, routeFeature.feature);
        })
      : navigation;
  const query = new URLSearchParams(location.search);
  const isFromStripe = query.get("success") === "true";

  useEffect(() => {
    localStorage.setItem(`pickupzone:${role}:sidebar-collapsed`, String(sidebarCollapsed));
  }, [role, sidebarCollapsed]);
  

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      adminLayoutCache = null;
      navigate("/login");
      return;
    }
  
    const fetchUserProfileAndPlans = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
  
        if (!res.ok) throw new Error("Unauthorized");
  
        const userData = await res.json();
        setUser(userData);
  
        // Check subscription block
        if (userData.role === "admin") {
          const nextSubscriptionStatus = userData.subscriptionStatus;
          const nextSchoolStatus = userData.schoolStatus || "Active";
          const nextGracePeriodDays = Math.max(Number(userData.gracePeriodDays ?? 7), 0);
          const nextAccountAge = Math.max(Number(userData.accountAgeDays ?? 0), 0);
          const nextSubscriptionEndDate = userData.subscriptionEndDate || null;
          const nextGracePeriodEndsAt = userData.gracePeriodEndsAt || null;
          const nextCancelAtPeriodEnd = Boolean(userData.cancelAtPeriodEnd);
          const nextFeatureToggles = userData.featureToggles || null;
          const assignedPlanId = Number(userData.planId || 0) || null;
          const now = Date.now();
          const hasPaidPeriodAccess =
            nextSubscriptionStatus === "Cancelled" &&
            nextCancelAtPeriodEnd &&
            nextSubscriptionEndDate &&
            new Date(nextSubscriptionEndDate).getTime() >= now;
          const hasPastDueGraceAccess =
            nextSubscriptionStatus === "Expiring Soon" &&
            nextGracePeriodEndsAt &&
            new Date(nextGracePeriodEndsAt).getTime() >= now;
          const nextIsBlocked =
            nextSchoolStatus === "Suspended" ||
            (
              nextSubscriptionStatus !== "Active" &&
              !hasPaidPeriodAccess &&
              !hasPastDueGraceAccess &&
              nextAccountAge >= nextGracePeriodDays
            );
          let nextPlans = plans;
          let nextSelectedPlanId = selectedPlanId;

          setSubscriptionStatus(nextSubscriptionStatus);
          setSchoolStatus(nextSchoolStatus);
          setGracePeriodDays(nextGracePeriodDays);
          setSubscriptionEndDate(nextSubscriptionEndDate);
          setGracePeriodEndsAt(nextGracePeriodEndsAt);
          setCancelAtPeriodEnd(nextCancelAtPeriodEnd);
          setAccountAge(nextAccountAge);
          setFeatureToggles(nextFeatureToggles);
  
          setIsBlocked(nextIsBlocked);
  
          // Fetch plans
          const plansRes = await fetch(`${API_BASE_URL}/superadmin/plans`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const plansData = await plansRes.json();
          if (Array.isArray(plansData) && plansData.length > 0) {
            nextPlans = plansData;
            const assignedPlan = assignedPlanId
              ? plansData.find((plan) => Number(plan.id) === assignedPlanId)
              : null;
            nextSelectedPlanId = assignedPlan?.id ?? assignedPlanId ?? null;
            setPlans(plansData);
            setSelectedPlanId(nextSelectedPlanId);
          } else if (assignedPlanId) {
            nextSelectedPlanId = assignedPlanId;
            setSelectedPlanId(assignedPlanId);
          }

          adminLayoutCache = {
            user: userData,
            subscriptionStatus: nextSubscriptionStatus,
            schoolStatus: nextSchoolStatus,
            gracePeriodDays: nextGracePeriodDays,
            subscriptionEndDate: nextSubscriptionEndDate,
            gracePeriodEndsAt: nextGracePeriodEndsAt,
            cancelAtPeriodEnd: nextCancelAtPeriodEnd,
            accountAge: nextAccountAge,
            plans: nextPlans,
            selectedPlanId: nextSelectedPlanId,
            isBlocked: nextIsBlocked,
            featureToggles: nextFeatureToggles,
          };
        }
  
        setLoadingSubscription(false);
      } catch (err: any) {
        console.error("Auth or subscription check failed", err);
        adminLayoutCache = null;
        localStorage.removeItem("token");
        navigate("/login");
        setLoadingSubscription(false);
      }
    };
  
    fetchUserProfileAndPlans();
  }, []);
  
  
  const handleLogout = () => {
    adminLayoutCache = null;
    localStorage.removeItem("token");
    setUser(null);
    navigate("/login");
  };

  const handleClickOutside = (e: MouseEvent) => {
    const profileMenu = document.getElementById("profile-menu");
    if (profileMenu && !profileMenu.contains(e.target as Node)) {
      setProfileOpen(false);
    }
  };

  // Use useEffect instead of useState for side effects
  // This was causing error TS2554: Expected 0-1 arguments, but got 2
  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleProfileUpdate = (event: Event) => {
      const updatedUser = (event as CustomEvent).detail;
      if (!updatedUser) return;

      setUser((currentUser: any) => {
        const mergedUser = { ...(currentUser || {}), ...updatedUser };
        if (role === "admin" && adminLayoutCache) {
          adminLayoutCache = {
            ...adminLayoutCache,
            user: mergedUser,
          };
        }
        return mergedUser;
      });
    };

    window.addEventListener("pickupzone:user-updated", handleProfileUpdate as EventListener);
    return () => window.removeEventListener("pickupzone:user-updated", handleProfileUpdate as EventListener);
  }, [role]);

  useEffect(() => {
    if (
      role !== "admin" ||
      loadingSubscription ||
      !featureToggles ||
      location.pathname !== "/admin" ||
      isFeatureEnabled(featureToggles, "analytics")
    ) {
      return;
    }

    const firstEnabledPage = adminNavigation.find((item) => {
      if (item.href === "/admin") return false;
      const routeFeature = getFeatureForPath(item.href);
      return !routeFeature || isFeatureEnabled(featureToggles, routeFeature.feature);
    });

    if (firstEnabledPage) {
      navigate(firstEnabledPage.href, { replace: true });
    }
  }, [featureToggles, loadingSubscription, location.pathname, navigate, role]);


  const assignedPlan = plans.find((plan) => Number(plan.id) === Number(selectedPlanId));
  const currentPackageName = user?.planName || assignedPlan?.name || "Assigned package";
  const currentBillingInterval = user?.billingInterval || assignedPlan?.billing_interval || "monthly";
  const currentPackagePrice = assignedPlan
    ? currentBillingInterval === "yearly"
      ? assignedPlan.yearly_price ?? assignedPlan.price
      : assignedPlan.monthly_price ?? assignedPlan.price
    : null;
  const notificationsEnabled =
    role !== "admin" || isFeatureEnabled(featureToggles, "notifications");

  const handlePayNow = async () => {
    const token = localStorage.getItem("token");
  
    if (!selectedPlanId) {
      toast("Please select a plan.");
      return;
    }
  
    try {
      const userRes = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
  
      const userData = await userRes.json();
      const schoolId = userData.school_id;
      const checkoutPlanId = Number(userData.planId || selectedPlanId || 0);

      if (!checkoutPlanId) {
        toast("No package is assigned to this school.");
        return;
      }
  
      const response = await fetch(`${API_BASE_URL}/superadmin/subscription/subscribe/create-session`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          schoolId,
          planId: checkoutPlanId,
          billingInterval: userData.billingInterval || currentBillingInterval,
        }),
      });
  
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error("Missing checkout URL");
      }
    } catch (err) {
      console.error("Checkout failed", err);
      toast("Checkout failed. See console for details.");
    }
  };

  const isAdminBlocked =
    role === "admin" &&
    (schoolStatus === "Suspended" ||
      (
        subscriptionStatus !== "Active" &&
        !hasPaidPeriodAccess(subscriptionStatus, cancelAtPeriodEnd, subscriptionEndDate) &&
        !hasPastDueGraceAccess(subscriptionStatus, gracePeriodEndsAt) &&
        accountAge >= gracePeriodDays
      ));
const isAdminInOnboardingGrace =
  role === "admin" &&
  schoolStatus !== "Suspended" &&
  subscriptionStatus !== "Active" &&
  !hasPaidPeriodAccess(subscriptionStatus, cancelAtPeriodEnd, subscriptionEndDate) &&
  !hasPastDueGraceAccess(subscriptionStatus, gracePeriodEndsAt) &&
  accountAge < gracePeriodDays;
const isAdminInPaymentGrace =
  role === "admin" &&
  schoolStatus !== "Suspended" &&
  hasPastDueGraceAccess(subscriptionStatus, gracePeriodEndsAt);
const isAdminInGrace = isAdminInOnboardingGrace || isAdminInPaymentGrace;
const graceDaysLeft = isAdminInPaymentGrace && gracePeriodEndsAt
  ? Math.max(
      Math.ceil((new Date(gracePeriodEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
      0
    )
  : Math.max(gracePeriodDays - accountAge, 0);
const visibleNavigation =
  role === "admin" && (isBlocked || isAdminBlocked)
    ? navigation.filter((item) => item.href === "/admin/billing")
    : baseVisibleNavigation;

if (loadingSubscription) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <LoadingSpinner size="lg" label="Loading workspace" />
      </div>
  );
}

if ((isBlocked || isAdminBlocked) && location.pathname !== "/admin/billing") {
  const blockedBySuspension = schoolStatus === "Suspended";
  const suspensionReason = String(user?.suspensionReason || "").trim();
  const paymentRelatedBlock =
    !blockedBySuspension ||
    subscriptionStatus !== "Active" ||
    /subscription|payment|billing|grace/i.test(suspensionReason);
  const blockedTitle = paymentRelatedBlock ? "Payment Attention Needed" : "Access Blocked";
  const blockedMessage = paymentRelatedBlock
    ? "Your school access is currently paused because the subscription payment needs attention. You can open billing to update payment details or contact Pickup Zone support for help."
    : "This school has been suspended by the platform administrator. Contact Pickup Zone support if you need help.";
  const contactHref = paymentRelatedBlock
    ? "/contact?reason=payment&from=blocked"
    : "/contact?reason=suspension&from=blocked";
  const adminDisplayName =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim() ||
    user?.name ||
    user?.email ||
    "Pickup Zone";

  return (
    <div className="pz-admin-shell pz-admin-blocked-view">
      <style>{ADMIN_SHELL_CSS}</style>
      <div className="pz-admin-blocked-underlay" aria-hidden="true">
        <aside className="pz-admin-sidebar">
          <div className="pz-admin-sidebar-logo">
            <div className="pz-admin-logo-icon">
              <svg width="18" height="22" viewBox="0 0 18 22" fill="none">
                <path
                  d="M9 1L17 4.5V11C17 16 13.5 20.5 9 21C4.5 20.5 1 16 1 11V4.5L9 1Z"
                  fill="white"
                  opacity="0.95"
                />
                <path
                  d="M6 11L8 13L12 9"
                  stroke="#1A9E75"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div>
              <div className="pz-admin-logo-text">Pickup Zone</div>
              <div className="pz-admin-logo-sub">Admin Panel</div>
            </div>
          </div>
          <nav className="pz-admin-sidebar-nav">
            <div className="pz-admin-section-label">Main</div>
            {["Dashboard", "Profiles", "Users"].map((item) => (
              <div key={item} className="pz-admin-nav-item">
                <ChartPieIcon className="pz-admin-nav-icon" aria-hidden="true" />
                {item}
              </div>
            ))}
            <div className="pz-admin-section-label">Operations</div>
            {["QR Codes", "Activity", "Scanner"].map((item) => (
              <div key={item} className="pz-admin-nav-item">
                <QrCodeIcon className="pz-admin-nav-icon" aria-hidden="true" />
                {item}
              </div>
            ))}
          </nav>
          <div className="pz-admin-sidebar-school">
            <div className="pz-admin-school-avatar">{adminDisplayName.slice(0, 2).toUpperCase()}</div>
            <div>
              <div className="pz-admin-school-name">{adminDisplayName}</div>
              <div className="pz-admin-school-role">School Admin</div>
            </div>
          </div>
        </aside>

        <div className="pz-admin-main">
          <header className="pz-admin-topbar">
            <div className="pz-admin-topbar-title">
              Dashboard
              <span>
                {new Date().toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </div>
            <div className="pz-admin-search-box">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <circle cx="6" cy="6" r="4.5" stroke="#8A96A8" strokeWidth="1.3" />
                <path d="M10 10L12.5 12.5" stroke="#8A96A8" strokeWidth="1.3" strokeLinecap="round" />
              </svg>
              <input type="text" placeholder="Search admin records..." readOnly />
            </div>
          </header>
          <main className="pz-admin-content">
            <div className="pz-admin-blocked-placeholder">
              <div className="pz-admin-blocked-line" />
              <div className="pz-admin-blocked-grid">
                <div className="pz-admin-blocked-card" />
                <div className="pz-admin-blocked-card" />
                <div className="pz-admin-blocked-card" />
              </div>
              <div className="pz-admin-blocked-line" />
            </div>
          </main>
        </div>
      </div>

      <div className="pz-admin-blocked-overlay">
        <section className="pz-admin-blocked-modal" role="dialog" aria-modal="true" aria-labelledby="blocked-title">
          <div className="pz-admin-blocked-icon">
            <LockClosedIcon aria-hidden="true" />
          </div>
          <h2 id="blocked-title">{blockedTitle}</h2>
          <p>{blockedMessage}</p>
          {suspensionReason && (
            <p style={{ marginTop: 10 }}>
              Reason: {suspensionReason}
            </p>
          )}
          <div className="pz-admin-blocked-actions">
            <Link
              to="/admin/billing"
              className={paymentRelatedBlock ? "pz-admin-blocked-action primary" : "pz-admin-blocked-action"}
            >
              Open Billing
            </Link>
            <Link to={contactHref} className="pz-admin-blocked-action">
              Contact Us
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}



  if (role === "admin" || role === "parent" || role === "super-admin") {
    const profileSettingsHref =
      role === "admin"
        ? "/admin/profile-settings"
        : role === "super-admin"
          ? "/super-admin/profile-settings"
          : "/profile";
    const roleLabel =
      role === "admin"
        ? "School Admin"
        : role === "super-admin"
          ? "Super Admin"
          : "Parent";
    const logoSub =
      role === "admin"
        ? "Admin Panel"
        : role === "super-admin"
          ? "Platform Console"
          : "Parent Portal";
    const searchPlaceholder =
      role === "admin"
        ? "Search admin records..."
        : role === "super-admin"
          ? "Search platform records..."
          : "Search family records...";
    const activeNavigationItem = navigation.find(
      (item) =>
        location.pathname === item.href ||
        (role === "parent" &&
          item.href === "/parent/profiles" &&
          location.pathname.startsWith("/parent/child/"))
    );
    const activeItem =
      location.pathname === profileSettingsHref
        ? { name: "Profile Settings" }
        : activeNavigationItem || visibleNavigation[0] || navigation[0];
    const dateLabel = new Date().toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
    const adminDisplayName =
      [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim() ||
      user?.name ||
      user?.email ||
      "Pickup Zone";
    const adminProfilePicture = user?.profile_picture;
    const adminProfileVersion = user?.profile_picture_cache_buster;
    const adminGroups =
      role === "admin"
        ? [
            {
              label: "Main",
              items: visibleNavigation.filter((item) =>
                ["Dashboard", "Profiles", "Users"].includes(item.name)
                || item.name === "Documents"
              ),
            },
            {
              label: "Operations",
              items: visibleNavigation.filter((item) =>
                ["QR Codes", "Activity", "Scanner", "Duty Roster"].includes(item.name)
              ),
            },
            {
              label: "Billing",
              items: visibleNavigation.filter((item) =>
                ["Billing"].includes(item.name)
              ),
            },
          ]
        : role === "parent"
          ? [
            {
              label: "Family",
              items: visibleNavigation,
            },
          ]
          : [
              {
                label: "Platform",
                items: visibleNavigation.filter((item) =>
                  ["Dashboard", "Schools", "Admins", "Inquiries", "Audit Logs"].includes(item.name)
                ),
              },
              {
                label: "Billing",
                items: visibleNavigation.filter((item) =>
                  ["Subscriptions"].includes(item.name)
                ),
              },
            ];
    const disabledFeatureRoute =
      role === "admin"
        ? (() => {
            const routeFeature = getFeatureForPath(location.pathname);
            return routeFeature && !isFeatureEnabled(featureToggles, routeFeature.feature)
              ? routeFeature
              : null;
          })()
        : null;

    return (
      <div className="pz-admin-shell">
        <style>{ADMIN_SHELL_CSS}</style>
        {sidebarOpen && (
          <div
            className="pz-admin-mobile-backdrop"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <aside className={cn("pz-admin-sidebar", sidebarOpen && "open", sidebarCollapsed && "collapsed")}>
          <div className="pz-admin-sidebar-logo">
            <div className="pz-admin-logo-icon">
              <svg width="18" height="22" viewBox="0 0 18 22" fill="none">
                <path
                  d="M9 1L17 4.5V11C17 16 13.5 20.5 9 21C4.5 20.5 1 16 1 11V4.5L9 1Z"
                  fill="white"
                  opacity="0.95"
                />
                <path
                  d="M6 11L8 13L12 9"
                  stroke="#1A9E75"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div className="pz-admin-logo-copy">
              <div className="pz-admin-logo-text">Pickup Zone</div>
              <div className="pz-admin-logo-sub">{logoSub}</div>
            </div>
            <button
              type="button"
              className="pz-admin-sidebar-close"
              onClick={() => setSidebarOpen(false)}
              aria-label="Close navigation"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          <nav className="pz-admin-sidebar-nav">
            {adminGroups.map((group) => (
              <div key={group.label}>
                <div className="pz-admin-section-label">{group.label}</div>
                {group.items.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={cn(
                      "pz-admin-nav-item",
                      (location.pathname === item.href ||
                        (role === "parent" &&
                          item.href === "/parent/profiles" &&
                          location.pathname.startsWith("/parent/child/"))) &&
                        "active"
                    )}
                    title={sidebarCollapsed ? item.name : undefined}
                    aria-label={item.name}
                  >
                    <item.icon className="pz-admin-nav-icon" aria-hidden="true" />
                    <span className="pz-admin-nav-text">{item.name}</span>
                  </Link>
                ))}
              </div>
            ))}
          </nav>

          <div className="pz-admin-sidebar-account">
            <div className="pz-admin-account-label">Account</div>
            <Link
              to={profileSettingsHref}
              onClick={() => setSidebarOpen(false)}
              className={cn(
                "pz-admin-account-action",
                location.pathname === profileSettingsHref && "active"
              )}
              title={sidebarCollapsed ? "Profile Settings" : undefined}
              aria-label="Profile Settings"
            >
              <UserCircleIcon aria-hidden="true" />
              <span className="pz-admin-account-text">Profile Settings</span>
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="pz-admin-account-action danger"
              title={sidebarCollapsed ? "Logout" : undefined}
              aria-label="Logout"
            >
              <ArrowRightOnRectangleIcon aria-hidden="true" />
              <span className="pz-admin-account-text">Logout</span>
            </button>
          </div>

          <div className="pz-admin-sidebar-school">
            <div className="pz-admin-school-avatar">
              {adminProfilePicture ? (
                <img
                  src={`${LOCAL_BASE}${adminProfilePicture}${adminProfileVersion ? `?v=${adminProfileVersion}` : ""}`}
                  alt={adminDisplayName}
                />
              ) : (
                adminDisplayName?.toString().slice(0, 2).toUpperCase()
              )}
            </div>
            <div className="pz-admin-school-details">
              <div className="pz-admin-school-name">{adminDisplayName}</div>
              <div className="pz-admin-school-role">{roleLabel}</div>
            </div>
          </div>
        </aside>

        <div className="pz-admin-main">
          <header className="pz-admin-topbar">
            <button
              type="button"
              className="pz-admin-mobile-menu-btn"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open navigation"
            >
              <Bars3Icon className="h-5 w-5" />
            </button>
            <button
              type="button"
              className="pz-admin-desktop-collapse-btn"
              onClick={() => setSidebarCollapsed((collapsed) => !collapsed)}
              aria-label={sidebarCollapsed ? "Expand navigation" : "Collapse navigation"}
              title={sidebarCollapsed ? "Expand navigation" : "Collapse navigation"}
            >
              {sidebarCollapsed ? (
                <ArrowRightIcon className="h-5 w-5" aria-hidden="true" />
              ) : (
                <ArrowLeftIcon className="h-5 w-5" aria-hidden="true" />
              )}
            </button>
            <div className="pz-admin-topbar-title">
              {activeItem?.name || "Dashboard"}
              <span>{dateLabel}</span>
            </div>
            <div className="pz-admin-search-box">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <circle
                  cx="6"
                  cy="6"
                  r="4.5"
                  stroke="#8A96A8"
                  strokeWidth="1.3"
                />
                <path
                  d="M10 10L12.5 12.5"
                  stroke="#8A96A8"
                  strokeWidth="1.3"
                  strokeLinecap="round"
                />
              </svg>
              <input type="text" placeholder={searchPlaceholder} />
            </div>
            {notificationsEnabled && <NotificationsContainer />}
          </header>

          <main className="pz-admin-content">
            {isAdminInGrace && (
              <div className="pz-admin-grace-banner">
                <div>
                  <p className="font-semibold">
                    {isAdminInPaymentGrace ? "Payment Grace Period" : "Subscription Pending"}
                  </p>
                  <p>
                    {isAdminInPaymentGrace
                      ? "Your payment is past due. "
                      : ""}
                    You have <strong>{graceDaysLeft}</strong> day(s) left in your grace period.
                  </p>
                  {selectedPlanId && (
                    <p>
                      Plan: <strong>{currentPackageName}</strong>
                      {currentPackagePrice !== null ? ` - $${currentPackagePrice}/${currentBillingInterval}` : ""}
                    </p>
                  )}
                </div>
                {isAdminInPaymentGrace ? (
                  <Link to="/admin/billing" className="pz-admin-pay-btn">
                    Open Billing
                  </Link>
                ) : (
                  <button
                    type="button"
                    className="pz-admin-pay-btn"
                    onClick={handlePayNow}
                    disabled={!selectedPlanId}
                  >
                    Pay Now
                  </button>
                )}
              </div>
            )}
            {disabledFeatureRoute ? (
              <div className="pz-admin-feature-block">
                <section className="pz-admin-feature-panel" aria-labelledby="locked-feature-title">
                  <div className="pz-admin-feature-icon">
                    <LockClosedIcon aria-hidden="true" />
                  </div>
                  <div>
                    <div className="pz-admin-feature-kicker">Package Access</div>
                    <h2 id="locked-feature-title">{disabledFeatureRoute.label} is not available</h2>
                    <p>
                      Your current school package does not include {disabledFeatureRoute.label.toLowerCase()}.
                      Contact the Super Admin to enable this feature or move the school to a package that includes it.
                    </p>
                    <div className="pz-admin-feature-meta">
                      <span className="pz-admin-feature-pill">
                        Current package <strong>{user?.planName || "Not assigned"}</strong>
                      </span>
                      <span className="pz-admin-feature-pill">
                        Subscription <strong>{subscriptionStatus || "Inactive"}</strong>
                      </span>
                    </div>
                    <div className="pz-admin-feature-actions">
                      <Link to="/admin" className="pz-admin-feature-button">
                        Back to Dashboard
                      </Link>
                      <span className="pz-admin-feature-note">
                        Package changes are managed by the platform Super Admin.
                      </span>
                    </div>
                  </div>
                </section>
              </div>
            ) : (
              children
            )}
          </main>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Mobile sidebar */}
      <div
        className={cn(
          "relative z-50 lg:hidden",
          sidebarOpen ? "fixed inset-0 bg-gray-900/80" : "hidden"
        )}
      >
        <div className="fixed inset-0 flex">
          <div className="relative mr-16 flex w-full max-w-xs flex-1">
            <div className="absolute left-full top-0 flex w-16 justify-center pt-5">
              <button
                type="button"
                onClick={() => setSidebarOpen(false)}
                className="-m-2.5 p-2.5"
              >
                <XMarkIcon className="h-6 w-6 text-white" />
              </button>
            </div>
            <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white px-6 pb-2 pt-5">
              <div className="flex items-center gap-2">
                <img className="h-8 w-auto" src="/logo.png" alt="PickupZone" />
                <h3 className="text-xl font-semibold text-gray-900">
                  PickupZone
                </h3>
              </div>
              <nav className="flex flex-1 flex-col">
                <ul role="list" className="flex flex-1 flex-col gap-y-7">
                  <li>
                    <ul role="list" className="-mx-2 space-y-1">
                      {navigation.map((item) => (
                        <li key={item.name}>
                          <Link
                            to={item.href}
                            className={cn(
                              location.pathname === item.href
                                ? "bg-gray-50 text-primary-600"
                                : "text-gray-700 hover:bg-gray-50 hover:text-primary-600",
                              "group flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6"
                            )}
                          >
                            <item.icon className="h-6 w-6 shrink-0" />
                            {item.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </li>
                </ul>
              </nav>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div
        className={cn(
          "hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:flex-col",
          sidebarCollapsed ? "lg:w-20" : "lg:w-72",
          "transition-all duration-300"
        )}
      >
        <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-gray-200 bg-white px-6">
          <div className="flex h-16 shrink-0 items-center justify-between">
            <div
              className={cn(
                "flex items-center gap-2",
                sidebarCollapsed && "hidden"
              )}
            >
              <img className="h-8 w-auto" src="/logo.png" alt="PickupZone" />
              <h3 className="text-xl font-semibold text-gray-900">
                PickupZone
              </h3>
            </div>
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {sidebarCollapsed ? (
                <ArrowRightIcon className="h-5 w-5" />
              ) : (
                <ArrowLeftIcon className="h-5 w-5" />
              )}
            </button>
          </div>

          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-7">
              <li>
                <ul role="list" className="-mx-2 space-y-1">
                  {navigation.map((item) => (
                    <li key={item.name}>
                      <Link
                        to={item.href}
                        className={cn(
                          location.pathname === item.href
                            ? "bg-gray-50 text-primary-600"
                            : "text-gray-700 hover:bg-gray-50 hover:text-primary-600",
                          "group flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6 transition-colors",
                          sidebarCollapsed && "justify-center"
                        )}
                        title={sidebarCollapsed ? item.name : undefined}
                      >
                        <item.icon className="h-6 w-6 shrink-0" />
                        {!sidebarCollapsed && item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div
        className={cn(
          "lg:pl-72 transition-all duration-300",
          sidebarCollapsed && "lg:pl-20"
        )}
      >
        {/* Top header */}
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          <button
            type="button"
            className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Bars3Icon className="h-6 w-6" />
          </button>

          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex flex-1" />
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              {/* Notification Bell */}
              {notificationsEnabled && <NotificationsContainer />}

              <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-gray-200" />

              <div className="relative" id="profile-menu">
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <div className="h-8 w-8 rounded-full bg-gray-100 overflow-hidden">
                    {user?.profile_picture ? (
                      <img
                        src={`${LOCAL_BASE}${user.profile_picture}`}
                        alt="Avatar"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <UserCircleIcon className="h-6 w-6 text-gray-400" />
                    )}
                  </div>

                  <div
                    className={cn(
                      "flex flex-col items-start",
                      profileOpen && "text-primary-600"
                    )}
                  >
                    <span className="text-sm font-medium">
                      {user?.firstName} {user?.lastName}
                    </span>
                    <span className="text-xs text-gray-500 capitalize">{user?.role}</span>

                  </div>
                </button>

                {profileOpen && (
                  <div className="absolute right-0 mt-2 w-48 py-1 bg-white rounded-lg shadow-lg border border-gray-100">
                    <Link
                      to="/profile"
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <UserCircleIcon className="h-5 w-5" />
                      Profile Settings
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full transition-colors"
                    >
                      <ArrowRightOnRectangleIcon className="h-5 w-5" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        <>
  {isAdminInGrace && (
    <div className="bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800 p-4 m-4 rounded shadow flex items-center justify-between">
      <div>
        <p className="font-semibold">{isAdminInPaymentGrace ? "Payment Grace Period" : "Subscription Pending"}</p>
        <p>
          {isAdminInPaymentGrace ? "Your payment is past due. " : ""}
          You have <strong>{graceDaysLeft}</strong> day(s) left in your grace period.
        </p>
        {selectedPlanId && (
          <p>
            Plan: <strong>{currentPackageName}</strong>
            {currentPackagePrice !== null ? ` - $${currentPackagePrice}/${currentBillingInterval}` : ""}
          </p>
        )}
      </div>
      {isAdminInPaymentGrace ? (
        <Link
          to="/admin/billing"
          className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded text-sm"
        >
          Open Billing
        </Link>
      ) : (
        <button
          className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded text-sm"
          onClick={handlePayNow}
          disabled={!selectedPlanId}
        >
          Pay Now
        </button>
      )}
    </div>
  )}
  <main className="py-10">
    <div className="px-4 sm:px-6 lg:px-8">{children}</div>
  </main>
</>


      </div>
    </div>
  );
}
