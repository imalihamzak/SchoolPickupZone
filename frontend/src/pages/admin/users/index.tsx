import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import {
  CalendarDays,
  CheckCircle2,
  Copy,
  Edit3,
  Eye,
  KeyRound,
  Mail,
  Phone,
  Plus,
  QrCode,
  RefreshCw,
  Search,
  ShieldCheck,
  Smartphone,
  Trash2,
  UserRound,
  UserRoundCheck,
  UsersRound,
} from "lucide-react";
import DashboardLayout from "@/components/layouts/dashboard-layout";
import { API_BASE_URL } from "@/lib/api/link";
import CreateUserModal from "./components/CreateUserModal";
import DeviceManagementModal from "./components/DeviceManagementModal";
import GenerateQRModal from "./components/GenerateQRModal";
import EditUserModal from "./components/EditUserModal";
import DeleteUserModal from "./components/DeleteUserModal";
import { toast } from "@/components/ui/toast";
import { AdminSelect } from "@/components/ui/admin-controls";
import AdminPageSkeleton from "@/components/ui/AdminPageSkeleton";
import { isQuietEmptyStateResponse } from "@/lib/api/quietEmptyState";

const ADMIN_USERS_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Inter:wght@400;500;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,300&display=swap');

.pz-users-page {
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

.pz-users-page,
.pz-users-page * {
  box-sizing: border-box;
}

.pz-users-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 18px;
  margin-bottom: 24px;
}

.pz-users-kicker {
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

.pz-users-kicker::before {
  content: "";
  width: 18px;
  height: 2px;
  border-radius: 999px;
  background: var(--teal);
}

.pz-users-title {
  font-family: 'Inter', sans-serif;
  font-size: clamp(28px, 3.2vw, 42px);
  line-height: 1.04;
  letter-spacing: -0.025em;
  font-weight: 700;
  margin: 0;
  color: var(--text-1);
}

.pz-users-subtitle {
  color: var(--text-3);
  font-size: 14px;
  margin-top: 8px;
}

.pz-users-header-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  flex-wrap: wrap;
}

.pz-users-date-pill,
.pz-users-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 38px;
  border-radius: 10px;
  padding: 0 14px;
  font-size: 13px;
  font-weight: 800;
  font-family: 'DM Sans', sans-serif;
  white-space: nowrap;
}

.pz-users-date-pill {
  background: var(--white);
  border: 1px solid var(--border);
  color: var(--text-2);
  box-shadow: var(--shadow-sm);
}

.pz-users-button {
  border: 1px solid var(--border);
  background: var(--white);
  color: var(--text-2);
  cursor: pointer;
  transition: all 0.18s ease;
}

.pz-users-button:hover {
  color: var(--blue);
  border-color: rgba(27,110,204,0.36);
  background: #EFF6FF;
}

.pz-users-button.primary {
  border-color: var(--teal);
  background: var(--teal);
  color: var(--white);
}

.pz-users-button.primary:hover {
  background: var(--teal-light);
  border-color: var(--teal-light);
  color: var(--white);
}

.pz-users-stat-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
  margin-bottom: 18px;
}

