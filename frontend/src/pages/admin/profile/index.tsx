import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Eye,
  FileCheck2,
  Filter,
  GraduationCap,
  Mail,
  Phone,
  RefreshCw,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  UserRound,
  UserRoundCheck,
  UsersRound,
  X,
  XCircle,
} from "lucide-react";
import DashboardLayout from "@/components/layouts/dashboard-layout";
import type { Family } from "./types";
import FamilyView from "./components/FamilyView";
import { API_BASE_URL } from "@/lib/api/link";
import { toast } from "@/components/ui/toast";
import { useNavigate } from "react-router-dom";
import { AdminSelect } from "@/components/ui/admin-controls";
import AdminPageSkeleton from "@/components/ui/AdminPageSkeleton";
import { isQuietEmptyStateResponse } from "@/lib/api/quietEmptyState";

const ADMIN_PROFILES_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Inter:wght@400;500;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,300&display=swap');

.pz-profiles-page {
  --navy: #071D3B;
  --navy-mid: #0B2E5A;
  --navy-light: #123B75;
  --blue: #1B6ECC;
  --blue-light: #3D8FE8;
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
  --shadow-md: 0 4px 16px rgba(0,0,0,0.08);
  color: var(--text-1);
  font-family: 'DM Sans', "Segoe UI", Arial, sans-serif;
}

.pz-profiles-page,
.pz-profiles-page * {
  box-sizing: border-box;
}

.pz-profiles-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 18px;
  margin-bottom: 24px;
}

.pz-profiles-kicker {
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

.pz-profiles-kicker::before {
  content: "";
  width: 18px;
  height: 2px;
  border-radius: 999px;
  background: var(--teal);
}

.pz-profiles-title {
  font-family: 'Inter', sans-serif;
  font-size: clamp(28px, 3.2vw, 42px);
  line-height: 1.04;
  letter-spacing: -0.025em;
  font-weight: 700;
  margin: 0;
  color: var(--text-1);
}

.pz-profiles-subtitle {
  color: var(--text-3);
  font-size: 14px;
  margin-top: 8px;
}

.pz-profiles-header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.pz-profiles-date-pill,
.pz-profiles-refresh {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: var(--white);
  border: 1px solid var(--border);
  color: var(--text-2);
  border-radius: 999px;
  padding: 9px 14px;
  font-size: 13px;
  font-weight: 700;
  box-shadow: var(--shadow-sm);
  white-space: nowrap;
}

.pz-profiles-refresh {
  cursor: pointer;
  border-radius: 10px;
  transition: all 0.18s ease;
}

.pz-profiles-refresh:hover {
  color: var(--blue);
  border-color: rgba(27,110,204,0.36);
  background: #EFF6FF;
}

.pz-profile-stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
  margin-bottom: 18px;
}

