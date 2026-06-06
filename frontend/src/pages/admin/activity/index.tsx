import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import {
  Activity as ActivityIcon,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Download,
  FileText,
  Filter,
  GraduationCap,
  QrCode,
  Search,
  ShieldAlert,
  TimerReset,
  TrendingUp,
  UserRound,
  UsersRound,
  XCircle,
} from "lucide-react";
import DashboardLayout from "@/components/layouts/dashboard-layout";
import { AdminDatePicker, AdminSelect } from "@/components/ui/admin-controls";
import AdminPageSkeleton from "@/components/ui/AdminPageSkeleton";
import { toast } from "@/components/ui/toast";
import { API_BASE_URL } from "@/lib/api/link";
import { isQuietEmptyStateResponse } from "@/lib/api/quietEmptyState";

const ADMIN_ACTIVITY_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Inter:wght@400;500;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,300&display=swap');

.pz-activity-page {
  --navy: #071D3B;
  --navy-mid: #0B2E5A;
  --navy-light: #123B75;
  --blue: #1B6ECC;
  --teal: #1A9E75;
  --teal-light: #2DC98F;
  --teal-pale: #E1F5EE;
  --amber: #EF9F27;
  --amber-pale: #FEF3DC;
  --red: #E24B4A;
  --red-pale: #FDEAEA;
  --white: #FFFFFF;
  --surface: #F4F6FA;
  --surface-2: #EBEEF5;
  --border: #E2E6EE;
  --text-1: #0A1628;
  --text-2: #4A5568;
  --text-3: #8A96A8;
  --radius: 12px;
  --shadow-sm: 0 1px 4px rgba(0,0,0,0.06);
  color: var(--text-1);
  font-family: 'DM Sans', "Segoe UI", Arial, sans-serif;
}

.pz-activity-page,
.pz-activity-page * {
  box-sizing: border-box;
}

.pz-activity-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 18px;
  margin-bottom: 24px;
}

.pz-activity-kicker {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  color: var(--teal);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  margin-bottom: 8px;
}

.pz-activity-kicker::before {
  content: "";
  width: 18px;
  height: 2px;
  border-radius: 999px;
  background: var(--teal);
}

.pz-activity-title {
  font-family: 'Inter', sans-serif;
  font-size: clamp(28px, 3.2vw, 42px);
  line-height: 1.04;
  letter-spacing: -0.025em;
  font-weight: 700;
  margin: 0;
  color: var(--text-1);
}

.pz-activity-subtitle {
  color: var(--text-3);
  font-size: 14px;
  margin-top: 8px;
}

.pz-activity-date-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 38px;
  border-radius: 999px;
  padding: 0 14px;
  font-size: 13px;
  font-weight: 800;
  font-family: 'DM Sans', sans-serif;
  background: var(--white);
  border: 1px solid var(--border);
  color: var(--text-2);
  box-shadow: var(--shadow-sm);
  white-space: nowrap;
}

.pz-activity-stat-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
  margin-bottom: 18px;
}

.pz-activity-stat-card {
  min-height: 136px;
  background: var(--white);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 18px 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  position: relative;
  overflow: hidden;
  box-shadow: var(--shadow-sm);
}

button.pz-activity-stat-card {
  width: 100%;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.pz-activity-stat-card::after {
  content: "";
  position: absolute;
  inset: auto -34px -70px auto;
  width: 140px;
  height: 140px;
  background: radial-gradient(circle, var(--stat-glow) 0%, transparent 67%);
  pointer-events: none;
}

.pz-activity-stat-top {
  display: flex;
  justify-content: space-between;
  gap: 14px;
  align-items: flex-start;
}

.pz-activity-stat-label {
  color: var(--text-3);
  font-size: 12px;
  font-weight: 700;
}

.pz-activity-stat-icon {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.pz-activity-stat-value {
  font-family: 'Inter', 'Segoe UI', Arial, sans-serif;
  font-size: 34px;
  font-weight: 700;
  line-height: 1;
  letter-spacing: 0;
  color: var(--text-1);
  font-variant-numeric: tabular-nums;
}

.pz-activity-stat-helper {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--text-3);
  font-size: 12px;
  font-weight: 500;
}

.pz-activity-controls {
  background: var(--white);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 16px;
  box-shadow: var(--shadow-sm);
  margin-bottom: 18px;
}

.pz-activity-toolbar {
  display: grid;
  grid-template-columns: minmax(260px, 1fr) auto;
  gap: 14px;
  align-items: center;
}

.pz-activity-search {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 44px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 11px;
  padding: 0 14px;
  transition: border-color 0.18s ease, box-shadow 0.18s ease;
}

.pz-activity-search:focus-within {
  border-color: var(--blue);
  box-shadow: 0 0 0 3px rgba(27,110,204,0.08);
}

.pz-activity-search input {
  width: 100%;
  border: 0;
  outline: 0;
  background: transparent;
  color: var(--text-1);
  font: inherit;
  font-size: 14px;
}

.pz-activity-search input::placeholder {
  color: var(--text-3);
}

.pz-activity-filter-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  padding-top: 14px;
  margin-top: 14px;
  border-top: 1px solid var(--border);
}

.pz-activity-filter-label {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  color: var(--text-3);
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.pz-activity-input,
.pz-activity-select,
.pz-activity-reset {
  height: 38px;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--white);
  color: var(--text-2);
  padding: 0 12px;
  font-size: 13px;
  font-weight: 600;
  outline: none;
  font-family: 'DM Sans', sans-serif;
}

