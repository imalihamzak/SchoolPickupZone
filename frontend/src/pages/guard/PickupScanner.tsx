'use client';
import Webcam from 'react-webcam';
import jsQR from 'jsqr';
import { useEffect, useRef, useState } from 'react';
import FingerprintJS from '@fingerprintjs/fingerprintjs';
import {
  AlertTriangle,
  BadgeCheck,
  Camera,
  CheckCircle2,
  Clock3,
  QrCode,
  RefreshCw,
  ShieldCheck,
  Upload,
  X,
  XCircle,
} from 'lucide-react';
import { LAN_API_BASE } from '@/lib/api/link';
import { toast } from '@/components/ui/toast';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ParentMessagesPanel from './ParentMessagesPanel';

type PickupLog = {
  id: number;
  status: 'pending' | 'approved' | 'completed' | 'confirmed' | 'cancelled' | 'rejected' | string;
  studentName: string;
  studentNames?: string | null;
  studentCount?: number | null;
  familyChildren?: FamilyChild[];
  grade?: string | null;
  guardianName: string;
  guardianRelation?: string | null;
  guardianPhone?: string | null;
  carDescription: string;
  scannedAt?: string | null;
  rejectionReason?: string | null;
  releaseConfirmationRequired?: boolean;
  canConfirmRelease?: boolean;
};

type FamilyChild = {
  id: number | string;
  name: string;
  grade?: string | null;
  photoPath?: string | null;
  scanned?: boolean;
};

type SafetyAlertType = 'driver_concern' | 'unsafe_behavior' | 'line_emergency' | 'medical_concern' | 'other';

const SAFETY_ALERT_OPTIONS: Array<{ value: SafetyAlertType; label: string }> = [
  { value: 'driver_concern', label: 'Driver Concern' },
  { value: 'unsafe_behavior', label: 'Unsafe Behavior' },
  { value: 'line_emergency', label: 'Line Emergency' },
  { value: 'medical_concern', label: 'Medical Concern' },
  { value: 'other', label: 'Other' },
];

const statusCopy = {
  pending: {
    title: 'Pending review',
    body: 'This pickup is waiting for review before release.',
    tone: 'pending',
    icon: Clock3,
  },
  approved: {
    title: 'Ready for release',
    body: 'The release guard has this pickup in their queue and will confirm when the child leaves.',
    tone: 'approved',
    icon: ShieldCheck,
  },
  confirmed: {
    title: 'Pickup confirmed',
    body: 'Final release time has been logged.',
    tone: 'confirmed',
    icon: CheckCircle2,
  },
  completed: {
    title: 'Pickup confirmed',
    body: 'Final release time has been logged.',
    tone: 'confirmed',
    icon: CheckCircle2,
  },
  cancelled: {
    title: 'Pickup rejected',
    body: 'The Admin rejected this pickup request.',
    tone: 'cancelled',
    icon: XCircle,
  },
};