.pz-profile-stat {
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

button.pz-profile-stat {
  width: 100%;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.pz-profile-stat::after {
  content: "";
  position: absolute;
  inset: auto -34px -70px auto;
  width: 140px;
  height: 140px;
  background: radial-gradient(circle, var(--stat-glow) 0%, transparent 67%);
  pointer-events: none;
}

.pz-profile-stat-top {
  display: flex;
  justify-content: space-between;
  gap: 14px;
  align-items: flex-start;
}

.pz-profile-stat-label {
  color: var(--text-3);
  font-size: 12px;
  font-weight: 700;
}

.pz-profile-stat-icon {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.pz-profile-stat-value {
  font-family: 'Inter', 'Segoe UI', Arial, sans-serif;
  font-size: 34px;
  font-weight: 700;
  line-height: 1;
  letter-spacing: 0;
  color: var(--text-1);
  font-variant-numeric: tabular-nums;
}

.pz-profile-stat-helper {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--text-3);
  font-size: 12px;
  font-weight: 500;
}

.pz-profiles-control-card {
  background: var(--white);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 16px;
  box-shadow: var(--shadow-sm);
  margin-bottom: 18px;
}

.pz-profiles-toolbar {
  display: grid;
  grid-template-columns: minmax(260px, 1fr) auto;
  align-items: center;
  gap: 14px;
}

.pz-profiles-search {
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

.pz-profiles-search:focus-within {
  border-color: var(--blue);
  box-shadow: 0 0 0 3px rgba(27,110,204,0.08);
}

.pz-profiles-search input {
  width: 100%;
  border: 0;
  outline: 0;
  background: transparent;
  color: var(--text-1);
  font: inherit;
  font-size: 14px;
}

.pz-profiles-search input::placeholder {
  color: var(--text-3);
}

.pz-status-tabs {
  display: flex;
  gap: 5px;
  padding: 4px;
  border-radius: 11px;
  background: var(--surface);
  border: 1px solid var(--border);
}

.pz-status-tab {
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

.pz-status-tab.active {
  background: var(--white);
  color: var(--text-1);
  box-shadow: var(--shadow-sm);
}

.pz-profiles-filter-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  padding-top: 14px;
  margin-top: 14px;
  border-top: 1px solid var(--border);
}

.pz-profiles-filter-label {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  color: var(--text-3);
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.pz-profile-select,
.pz-filter-reset {
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

.pz-filter-reset {
  cursor: pointer;
  transition: all 0.18s ease;
}

.pz-filter-reset:hover {
  color: var(--blue);
  border-color: rgba(27,110,204,0.36);
}

.pz-profiles-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(320px, 0.42fr);
  gap: 18px;
  align-items: start;
}

.pz-profiles-main-card,
.pz-profiles-side-card {
  background: var(--white);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
}

.pz-profiles-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 18px 20px;
  border-bottom: 1px solid var(--border);
}

.pz-profiles-card-title {
  font-family: 'Inter', sans-serif;
  font-size: 16px;
  font-weight: 700;
  letter-spacing: -0.025em;
  color: var(--text-1);
}

.pz-profiles-card-subtitle {
  color: var(--text-3);
  font-size: 12px;
  margin-top: 4px;
}

.pz-profiles-count-badge,
.pz-status-badge,
.pz-mini-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 800;
  white-space: nowrap;
}

.pz-profiles-count-badge {
  color: #065F46;
  background: var(--teal-pale);
  padding: 5px 10px;
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

.pz-status-badge.gray {
  color: var(--text-2);
  background: var(--surface-2);
}

.pz-badge-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}

.pz-profile-list {
  display: flex;
  flex-direction: column;
}

.pz-profile-card {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 18px;
  padding: 18px 20px;
  border-bottom: 1px solid var(--border);
  transition: background 0.18s ease;
}

.pz-profile-card:last-child {
  border-bottom: 0;
}

.pz-profile-card:hover {
  background: #FAFBFD;
}

.pz-profile-identity {
  display: flex;
  gap: 14px;
  min-width: 0;
}

.pz-profile-avatar {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  background: linear-gradient(135deg, var(--navy), var(--navy-light));
  color: var(--white);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Inter', sans-serif;
  font-weight: 800;
  font-size: 13px;
  flex-shrink: 0;
}

.pz-profile-text {
  min-width: 0;
  flex: 1;
}

.pz-profile-title-row {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  flex-wrap: wrap;
}

.pz-profile-name {
  color: var(--text-1);
  font-weight: 800;
  font-size: 15px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pz-profile-subline {
  color: var(--text-3);
  font-size: 12px;
  margin-top: 5px;
  display: flex;
  align-items: center;
  gap: 7px;
  flex-wrap: wrap;
}

.pz-profile-contact-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  margin-top: 12px;
  max-width: 640px;
}

.pz-contact-pill,
.pz-child-pill {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  min-width: 0;
  color: var(--text-2);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 9px;
  padding: 7px 9px;
  font-size: 12px;
  font-weight: 600;
}

.pz-contact-pill span,
.pz-child-pill span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pz-profile-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  margin-top: 12px;
}

.pz-child-pill {
  background: #F8FAFC;
}

.pz-profile-actions {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
  min-width: 210px;
}

.pz-profile-action {
  min-height: 36px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  border: 1px solid var(--border);
  border-radius: 9px;
  background: var(--white);
  color: var(--text-2);
  padding: 0 12px;
  font-size: 12px;
  font-weight: 800;
  cursor: pointer;
  font-family: 'DM Sans', sans-serif;
  transition: all 0.18s ease;
}

.pz-profile-action:hover {
  border-color: rgba(27,110,204,0.36);
  color: var(--blue);
  background: #EFF6FF;
}

.pz-profile-action.approve {
  color: #065F46;
  background: var(--teal-pale);
  border-color: rgba(26,158,117,0.22);
}

.pz-profile-action.approve:hover {
  color: var(--white);
  background: var(--teal);
}

.pz-profile-action.deny {
  color: #991B1B;
  background: var(--red-pale);
  border-color: rgba(226,75,74,0.22);
}

.pz-profile-action.deny:hover {
  color: var(--white);
  background: var(--red);
}

.pz-profiles-empty {
  min-height: 320px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  text-align: center;
  color: var(--text-3);
  padding: 40px 22px;
}

.pz-profiles-empty-icon {
  width: 54px;
  height: 54px;
  border-radius: 16px;
  background: var(--surface);
  border: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--teal);
}