.pz-activity-reset {
  cursor: pointer;
  transition: all 0.18s ease;
}

.pz-activity-reset:hover {
  color: var(--blue);
  border-color: rgba(27,110,204,0.36);
}

.pz-activity-tabs {
  display: flex;
  gap: 5px;
  padding: 4px;
  border-radius: 11px;
  background: var(--surface);
  border: 1px solid var(--border);
}

.pz-activity-tab {
  border: 0;
  background: transparent;
  color: var(--text-3);
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 12px;
  font-weight: 800;
  cursor: pointer;
  transition: all 0.18s ease;
  white-space: nowrap;
  font-family: 'DM Sans', sans-serif;
}

.pz-activity-tab.active {
  background: var(--white);
  color: var(--text-1);
  box-shadow: var(--shadow-sm);
}

.pz-activity-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(320px, 0.42fr);
  gap: 18px;
  align-items: start;
}

.pz-activity-card,
.pz-activity-side-card {
  background: var(--white);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
}

.pz-activity-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 18px 20px;
  border-bottom: 1px solid var(--border);
}

.pz-activity-card-title {
  font-family: 'Inter', sans-serif;
  font-size: 16px;
  font-weight: 700;
  letter-spacing: -0.025em;
  color: var(--text-1);
}

.pz-activity-card-subtitle {
  color: var(--text-3);
  font-size: 12px;
  margin-top: 4px;
}

.pz-activity-badge,
.pz-status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 800;
  white-space: nowrap;
}

.pz-activity-badge {
  padding: 5px 10px;
  color: #065F46;
  background: var(--teal-pale);
}

.pz-status-badge {
  padding: 5px 10px;
  text-transform: capitalize;
}

.pz-status-badge.green {
  color: #065F46;
  background: var(--teal-pale);
}

.pz-status-badge.amber {
  color: #92400E;
  background: var(--amber-pale);
}

.pz-status-badge.red {
  color: #991B1B;
  background: var(--red-pale);
}

.pz-activity-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}

.pz-activity-table-wrap {
  overflow-x: auto;
}

.pz-activity-table {
  width: 100%;
  border-collapse: collapse;
}

.pz-activity-table th {
  text-align: left;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--text-3);
  padding: 12px 16px;
  border-bottom: 1px solid var(--border);
  background: var(--surface);
  white-space: nowrap;
}

.pz-activity-table td {
  padding: 14px 16px;
  font-size: 13px;
  color: var(--text-2);
  border-bottom: 1px solid var(--border);
  vertical-align: middle;
}

.pz-activity-table tbody tr:last-child td {
  border-bottom: 0;
}

.pz-activity-table tbody tr:hover td {
  background: #FAFBFD;
}

.pz-activity-person {
  display: flex;
  align-items: center;
  gap: 11px;
  min-width: 230px;
}

.pz-activity-avatar {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  background: linear-gradient(135deg, var(--navy), var(--navy-light));
  color: var(--white);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Inter', sans-serif;
  font-weight: 800;
  font-size: 12px;
  flex-shrink: 0;
}

.pz-activity-name {
  color: var(--text-1);
  font-size: 14px;
  font-weight: 800;
}

.pz-activity-muted {
  color: var(--text-3);
  font-size: 12px;
  margin-top: 3px;
}

.pz-activity-empty {
  min-height: 280px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  text-align: center;
  color: var(--text-3);
  padding: 40px 22px;
}

.pz-activity-empty-icon {
  width: 54px;
  height: 54px;
  border-radius: 16px;
  background: var(--surface);
  border: 1px solid var(--border);
  color: var(--teal);
  display: flex;
  align-items: center;
  justify-content: center;
}

.pz-activity-feature-lock {
  background: var(--white);
  border: 1px solid rgba(239,159,39,0.42);
  border-left: 4px solid var(--amber);
  border-radius: var(--radius);
  padding: 18px 20px;
  box-shadow: var(--shadow-sm);
  display: flex;
  gap: 14px;
  align-items: flex-start;
  margin-bottom: 18px;
}

.pz-activity-feature-lock-icon {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  background: var(--amber-pale);
  color: #92400E;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.pz-activity-feature-lock-title {
  font-family: 'Inter', sans-serif;
  color: var(--text-1);
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 4px;
}

.pz-activity-feature-lock-copy {
  color: var(--text-2);
  font-size: 13px;
  line-height: 1.55;
}

.pz-activity-side-card {
  position: sticky;
  top: 0;
}

.pz-activity-side-section {
  padding: 18px 20px;
  border-bottom: 1px solid var(--border);
}

.pz-activity-side-section:last-child {
  border-bottom: 0;
}

.pz-activity-side-title {
  color: var(--text-1);
  font-size: 13px;
  font-weight: 800;
  margin-bottom: 12px;
}

.pz-activity-meter-row {
  display: grid;
  grid-template-columns: 76px 1fr;
  gap: 14px;
  align-items: center;
}

.pz-activity-meter {
  width: 76px;
  height: 76px;
  border-radius: 50%;
  background: conic-gradient(var(--teal) var(--meter-angle), var(--surface-2) 0);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.pz-activity-meter::after {
  content: "";
  position: absolute;
  inset: 8px;
  border-radius: 50%;
  background: var(--white);
}

.pz-activity-meter span {
  position: relative;
  z-index: 1;
  color: var(--text-1);
  font-family: 'Inter', 'Segoe UI', Arial, sans-serif;
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 0;
  line-height: 1;
  font-variant-numeric: tabular-nums;
}

.pz-activity-copy {
  color: var(--text-3);
  font-size: 12px;
  line-height: 1.55;
}

.pz-activity-copy strong {
  color: var(--text-1);
  font-family: 'Inter', 'Segoe UI', Arial, sans-serif;
  font-variant-numeric: tabular-nums;
}

.pz-timeline {
  display: flex;
  flex-direction: column;
}

.pz-timeline-item {
  display: flex;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid var(--border);
}

.pz-timeline-item:last-child {
  border-bottom: 0;
}

.pz-timeline-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: var(--teal);
  box-shadow: 0 0 0 4px rgba(26,158,117,0.12);
  margin-top: 7px;
  flex-shrink: 0;
}