const GUARD_SCANNER_CSS = `
.pz-guard-scanner {
  --navy: #071D3B;
  --navy-mid: #0B2E5A;
  --blue: #1B6ECC;
  --teal: #1A9E75;
  --teal-light: #2DC98F;
  --amber: #EF9F27;
  --red: #E24B4A;
  --white: #FFFFFF;
  --surface: #F4F6FA;
  --border: #E2E6EE;
  --text-1: #0A1628;
  --text-2: #4A5568;
  --text-3: #8A96A8;
  width: 100%;
}

.pz-guard-scanner,
.pz-guard-scanner * {
  box-sizing: border-box;
}

.pz-guard-hero {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 18px;
  margin-bottom: 22px;
}

.pz-guard-kicker {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--teal);
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0;
  margin-bottom: 8px;
}

.pz-guard-kicker::before {
  content: "";
  width: 22px;
  height: 2px;
  border-radius: 999px;
  background: var(--teal);
}

.pz-guard-title {
  margin: 0;
  color: var(--text-1);
  font-family: 'Inter', 'Segoe UI', Arial, sans-serif;
  font-size: clamp(30px, 3.6vw, 44px);
  line-height: 1.08;
  font-weight: 700;
  letter-spacing: 0;
}

.pz-guard-subtitle {
  max-width: 620px;
  margin-top: 10px;
  color: var(--text-2);
  font-size: 15px;
  line-height: 1.7;
}

.pz-guard-hero-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.pz-guard-button {
  min-height: 42px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--white);
  color: var(--text-1);
  padding: 0 14px;
  font-size: 13px;
  font-weight: 800;
  font-family: inherit;
  cursor: pointer;
  text-decoration: none;
  transition: transform 0.18s ease, box-shadow 0.18s ease, background 0.18s ease;
}

.pz-guard-button:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 10px 24px rgba(7,29,59,0.10);
}

.pz-guard-button:disabled {
  cursor: not-allowed;
  opacity: 0.65;
}

.pz-guard-button.primary {
  border-color: var(--teal);
  background: var(--teal);
  color: var(--white);
}

.pz-guard-button.primary:hover:not(:disabled) {
  background: var(--teal-light);
}

.pz-guard-button.dark {
  border-color: var(--navy);
  background: var(--navy);
  color: var(--white);
}

.pz-guard-button.danger {
  border-color: rgba(226,75,74,0.38);
  background: #FDEAEA;
  color: #B42318;
}

.pz-guard-button.danger:hover:not(:disabled) {
  border-color: var(--red);
  background: var(--red);
  color: var(--white);
}

.pz-guard-board {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 380px;
  gap: 20px;
  align-items: start;
}

.pz-guard-panel,
.pz-guard-side-card,
.pz-guard-metric {
  background: var(--white);
  border: 1px solid var(--border);
  box-shadow: 0 16px 42px rgba(7,29,59,0.08);
}

.pz-guard-panel {
  border-radius: 18px;
  overflow: hidden;
}

.pz-guard-panel-header {
  min-height: 76px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 20px 22px;
  border-bottom: 1px solid var(--border);
}

.pz-guard-panel-title {
  color: var(--text-1);
  font-family: 'Inter', 'Segoe UI', Arial, sans-serif;
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 0;
}

.pz-guard-panel-subtitle {
  margin-top: 4px;
  color: var(--text-3);
  font-size: 12px;
}

.pz-guard-live-pill,
.pz-guard-state-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 32px;
  padding: 0 11px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 800;
}

.pz-guard-live-pill {
  color: #065F46;
  background: #E1F5EE;
}

.pz-guard-live-dot {
  width: 7px;
  height: 7px;
  border-radius: 999px;
  background: var(--teal);
  box-shadow: 0 0 0 5px rgba(26,158,117,0.14);
}

.pz-guard-camera-wrap {
  padding: 18px;
}

.pz-guard-camera-frame {
  position: relative;
  overflow: hidden;
  border-radius: 16px;
  background: var(--navy);
  aspect-ratio: 16 / 10;
  min-height: 340px;
  display: grid;
  place-items: center;
}

.pz-guard-camera-frame video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.pz-guard-camera-frame::after {
  content: "";
  position: absolute;
  inset: 0;
  background:
    linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px);
  background-size: 44px 44px;
  pointer-events: none;
}

.pz-guard-reticle {
  position: absolute;
  inset: 12%;
  border: 1px solid rgba(255,255,255,0.24);
  border-radius: 24px;
  z-index: 2;
  pointer-events: none;
}

.pz-guard-reticle span {
  position: absolute;
  width: 42px;
  height: 42px;
  border-color: var(--teal-light);
}

.pz-guard-reticle span:nth-child(1) {
  top: -1px;
  left: -1px;
  border-top: 4px solid;
  border-left: 4px solid;
  border-radius: 18px 0 0 0;
}

.pz-guard-reticle span:nth-child(2) {
  top: -1px;
  right: -1px;
  border-top: 4px solid;
  border-right: 4px solid;
  border-radius: 0 18px 0 0;
}

.pz-guard-reticle span:nth-child(3) {
  bottom: -1px;
  right: -1px;
  border-bottom: 4px solid;
  border-right: 4px solid;
  border-radius: 0 0 18px 0;
}

.pz-guard-reticle span:nth-child(4) {
  bottom: -1px;
  left: -1px;
  border-bottom: 4px solid;
  border-left: 4px solid;
  border-radius: 0 0 0 18px;
}

.pz-guard-scan-line {
  position: absolute;
  left: 16%;
  right: 16%;
  top: 24%;
  height: 2px;
  border-radius: 999px;
  background: linear-gradient(90deg, transparent, var(--teal-light), transparent);
  z-index: 3;
  animation: pzGuardScanLine 2.2s ease-in-out infinite;
}

.pz-guard-camera-label {
  position: absolute;
  left: 18px;
  bottom: 18px;
  z-index: 4;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 34px;
  padding: 0 12px;
  border-radius: 999px;
  background: rgba(7,29,59,0.72);
  color: var(--white);
  font-size: 12px;
  font-weight: 800;
  backdrop-filter: blur(10px);
}

.pz-guard-result {
  min-height: 340px;
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 34px;
  border: 1px solid;
}

.pz-guard-result.pending {
  background: #FFFBEB;
  border-color: #FDE68A;
  color: #92400E;
}

.pz-guard-result.approved,
.pz-guard-result.confirmed {
  background: #E1F5EE;
  border-color: #BDEBD9;
  color: #065F46;
}

.pz-guard-result.cancelled {
  background: #FDEAEA;
  border-color: #F7C8C8;
  color: #9B1C1C;
}

.pz-guard-result-icon {
  width: 62px;
  height: 62px;
  border-radius: 18px;
  display: grid;
  place-items: center;
  background: rgba(255,255,255,0.65);
}

.pz-guard-result h2 {
  margin: 16px 0 8px;
  color: currentColor;
  font-family: 'Inter', 'Segoe UI', Arial, sans-serif;
  font-size: 24px;
  font-weight: 700;
  letter-spacing: 0;
}

.pz-guard-result p {
  margin: 0;
  max-width: 430px;
  color: currentColor;
  opacity: 0.82;
  line-height: 1.65;
}

.pz-guard-panel-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  padding: 0 18px 20px;
}

.pz-guard-side {
  display: grid;
  gap: 16px;
}

.pz-guard-side-card {
  border-radius: 18px;
  padding: 20px;
}

.pz-guard-card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
}

.pz-guard-card-title {
  color: var(--text-1);
  font-family: 'Inter', 'Segoe UI', Arial, sans-serif;
  font-size: 17px;
  font-weight: 700;
  letter-spacing: 0;
}

.pz-guard-card-subtitle {
  margin-top: 4px;
  color: var(--text-3);
  font-size: 12px;
  line-height: 1.5;
}

.pz-guard-card-icon {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  background: #E1F5EE;
  color: var(--teal);
  flex: 0 0 auto;
}

.pz-guard-state-pill.pending {
  background: #FFFBEB;
  color: #92400E;
}

.pz-guard-state-pill.approved,
.pz-guard-state-pill.confirmed {
  background: #E1F5EE;
  color: #065F46;
}

.pz-guard-state-pill.cancelled {
  background: #FDEAEA;
  color: #9B1C1C;
}

.pz-guard-details {
  display: grid;
  gap: 12px;
}

.pz-guard-info-row {
  padding: 12px 0;
  border-bottom: 1px solid var(--border);
}

.pz-guard-info-row:last-child {
  border-bottom: 0;
}

.pz-guard-info-label {
  color: var(--text-3);
  font-size: 10px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0;
}

.pz-guard-info-value {
  margin-top: 4px;
  color: var(--text-1);
  font-size: 14px;
  font-weight: 800;
  line-height: 1.45;
}

.pz-guard-linked-children {
  display: grid;
  gap: 8px;
  padding: 12px 0;
  border-bottom: 1px solid var(--border);
}

.pz-guard-child-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
}

.pz-guard-child-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 31px;
  border: 1px solid var(--border);
  border-radius: 999px;
  background: #F8FAFC;
  color: var(--text-1);
  padding: 0 10px;
  font-size: 12px;
  font-weight: 800;
  max-width: 100%;
}

.pz-guard-child-chip span {
  color: var(--text-3);
  font-size: 11px;
}

.pz-guard-child-chip.scanned {
  border-color: rgba(26,158,117,0.36);
  background: #E1F5EE;
  color: #065F46;
}

.pz-guard-empty {
  border: 1px dashed #CBD5E1;
  border-radius: 14px;
  background: #F8FAFC;
  padding: 22px;
  color: var(--text-2);
  font-size: 13px;
  line-height: 1.6;
}

.pz-guard-metrics {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin-top: 20px;
}

.pz-guard-metric {
  border-radius: 15px;
  padding: 16px;
}

.pz-guard-metric-label {
  color: var(--text-3);
  font-size: 11px;
  font-weight: 800;
}

.pz-guard-metric-value {
  margin-top: 8px;
  color: var(--text-1);
  font-family: 'Inter', 'Segoe UI', Arial, sans-serif;
  font-size: 20px;
  font-weight: 700;
}

.pz-guard-processing-overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: grid;
  place-items: center;
  padding: 24px;
  background: rgba(7,29,59,0.22);
  backdrop-filter: blur(8px);
}

.pz-guard-processing-card {
  width: min(100%, 340px);
  border: 1px solid var(--border);
  border-radius: 18px;
  background: var(--white);
  box-shadow: 0 24px 70px rgba(7,29,59,0.22);
  padding: 28px;
  text-align: center;
}

.pz-guard-processing-card p {
  margin: 14px 0 0;
  color: var(--text-1);
  font-weight: 800;
}

.pz-guard-alert-backdrop {
  position: fixed;
  inset: 0;
  z-index: 120;
  display: grid;
  place-items: center;
  padding: 18px;
  background: rgba(7,29,59,0.48);
  backdrop-filter: blur(8px);
}

.pz-guard-alert-modal {
  width: min(100%, 480px);
  max-height: min(92vh, 620px);
  overflow: auto;
  border: 1px solid var(--border);
  border-radius: 16px;
  background: var(--white);
  box-shadow: 0 24px 80px rgba(7,29,59,0.28);
}

.pz-guard-alert-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
  padding: 18px 18px 14px;
  border-bottom: 1px solid var(--border);
}

.pz-guard-alert-title-row {
  display: flex;
  align-items: center;
  gap: 11px;
}

.pz-guard-alert-icon {
  width: 42px;
  height: 42px;
  border-radius: 13px;
  display: grid;
  place-items: center;
  background: #FDEAEA;
  color: var(--red);
  flex: 0 0 auto;
}

.pz-guard-alert-title {
  margin: 0;
  color: var(--text-1);
  font-family: 'Inter', 'Segoe UI', Arial, sans-serif;
  font-size: 18px;
  font-weight: 800;
  letter-spacing: 0;
}

.pz-guard-alert-subtitle {
  margin-top: 4px;
  color: var(--text-3);
  font-size: 12px;
}

.pz-guard-alert-close {
  width: 34px;
  height: 34px;
  border: 1px solid var(--border);
  border-radius: 10px;
  display: grid;
  place-items: center;
  background: var(--white);
  color: var(--text-2);
  cursor: pointer;
}

.pz-guard-alert-body {
  padding: 16px 18px 18px;
  display: grid;
  gap: 14px;
}

.pz-guard-alert-label {
  color: var(--text-3);
  font-size: 10px;
  font-weight: 900;
  letter-spacing: 0;
  text-transform: uppercase;
}

.pz-guard-alert-options {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  margin-top: 8px;
}

.pz-guard-alert-option {
  min-height: 42px;
  border: 1px solid var(--border);
  border-radius: 11px;
  background: #F8FAFC;
  color: var(--text-1);
  padding: 0 12px;
  text-align: left;
  font-size: 13px;
  font-weight: 800;
  cursor: pointer;
}

.pz-guard-alert-option.active {
  border-color: rgba(226,75,74,0.42);
  background: #FDEAEA;
  color: #B42318;
}

.pz-guard-alert-note {
  width: 100%;
  min-height: 104px;
  resize: vertical;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: var(--white);
  color: var(--text-1);
  padding: 12px;
  font: 700 13px/1.5 'DM Sans', 'Segoe UI', Arial, sans-serif;
  outline: none;
}

.pz-guard-alert-note:focus {
  border-color: rgba(27,110,204,0.48);
  box-shadow: 0 0 0 3px rgba(27,110,204,0.10);
}

.pz-guard-alert-actions {
  display: grid;
  grid-template-columns: 1fr 1.2fr;
  gap: 10px;
}

.pz-guard-scanner-loading {
  min-height: 420px;
  display: grid;
  place-items: center;
}

.pz-guard-scanner-loading-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  color: var(--text-2);
  font-weight: 800;
}

.pz-guard-camera-skeleton {
  background: var(--white);
  border-color: var(--border);
}

.pz-guard-camera-skeleton::after {
  display: none;
}

.pz-guard-camera-skeleton-inner {
  width: min(420px, 86%);
  display: grid;
  gap: 18px;
}

@keyframes pzGuardScanLine {
  0%, 100% {
    top: 22%;
    opacity: 0.5;
  }
  50% {
    top: 76%;
    opacity: 1;
  }
}

@media (max-width: 1120px) {
  .pz-guard-board {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 760px) {
  .pz-guard-scanner {
    overflow-x: hidden;
  }

  .pz-guard-hero {
    align-items: flex-start;
    flex-direction: column;
    gap: 12px;
    margin-bottom: 14px;
  }

  .pz-guard-kicker {
    font-size: 10px;
    margin-bottom: 6px;
  }

  .pz-guard-title {
    font-size: clamp(24px, 9vw, 32px);
    line-height: 1.1;
  }

  .pz-guard-subtitle {
    margin-top: 6px;
    font-size: 13px;
    line-height: 1.55;
  }

  .pz-guard-hero-actions {
    width: 100%;
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 8px;
  }

  .pz-guard-button {
    width: 100%;
    min-height: 38px;
    padding: 0 10px;
    font-size: 12px;
    white-space: nowrap;
  }

  .pz-guard-board,
  .pz-guard-side {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .pz-guard-panel,
  .pz-guard-side-card,
  .pz-guard-metric {
    border-radius: 14px;
    box-shadow: 0 10px 28px rgba(7,29,59,0.07);
  }

  .pz-guard-panel-header {
    min-height: 0;
    align-items: flex-start;
    padding: 14px;
  }

  .pz-guard-panel-title,
  .pz-guard-card-title {
    font-size: 14px;
  }

  .pz-guard-panel-subtitle,
  .pz-guard-card-subtitle {
    font-size: 10px;
    line-height: 1.45;
  }

  .pz-guard-live-pill,
  .pz-guard-state-pill {
    min-height: 26px;
    padding: 0 9px;
    font-size: 10px;
  }

  .pz-guard-camera-wrap,
  .pz-guard-side-card {
    padding: 10px;
  }

  .pz-guard-camera-frame {
    min-height: 0;
    height: clamp(190px, 68vw, 340px);
    aspect-ratio: auto;
    border-radius: 12px;
  }

  .pz-guard-camera-frame video {
    object-fit: contain;
  }

  .pz-guard-camera-frame::after {
    background-size: 34px 34px;
  }

  .pz-guard-reticle {
    inset: 11%;
    border-radius: 16px;
  }

  .pz-guard-reticle span {
    width: 28px;
    height: 28px;
  }

  .pz-guard-reticle span:nth-child(1) {
    border-top-width: 3px;
    border-left-width: 3px;
    border-radius: 12px 0 0 0;
  }

  .pz-guard-reticle span:nth-child(2) {
    border-top-width: 3px;
    border-right-width: 3px;
    border-radius: 0 12px 0 0;
  }

  .pz-guard-reticle span:nth-child(3) {
    border-bottom-width: 3px;
    border-right-width: 3px;
    border-radius: 0 0 12px 0;
  }

  .pz-guard-reticle span:nth-child(4) {
    border-bottom-width: 3px;
    border-left-width: 3px;
    border-radius: 0 0 0 12px;
  }

  .pz-guard-camera-label {
    left: 10px;
    bottom: 10px;
    min-height: 28px;
    padding: 0 9px;
    font-size: 10px;
  }

  .pz-guard-result {
    min-height: 190px;
    padding: 22px 14px;
    border-radius: 12px;
  }

  .pz-guard-result-icon {
    width: 48px;
    height: 48px;
    border-radius: 14px;
  }

  .pz-guard-result h2 {
    font-size: 18px;
  }

  .pz-guard-result p {
    font-size: 12px;
  }

  .pz-guard-card-top {
    margin-bottom: 12px;
  }

  .pz-guard-card-icon {
    width: 34px;
    height: 34px;
    border-radius: 10px;
  }

  .pz-guard-empty {
    padding: 14px;
    font-size: 12px;
  }

  .pz-guard-metrics {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 8px;
    margin-top: 14px;
  }

  .pz-guard-metric {
    padding: 10px 8px;
    min-width: 0;
  }

  .pz-guard-metric-label {
    font-size: 9px;
  }

  .pz-guard-metric-value {
    font-size: clamp(13px, 4.5vw, 16px);
    overflow-wrap: anywhere;
  }
}

@media (max-width: 380px) {
  .pz-guard-hero-actions {
    grid-template-columns: 1fr;
  }

  .pz-guard-metrics {
    grid-template-columns: 1fr;
  }

  .pz-guard-alert-options,
  .pz-guard-alert-actions {
    grid-template-columns: 1fr;
  }

  .pz-guard-camera-frame {
    height: clamp(180px, 78vw, 280px);
  }
}
`;