.pz-profiles-side-card {
  position: sticky;
  top: 0;
}

.pz-side-section {
  padding: 18px 20px;
  border-bottom: 1px solid var(--border);
}

.pz-side-section:last-child {
  border-bottom: 0;
}

.pz-side-section-title {
  color: var(--text-1);
  font-size: 13px;
  font-weight: 800;
  margin-bottom: 12px;
}

.pz-review-meter {
  display: grid;
  grid-template-columns: 86px 1fr;
  gap: 14px;
  align-items: center;
}

.pz-review-ring {
  width: 86px;
  height: 86px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: conic-gradient(var(--teal) var(--review-angle), var(--surface-2) 0);
  position: relative;
}

.pz-review-ring::after {
  content: "";
  position: absolute;
  inset: 9px;
  border-radius: 50%;
  background: var(--white);
}

.pz-review-ring span {
  position: relative;
  z-index: 1;
  color: var(--text-1);
  font-family: 'Inter', 'Segoe UI', Arial, sans-serif;
  font-weight: 700;
  font-size: 19px;
  letter-spacing: 0;
  line-height: 1;
  font-variant-numeric: tabular-nums;
}

.pz-review-copy {
  color: var(--text-3);
  font-size: 12px;
  line-height: 1.55;
}

.pz-review-copy strong {
  color: var(--text-1);
  font-family: 'Inter', 'Segoe UI', Arial, sans-serif;
  font-variant-numeric: tabular-nums;
}

.pz-queue-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.pz-queue-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 11px;
  border: 1px solid var(--border);
  border-radius: 11px;
  background: #FAFBFD;
}

.pz-queue-avatar {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: var(--navy-mid);
  color: var(--white);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Inter', sans-serif;
  font-size: 11px;
  font-weight: 800;
  flex-shrink: 0;
}

.pz-queue-text {
  min-width: 0;
  flex: 1;
}