.pz-users-stat-card {
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

button.pz-users-stat-card {
  width: 100%;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.pz-users-stat-card::after {
  content: "";
  position: absolute;
  inset: auto -34px -70px auto;
  width: 140px;
  height: 140px;
  background: radial-gradient(circle, var(--stat-glow) 0%, transparent 67%);
  pointer-events: none;
}

.pz-users-stat-top {
  display: flex;
  justify-content: space-between;
  gap: 14px;
  align-items: flex-start;
}

.pz-users-stat-label {
  color: var(--text-3);
  font-size: 12px;
  font-weight: 700;
}

.pz-users-stat-icon {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.pz-users-stat-value {
  font-family: 'Inter', 'Segoe UI', Arial, sans-serif;
  font-size: 34px;
  font-weight: 700;
  line-height: 1;
  letter-spacing: 0;
  color: var(--text-1);
  font-variant-numeric: tabular-nums;
}

.pz-users-stat-helper {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--text-3);
  font-size: 12px;
  font-weight: 500;
}

.pz-users-control-card {
  background: var(--white);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 16px;
  box-shadow: var(--shadow-sm);
  margin-bottom: 18px;
}

.pz-users-toolbar {
  display: grid;
  grid-template-columns: minmax(260px, 1fr) auto;
  gap: 14px;
  align-items: center;
}

.pz-users-search {
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

.pz-users-search:focus-within {
  border-color: var(--blue);
  box-shadow: 0 0 0 3px rgba(27,110,204,0.08);
}

.pz-users-search input {
  width: 100%;
  border: 0;
  outline: 0;
  background: transparent;
  color: var(--text-1);
  font: inherit;
  font-size: 14px;
}

.pz-users-search input::placeholder {
  color: var(--text-3);
}

.pz-users-tabs {
  display: flex;
  gap: 5px;
  padding: 4px;
  border-radius: 11px;
  background: var(--surface);
  border: 1px solid var(--border);
}

.pz-users-tab {
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

.pz-users-tab.active {
  background: var(--white);
  color: var(--text-1);
  box-shadow: var(--shadow-sm);
}

.pz-users-filter-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  padding-top: 14px;
  margin-top: 14px;
  border-top: 1px solid var(--border);
}

.pz-users-select,
.pz-users-reset {
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

.pz-users-reset {
  cursor: pointer;
  transition: all 0.18s ease;
}

.pz-users-reset:hover {
  color: var(--blue);
  border-color: rgba(27,110,204,0.36);
}

.pz-users-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(320px, 0.42fr);
  gap: 18px;
  align-items: start;
}

.pz-users-card,
.pz-users-side-card {
  background: var(--white);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
}

.pz-users-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 18px 20px;
  border-bottom: 1px solid var(--border);
}

.pz-users-card-title {
  font-family: 'Inter', sans-serif;
  font-size: 16px;
  font-weight: 700;
  letter-spacing: -0.025em;
  color: var(--text-1);
}

.pz-users-card-subtitle {
  color: var(--text-3);
  font-size: 12px;
  margin-top: 4px;
}

.pz-users-badge,
.pz-users-status,
.pz-users-role {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 800;
  white-space: nowrap;
}

.pz-users-badge {
  padding: 5px 10px;
  color: #065F46;
  background: var(--teal-pale);
}

.pz-users-status,
.pz-users-role {
  padding: 5px 10px;
  text-transform: capitalize;
}

.pz-users-status.green,
.pz-users-role.parent {
  color: #065F46;
  background: var(--teal-pale);
}

.pz-users-status.red {
  color: #991B1B;
  background: var(--red-pale);
}

.pz-users-status.gray {
  color: var(--text-2);
  background: var(--surface-2);
}

.pz-users-role.guard {
  color: #92400E;
  background: var(--amber-pale);
}

.pz-users-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}

.pz-users-table-wrap {
  overflow-x: auto;
}

.pz-users-table {
  width: 100%;
  border-collapse: collapse;
}

.pz-users-table th {
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

.pz-users-table td {
  padding: 14px 16px;
  font-size: 13px;
  color: var(--text-2);
  border-bottom: 1px solid var(--border);
  vertical-align: middle;
}

.pz-users-table tbody tr:last-child td {
  border-bottom: 0;
}

.pz-users-table tbody tr:hover td {
  background: #FAFBFD;
}

.pz-user-cell {
  display: flex;
  align-items: center;
  gap: 11px;
  min-width: 240px;
}

.pz-user-avatar {
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

.pz-user-name {
  color: var(--text-1);
  font-size: 14px;
  font-weight: 800;
  white-space: nowrap;
}

.pz-user-email,
.pz-user-phone,
.pz-users-muted {
  color: var(--text-3);
  font-size: 12px;
}

.pz-user-contact {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 3px;
}

.pz-device-button {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  border: 1px solid var(--border);
  border-radius: 999px;
  background: var(--white);
  color: var(--blue);
  padding: 6px 10px;
  font-size: 12px;
  font-weight: 800;
  cursor: pointer;
  transition: all 0.18s ease;
  white-space: nowrap;
}

.pz-device-button:hover {
  background: #EFF6FF;
  border-color: rgba(27,110,204,0.32);
}

.pz-users-actions {
  display: flex;
  justify-content: flex-end;
  gap: 7px;
}

.pz-users-icon-button {
  width: 34px;
  height: 34px;
  border-radius: 9px;
  border: 1px solid var(--border);
  background: var(--white);
  color: var(--text-2);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.18s ease;
}

.pz-users-icon-button:hover {
  border-color: rgba(27,110,204,0.36);
  color: var(--blue);
  background: #EFF6FF;
}

.pz-users-icon-button.danger:hover {
  border-color: rgba(226,75,74,0.28);
  color: #991B1B;
  background: var(--red-pale);
}

.pz-users-empty {
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

.pz-users-empty-icon {
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

.pz-users-side-card {
  position: sticky;
  top: 0;
}

.pz-users-side-section {
  padding: 18px 20px;
  border-bottom: 1px solid var(--border);
}

.pz-users-side-section:last-child {
  border-bottom: 0;
}

.pz-users-side-title {
  color: var(--text-1);
  font-size: 13px;
  font-weight: 800;
  margin-bottom: 12px;
}

.pz-access-panel {
  display: grid;
  grid-template-columns: 76px 1fr;
  gap: 14px;
  align-items: center;
}

.pz-access-meter {
  width: 76px;
  height: 76px;
  border-radius: 50%;
  background: conic-gradient(var(--teal) var(--meter-angle), var(--surface-2) 0);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.pz-access-meter::after {
  content: "";
  position: absolute;
  inset: 8px;
  border-radius: 50%;
  background: var(--white);
}

.pz-access-meter span {
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

.pz-access-copy {
  color: var(--text-3);
  font-size: 12px;
  line-height: 1.55;
}

.pz-access-copy strong {
  color: var(--text-1);
  font-family: 'Inter', 'Segoe UI', Arial, sans-serif;
  font-variant-numeric: tabular-nums;
}

.pz-guard-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.pz-guard-item {
  display: grid;
  grid-template-columns: 36px minmax(0, 1fr) auto;
  gap: 10px;
  align-items: center;
  padding: 11px;
  border: 1px solid var(--border);
  border-radius: 11px;
  background: #FAFBFD;
}

.pz-guard-avatar {
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
}

.pz-guard-name {
  color: var(--text-1);
  font-size: 13px;
  font-weight: 800;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pz-guard-sub {
  color: var(--text-3);
  font-size: 11px;
  margin-top: 2px;
}

.pz-guard-actions {
  display: flex;
  gap: 6px;
}

.pz-user-modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 80;
  background: rgba(7,29,59,0.58);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 18px;
  overflow-y: auto;
}

.pz-user-modal {
  width: min(520px, 100%);
  max-height: calc(100dvh - 36px);
  background: var(--white);
  border: 1px solid rgba(255,255,255,0.18);
  border-radius: 18px;
  box-shadow: 0 28px 90px rgba(7,29,59,0.28);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.pz-user-modal.wide {
  width: min(760px, 100%);
}

.pz-user-modal-head {
  background: linear-gradient(135deg, var(--navy), var(--navy-mid));
  color: var(--white);
  padding: 20px 22px;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
  flex-shrink: 0;
}

.pz-user-modal-title-row {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  min-width: 0;
}

.pz-user-modal-icon {
  width: 40px;
  height: 40px;
  border-radius: 11px;
  background: var(--teal);
  color: var(--white);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.pz-user-modal-icon.warn {
  background: var(--amber);
}

.pz-user-modal-icon.danger {
  background: var(--red);
}

.pz-user-modal-title {
  font-family: 'Inter', sans-serif;
  color: var(--white);
  font-size: 20px;
  line-height: 1.1;
  letter-spacing: -0.025em;
  font-weight: 700;
  margin: 0;
}

.pz-user-modal-subtitle {
  color: rgba(255,255,255,0.58);
  font-size: 12px;
  margin-top: 5px;
  line-height: 1.45;
}

.pz-user-modal-close {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  border: 1px solid rgba(255,255,255,0.14);
  background: rgba(255,255,255,0.07);
  color: var(--white);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.pz-user-modal-body {
  padding: 20px 22px;
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
}

.pz-user-modal-body::-webkit-scrollbar {
  width: 5px;
}

.pz-user-modal-body::-webkit-scrollbar-thumb {
  background: #CAD2DF;
  border-radius: 999px;
}

.pz-user-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.pz-user-modal > .pz-user-form {
  flex: 1;
  min-height: 0;
  gap: 0;
  overflow: hidden;
}

.pz-user-form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.pz-user-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.pz-user-field label {
  color: var(--text-2);
  font-size: 12px;
  font-weight: 800;
}

.pz-user-field input,
.pz-user-field select {
  width: 100%;
  height: 42px;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--surface);
  color: var(--text-1);
  outline: none;
  padding: 0 12px;
  font: inherit;
  font-size: 14px;
  transition: border-color 0.18s ease, box-shadow 0.18s ease;
}

.pz-user-field input:focus,
.pz-user-field select:focus {
  border-color: var(--blue);
  box-shadow: 0 0 0 3px rgba(27,110,204,0.08);
}

.pz-user-field input.error {
  border-color: var(--red);
}

.pz-user-error {
  color: #991B1B;
  font-size: 11px;
  font-weight: 700;
}

.pz-user-feedback {
  font-size: 11px;
  font-weight: 800;
  line-height: 1.35;
}

.pz-user-feedback.hint {
  color: var(--text-3);
}

.pz-user-feedback.success {
  color: #047857;
}

.pz-user-feedback.error {
  color: #991B1B;
}

.pz-user-note {
  border: 1px solid rgba(26,158,117,0.24);
  background: var(--teal-pale);
  color: #065F46;
  border-radius: 10px;
  padding: 11px 12px;
  font-size: 12px;
  font-weight: 700;
  line-height: 1.45;
}

.pz-user-modal-footer {
  padding: 16px 22px;
  border-top: 1px solid var(--border);
  background: #FAFBFD;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  flex-shrink: 0;
}

.pz-user-modal-note {
  border: 1px solid rgba(239,159,39,0.24);
  background: var(--amber-pale);
  color: #92400E;
  border-radius: 12px;
  padding: 12px 13px;
  font-size: 13px;
  line-height: 1.5;
}

.pz-device-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.pz-device-card {
  border: 1px solid var(--border);
  border-radius: 14px;
  background: var(--white);
  padding: 16px;
  box-shadow: var(--shadow-sm);
}

.pz-device-card-top {
  display: grid;
  grid-template-columns: 42px minmax(0, 1fr) auto;
  gap: 12px;
  align-items: flex-start;
}

.pz-device-icon {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  background: var(--teal-pale);
  color: var(--teal);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.pz-device-heading {
  min-width: 0;
}

.pz-device-name-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.pz-device-name {
  color: var(--text-1);
  font-size: 15px;
  font-weight: 800;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pz-device-status {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  border-radius: 999px;
  padding: 4px 9px;
  font-size: 11px;
  font-weight: 900;
  white-space: nowrap;
}

.pz-device-status.active {
  color: #065F46;
  background: var(--teal-pale);
}

.pz-device-status.disabled {
  color: #991B1B;
  background: var(--red-pale);
}

.pz-device-meta {
  color: var(--text-3);
  font-size: 12px;
  margin-top: 5px;
  line-height: 1.45;
  overflow-wrap: anywhere;
}

.pz-device-detail-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin-top: 14px;
}

.pz-device-detail {
  min-width: 0;
  border: 1px solid var(--border);
  border-radius: 11px;
  background: #FAFBFD;
  padding: 11px 12px;
}

.pz-device-detail-label {
  display: flex;
  align-items: center;
  gap: 7px;
  color: var(--text-3);
  font-size: 11px;
  font-weight: 900;
  text-transform: uppercase;
}

.pz-device-detail-value {
  color: var(--text-2);
  font-size: 12px;
  line-height: 1.45;
  margin-top: 6px;
  overflow-wrap: anywhere;
}

.pz-device-copy {
  border: 1px solid rgba(27,110,204,0.22);
  border-radius: 8px;
  background: #EFF6FF;
  color: var(--blue);
  font-weight: 800;
  font-size: 12px;
  cursor: pointer;
  padding: 5px 8px;
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.pz-device-control-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto;
  gap: 10px;
  align-items: end;
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px solid var(--border);
}

.pz-device-ip-field {
  display: grid;
  gap: 6px;
}

.pz-device-ip-field label {
  color: var(--text-2);
  font-size: 12px;
  font-weight: 900;
}

.pz-device-ip-input {
  width: 100%;
  height: 40px;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--surface);
  color: var(--text-1);
  outline: none;
  padding: 0 12px;
  font: inherit;
  font-size: 13px;
}

.pz-device-ip-input:focus {
  border-color: var(--blue);
  background: var(--white);
  box-shadow: 0 0 0 3px rgba(27,110,204,0.08);
}

.pz-device-action {
  height: 40px;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--white);
  color: var(--text-2);
  padding: 0 13px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  font-size: 12px;
  font-weight: 900;
  white-space: nowrap;
  cursor: pointer;
}

.pz-device-action:hover:not(:disabled) {
  border-color: rgba(27,110,204,0.36);
  color: var(--blue);
  background: #EFF6FF;
}

.pz-device-action.danger {
  color: #991B1B;
  background: var(--red-pale);
  border-color: rgba(226,75,74,0.28);
}

.pz-device-action.success {
  color: #065F46;
  background: var(--teal-pale);
  border-color: rgba(26,158,117,0.28);
}

.pz-device-action:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.pz-qr-panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 14px;
}

.pz-qr-box {
  padding: 14px;
  border: 1px solid var(--border);
  border-radius: 16px;
  background: var(--white);
  box-shadow: inset 0 0 0 6px var(--surface);
}

.pz-qr-link {
  width: 100%;
  overflow: hidden;
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--text-2);
  border-radius: 11px;
  padding: 10px 14px;
  font-size: 12px;
  line-height: 1.45;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.pz-qr-skeleton {
  min-height: 330px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  text-align: center;
}

.pz-qr-skeleton-box,
.pz-qr-skeleton-button,
.pz-qr-skeleton-link {
  position: relative;
  overflow: hidden;
  background: var(--surface);
  border: 1px solid var(--border);
}

.pz-qr-skeleton-box::after,
.pz-qr-skeleton-button::after,
.pz-qr-skeleton-link::after {
  content: "";
  position: absolute;
  inset: 0;
  transform: translateX(-100%);
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.78), transparent);
  animation: pzQrSkeleton 1.15s ease-in-out infinite;
}

.pz-qr-skeleton-box {
  width: 220px;
  height: 220px;
  border-radius: 16px;
  color: rgba(27,110,204,0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: inset 0 0 0 8px #FFFFFF;
}

.pz-qr-skeleton-button {
  width: 136px;
  height: 38px;
  border-radius: 10px;
}

.pz-qr-skeleton-button.primary {
  width: 112px;
  background: rgba(26,158,117,0.16);
  border-color: rgba(26,158,117,0.2);
}

.pz-qr-skeleton-link {
  width: 100%;
  min-height: 50px;
  border-radius: 11px;
  display: grid;
  gap: 8px;
  padding: 12px 14px;
}

.pz-qr-skeleton-link span {
  height: 8px;
  border-radius: 999px;
  background: #CAD2DF;
}

.pz-qr-skeleton-link span:last-child {
  width: 58%;
}

@keyframes pzQrSkeleton {
  100% {
    transform: translateX(100%);
  }
}

@media (max-width: 1180px) {
  .pz-users-stat-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .pz-users-grid {
    grid-template-columns: 1fr;
  }
  .pz-users-side-card {
    position: static;
  }
}

@media (max-width: 760px) {
  .pz-users-header {
    align-items: flex-start;
    flex-direction: column;
  }
  .pz-users-header-actions {
    justify-content: flex-start;
    width: 100%;
  }
  .pz-users-stat-grid {
    grid-template-columns: 1fr;
  }
  .pz-users-toolbar {
    grid-template-columns: 1fr;
  }
  .pz-users-tabs {
    overflow-x: auto;
  }
  .pz-users-card-header {
    align-items: flex-start;
    flex-direction: column;
  }
  .pz-user-form-grid {
    grid-template-columns: 1fr;
  }
  .pz-user-modal-overlay {
    padding: 12px;
    align-items: center;
  }
  .pz-user-modal {
    max-height: calc(100dvh - 24px);
    min-height: 0;
    border-radius: 16px;
  }
  .pz-user-modal-head,
  .pz-user-modal-body,
  .pz-user-modal-footer {
    padding-left: 16px;
    padding-right: 16px;
  }
  .pz-user-modal-body {
    padding-top: 16px;
    padding-bottom: 16px;
  }
  .pz-user-modal-footer {
    flex-direction: column;
  }
  .pz-user-modal-footer .pz-users-button {
    width: 100%;
  }
  .pz-device-card {
    padding: 14px;
  }
  .pz-device-card-top {
    grid-template-columns: 42px minmax(0, 1fr);
  }
  .pz-device-card-top .pz-device-copy {
    grid-column: 1 / -1;
    justify-content: center;
  }
  .pz-device-detail-grid,
  .pz-device-control-row {
    grid-template-columns: 1fr;
  }
  .pz-device-action {
    width: 100%;
  }
}
`;

type ManagedUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  name: string;
  role: "parent" | "guard" | string;
  status: string;
  createdAt: string;
  deviceCount: number;
};

type RoleFilter = "all" | "parent" | "guard";

function safeText(value?: string | number | null, fallback = "N/A") {
  if (value === undefined || value === null || value === "") return fallback;
  return String(value);
}

function initials(name?: string) {
  return safeText(name, "PZ")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function todayLabel() {
  return new Date().toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function statusTone(status?: string) {
  const normalized = String(status || "").toLowerCase();
  if (normalized === "active") return "green";
  if (normalized === "inactive") return "red";
  return "gray";
}

function formatRole(role?: string) {
  if (role === "guard") return "Guard";
  if (role === "parent") return "Parent";
  return safeText(role);
}

export default function UsersManagement() {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDeviceModalOpen, setIsDeviceModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<ManagedUser | null>(null);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrLoading, setQrLoading] = useState(false);
  const [qrUrl, setQrUrl] = useState("");
  const [qrGuardName, setQrGuardName] = useState("");
  const qrRequestIdRef = useRef(0);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editUserData, setEditUserData] = useState<ManagedUser | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<ManagedUser | null>(null);

  const filteredUsers = useMemo(() => {
    const term = searchQuery.trim().toLowerCase();
    return users.filter((user) => {
      const haystack = `${user.name} ${user.email} ${user.phone || ""}`.toLowerCase();
      const matchesSearch = !term || haystack.includes(term);
      const matchesRole = roleFilter === "all" || user.role === roleFilter;
      const matchesStatus = statusFilter === "all" || user.status === statusFilter;
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [roleFilter, searchQuery, statusFilter, users]);

  const parentCount = users.filter((user) => user.role === "parent").length;
  const guardCount = users.filter((user) => user.role === "guard").length;
  const activeCount = users.filter((user) => String(user.status).toLowerCase() === "active").length;
  const inactiveCount = users.filter((user) => String(user.status).toLowerCase() === "inactive").length;
  const totalDevices = users.reduce((total, user) => total + Number(user.deviceCount || 0), 0);
  const activeRate = users.length ? Math.round((activeCount / users.length) * 100) : 0;
  const guardUsers = users.filter((user) => user.role === "guard");

  const statCards = [
    {
      label: "Total Users",
      value: users.length,
      helper: "Parent and guard accounts",
      icon: UsersRound,
      tone: { background: "#EFF6FF", color: "#1B6ECC" },
      glow: "rgba(27,110,204,0.16)",
      action: () => {
        setRoleFilter("all");
        setStatusFilter("all");
      },
    },
    {
      label: "Parents",
      value: parentCount,
      helper: "Pickup family contacts",
      icon: UserRound,
      tone: { background: "#E1F5EE", color: "#1A9E75" },
      glow: "rgba(26,158,117,0.16)",
      action: () => {
        setRoleFilter("parent");
        setStatusFilter("all");
      },
    },
    {
      label: "Guards",
      value: guardCount,
      helper: `${totalDevices} registered devices`,
      icon: ShieldCheck,
      tone: { background: "#FEF3DC", color: "#EF9F27" },
      glow: "rgba(239,159,39,0.16)",
      action: () => {
        setRoleFilter("guard");
        setStatusFilter("all");
      },
    },
    {
      label: "Active",
      value: activeCount,
      helper: `${inactiveCount} inactive accounts`,
      icon: UserRoundCheck,
      tone: { background: "#F4F6FA", color: "#0B2E5A" },
      glow: "rgba(7,29,59,0.14)",
      action: () => {
        setRoleFilter("all");
        setStatusFilter("active");
      },
    },
  ];

  const roleTabs: Array<{ key: RoleFilter; label: string; count: number }> = [
    { key: "all", label: "All", count: users.length },
    { key: "parent", label: "Parents", count: parentCount },
    { key: "guard", label: "Guards", count: guardCount },
  ];
  const statusOptions = [
    { value: "all", label: "All status" },
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
  ];

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/admin/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const error = await response.json();
        if (isQuietEmptyStateResponse(response, error)) {
          setUsers([]);
          return;
        }
        throw new Error(error.error || "Unauthorized");
      }

      const data = await response.json();
      const formatted = data
        .filter((u: any) => u.role === "parent" || u.role === "guard")
        .map((u: any) => ({
          id: u.id,
          firstName: u.firstName,
          lastName: u.lastName,
          email: u.email,
          phone: u.phone,
          name: `${u.firstName} ${u.lastName}`,
          role: u.role,
          status: u.status,
          createdAt: new Date(u.created_at).toISOString().split("T")[0],
          deviceCount: u.role === "guard" ? u.deviceCount || 0 : 0,
        }));

      setUsers(formatted);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async (userData: any): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();
      if (!response.ok) {
        toast.error(data.error || "Failed to create user");
        return false;
      } else {
        if (data.warning || data.emailSent === false) {
          toast.error(data.warning || "User created, but the password setup email was not sent");
        } else {
          toast.success(data.message || "User created and password setup email sent");
        }
        await fetchUsers();
        setIsCreateModalOpen(false);
        return true;
      }
    } catch (error) {
      toast.error("Something went wrong");
      return false;
    }
  };

  const handleGenerateQR = async (guardId: string, guardName: string) => {
    const requestId = qrRequestIdRef.current + 1;
    qrRequestIdRef.current = requestId;
    setQrGuardName(guardName);
    setQrUrl("");
    setQrLoading(true);
    setQrModalOpen(true);

    try {
      const res = await fetch(`${API_BASE_URL}/admin/generate-device-link`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ guard_id: guardId }),
      });

      const data = await res.json();
      if (requestId !== qrRequestIdRef.current) return;

      if (!res.ok) {
        toast.error(data.error || "Failed to generate link");
        setQrModalOpen(false);
        setQrUrl("");
      } else {
        setQrUrl(data.registrationUrl);
      }
    } catch {
      if (requestId !== qrRequestIdRef.current) return;
      toast.error("Something went wrong");
      setQrModalOpen(false);
      setQrUrl("");
    } finally {
      if (requestId === qrRequestIdRef.current) {
        setQrLoading(false);
      }
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/admin/parentguard/${userToDelete.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to delete user");
      } else {
        toast.success("User deleted successfully");
        setUsers(users.filter((user) => user.id !== userToDelete.id));
        setIsDeleteModalOpen(false);
        setUserToDelete(null);
      }
    } catch (err: any) {
      toast.error("Something went wrong");
    }
  };

  const openDeviceModal = (user: ManagedUser) => {
    setSelectedUser(user);
    setIsDeviceModalOpen(true);
  };

  const handleUpdateDevices = (userId: string, deviceCount: number) => {
    setUsers(users.map((user) => (user.id === userId ? { ...user, deviceCount } : user)));
  };

  const resetFilters = () => {
    setSearchQuery("");
    setRoleFilter("all");
    setStatusFilter("all");
  };

  if (loading && users.length === 0) {
    return (
      <DashboardLayout role="admin">
        <AdminPageSkeleton variant="users" label="Loading user management" />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="admin">
      <style>{ADMIN_USERS_CSS}</style>
      <div className="pz-users-page">
        <div className="pz-users-header">
          <div>
            <div className="pz-users-kicker">School Admin</div>
            <h1 className="pz-users-title">User Management</h1>
            <div className="pz-users-subtitle">
              Manage parent and guard accounts, registered devices, and guard activation links.
            </div>
          </div>
          <div className="pz-users-header-actions">
            <div className="pz-users-date-pill">
              <CalendarDays size={15} aria-hidden="true" />
              {todayLabel()}
            </div>
            <button type="button" className="pz-users-button" onClick={fetchUsers}>
              <RefreshCw size={15} aria-hidden="true" />
              Refresh
            </button>
            <button type="button" className="pz-users-button primary" onClick={() => setIsCreateModalOpen(true)}>
              <Plus size={16} aria-hidden="true" />
              Add User
            </button>
          </div>
        </div>

        <div className="pz-users-stat-grid">
          {statCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <button
                type="button"
                className="pz-users-stat-card"
                key={stat.label}
                style={{ "--stat-glow": stat.glow } as CSSProperties}
                onClick={stat.action}
                aria-label={`Filter by ${stat.label}`}
              >
                <div className="pz-users-stat-top">
                  <div className="pz-users-stat-label">{stat.label}</div>
                  <div className="pz-users-stat-icon" style={stat.tone}>
                    <Icon size={19} strokeWidth={2.4} aria-hidden="true" />
                  </div>
                </div>
                <div className="pz-users-stat-value">{stat.value}</div>
                <div className="pz-users-stat-helper">
                  <CheckCircle2 size={14} aria-hidden="true" />
                  <span>{stat.helper}</span>
                </div>
              </button>
            );
          })}
        </div>

        <div className="pz-users-control-card">
          <div className="pz-users-toolbar">
            <label className="pz-users-search">
              <Search size={17} color="#8A96A8" aria-hidden="true" />
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search users by name, email, or phone..."
              />
            </label>

            <div className="pz-users-tabs" aria-label="Role filters">
              {roleTabs.map((tab) => (
                <button
                  type="button"
                  key={tab.key}
                  className={`pz-users-tab ${roleFilter === tab.key ? "active" : ""}`}
                  onClick={() => setRoleFilter(tab.key)}
                >
                  {tab.label} {tab.count}
                </button>
              ))}
            </div>
          </div>

          <div className="pz-users-filter-row">
            <AdminSelect
              className="compact"
              value={statusFilter}
              onChange={setStatusFilter}
              options={statusOptions}
              aria-label="Filter by account status"
            />
            <button type="button" className="pz-users-reset" onClick={resetFilters}>
              Reset filters
            </button>
          </div>
        </div>

        <div className="pz-users-grid">
          <section className="pz-users-card">
            <div className="pz-users-card-header">
              <div>
                <div className="pz-users-card-title">User Directory</div>
                <div className="pz-users-card-subtitle">
                  {loading ? "Loading user records..." : `${filteredUsers.length} matching records`}
                </div>
              </div>
              <span className="pz-users-badge">
                <UsersRound size={13} aria-hidden="true" />
                {roleFilter === "all" ? "All roles" : formatRole(roleFilter)}
              </span>
            </div>

            <div className="pz-users-table-wrap">
              <table className="pz-users-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Devices</th>
                    <th>Created</th>
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && (
                    <tr>
                      <td colSpan={6}>
                        <div className="pz-users-empty">
                          <div className="pz-users-empty-icon">
                            <RefreshCw size={22} aria-hidden="true" />
                          </div>
                          <div>Loading users...</div>
                        </div>
                      </td>
                    </tr>
                  )}

                  {!loading &&
                    filteredUsers.map((user) => (
                      <tr key={user.id}>
                        <td>
                          <div className="pz-user-cell">
                            <div className="pz-user-avatar">{initials(user.name)}</div>
                            <div>
                              <div className="pz-user-name">{safeText(user.name, "Unnamed user")}</div>
                              <div className="pz-user-contact">
                                <Mail size={13} aria-hidden="true" />
                                <span className="pz-user-email">{safeText(user.email, "No email")}</span>
                              </div>
                              {user.phone && (
                                <div className="pz-user-contact">
                                  <Phone size={13} aria-hidden="true" />
                                  <span className="pz-user-phone">{user.phone}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className={`pz-users-role ${user.role === "guard" ? "guard" : "parent"}`}>
                            <span className="pz-users-dot" />
                            {formatRole(user.role)}
                          </span>
                        </td>
                        <td>
                          <span className={`pz-users-status ${statusTone(user.status)}`}>
                            <span className="pz-users-dot" />
                            {safeText(user.status)}
                          </span>
                        </td>
                        <td>
                          {user.role === "guard" ? (
                            <button type="button" className="pz-device-button" onClick={() => openDeviceModal(user)}>
                              <Smartphone size={14} aria-hidden="true" />
                              {user.deviceCount} devices
                            </button>
                          ) : (
                            <span className="pz-users-muted">Parent account</span>
                          )}
                        </td>
                        <td>{safeText(user.createdAt)}</td>
                        <td>
                          <div className="pz-users-actions">
                            <button
                              type="button"
                              className="pz-users-icon-button"
                              onClick={() => {
                                setEditUserData(user);
                                setIsEditModalOpen(true);
                              }}
                              title="Edit user"
                            >
                              <Edit3 size={16} aria-hidden="true" />
                            </button>
                            <button
                              type="button"
                              className="pz-users-icon-button danger"
                              onClick={() => {
                                setUserToDelete(user);
                                setIsDeleteModalOpen(true);
                              }}
                              title="Delete user"
                            >
                              <Trash2 size={16} aria-hidden="true" />
                            </button>
                            {user.role === "guard" && (
                              <button
                                type="button"
                                className="pz-users-icon-button"
                                onClick={() => handleGenerateQR(user.id, user.name)}
                                title="Generate QR code"
                              >
                                <QrCode size={16} aria-hidden="true" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}

                  {!loading && filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan={6}>
                        <div className="pz-users-empty">
                          <div className="pz-users-empty-icon">
                            <Search size={22} aria-hidden="true" />
                          </div>
                          <strong>No users match these filters.</strong>
                          <span>Try another role, status, or search term.</span>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <aside className="pz-users-side-card">
            <div className="pz-users-card-header">
              <div>
                <div className="pz-users-card-title">Access Operations</div>
                <div className="pz-users-card-subtitle">Guard devices and registration links</div>
              </div>
              <span className="pz-users-badge">
                <KeyRound size={13} aria-hidden="true" />
                Secure
              </span>
            </div>

            <div className="pz-users-side-section">
              <div className="pz-access-panel">
                <div
                  className="pz-access-meter"
                  style={{ "--meter-angle": `${activeRate * 3.6}deg` } as CSSProperties}
                >
                  <span>{activeRate}%</span>
                </div>
                <div className="pz-access-copy">
                  <strong>{activeCount}</strong> active users out of <strong>{users.length}</strong>. Device
                  registration remains available for guards only.
                </div>
              </div>
            </div>

            <div className="pz-users-side-section">
              <div className="pz-users-side-title">Guard Device Setup</div>
              <div className="pz-guard-list">
                {guardUsers.slice(0, 5).map((guard) => (
                  <div className="pz-guard-item" key={`guard-${guard.id}`}>
                    <div className="pz-guard-avatar">{initials(guard.name)}</div>
                    <div>
                      <div className="pz-guard-name">{guard.name}</div>
                      <div className="pz-guard-sub">{guard.deviceCount} registered devices</div>
                    </div>
                    <div className="pz-guard-actions">
                      <button
                        type="button"
                        className="pz-users-icon-button"
                        onClick={() => openDeviceModal(guard)}
                        title="View devices"
                      >
                        <Eye size={15} aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        className="pz-users-icon-button"
                        onClick={() => handleGenerateQR(guard.id, guard.name)}
                        title="Generate QR"
                      >
                        <QrCode size={15} aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                ))}
                {!guardUsers.length && (
                  <div className="pz-users-empty" style={{ minHeight: 150, padding: 18 }}>
                    <div className="pz-users-empty-icon">
                      <ShieldCheck size={21} aria-hidden="true" />
                    </div>
                    <span>No guard users yet.</span>
                  </div>
                )}
              </div>
            </div>

            <div className="pz-users-side-section">
              <div className="pz-users-side-title">Quick Notes</div>
              <div className="pz-guard-item">
                <div className="pz-guard-avatar" style={{ background: "#1A9E75" }}>
                  <Copy size={16} aria-hidden="true" />
                </div>
                <div>
                  <div className="pz-guard-name">QR links</div>
                  <div className="pz-guard-sub">Generated links still open in the existing QR modal.</div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      <CreateUserModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateUser}
      />

      <GenerateQRModal
        isOpen={qrModalOpen}
        onClose={() => {
          setQrModalOpen(false);
          setQrUrl("");
          setQrLoading(false);
        }}
        url={qrUrl}
        guardName={qrGuardName}
        isLoading={qrLoading}
      />

      {isDeviceModalOpen && selectedUser && (
        <DeviceManagementModal
          key={selectedUser.id}
          onClose={() => {
            setIsDeviceModalOpen(false);
            setSelectedUser(null);
          }}
          user={selectedUser}
          onUpdate={(deviceCount) => handleUpdateDevices(selectedUser.id, deviceCount)}
        />
      )}

      {isEditModalOpen && editUserData && (
        <EditUserModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditUserData(null);
          }}
          userData={editUserData}
          onUpdate={(updatedUser) => {
            setUsers(
              users.map((user) =>
                user.id === updatedUser.id
                  ? {
                      ...updatedUser,
                      name: `${updatedUser.firstName} ${updatedUser.lastName}`,
                      createdAt: user.createdAt,
                      deviceCount: user.deviceCount,
                    }
                  : user
              )
            );
          }}
        />
      )}

      {isDeleteModalOpen && userToDelete && (
        <DeleteUserModal
          isOpen={isDeleteModalOpen}
          onClose={() => {
            setIsDeleteModalOpen(false);
            setUserToDelete(null);
          }}
          user={userToDelete}
          onDelete={handleDeleteUser}
        />
      )}
    </DashboardLayout>
  );
}