export default function PickupScanner() {
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const processingRef = useRef(false);
  const [scanning, setScanning] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [pickupLog, setPickupLog] = useState<PickupLog | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [safetyModalOpen, setSafetyModalOpen] = useState(false);
  const [safetyAlertType, setSafetyAlertType] = useState<SafetyAlertType>('driver_concern');
  const [safetyNote, setSafetyNote] = useState('');
  const [sendingSafetyAlert, setSendingSafetyAlert] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setPageLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!scanning || processingRef.current || !webcamRef.current || !canvasRef.current) return;

      const video = webcamRef.current.video;
      const canvas = canvasRef.current;
      if (!video || video.readyState !== 4) return;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const qrCode = jsQR(imageData.data, imageData.width, imageData.height);

      if (qrCode?.data) {
        handleQRScan(qrCode.data);
      }
    }, 600);

    return () => clearInterval(interval);
  }, [scanning]);

  useEffect(() => {
    if (!pickupLog?.id || pickupLog.status !== 'pending') return;

    const token = localStorage.getItem('token');
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`${LAN_API_BASE}/pickups/${pickupLog.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const result = await response.json();
        if (response.ok) {
          setPickupLog(result);
          if (result.status === 'approved') {
            toast.success('Pickup is ready for release');
          } else if (result.status === 'cancelled' || result.status === 'rejected') {
            toast.error('Pickup request was rejected');
          }
        }
      } catch {
        // Polling is best-effort; the guard can still refresh manually by scanning again.
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [pickupLog?.id, pickupLog?.status]);

  const handleQRScan = async (data: string) => {
    if (processingRef.current) return;
    processingRef.current = true;
    setUploading(true);

    try {
      const [fingerprint, location] = await Promise.all([
        getFingerprint(),
        getScanLocation(),
      ]);
      const userAgent = navigator.userAgent;
      const token = localStorage.getItem('token');

      const response = await fetch(`${LAN_API_BASE}/pickups/scan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          qrToken: data,
          device_fingerprint: fingerprint,
          user_agent: userAgent,
          location,
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        toast.error(result.error || 'Pickup scan failed');
        setScanning(false);
        return;
      }

      setPickupLog(result.pickupLog);
      setScanning(false);
      toast.success(result.message || 'Pickup request submitted');
    } catch (err) {
      console.error(err);
      toast.error('Invalid QR code or network error');
      setScanning(false);
    } finally {
      processingRef.current = false;
      setUploading(false);
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const img = new Image();
    img.src = URL.createObjectURL(file);

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        setUploading(false);
        return;
      }

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const qrCode = jsQR(imageData.data, imageData.width, imageData.height);

      if (qrCode?.data) {
        handleQRScan(qrCode.data);
      } else {
        toast.error('No QR code found in the image.');
        setUploading(false);
      }

      event.target.value = '';
    };
  };

  const confirmPickup = async () => {
    if (!pickupLog?.id) return;
    setConfirming(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${LAN_API_BASE}/pickups/${pickupLog.id}/confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      const result = await response.json();

      if (!response.ok) {
        toast.error(result.error || 'Could not confirm pickup');
        return;
      }

      setPickupLog(result.pickupLog);
      toast.success(result.message || 'Pickup confirmed');
    } catch {
      toast.error('Network error while confirming pickup');
    } finally {
      setConfirming(false);
    }
  };

  const resetScanner = () => {
    processingRef.current = false;
    setPickupLog(null);
    setScanning(true);
  };

  const sendSafetyAlert = async () => {
    if (sendingSafetyAlert) return;
    setSendingSafetyAlert(true);

    try {
      const token = localStorage.getItem('token');
      const location = await getScanLocation();
      const response = await fetch(`${LAN_API_BASE}/pickups/safety-alert`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          pickup_id: pickupLog?.id || null,
          alert_type: safetyAlertType,
          note: safetyNote.trim() || null,
          location,
        }),
      });
      const result = await response.json();

      if (!response.ok) {
        toast.error(result.error || 'Could not send safety alert');
        return;
      }

      if (result.warning) {
        toast.warning(result.warning);
      } else {
        toast.success(result.message || 'Safety alert sent');
      }
      setSafetyModalOpen(false);
      setSafetyAlertType('driver_concern');
      setSafetyNote('');
    } catch {
      toast.error('Network error while sending safety alert');
    } finally {
      setSendingSafetyAlert(false);
    }
  };

  async function getFingerprint() {
    const fp = await FingerprintJS.load();
    const result = await fp.get();
    return result.visitorId;
  }

  function getScanLocation(): Promise<string | null> {
    if (!navigator.geolocation) return Promise.resolve(null);

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        ({ coords }) => {
          resolve(JSON.stringify({
            lat: Number(coords.latitude.toFixed(6)),
            lng: Number(coords.longitude.toFixed(6)),
            accuracy: Math.round(coords.accuracy),
          }));
        },
        () => resolve(null),
        {
          enableHighAccuracy: true,
          maximumAge: 60000,
          timeout: 1500,
        }
      );
    });
  }

  const rawStatus = pickupLog?.status === 'rejected' ? 'cancelled' : pickupLog?.status || 'pending';
  const status = statusCopy[rawStatus as keyof typeof statusCopy] || statusCopy.pending;
  const StatusIcon = status.icon;
  const statusTone = status.tone;
  let statusBody = status.body;
  if (pickupLog?.status === 'approved') {
    statusBody = pickupLog.canConfirmRelease === false
      ? 'The release guard has this pickup in their queue and will confirm once the child leaves.'
      : 'Confirm the pickup once the child has left with the pickup vehicle.';
  }

  if (pageLoading) {
    return (
      <div className="pz-guard-scanner">
        <style>{GUARD_SCANNER_CSS}</style>
        <GuardDashboardSkeleton />
      </div>
    );
  }

  return (
    <div className="pz-guard-scanner">
      <style>{GUARD_SCANNER_CSS}</style>

      <div className="pz-guard-hero">
        <div>
          <div className="pz-guard-kicker">Guard Pickup</div>
          <h1 className="pz-guard-title">Scan Pickup QR</h1>
          <div className="pz-guard-subtitle">
            Verify the pickup request, send it to the release queue, and confirm final release when assigned.
          </div>
        </div>
        <div className="pz-guard-hero-actions">
          <label className="pz-guard-button">
            <Upload size={16} aria-hidden="true" />
            Upload QR
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              disabled={uploading}
              hidden
            />
          </label>
          <button type="button" onClick={resetScanner} className="pz-guard-button dark">
            <RefreshCw size={16} aria-hidden="true" />
            Scan Again
          </button>
          <button
            type="button"
            onClick={() => setSafetyModalOpen(true)}
            className="pz-guard-button danger"
            disabled={sendingSafetyAlert}
          >
            <AlertTriangle size={16} aria-hidden="true" />
            Safety Alert
          </button>
        </div>
      </div>

      <div className="pz-guard-board">
        <section className="pz-guard-panel">
          <div className="pz-guard-panel-header">
            <div>
              <div className="pz-guard-panel-title">Live Scanner</div>
              <div className="pz-guard-panel-subtitle">
                {scanning ? 'Camera active and ready for QR capture' : 'Scanner paused after last scan'}
              </div>
            </div>
            <div className="pz-guard-live-pill">
              <span className="pz-guard-live-dot" />
              {scanning ? 'Live' : 'Paused'}
            </div>
          </div>

          <div className="pz-guard-camera-wrap">
            {scanning ? (
              <div className="pz-guard-camera-frame">
                <Webcam
                  ref={webcamRef}
                  screenshotFormat="image/jpeg"
                  videoConstraints={{ facingMode: 'environment' }}
                />
                <canvas ref={canvasRef} hidden />
                <div className="pz-guard-reticle" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                  <span />
                </div>
                <div className="pz-guard-scan-line" aria-hidden="true" />
                <div className="pz-guard-camera-label">
                  <Camera size={15} aria-hidden="true" />
                  Camera scan
                </div>
              </div>
            ) : (
              <div className={`pz-guard-result ${statusTone}`}>
                <div className="pz-guard-result-icon">
                  <StatusIcon size={34} aria-hidden="true" />
                </div>
                <h2>{pickupLog ? status.title : 'Scanner paused'}</h2>
                <p>{pickupLog ? statusBody : 'Start another scan when you are ready.'}</p>
              </div>
            )}
          </div>
        </section>

        <aside className="pz-guard-side">
          <section className="pz-guard-side-card">
            <div className="pz-guard-card-top">
              <div>
                <div className="pz-guard-card-title">Pickup Status</div>
                <div className="pz-guard-card-subtitle">
                  {pickupLog ? `Request #${pickupLog.id}` : 'No active pickup request'}
                </div>
              </div>
              <div className="pz-guard-card-icon">
                <QrCode size={21} aria-hidden="true" />
              </div>
            </div>

            {pickupLog ? (
              <>
                <div className={`pz-guard-state-pill ${statusTone}`}>
                  <StatusIcon size={15} aria-hidden="true" />
                  {status.title}
                </div>

                <div className="pz-guard-details" style={{ marginTop: 16 }}>
                  <InfoRow label="Student" value={studentSummary(pickupLog)} />
                  {(pickupLog.familyChildren?.length || 0) > 1 && (
                    <LinkedChildren children={pickupLog.familyChildren || []} />
                  )}
                  <InfoRow label="Pickup Person" value={`${pickupLog.guardianName}${pickupLog.guardianRelation ? ` (${pickupLog.guardianRelation})` : ''}`} />
                  <InfoRow label="Phone" value={pickupLog.guardianPhone || 'Not provided'} />
                  <InfoRow label="Vehicle" value={pickupLog.carDescription || 'No vehicle registered'} />
                </div>

                {(pickupLog.rejectionReason || statusBody) && (
                  <div className="pz-guard-empty" style={{ marginTop: 16 }}>
                    {pickupLog.rejectionReason || statusBody}
                  </div>
                )}

                {pickupLog.status === 'approved' && pickupLog.canConfirmRelease !== false && (
                  <button
                    type="button"
                    onClick={confirmPickup}
                    disabled={confirming}
                    className="pz-guard-button primary"
                    style={{ width: '100%', marginTop: 16 }}
                  >
                    {confirming ? (
                      <LoadingSpinner size="xs" className="pz-loading-inline" />
                    ) : (
                      <CheckCircle2 size={17} aria-hidden="true" />
                    )}
                    Confirm Child Released
                  </button>
                )}
              </>
            ) : (
              <div className="pz-guard-empty">
                Scan a pickup QR code to create a release request.
              </div>
            )}
          </section>

          <section className="pz-guard-side-card">
            <div className="pz-guard-card-top">
              <div>
                <div className="pz-guard-card-title">Security Check</div>
                <div className="pz-guard-card-subtitle">Device, QR, and school matching are validated on every scan.</div>
              </div>
              <div className="pz-guard-card-icon">
                <BadgeCheck size={21} aria-hidden="true" />
              </div>
            </div>
            <div className="pz-guard-metrics">
              <div className="pz-guard-metric">
                <div className="pz-guard-metric-label">Mode</div>
                <div className="pz-guard-metric-value">{scanning ? 'Live' : 'Paused'}</div>
              </div>
              <div className="pz-guard-metric">
                <div className="pz-guard-metric-label">Request</div>
                <div className="pz-guard-metric-value">{pickupLog ? `#${pickupLog.id}` : 'None'}</div>
              </div>
              <div className="pz-guard-metric">
                <div className="pz-guard-metric-label">Status</div>
                <div className="pz-guard-metric-value">{pickupLog ? status.title.replace('Pickup ', '') : 'Ready'}</div>
              </div>
            </div>
          </section>

          <ParentMessagesPanel />
        </aside>
      </div>

      {uploading && (
        <div className="pz-guard-processing-overlay">
          <section className="pz-guard-processing-card" aria-live="polite">
            <LoadingSpinner size="lg" label="Processing QR code" />
            <p>Processing QR code...</p>
          </section>
        </div>
      )}

      {safetyModalOpen && (
        <div className="pz-guard-alert-backdrop">
          <section className="pz-guard-alert-modal" aria-labelledby="guard-safety-alert-title">
            <div className="pz-guard-alert-head">
              <div className="pz-guard-alert-title-row">
                <div className="pz-guard-alert-icon">
                  <AlertTriangle size={22} aria-hidden="true" />
                </div>
                <div>
                  <h2 className="pz-guard-alert-title" id="guard-safety-alert-title">Safety Alert</h2>
                  <div className="pz-guard-alert-subtitle">
                    {pickupLog ? `Attached to request #${pickupLog.id}` : 'No pickup request attached'}
                  </div>
                </div>
              </div>
              <button
                type="button"
                className="pz-guard-alert-close"
                onClick={() => setSafetyModalOpen(false)}
                disabled={sendingSafetyAlert}
                aria-label="Close safety alert"
              >
                <X size={17} aria-hidden="true" />
              </button>
            </div>

            <div className="pz-guard-alert-body">
              <div>
                <div className="pz-guard-alert-label">Concern Type</div>
                <div className="pz-guard-alert-options">
                  {SAFETY_ALERT_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      className={`pz-guard-alert-option ${safetyAlertType === option.value ? 'active' : ''}`}
                      onClick={() => setSafetyAlertType(option.value)}
                      disabled={sendingSafetyAlert}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <label>
                <div className="pz-guard-alert-label">Details</div>
                <textarea
                  className="pz-guard-alert-note"
                  value={safetyNote}
                  onChange={(event) => setSafetyNote(event.target.value.slice(0, 600))}
                  placeholder="Optional note"
                  disabled={sendingSafetyAlert}
                />
              </label>

              <div className="pz-guard-alert-actions">
                <button
                  type="button"
                  className="pz-guard-button"
                  onClick={() => setSafetyModalOpen(false)}
                  disabled={sendingSafetyAlert}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="pz-guard-button danger"
                  onClick={sendSafetyAlert}
                  disabled={sendingSafetyAlert}
                >
                  {sendingSafetyAlert ? (
                    <LoadingSpinner size="xs" className="pz-loading-inline" />
                  ) : (
                    <AlertTriangle size={16} aria-hidden="true" />
                  )}
                  Send Safety Alert
                </button>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

function studentSummary(pickup: PickupLog) {
  if (pickup.studentNames) return pickup.studentNames;
  return `${pickup.studentName}${pickup.grade ? `, Grade ${pickup.grade}` : ''}`;
}

function LinkedChildren({ children }: { children: FamilyChild[] }) {
  return (
    <div className="pz-guard-linked-children">
      <div className="pz-guard-info-label">Linked Children</div>
      <div className="pz-guard-child-chips">
        {children.map((child) => (
          <div className={`pz-guard-child-chip ${child.scanned ? 'scanned' : ''}`} key={child.id}>
            {child.name}
            {child.grade ? <span>Grade {child.grade}</span> : null}
            {child.scanned ? <span>Scanned QR</span> : null}
          </div>
        ))}
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="pz-guard-info-row">
      <div className="pz-guard-info-label">{label}</div>
      <div className="pz-guard-info-value">{value}</div>
    </div>
  );
}

function SkeletonLine({ width = "100%" }: { width?: string }) {
  return <div className="pz-skeleton pz-skeleton-line" style={{ width }} />;
}

function GuardDashboardSkeleton() {
  return (
    <>
      <div className="pz-guard-hero">
        <div style={{ width: "min(520px, 100%)" }}>
          <SkeletonLine width="28%" />
          <div style={{ marginTop: 14 }}>
            <div className="pz-skeleton" style={{ width: "70%", height: 40, borderRadius: 11 }} />
          </div>
          <div style={{ marginTop: 12 }}>
            <SkeletonLine width="88%" />
          </div>
        </div>
        <div className="pz-guard-hero-actions">
          <div className="pz-skeleton" style={{ width: 112, height: 40, borderRadius: 10 }} />
          <div className="pz-skeleton" style={{ width: 118, height: 40, borderRadius: 10 }} />
        </div>
      </div>

      <div className="pz-guard-board">
        <section className="pz-guard-panel">
          <div className="pz-guard-panel-header">
            <div style={{ minWidth: 220 }}>
              <SkeletonLine width="48%" />
              <div style={{ marginTop: 8 }}>
                <SkeletonLine width="84%" />
              </div>
            </div>
            <SkeletonLine width="76px" />
          </div>
          <div className="pz-guard-camera-wrap">
            <div className="pz-guard-camera-frame pz-guard-camera-skeleton">
              <div className="pz-guard-camera-skeleton-inner">
                <div className="pz-skeleton" style={{ width: "100%", height: 16, borderRadius: 999 }} />
                <div className="pz-skeleton" style={{ width: "78%", height: 16, borderRadius: 999, marginLeft: "11%" }} />
                <div className="pz-skeleton" style={{ width: "92%", height: 16, borderRadius: 999, marginLeft: "4%" }} />
              </div>
            </div>
          </div>
        </section>

        <aside className="pz-guard-side">
          <section className="pz-guard-side-card">
            <div className="pz-guard-card-top">
              <div style={{ minWidth: 180 }}>
                <SkeletonLine width="58%" />
                <div style={{ marginTop: 8 }}>
                  <SkeletonLine width="82%" />
                </div>
              </div>
              <div className="pz-skeleton pz-skeleton-icon" />
            </div>
            <div className="pz-guard-details" style={{ marginTop: 16 }}>
              {Array.from({ length: 4 }).map((_, index) => (
                <div className="pz-guard-info-row" key={index}>
                  <SkeletonLine width={index % 2 ? "38%" : "48%"} />
                  <SkeletonLine width={index % 2 ? "72%" : "56%"} />
                </div>
              ))}
            </div>
          </section>

          <section className="pz-guard-side-card">
            <div className="pz-guard-card-top">
              <div style={{ minWidth: 180 }}>
                <SkeletonLine width="52%" />
                <div style={{ marginTop: 8 }}>
                  <SkeletonLine width="88%" />
                </div>
              </div>
              <div className="pz-skeleton pz-skeleton-icon" />
            </div>
            <div className="pz-guard-metrics">
              {Array.from({ length: 3 }).map((_, index) => (
                <div className="pz-guard-metric" key={index}>
                  <SkeletonLine width="48%" />
                  <div style={{ marginTop: 11 }}>
                    <SkeletonLine width="70%" />
                  </div>
                </div>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </>
  );
}