.pz-queue-name {
  color: var(--text-1);
  font-size: 13px;
  font-weight: 800;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pz-queue-sub {
  color: var(--text-3);
  font-size: 11px;
  margin-top: 2px;
}

.pz-queue-view {
  width: 34px;
  height: 34px;
  border: 1px solid var(--border);
  border-radius: 9px;
  background: var(--white);
  color: var(--blue);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.pz-mini-badge {
  padding: 4px 8px;
  background: var(--surface);
  color: var(--text-2);
}

.pz-deny-overlay {
  position: fixed;
  inset: 0;
  z-index: 80;
  background: rgba(7,29,59,0.56);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 18px;
}

.pz-deny-dialog {
  width: min(480px, 100%);
  background: var(--white);
  border-radius: 16px;
  border: 1px solid var(--border);
  box-shadow: 0 24px 80px rgba(7,29,59,0.24);
  overflow: hidden;
}

.pz-deny-head {
  padding: 20px 22px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border-bottom: 1px solid var(--border);
}

.pz-deny-title {
  font-family: 'Inter', sans-serif;
  font-size: 18px;
  font-weight: 700;
  letter-spacing: -0.025em;
}

.pz-deny-close {
  width: 32px;
  height: 32px;
  border: 1px solid var(--border);
  background: var(--surface);
  border-radius: 9px;
  color: var(--text-2);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.pz-deny-body {
  padding: 20px 22px;
}

.pz-deny-body p {
  color: var(--text-3);
  font-size: 13px;
  line-height: 1.55;
  margin: 0 0 14px;
}

.pz-deny-body textarea {
  width: 100%;
  min-height: 130px;
  resize: vertical;
  border: 1px solid var(--border);
  border-radius: 11px;
  padding: 12px;
  color: var(--text-1);
  outline: none;
  font: inherit;
  font-size: 14px;
}

.pz-deny-body textarea:focus {
  border-color: var(--red);
  box-shadow: 0 0 0 3px rgba(226,75,74,0.08);
}

.pz-deny-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 16px 22px;
  border-top: 1px solid var(--border);
  background: #FAFBFD;
}

@media (max-width: 1180px) {
  .pz-profile-stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .pz-profiles-grid {
    grid-template-columns: 1fr;
  }
  .pz-profiles-side-card {
    position: static;
  }
}

@media (max-width: 760px) {
  .pz-profiles-header {
    align-items: flex-start;
    flex-direction: column;
  }
  .pz-profiles-header-actions {
    width: 100%;
    justify-content: flex-start;
  }
  .pz-profile-stats {
    grid-template-columns: 1fr;
  }
  .pz-profiles-toolbar {
    grid-template-columns: 1fr;
  }
  .pz-status-tabs {
    overflow-x: auto;
  }
  .pz-profile-card {
    grid-template-columns: 1fr;
  }
  .pz-profile-actions {
    min-width: 0;
    justify-content: flex-start;
  }
  .pz-profile-contact-grid {
    grid-template-columns: 1fr;
  }
  .pz-profiles-card-header {
    align-items: flex-start;
    flex-direction: column;
  }
}
`;

type StatusFilter = "All" | "Active" | "Pending" | "Inactive";
type SizeFilter = "all" | "small" | "medium" | "large";

function safeText(value?: string | number | null, fallback = "Not provided") {
  if (value === undefined || value === null || value === "") return fallback;
  return String(value);
}

function initials(name?: string) {
  const source = safeText(name, "PZ");
  return source
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function isPending(family: Family) {
  return String(family.status).toLowerCase() === "pending";
}

function statusTone(status?: string) {
  const normalized = String(status || "").toLowerCase();
  if (normalized.includes("active")) return "green";
  if (normalized.includes("pending")) return "amber";
  if (normalized.includes("deny") || normalized.includes("reject")) return "red";
  return "gray";
}

function formatDate(date?: string) {
  if (!date) return "No date";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function todayLabel() {
  return new Date().toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function memberCount(family: Family) {
  return 1 + (family.guardians?.length || 0) + (family.children?.length || 0);
}

function documentStats(families: Family[]) {
  return families.reduce(
    (acc, family) => {
      const docs = family.documents || [];
      acc.total += docs.length;
      acc.pending += docs.filter((doc) => (doc.status || "pending") === "pending").length;
      return acc;
    },
    { total: 0, pending: 0 }
  );
}

function matchesSearch(family: Family, search: string) {
  if (!search.trim()) return true;
  const term = search.trim().toLowerCase();
  const haystack = [
    family.familyName,
    family.parent?.name,
    family.parent?.email,
    family.parent?.phone,
    ...(family.children || []).map((child) => `${child.name} ${child.grade}`),
    ...(family.guardians || []).map((guardian) => `${guardian.name} ${guardian.relation} ${guardian.phone}`),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return haystack.includes(term);
}

function matchesSize(family: Family, size: SizeFilter) {
  const total = memberCount(family);
  if (size === "small") return total <= 3;
  if (size === "medium") return total > 3 && total <= 5;
  if (size === "large") return total > 5;
  return true;
}

export default function FamilyProfiles() {
  const navigate = useNavigate();
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedFamily, setSelectedFamily] = useState<Family | null>(null);
  const [families, setFamilies] = useState<Family[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");
  const [gradeFilter, setGradeFilter] = useState("all");
  const [sizeFilter, setSizeFilter] = useState<SizeFilter>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [denyTarget, setDenyTarget] = useState<Family | null>(null);
  const [denyReason, setDenyReason] = useState("");

  const fetchFamilies = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/family/all`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (isQuietEmptyStateResponse(response, errorData)) {
          setFamilies([]);
          return;
        }
        throw new Error("Failed to fetch families");
      }

      const data = await response.json();
      if (!Array.isArray(data)) {
        console.error("Unexpected response:", data);
        setFamilies([]);
        return;
      }

      setFamilies(data);
    } catch (error) {
      console.error("Error fetching family profiles:", error);
      toast.error("Failed to fetch families");
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproveFamily = async (family: Family) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/family/${family.id}/approve`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) throw new Error("Approval failed");

      toast.success("Family approved successfully");
      await fetchFamilies();
    } catch (error) {
      console.error("Error approving family:", error);
      toast.error("Error approving family");
    }
  };

  const handleDenyFamily = async (family: Family, reason?: string) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/family/${family.id}/deny`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reason }),
      });

      if (!res.ok) throw new Error("Denial failed");

      toast.success("Family denied successfully");
      await fetchFamilies();
    } catch (error) {
      console.error("Error denying family:", error);
      toast.error("Error denying family");
    }
  };

  useEffect(() => {
    fetchFamilies();
  }, []);

  const grades = useMemo(() => {
    const values = new Set<string>();
    families.forEach((family) => {
      family.children?.forEach((child) => {
        if (child.grade) values.add(String(child.grade));
      });
    });
    return Array.from(values).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  }, [families]);

  const filteredFamilies = useMemo(() => {
    return families.filter((family) => {
      const statusMatches =
        statusFilter === "All" ||
        String(family.status).toLowerCase() === statusFilter.toLowerCase();
      const gradeMatches =
        gradeFilter === "all" ||
        family.children?.some((child) => String(child.grade) === gradeFilter);

      return (
        statusMatches &&
        gradeMatches &&
        matchesSize(family, sizeFilter) &&
        matchesSearch(family, searchTerm)
      );
    });
  }, [families, gradeFilter, searchTerm, sizeFilter, statusFilter]);

  const docs = useMemo(() => documentStats(families), [families]);
  const activeCount = families.filter((family) => String(family.status).toLowerCase() === "active").length;
  const pendingCount = families.filter(isPending).length;
  const inactiveCount = families.filter((family) => String(family.status).toLowerCase() === "inactive").length;
  const pendingQueue = families.filter(isPending).slice(0, 5);
  const reviewRate = families.length ? Math.round((activeCount / families.length) * 100) : 0;

  const stats = [
    {
      label: "Total Profiles",
      value: families.length,
      helper: "Families in this school",
      icon: UsersRound,
      tone: { background: "#EFF6FF", color: "#1B6ECC" },
      glow: "rgba(27,110,204,0.16)",
      action: () => setStatusFilter("All"),
    },
    {
      label: "Active Families",
      value: activeCount,
      helper: "Approved pickup access",
      icon: UserRoundCheck,
      tone: { background: "#E1F5EE", color: "#1A9E75" },
      glow: "rgba(26,158,117,0.16)",
      action: () => setStatusFilter("Active"),
    },
    {
      label: "Pending Reviews",
      value: pendingCount,
      helper: "Need admin decision",
      icon: Clock3,
      tone: { background: "#FEF3DC", color: "#EF9F27" },
      glow: "rgba(239,159,39,0.16)",
      action: () => setStatusFilter("Pending"),
    },
    {
      label: "Documents",
      value: docs.total,
      helper: `${docs.pending} waiting verification`,
      icon: FileCheck2,
      tone: { background: "#F4F6FA", color: "#0B2E5A" },
      glow: "rgba(7,29,59,0.14)",
      action: () => navigate("/admin/documents"),
    },
  ];
  const gradeOptions = [
    { value: "all", label: "All grades" },
    ...grades.map((grade) => ({ value: grade, label: `Grade ${grade}` })),
  ];
  const familySizeOptions = [
    { value: "all", label: "Any family size" },
    { value: "small", label: "Small family" },
    { value: "medium", label: "Medium family" },
    { value: "large", label: "Large family" },
  ];

  const statusTabs: Array<{ key: StatusFilter; label: string; count: number }> = [
    { key: "All", label: "All", count: families.length },
    { key: "Active", label: "Active", count: activeCount },
    { key: "Pending", label: "Pending", count: pendingCount },
    { key: "Inactive", label: "Inactive", count: inactiveCount },
  ];

  const resetFilters = () => {
    setSearchTerm("");
    setStatusFilter("All");
    setGradeFilter("all");
    setSizeFilter("all");
  };

  const openFamily = (family: Family) => {
    setSelectedFamily(family);
    setViewModalOpen(true);
  };

  const closeDenyDialog = () => {
    setDenyTarget(null);
    setDenyReason("");
  };

  const submitDeny = async () => {
    if (!denyTarget || !denyReason.trim()) return;
    await handleDenyFamily(denyTarget, denyReason.trim());
    closeDenyDialog();
  };

  if (isLoading && families.length === 0) {
    return (
      <DashboardLayout role="admin">
        <AdminPageSkeleton variant="profiles" label="Loading family profiles" />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="admin">
      <style>{ADMIN_PROFILES_CSS}</style>
      <div className="pz-profiles-page">
        <div className="pz-profiles-header">
          <div>
            <div className="pz-profiles-kicker">School Admin</div>
            <h1 className="pz-profiles-title">Family Profiles</h1>
            <div className="pz-profiles-subtitle">
              Review parent accounts, guardians, children, and verification documents.
            </div>
          </div>
          <div className="pz-profiles-header-actions">
            <div className="pz-profiles-date-pill">
              <CalendarDays size={15} aria-hidden="true" />
              {todayLabel()}
            </div>
            <button type="button" className="pz-profiles-refresh" onClick={fetchFamilies}>
              <RefreshCw size={15} aria-hidden="true" />
              Refresh
            </button>
          </div>
        </div>

        <div className="pz-profile-stats">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <button
                type="button"
                className="pz-profile-stat"
                key={stat.label}
                style={{ "--stat-glow": stat.glow } as CSSProperties}
                onClick={stat.action}
                aria-label={`Open ${stat.label}`}
              >
                <div className="pz-profile-stat-top">
                  <div className="pz-profile-stat-label">{stat.label}</div>
                  <div className="pz-profile-stat-icon" style={stat.tone}>
                    <Icon size={19} strokeWidth={2.4} aria-hidden="true" />
                  </div>
                </div>
                <div className="pz-profile-stat-value">{stat.value}</div>
                <div className="pz-profile-stat-helper">
                  <CheckCircle2 size={14} aria-hidden="true" />
                  <span>{stat.helper}</span>
                </div>
              </button>
            );
          })}
        </div>

        <div className="pz-profiles-control-card">
          <div className="pz-profiles-toolbar">
            <label className="pz-profiles-search">
              <Search size={17} color="#8A96A8" aria-hidden="true" />
              <input
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search family, parent, child, guardian, email, or phone..."
              />
            </label>

            <div className="pz-status-tabs" aria-label="Profile status filters">
              {statusTabs.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  className={`pz-status-tab ${statusFilter === tab.key ? "active" : ""}`}
                  onClick={() => setStatusFilter(tab.key)}
                >
                  {tab.label} {tab.count}
                </button>
              ))}
            </div>
          </div>

          <div className="pz-profiles-filter-row">
            <div className="pz-profiles-filter-label">
              <SlidersHorizontal size={14} aria-hidden="true" />
              Filters
            </div>
            <AdminSelect
              className="compact"
              value={gradeFilter}
              onChange={setGradeFilter}
              options={gradeOptions}
              aria-label="Filter by grade"
            />
            <AdminSelect
              className="compact"
              value={sizeFilter}
              onChange={(value) => setSizeFilter(value as SizeFilter)}
              options={familySizeOptions}
              aria-label="Filter by family size"
            />
            <button type="button" className="pz-filter-reset" onClick={resetFilters}>
              Reset filters
            </button>
          </div>
        </div>

        <div className="pz-profiles-grid">
          <section className="pz-profiles-main-card">
            <div className="pz-profiles-card-header">
              <div>
                <div className="pz-profiles-card-title">Profile Registry</div>
                <div className="pz-profiles-card-subtitle">
                  {isLoading ? "Loading profile records..." : `${filteredFamilies.length} matching records`}
                </div>
              </div>
              <span className="pz-profiles-count-badge">
                <Filter size={13} aria-hidden="true" />
                {statusFilter}
              </span>
            </div>

            <div className="pz-profile-list">
              {!isLoading &&
                filteredFamilies.map((family) => (
                  <article className="pz-profile-card" key={family.id || family.familyName}>
                    <div className="pz-profile-identity">
                      <div className="pz-profile-avatar">{initials(family.familyName)}</div>
                      <div className="pz-profile-text">
                        <div className="pz-profile-title-row">
                          <div className="pz-profile-name">{safeText(family.familyName, "Unnamed family")}</div>
                          <span className={`pz-status-badge ${statusTone(family.status)}`}>
                            <span className="pz-badge-dot" />
                            {family.status}
                          </span>
                        </div>
                        <div className="pz-profile-subline">
                          <span>Submitted {formatDate(family.submittedAt)}</span>
                          <span className="pz-mini-badge">{memberCount(family)} members</span>
                          <span className="pz-mini-badge">{family.documents?.length || 0} docs</span>
                        </div>

                        <div className="pz-profile-contact-grid">
                          <div className="pz-contact-pill">
                            <UserRound size={14} aria-hidden="true" />
                            <span>{safeText(family.parent?.name, "No parent name")}</span>
                          </div>
                          <div className="pz-contact-pill">
                            <Mail size={14} aria-hidden="true" />
                            <span>{safeText(family.parent?.email, "No email")}</span>
                          </div>
                          <div className="pz-contact-pill">
                            <Phone size={14} aria-hidden="true" />
                            <span>{safeText(family.parent?.phone, "No phone")}</span>
                          </div>
                          <div className="pz-contact-pill">
                            <ShieldCheck size={14} aria-hidden="true" />
                            <span>{family.guardians?.length || 0} guardians</span>
                          </div>
                        </div>

                        <div className="pz-profile-chips">
                          {(family.children || []).slice(0, 3).map((child, index) => (
                            <div className="pz-child-pill" key={`${child.name}-${index}`}>
                              <GraduationCap size={14} aria-hidden="true" />
                              <span>
                                {safeText(child.name, "Child")} - Grade {safeText(child.grade, "N/A")}
                              </span>
                            </div>
                          ))}
                          {(family.children?.length || 0) > 3 && (
                            <div className="pz-child-pill">
                              <span>+{(family.children?.length || 0) - 3} more</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="pz-profile-actions">
                      <button type="button" className="pz-profile-action" onClick={() => openFamily(family)}>
                        <Eye size={15} aria-hidden="true" />
                        View
                      </button>
                      {isPending(family) && (
                        <>
                          <button
                            type="button"
                            className="pz-profile-action approve"
                            onClick={() => handleApproveFamily(family)}
                          >
                            <CheckCircle2 size={15} aria-hidden="true" />
                            Approve
                          </button>
                          <button
                            type="button"
                            className="pz-profile-action deny"
                            onClick={() => setDenyTarget(family)}
                          >
                            <XCircle size={15} aria-hidden="true" />
                            Deny
                          </button>
                        </>
                      )}
                    </div>
                  </article>
                ))}

              {isLoading && (
                <div className="pz-profiles-empty">
                  <div className="pz-profiles-empty-icon">
                    <RefreshCw size={22} aria-hidden="true" />
                  </div>
                  <div>Loading family profiles...</div>
                </div>
              )}

              {!isLoading && filteredFamilies.length === 0 && (
                <div className="pz-profiles-empty">
                  <div className="pz-profiles-empty-icon">
                    <Search size={22} aria-hidden="true" />
                  </div>
                  <strong>No profiles match these filters.</strong>
                  <span>Try a different search term, grade, status, or family size.</span>
                </div>
              )}
            </div>
          </section>

          <aside className="pz-profiles-side-card">
            <div className="pz-profiles-card-header">
              <div>
                <div className="pz-profiles-card-title">Review Desk</div>
                <div className="pz-profiles-card-subtitle">Pending approvals and document readiness</div>
              </div>
              <span className="pz-status-badge amber">
                <span className="pz-badge-dot" />
                {pendingCount} open
              </span>
            </div>

            <div className="pz-side-section">
              <div className="pz-review-meter">
                <div
                  className="pz-review-ring"
                  style={{ "--review-angle": `${reviewRate * 3.6}deg` } as CSSProperties}
                >
                  <span>{reviewRate}%</span>
                </div>
                <div className="pz-review-copy">
                  <strong>{activeCount}</strong> of <strong>{families.length}</strong> profiles are active.
                  Keep pending profiles moving by reviewing family details and documents.
                </div>
              </div>
            </div>

            <div className="pz-side-section">
              <div className="pz-side-section-title">Pending Queue</div>
              <div className="pz-queue-list">
                {pendingQueue.map((family) => (
                  <div className="pz-queue-item" key={`queue-${family.id || family.familyName}`}>
                    <div className="pz-queue-avatar">{initials(family.familyName)}</div>
                    <div className="pz-queue-text">
                      <div className="pz-queue-name">{family.familyName}</div>
                      <div className="pz-queue-sub">
                        {family.documents?.length || 0} docs - {formatDate(family.submittedAt)}
                      </div>
                    </div>
                    <button
                      type="button"
                      className="pz-queue-view"
                      onClick={() => openFamily(family)}
                      aria-label={`View ${family.familyName}`}
                    >
                      <Eye size={15} aria-hidden="true" />
                    </button>
                  </div>
                ))}
                {!pendingQueue.length && (
                  <div className="pz-profiles-empty" style={{ minHeight: 150, padding: 18 }}>
                    <div className="pz-profiles-empty-icon">
                      <CheckCircle2 size={21} aria-hidden="true" />
                    </div>
                    <span>No pending reviews right now.</span>
                  </div>
                )}
              </div>
            </div>

            <div className="pz-side-section">
              <div className="pz-side-section-title">Attention</div>
              <div className="pz-queue-item">
                <div className="pz-queue-avatar" style={{ background: "#92400E" }}>
                  <AlertTriangle size={16} aria-hidden="true" />
                </div>
                <div className="pz-queue-text">
                  <div className="pz-queue-name">{docs.pending} documents waiting</div>
                  <div className="pz-queue-sub">Use the Documents page for direct review, or open a family profile for full context.</div>
                </div>
              </div>
            </div>
          </aside>
        </div>

        {selectedFamily && viewModalOpen && (
          <FamilyView
            data={{
              id: selectedFamily.id,
              familyName: selectedFamily.familyName,
              status: selectedFamily.status,
              submittedAt: selectedFamily.submittedAt,
              parent: selectedFamily.parent,
              guardians: selectedFamily.guardians,
              children: selectedFamily.children,
              documents: selectedFamily.documents?.map((doc) => ({
                id: doc.id || "",
                name: doc.name,
                documentType: doc.documentType,
                type: doc.type,
                status: doc.status,
                file_path: doc.file_path,
                url: doc.url,
                childId: doc.childId,
                required: doc.required,
                rejectionReason: doc.rejectionReason,
              })),
              documentVerification: selectedFamily.documentVerification,
            }}
            onClose={() => {
              setViewModalOpen(false);
              setSelectedFamily(null);
            }}
            onApprove={() => handleApproveFamily(selectedFamily)}
            onDeny={(_, reason) => handleDenyFamily(selectedFamily, reason)}
          />
        )}

        {denyTarget && (
          <div className="pz-deny-overlay" role="dialog" aria-modal="true" aria-labelledby="deny-profile-title">
            <div className="pz-deny-dialog">
              <div className="pz-deny-head">
                <div className="pz-deny-title" id="deny-profile-title">
                  Deny Profile
                </div>
                <button type="button" className="pz-deny-close" onClick={closeDenyDialog} aria-label="Close">
                  <X size={17} aria-hidden="true" />
                </button>
              </div>
              <div className="pz-deny-body">
                <p>
                  Add a clear reason for denying <strong>{denyTarget.familyName}</strong>. This keeps the
                  existing denial workflow intact and sends the backend the same reason payload.
                </p>
                <textarea
                  value={denyReason}
                  onChange={(event) => setDenyReason(event.target.value)}
                  placeholder="Reason for denial"
                />
              </div>
              <div className="pz-deny-footer">
                <button type="button" className="pz-profile-action" onClick={closeDenyDialog}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="pz-profile-action deny"
                  disabled={!denyReason.trim()}
                  onClick={submitDeny}
                >
                  Deny Profile
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