.pz-timeline-title {
  color: var(--text-1);
  font-size: 13px;
  font-weight: 800;
}

.pz-timeline-sub {
  color: var(--text-3);
  font-size: 12px;
  margin-top: 3px;
  line-height: 1.45;
}

.pz-report-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
  justify-content: flex-end;
}

.pz-report-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 38px;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--white);
  color: var(--text-2);
  padding: 0 13px;
  font-size: 12px;
  font-weight: 800;
  transition: all 0.18s ease;
}

.pz-report-button:hover {
  border-color: rgba(27,110,204,0.35);
  color: var(--blue);
  background: #EFF6FF;
}

.pz-report-button.primary {
  background: var(--teal);
  border-color: var(--teal);
  color: white;
}

.pz-report-button:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.pz-analytics-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
  margin-bottom: 18px;
}

.pz-analytics-card {
  background: var(--white);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow-sm);
  padding: 16px;
  min-height: 128px;
}

.pz-analytics-card-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.pz-analytics-label {
  color: var(--text-3);
  font-size: 11px;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.pz-analytics-value {
  margin-top: 12px;
  font-size: 24px;
  font-weight: 900;
  color: var(--text-1);
}

.pz-analytics-helper {
  margin-top: 7px;
  color: var(--text-3);
  font-size: 12px;
  line-height: 1.4;
}

.pz-analytics-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #EFF6FF;
  color: var(--blue);
}

.pz-report-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.25fr) minmax(320px, 0.75fr);
  gap: 18px;
  margin-bottom: 18px;
}

.pz-trend-list {
  display: grid;
  gap: 12px;
  padding: 18px 20px;
}

.pz-trend-row {
  display: grid;
  grid-template-columns: 86px minmax(0, 1fr) 58px;
  gap: 12px;
  align-items: center;
  font-size: 12px;
  color: var(--text-2);
}

.pz-trend-track {
  height: 10px;
  border-radius: 999px;
  background: var(--surface-2);
  overflow: hidden;
}

.pz-trend-fill {
  height: 100%;
  min-width: 4px;
  border-radius: inherit;
  background: linear-gradient(90deg, var(--blue), var(--teal));
}

.pz-signal-list {
  display: grid;
  gap: 10px;
  padding: 18px 20px;
}

.pz-signal-item {
  display: grid;
  grid-template-columns: 32px minmax(0, 1fr) auto;
  gap: 10px;
  align-items: center;
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 10px;
  background: var(--surface);
}

.pz-signal-icon {
  width: 32px;
  height: 32px;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #FEF3DC;
  color: #92400E;
}

.pz-signal-title {
  font-weight: 900;
  color: var(--text-1);
  font-size: 13px;
}

.pz-signal-sub {
  color: var(--text-3);
  font-size: 11px;
  margin-top: 2px;
}

.pz-guard-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}

.pz-guard-table th,
.pz-guard-table td {
  padding: 12px 14px;
  border-bottom: 1px solid var(--border);
  text-align: left;
  font-size: 12px;
}

.pz-guard-table th {
  color: var(--text-3);
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.pz-guard-table td {
  color: var(--text-2);
  font-weight: 700;
}

.pz-guard-table tr:last-child td {
  border-bottom: 0;
}

.pz-report-empty {
  padding: 18px 20px;
  color: var(--text-3);
  font-size: 13px;
}

@media (max-width: 1180px) {
  .pz-activity-stat-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .pz-analytics-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .pz-report-grid {
    grid-template-columns: 1fr;
  }
  .pz-activity-grid {
    grid-template-columns: 1fr;
  }
  .pz-activity-side-card {
    position: static;
  }
}

@media (max-width: 760px) {
  .pz-activity-header {
    align-items: flex-start;
    flex-direction: column;
  }
  .pz-activity-stat-grid {
    grid-template-columns: 1fr;
  }
  .pz-analytics-grid {
    grid-template-columns: 1fr;
  }
  .pz-report-actions {
    justify-content: stretch;
  }
  .pz-report-button {
    flex: 1 1 150px;
  }
  .pz-trend-row {
    grid-template-columns: 72px minmax(0, 1fr) 44px;
  }
  .pz-activity-toolbar {
    grid-template-columns: 1fr;
  }
  .pz-activity-tabs {
    overflow-x: auto;
  }
  .pz-activity-card-header {
    align-items: flex-start;
    flex-direction: column;
  }
}
`;

interface ActivityLog {
  id: string;
  childName: string;
  childGrade: string;
  familyName: string;
  pickedBy: string;
  relation: string;
  time: string;
  date: string;
  qrCode: string;
  status: "completed" | "approved" | "cancelled" | "pending";
}

type StatusFilter = "all" | ActivityLog["status"];

type AnalyticsData = {
  range: { start: string; end: string; lateCutoff: string };
  operational: {
    totalPickups: number;
    completedPickups: number;
    approvedPickups: number;
    pendingPickups: number;
    rejectedPickups: number;
    studentsServed: number;
    guardiansInvolved: number;
    activeGuards: number;
    latePickups: number;
    avgApprovalSeconds: number;
    avgApprovalTime: string;
    avgCompletionSeconds: number;
    avgCompletionTime: string;
  };
  monthlyTrends: Array<{
    month: string;
    label: string;
    total: number;
    completed: number;
    rejected: number;
    pending: number;
    approved: number;
  }>;
  peakPickupTime: { hour: number | null; label: string; scans: number };
  hourlyDistribution: Array<{ hour: number; label: string; scans: number }>;
  security: {
    rejectedPickupAttempts: number;
    revokedQrUsageAttempts: number;
    unauthorizedScanAttempts: number;
    invalidQrAttempts: number;
    expiredQrAttempts: number;
    tenantMismatchAttempts: number;
    unauthorizedDeviceAttempts: number;
  };
  latePickupReports: Array<{ id: number; studentName: string; grade?: string; guardName: string; scannedAt: string; status: string }>;
  rejectedAttempts: Array<{ id: number; studentName: string; guardName: string; reason: string; rejectedAt: string }>;
  securityEvents: Array<{ id: number; type: string; message: string; ipAddress: string; guardName: string; createdAt: string }>;
  guardActivitySummary: Array<{
    guardId: number | null;
    guardName: string;
    totalScans: number;
    completedPickups: number;
    approvedPickups: number;
    pendingPickups: number;
    rejectedPickups: number;
    avgCompletionTime: string;
    lastScanAt: string;
  }>;
};

function todayLabel() {
  return new Date().toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function initials(name?: string) {
  if (!name) return "PZ";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function statusTone(status: ActivityLog["status"]) {
  if (status === "completed") return "green";
  if (status === "approved") return "green";
  if (status === "pending") return "amber";
  return "red";
}

function statusLabel(status: ActivityLog["status"]) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

function buildDateQuery(dateRange: { start: string; end: string }) {
  const params = new URLSearchParams();
  if (dateRange.start) params.set("start", dateRange.start);
  if (dateRange.end) params.set("end", dateRange.end);
  const query = params.toString();
  return query ? `?${query}` : "";
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export default function Activity() {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [analyticsEnabled, setAnalyticsEnabled] = useState<boolean | null>(null);
  const [exporting, setExporting] = useState<"csv" | "daily" | "monthly" | null>(null);
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    grade: "",
    status: "all" as StatusFilter,
  });

  useEffect(() => {
    const fetchPackageAccess = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(`${API_BASE_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to load package access");
        }

        setAnalyticsEnabled(data.featureToggles?.analytics !== false);
      } catch (_err) {
        setAnalyticsEnabled(true);
      }
    };

    fetchPackageAccess();
  }, []);

  useEffect(() => {
    const fetchActivity = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(`${API_BASE_URL}/pickups?limit=200`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();

        if (!response.ok) {
          if (isQuietEmptyStateResponse(response, data)) {
            setActivities([]);
            return;
          }
          throw new Error(data.error || "Failed to load pickup activity");
        }

        setActivities(
          (data || []).map((item: any) => {
            const scannedAt = item.scannedAt ? new Date(item.scannedAt) : null;
            const status =
              item.status === "rejected"
                ? "cancelled"
                : item.status === "approved"
                  ? "approved"
                  : item.status === "completed"
                    ? "completed"
                    : item.status === "cancelled"
                      ? "cancelled"
                      : "pending";

            return {
              id: String(item.id),
              childName: item.studentName || "Student",
              childGrade: item.grade || "N/A",
              familyName: item.parentName || "Family",
              pickedBy: item.guardianName || "Parent",
              relation: item.guardianRelation || "Parent",
              time: scannedAt
                ? scannedAt.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
                : item.scannedAtDisplay || "",
              date: scannedAt ? scannedAt.toISOString().slice(0, 10) : "",
              qrCode: item.qrCode || `QR-${item.qrAssignmentId || item.id}`,
              status,
            } as ActivityLog;
          })
        );
      } catch (err: any) {
        toast.error(err.message || "Failed to load pickup activity");
      } finally {
        setLoading(false);
      }
    };

    fetchActivity();
  }, []);

  useEffect(() => {
    if (analyticsEnabled === null) return;

    if (!analyticsEnabled) {
      setAnalytics(null);
      setAnalyticsLoading(false);
      return;
    }

    const fetchAnalytics = async () => {
      setAnalyticsLoading(true);
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(`${API_BASE_URL}/pickups/analytics${buildDateQuery(dateRange)}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();

        if (!response.ok) {
          if (isQuietEmptyStateResponse(response, data)) {
            setAnalytics(null);
            return;
          }
          throw new Error(data.error || "Failed to load pickup analytics");
        }

        setAnalytics(data);
      } catch (err: any) {
        setAnalytics(null);
        toast.error(err.message || "Failed to load pickup analytics");
      } finally {
        setAnalyticsLoading(false);
      }
    };

    fetchAnalytics();
  }, [analyticsEnabled, dateRange.end, dateRange.start]);

  const filteredActivities = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return activities.filter((activity) => {
      const haystack = [
        activity.childName,
        activity.familyName,
        activity.pickedBy,
        activity.relation,
        activity.qrCode,
      ]
        .join(" ")
        .toLowerCase();
      const searchMatches = !term || haystack.includes(term);
      const gradeMatches = !filters.grade || activity.childGrade === filters.grade;
      const statusMatches = filters.status === "all" || activity.status === filters.status;
      const startMatches = !dateRange.start || activity.date >= dateRange.start;
      const endMatches = !dateRange.end || activity.date <= dateRange.end;

      return searchMatches && gradeMatches && statusMatches && startMatches && endMatches;
    });
  }, [activities, dateRange.end, dateRange.start, filters.grade, filters.status, searchTerm]);

  const completedCount = activities.filter((activity) => activity.status === "completed").length;
  const pendingCount = activities.filter((activity) => activity.status === "pending").length;
  const cancelledCount = activities.filter((activity) => activity.status === "cancelled").length;
  const completedRate = activities.length ? Math.round((completedCount / activities.length) * 100) : 0;
  const grades = Array.from(new Set(activities.map((activity) => activity.childGrade))).sort();
  const gradeOptions = [
    { value: "", label: "All Grades" },
    ...grades.map((grade) => ({ value: grade, label: `Grade ${grade}` })),
  ];

  const statCards = [
    {
      label: "Total Events",
      value: activities.length,
      helper: loading ? "Loading activity" : "Activity records loaded",
      icon: ActivityIcon,
      tone: { background: "#EFF6FF", color: "#1B6ECC" },
      glow: "rgba(27,110,204,0.16)",
      action: () => setFilters((current) => ({ ...current, status: "all" })),
    },
    {
      label: "Completed",
      value: completedCount,
      helper: "Successful pickups",
      icon: CheckCircle2,
      tone: { background: "#E1F5EE", color: "#1A9E75" },
      glow: "rgba(26,158,117,0.16)",
      action: () => setFilters((current) => ({ ...current, status: "completed" })),
    },
    {
      label: "Pending",
      value: pendingCount,
      helper: "Awaiting completion",
      icon: Clock3,
      tone: { background: "#FEF3DC", color: "#EF9F27" },
      glow: "rgba(239,159,39,0.16)",
      action: () => setFilters((current) => ({ ...current, status: "pending" })),
    },
    {
      label: "Cancelled",
      value: cancelledCount,
      helper: "Stopped or denied events",
      icon: XCircle,
      tone: { background: "#FDEAEA", color: "#E24B4A" },
      glow: "rgba(226,75,74,0.14)",
      action: () => setFilters((current) => ({ ...current, status: "cancelled" })),
    },
  ];

  const statusTabs: Array<{ key: StatusFilter; label: string }> = [
    { key: "all", label: "All" },
    { key: "completed", label: "Completed" },
    { key: "approved", label: "Approved" },
    { key: "pending", label: "Pending" },
    { key: "cancelled", label: "Cancelled" },
  ];

  const resetFilters = () => {
    setDateRange({ start: "", end: "" });
    setSearchTerm("");
    setFilters({ grade: "", status: "all" });
  };

  const downloadReport = async (kind: "csv" | "daily" | "monthly") => {
    if (!analyticsEnabled) return;

    setExporting(kind);
    try {
      const token = localStorage.getItem("token");
      let url = "";
      let filename = "";

      if (kind === "csv") {
        const params = new URLSearchParams();
        if (dateRange.start) params.set("start", dateRange.start);
        if (dateRange.end) params.set("end", dateRange.end);
        if (filters.status !== "all") params.set("status", filters.status);
        url = `${API_BASE_URL}/pickups/reports/export.csv?${params.toString()}`;
        filename = `pickup-logs-${dateRange.start || "start"}-${dateRange.end || "today"}.csv`;
      } else if (kind === "daily") {
        const date = dateRange.end || todayDate();
        url = `${API_BASE_URL}/pickups/reports/summary.pdf?period=daily&date=${encodeURIComponent(date)}`;
        filename = `pickup-daily-report-${date}.pdf`;
      } else {
        const month = (dateRange.end || todayDate()).slice(0, 7);
        url = `${API_BASE_URL}/pickups/reports/summary.pdf?period=monthly&month=${encodeURIComponent(month)}`;
        filename = `pickup-monthly-report-${month}.pdf`;
      }

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Report export failed");
      }

      downloadBlob(await response.blob(), filename);
      toast.success(kind === "csv" ? "CSV export downloaded" : "PDF report downloaded");
    } catch (err: any) {
      toast.error(err.message || "Report export failed");
    } finally {
      setExporting(null);
    }
  };

  const maxTrendTotal = Math.max(1, ...(analytics?.monthlyTrends || []).map((item) => item.total));
  const analyticsCards = [
    {
      label: "Peak Pickup Time",
      value: analytics?.peakPickupTime.label || "No scans",
      helper: `${analytics?.peakPickupTime.scans || 0} scan(s) in the busiest hour`,
      icon: BarChart3,
    },
    {
      label: "Rejected Attempts",
      value: analytics?.security.rejectedPickupAttempts || 0,
      helper: "Admin rejected pickup requests",
      icon: XCircle,
    },
    {
      label: "Revoked QR Usage",
      value: analytics?.security.revokedQrUsageAttempts || 0,
      helper: "Scans blocked because QR was revoked",
      icon: ShieldAlert,
    },
    {
      label: "Unauthorized Scans",
      value: analytics?.security.unauthorizedScanAttempts || 0,
      helper: "Unauthorized device or tenant mismatch attempts",
      icon: ShieldAlert,
    },
    {
      label: "Late Pickups",
      value: analytics?.operational.latePickups || 0,
      helper: `After ${analytics?.range.lateCutoff || "15:30:00"}`,
      icon: TimerReset,
    },
    {
      label: "Avg Approval Time",
      value: analytics?.operational.avgApprovalTime || "0m",
      helper: "From scan to school admin approval",
      icon: Clock3,
    },
    {
      label: "Avg Completion Time",
      value: analytics?.operational.avgCompletionTime || "0m",
      helper: "From scan to final guard confirmation",
      icon: CheckCircle2,
    },
    {
      label: "Guard Activity",
      value: analytics?.operational.activeGuards || 0,
      helper: "Guards with pickup activity in range",
      icon: UsersRound,
    },
  ];

  if (loading && activities.length === 0) {
    return (
      <DashboardLayout role="admin">
        <AdminPageSkeleton variant="activity" label="Loading activity logs" />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="admin">
      <style>{ADMIN_ACTIVITY_CSS}</style>
      <div className="pz-activity-page">
        <div className="pz-activity-header">
          <div>
            <div className="pz-activity-kicker">School Admin</div>
            <h1 className="pz-activity-title">Activity Logs</h1>
            <div className="pz-activity-subtitle">
              Review pickup events, QR usage, family activity, and event status.
            </div>
          </div>
          <div className="pz-activity-date-pill">
            <CalendarDays size={15} aria-hidden="true" />
            {todayLabel()}
          </div>
        </div>

        <div className="pz-activity-stat-grid">
          {statCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <button
                type="button"
                className="pz-activity-stat-card"
                key={stat.label}
                style={{ "--stat-glow": stat.glow } as CSSProperties}
                onClick={stat.action}
                aria-label={`Filter by ${stat.label}`}
              >
                <div className="pz-activity-stat-top">
                  <div className="pz-activity-stat-label">{stat.label}</div>
                  <div className="pz-activity-stat-icon" style={stat.tone}>
                    <Icon size={19} strokeWidth={2.4} aria-hidden="true" />
                  </div>
                </div>
                <div className="pz-activity-stat-value">{stat.value}</div>
                <div className="pz-activity-stat-helper">
                  <CheckCircle2 size={14} aria-hidden="true" />
                  <span>{stat.helper}</span>
                </div>
              </button>
            );
          })}
        </div>

        <div className="pz-activity-controls">
          <div className="pz-activity-toolbar">
            <label className="pz-activity-search">
              <Search size={17} color="#8A96A8" aria-hidden="true" />
              <input
                type="search"
                placeholder="Search by child, family, pickup person, or QR code..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </label>

            <div className="pz-activity-tabs" aria-label="Activity status filters">
              {statusTabs.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  className={`pz-activity-tab ${filters.status === tab.key ? "active" : ""}`}
                  onClick={() => setFilters((prev) => ({ ...prev, status: tab.key }))}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="pz-activity-filter-row">
            <div className="pz-activity-filter-label">
              <Filter size={14} aria-hidden="true" />
              Filters
            </div>
            <AdminDatePicker
              value={dateRange.start}
              onChange={(value) => setDateRange((prev) => ({ ...prev, start: value }))}
              className="compact"
              aria-label="Start date"
            />
            <AdminDatePicker
              value={dateRange.end}
              onChange={(value) => setDateRange((prev) => ({ ...prev, end: value }))}
              className="compact"
              aria-label="End date"
            />
            <AdminSelect
              value={filters.grade}
              onChange={(value) => setFilters((prev) => ({ ...prev, grade: value }))}
              options={gradeOptions}
              className="compact"
              aria-label="Grade filter"
            />
            <button type="button" className="pz-activity-reset" onClick={resetFilters}>
              Reset filters
            </button>
          </div>
        </div>

        {analyticsEnabled === false ? (
          <section className="pz-activity-feature-lock" aria-labelledby="activity-analytics-locked-title">
            <div className="pz-activity-feature-lock-icon">
              <ShieldAlert size={21} aria-hidden="true" />
            </div>
            <div>
              <div id="activity-analytics-locked-title" className="pz-activity-feature-lock-title">
                Analytics & reports are not included
              </div>
              <div className="pz-activity-feature-lock-copy">
                Pickup activity logs remain available for this package. Analytics cards, trends, security
                summaries, guard performance reports, and CSV/PDF report exports are disabled until Analytics is
                added to the school package.
              </div>
            </div>
          </section>
        ) : (
          <>
            <div className="pz-activity-controls">
              <div className="pz-activity-toolbar">
                <div>
                  <div className="pz-activity-card-title">Analytics & Reports</div>
                  <div className="pz-activity-card-subtitle">
                    {analytics?.range
                      ? `${analytics.range.start} to ${analytics.range.end}`
                      : "School-scoped pickup analytics"}
                  </div>
                </div>
                <div className="pz-report-actions">
                  <button
                    type="button"
                    className="pz-report-button primary"
                    onClick={() => downloadReport("csv")}
                    disabled={Boolean(exporting)}
                  >
                    <Download size={15} aria-hidden="true" />
                    {exporting === "csv" ? "Exporting..." : "CSV Export"}
                  </button>
                  <button
                    type="button"
                    className="pz-report-button"
                    onClick={() => downloadReport("daily")}
                    disabled={Boolean(exporting)}
                  >
                    <FileText size={15} aria-hidden="true" />
                    {exporting === "daily" ? "Preparing..." : "PDF Daily"}
                  </button>
                  <button
                    type="button"
                    className="pz-report-button"
                    onClick={() => downloadReport("monthly")}
                    disabled={Boolean(exporting)}
                  >
                    <FileText size={15} aria-hidden="true" />
                    {exporting === "monthly" ? "Preparing..." : "PDF Monthly"}
                  </button>
                </div>
              </div>
            </div>

            <div className="pz-analytics-grid">
              {analyticsCards.map((card) => {
                const Icon = card.icon;
                return (
                  <div className="pz-analytics-card" key={card.label}>
                    <div className="pz-analytics-card-top">
                      <div className="pz-analytics-label">{card.label}</div>
                      <div className="pz-analytics-icon">
                        <Icon size={18} strokeWidth={2.4} aria-hidden="true" />
                      </div>
                    </div>
                    <div className="pz-analytics-value">{analyticsLoading ? "..." : card.value}</div>
                    <div className="pz-analytics-helper">{card.helper}</div>
                  </div>
                );
              })}
            </div>

            <div className="pz-report-grid">
          <section className="pz-activity-card">
            <div className="pz-activity-card-header">
              <div>
                <div className="pz-activity-card-title">Monthly Pickup Trends</div>
                <div className="pz-activity-card-subtitle">Total, completed, rejected, pending, and approved pickups by month</div>
              </div>
              <span className="pz-activity-badge">
                <TrendingUp size={13} aria-hidden="true" />
                Trend
              </span>
            </div>
            <div className="pz-trend-list">
              {(analytics?.monthlyTrends || []).map((item) => (
                <div className="pz-trend-row" key={item.month}>
                  <strong>{item.label}</strong>
                  <div className="pz-trend-track" aria-label={`${item.label} pickup trend`}>
                    <div
                      className="pz-trend-fill"
                      style={{ width: `${Math.max(4, Math.round((item.total / maxTrendTotal) * 100))}%` }}
                    />
                  </div>
                  <span>{item.total}</span>
                </div>
              ))}
              {!analytics?.monthlyTrends?.length && (
                <div className="pz-report-empty">No monthly pickup trend data is available for this range.</div>
              )}
            </div>
          </section>

          <section className="pz-activity-card">
            <div className="pz-activity-card-header">
              <div>
                <div className="pz-activity-card-title">Security Analytics</div>
                <div className="pz-activity-card-subtitle">Rejected, revoked, unauthorized, invalid, and expired QR signals</div>
              </div>
              <ShieldAlert size={19} color="#EF9F27" aria-hidden="true" />
            </div>
            <div className="pz-signal-list">
              {[
                ["Rejected pickup attempts", analytics?.security.rejectedPickupAttempts || 0],
                ["Revoked QR usage attempts", analytics?.security.revokedQrUsageAttempts || 0],
                ["Unauthorized device attempts", analytics?.security.unauthorizedDeviceAttempts || 0],
                ["Tenant mismatch attempts", analytics?.security.tenantMismatchAttempts || 0],
                ["Invalid QR attempts", analytics?.security.invalidQrAttempts || 0],
                ["Expired QR attempts", analytics?.security.expiredQrAttempts || 0],
              ].map(([label, value]) => (
                <div className="pz-signal-item" key={String(label)}>
                  <div className="pz-signal-icon">
                    <ShieldAlert size={15} aria-hidden="true" />
                  </div>
                  <div>
                    <div className="pz-signal-title">{label}</div>
                    <div className="pz-signal-sub">School-scoped security event count</div>
                  </div>
                  <strong>{value}</strong>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="pz-report-grid">
          <section className="pz-activity-card">
            <div className="pz-activity-card-header">
              <div>
                <div className="pz-activity-card-title">Guard Activity Summary</div>
                <div className="pz-activity-card-subtitle">Scan volume, approvals, rejections, and completion time by guard</div>
              </div>
              <UsersRound size={19} color="#1A9E75" aria-hidden="true" />
            </div>
            <div className="pz-activity-table-wrap">
              <table className="pz-guard-table">
                <thead>
                  <tr>
                    <th>Guard</th>
                    <th>Scans</th>
                    <th>Completed</th>
                    <th>Rejected</th>
                    <th>Avg Completion</th>
                    <th>Last Scan</th>
                  </tr>
                </thead>
                <tbody>
                  {(analytics?.guardActivitySummary || []).map((guard) => (
                    <tr key={`${guard.guardId}-${guard.guardName}`}>
                      <td>{guard.guardName}</td>
                      <td>{guard.totalScans}</td>
                      <td>{guard.completedPickups}</td>
                      <td>{guard.rejectedPickups}</td>
                      <td>{guard.avgCompletionTime}</td>
                      <td>{guard.lastScanAt || "N/A"}</td>
                    </tr>
                  ))}
                  {!analytics?.guardActivitySummary?.length && (
                    <tr>
                      <td colSpan={6}>
                        <div className="pz-report-empty">No guard activity is available for this range.</div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className="pz-activity-card">
            <div className="pz-activity-card-header">
              <div>
                <div className="pz-activity-card-title">Late Pickup Reports</div>
                <div className="pz-activity-card-subtitle">Recent pickups after {analytics?.range.lateCutoff || "15:30:00"}</div>
              </div>
              <TimerReset size={19} color="#EF9F27" aria-hidden="true" />
            </div>
            <div className="pz-signal-list">
              {(analytics?.latePickupReports || []).slice(0, 6).map((late) => (
                <div className="pz-signal-item" key={late.id}>
                  <div className="pz-signal-icon">
                    <Clock3 size={15} aria-hidden="true" />
                  </div>
                  <div>
                    <div className="pz-signal-title">{late.studentName}</div>
                    <div className="pz-signal-sub">{late.scannedAt} / {late.guardName}</div>
                  </div>
                  <strong>{late.status}</strong>
                </div>
              ))}
              {!analytics?.latePickupReports?.length && (
                <div className="pz-report-empty">No late pickups are recorded in this range.</div>
              )}
            </div>
          </section>
        </div>
          </>
        )}

        <div className="pz-activity-grid">
          <section className="pz-activity-card">
            <div className="pz-activity-card-header">
              <div>
                <div className="pz-activity-card-title">Pickup Activity</div>
                <div className="pz-activity-card-subtitle">{filteredActivities.length} matching records</div>
              </div>
              <span className="pz-activity-badge">
                <span className="pz-activity-dot" />
                {filters.status === "all" ? "All events" : statusLabel(filters.status)}
              </span>
            </div>

            <div className="pz-activity-table-wrap">
              <table className="pz-activity-table">
                <thead>
                  <tr>
                    <th>Child Details</th>
                    <th>Picked By</th>
                    <th>Time</th>
                    <th>QR Code</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredActivities.map((activity) => (
                    <tr key={activity.id}>
                      <td>
                        <div className="pz-activity-person">
                          <div className="pz-activity-avatar">{initials(activity.childName)}</div>
                          <div>
                            <div className="pz-activity-name">{activity.childName}</div>
                            <div className="pz-activity-muted">
                              {activity.familyName} - Grade {activity.childGrade}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="pz-activity-name">{activity.pickedBy}</div>
                        <div className="pz-activity-muted">{activity.relation}</div>
                      </td>
                      <td>
                        <div className="pz-activity-name">{activity.time}</div>
                        <div className="pz-activity-muted">{activity.date}</div>
                      </td>
                      <td>
                        <div className="pz-activity-name">{activity.qrCode}</div>
                      </td>
                      <td>
                        <span className={`pz-status-badge ${statusTone(activity.status)}`}>
                          <span className="pz-activity-dot" />
                          {statusLabel(activity.status)}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {!filteredActivities.length && (
                    <tr>
                      <td colSpan={5}>
                        <div className="pz-activity-empty">
                          <div className="pz-activity-empty-icon">
                            <Search size={22} aria-hidden="true" />
                          </div>
                          <strong>No activity matches these filters.</strong>
                          <span>Try a different date range, grade, status, or search term.</span>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <aside className="pz-activity-side-card">
            <div className="pz-activity-card-header">
              <div>
                <div className="pz-activity-card-title">Dismissal Snapshot</div>
                <div className="pz-activity-card-subtitle">Current activity summary</div>
              </div>
              <span className="pz-activity-badge">
                <ActivityIcon size={13} aria-hidden="true" />
                Live
              </span>
            </div>

            <div className="pz-activity-side-section">
              <div className="pz-activity-meter-row">
                <div
                  className="pz-activity-meter"
                  style={{ "--meter-angle": `${completedRate * 3.6}deg` } as CSSProperties}
                >
                  <span>{completedRate}%</span>
                </div>
                <div className="pz-activity-copy">
                  <strong>{completedCount}</strong> completed events out of <strong>{activities.length}</strong>.
                  Pickup status is loaded from the school-scoped workflow records.
                </div>
              </div>
            </div>

            <div className="pz-activity-side-section">
              <div className="pz-activity-side-title">Recent Timeline</div>
              <div className="pz-timeline">
                {filteredActivities.slice(0, 5).map((activity) => (
                  <div className="pz-timeline-item" key={`timeline-${activity.id}`}>
                    <div className="pz-timeline-dot" />
                    <div>
                      <div className="pz-timeline-title">{activity.childName}</div>
                      <div className="pz-timeline-sub">
                        {activity.pickedBy} scanned {activity.qrCode} at {activity.time}
                      </div>
                    </div>
                  </div>
                ))}
                {!filteredActivities.length && <div className="pz-activity-copy">No timeline items to show.</div>}
              </div>
            </div>

            <div className="pz-activity-side-section">
              <div className="pz-activity-side-title">Rejected Attempts</div>
              {analyticsEnabled === false ? (
                <div className="pz-activity-copy">Analytics is not included in this package.</div>
              ) : (
                <div className="pz-timeline">
                  {(analytics?.rejectedAttempts || []).slice(0, 4).map((attempt) => (
                    <div className="pz-timeline-item" key={`rejected-${attempt.id}`}>
                      <div className="pz-timeline-dot" style={{ background: "#E24B4A" }} />
                      <div>
                        <div className="pz-timeline-title">{attempt.studentName}</div>
                        <div className="pz-timeline-sub">
                          {attempt.rejectedAt} / {attempt.reason}
                        </div>
                      </div>
                    </div>
                  ))}
                  {!analytics?.rejectedAttempts?.length && (
                    <div className="pz-activity-copy">No rejected pickup attempts in this range.</div>
                  )}
                </div>
              )}
            </div>

            <div className="pz-activity-side-section">
              <div className="pz-activity-side-title">Security Events</div>
              {analyticsEnabled === false ? (
                <div className="pz-activity-copy">Analytics is not included in this package.</div>
              ) : (
                <div className="pz-timeline">
                  {(analytics?.securityEvents || []).slice(0, 4).map((event) => (
                    <div className="pz-timeline-item" key={`security-${event.id}`}>
                      <div className="pz-timeline-dot" style={{ background: "#EF9F27" }} />
                      <div>
                        <div className="pz-timeline-title">{event.type.replace(/_/g, " ")}</div>
                        <div className="pz-timeline-sub">
                          {event.createdAt} / {event.guardName} / {event.message}
                        </div>
                      </div>
                    </div>
                  ))}
                  {!analytics?.securityEvents?.length && (
                    <div className="pz-activity-copy">No revoked, unauthorized, invalid, or expired QR security events in this range.</div>
                  )}
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </DashboardLayout>
  );
}
