import { useState } from "react";
import {
  AlertTriangle,
  CalendarDays,
  CarFront,
  CheckCircle2,
  Download,
  ExternalLink,
  FileText,
  GraduationCap,
  Home,
  Mail,
  Phone,
  ShieldCheck,
  UserRound,
  UsersRound,
  X,
  XCircle,
} from "lucide-react";
import { API_BASE_URL, LOCAL_BASE } from "@/lib/api/link";
import { toast } from "@/components/ui/toast";
import type { DocumentVerificationStatus } from "@/lib/documentVerification";

const FAMILY_VIEW_CSS = `
.pz-family-modal-root {
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
  font-family: 'DM Sans', "Segoe UI", Arial, sans-serif;
  position: fixed;
  inset: 0;
  z-index: 70;
  background: rgba(7,29,59,0.58);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 18px;
}

.pz-family-modal-root,
.pz-family-modal-root * {
  box-sizing: border-box;
}

.pz-family-modal {
  width: min(1180px, 100%);
  max-height: min(92vh, 980px);
  background: var(--white);
  border: 1px solid rgba(255,255,255,0.18);
  border-radius: 18px;
  box-shadow: 0 28px 90px rgba(7,29,59,0.32);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.pz-family-modal-header {
  background: linear-gradient(135deg, var(--navy), var(--navy-mid));
  color: var(--white);
  padding: 22px 24px;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18px;
}

.pz-family-title-wrap {
  display: flex;
  gap: 14px;
  min-width: 0;
}

.pz-family-avatar {
  width: 54px;
  height: 54px;
  border-radius: 15px;
  background: var(--teal);
  color: var(--white);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-family: 'Inter', sans-serif;
  font-size: 15px;
  font-weight: 800;
}

.pz-family-title {
  font-family: 'Inter', sans-serif;
  font-size: clamp(22px, 3vw, 31px);
  line-height: 1.05;
  font-weight: 700;
  letter-spacing: -0.025em;
  margin: 0;
  color: var(--white);
}

.pz-family-meta {
  display: flex;
  align-items: center;
  gap: 9px;
  flex-wrap: wrap;
  color: rgba(255,255,255,0.58);
  font-size: 12px;
  margin-top: 9px;
}

.pz-family-status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border-radius: 999px;
  padding: 5px 10px;
  font-size: 11px;
  font-weight: 800;
  text-transform: capitalize;
}

.pz-family-status.green {
  background: rgba(45,201,143,0.16);
  color: #9BE8C8;
}

.pz-family-status.amber {
  background: rgba(239,159,39,0.17);
  color: #FFD08A;
}

.pz-family-status.red {
  background: rgba(226,75,74,0.18);
  color: #FFAAA8;
}

.pz-family-status.gray {
  background: rgba(255,255,255,0.12);
  color: rgba(255,255,255,0.8);
}

.pz-family-body .pz-family-status.green {
  background: #D9F7EC;
  color: #067647;
}

.pz-family-body .pz-family-status.amber {
  background: #FFF0D5;
  color: #9A5B00;
}

.pz-family-body .pz-family-status.red {
  background: #FDE2E2;
  color: #B42318;
}

.pz-family-body .pz-family-status.gray {
  background: #E9EEF5;
  color: #344054;
}

.pz-family-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}

.pz-family-close {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  border: 1px solid rgba(255,255,255,0.14);
  background: rgba(255,255,255,0.07);
  color: var(--white);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.18s ease;
}

.pz-family-close:hover {
  background: rgba(255,255,255,0.15);
}

.pz-family-body {
  overflow-y: auto;
  background: var(--surface);
  padding: 20px;
}

.pz-family-body::-webkit-scrollbar {
  width: 5px;
}

.pz-family-body::-webkit-scrollbar-thumb {
  background: #CAD2DF;
  border-radius: 999px;
}

.pz-family-summary {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}

.pz-family-summary-card {
  background: var(--white);
  border: 1px solid var(--border);
  border-radius: 13px;
  padding: 14px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.pz-family-summary-icon {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.pz-family-summary-label {
  color: var(--text-3);
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.pz-family-summary-value {
  color: var(--text-1);
  font-family: 'Inter', sans-serif;
  font-size: 22px;
  font-weight: 800;
  line-height: 1;
  margin-top: 4px;
}

.pz-family-tabs {
  display: flex;
  gap: 5px;
  width: fit-content;
  background: var(--white);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 4px;
  margin-bottom: 16px;
}

.pz-family-tab {
  border: 0;
  border-radius: 9px;
  background: transparent;
  color: var(--text-3);
  padding: 9px 13px;
  font-size: 13px;
  font-weight: 800;
  cursor: pointer;
  font-family: 'DM Sans', sans-serif;
}

.pz-family-tab.active {
  background: var(--navy);
  color: var(--white);
}

.pz-family-grid {
  display: grid;
  grid-template-columns: minmax(0, 0.95fr) minmax(340px, 0.55fr);
  gap: 16px;
  align-items: start;
}

.pz-family-card {
  background: var(--white);
  border: 1px solid var(--border);
  border-radius: 14px;
  overflow: hidden;
}

.pz-family-card-head {
  padding: 16px 18px;
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.pz-family-card-title {
  font-family: 'Inter', sans-serif;
  font-size: 15px;
  font-weight: 700;
  letter-spacing: -0.025em;
  color: var(--text-1);
}

.pz-family-card-body {
  padding: 18px;
}

.pz-info-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.pz-info-item {
  min-width: 0;
  display: flex;
  gap: 10px;
  align-items: flex-start;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 11px;
  padding: 11px;
}

.pz-info-icon {
  width: 32px;
  height: 32px;
  border-radius: 9px;
  background: #EFF6FF;
  color: var(--blue);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.pz-info-label {
  color: var(--text-3);
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.pz-info-value {
  color: var(--text-1);
  font-size: 13px;
  font-weight: 700;
  margin-top: 3px;
  overflow-wrap: anywhere;
}

.pz-family-stack {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.pz-person-card {
  border: 1px solid var(--border);
  border-radius: 13px;
  padding: 13px;
  background: #FAFBFD;
}

.pz-person-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.pz-person-title {
  color: var(--text-1);
  font-size: 14px;
  font-weight: 800;
}

.pz-person-sub {
  color: var(--text-3);
  font-size: 12px;
  margin-top: 3px;
}

.pz-person-badge {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 4px 9px;
  background: var(--teal-pale);
  color: #065F46;
  font-size: 11px;
  font-weight: 800;
  white-space: nowrap;
}

.pz-person-meta {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  margin-top: 12px;
}

.pz-person-meta-item {
  display: flex;
  align-items: center;
  gap: 7px;
  min-width: 0;
  color: var(--text-2);
  background: var(--white);
  border: 1px solid var(--border);
  border-radius: 9px;
  padding: 7px 8px;
  font-size: 12px;
  font-weight: 600;
}

.pz-person-meta-item span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pz-medical-note {
  margin-top: 12px;
  border-radius: 10px;
  border: 1px solid rgba(226,75,74,0.18);
  background: var(--red-pale);
  color: #991B1B;
  padding: 10px 11px;
  font-size: 12px;
  line-height: 1.45;
}

.pz-vehicle-panel {
  margin-top: 12px;
  border-top: 1px solid var(--border);
  padding-top: 12px;
}

.pz-vehicle-title {
  display: flex;
  align-items: center;
  gap: 7px;
  color: var(--text-2);
  font-size: 12px;
  font-weight: 800;
  margin-bottom: 8px;
}

.pz-vehicle-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.pz-document-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.pz-document-review-summary {
  background: var(--white);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 16px;
  margin-bottom: 14px;
}

.pz-document-review-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
  margin-bottom: 12px;
}

.pz-document-review-title {
  color: var(--text-1);
  font-size: 15px;
  font-weight: 800;
}

.pz-document-review-copy {
  color: var(--text-3);
  font-size: 12px;
  margin-top: 4px;
}

.pz-document-checklist {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.pz-document-check {
  border: 1px solid var(--border);
  background: var(--surface);
  border-radius: 11px;
  padding: 11px 12px;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}

.pz-document-check-name {
  color: var(--text-1);
  font-size: 13px;
  font-weight: 800;
}

.pz-document-check-note {
  color: var(--red);
  font-size: 11px;
  margin-top: 4px;
}

.pz-document-card {
  background: var(--white);
  border: 1px solid var(--border);
  border-radius: 14px;
  overflow: hidden;
}

.pz-document-head {
  padding: 15px;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  border-bottom: 1px solid var(--border);
}

.pz-document-title-wrap {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  min-width: 0;
}

.pz-document-icon {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background: #EFF6FF;
  color: var(--blue);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.pz-document-title {
  color: var(--text-1);
  font-size: 14px;
  font-weight: 800;
  overflow-wrap: anywhere;
}

.pz-document-type {
  color: var(--text-3);
  font-size: 11px;
  margin-top: 3px;
}

.pz-doc-actions {
  display: flex;
  gap: 7px;
  flex-shrink: 0;
}

.pz-doc-action {
  width: 34px;
  height: 34px;
  border-radius: 9px;
  border: 1px solid var(--border);
  background: var(--white);
  color: var(--text-2);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.18s ease;
}

.pz-doc-action.verify {
  color: #065F46;
  background: var(--teal-pale);
  border-color: rgba(26,158,117,0.22);
}

.pz-doc-action.reject {
  color: #991B1B;
  background: var(--red-pale);
  border-color: rgba(226,75,74,0.22);
}

.pz-doc-action:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.pz-document-preview {
  min-height: 168px;
  background: var(--surface);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 14px;
}

.pz-document-preview img {
  max-width: 100%;
  max-height: 210px;
  border-radius: 10px;
  object-fit: contain;
  box-shadow: 0 8px 28px rgba(7,29,59,0.12);
}

.pz-document-link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--blue);
  font-size: 13px;
  font-weight: 800;
  text-decoration: none;
}

.pz-family-footer {
  background: var(--white);
  border-top: 1px solid var(--border);
  padding: 14px 20px;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  flex-shrink: 0;
}

.pz-family-button {
  min-height: 38px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: var(--white);
  color: var(--text-2);
  padding: 0 14px;
  font-size: 13px;
  font-weight: 800;
  cursor: pointer;
  font-family: 'DM Sans', sans-serif;
}

.pz-family-button.approve {
  color: var(--white);
  background: var(--teal);
  border-color: var(--teal);
}

.pz-family-button.approve:hover {
  background: var(--teal-light);
}

.pz-family-button.deny {
  color: #991B1B;
  background: var(--red-pale);
  border-color: rgba(226,75,74,0.24);
}

.pz-family-button:disabled {
  opacity: 0.52;
  cursor: not-allowed;
}

.pz-family-dialog-layer {
  position: fixed;
  inset: 0;
  z-index: 95;
  background: rgba(7,29,59,0.58);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 18px;
}

.pz-family-dialog {
  width: min(460px, 100%);
  background: var(--white);
  border: 1px solid var(--border);
  border-radius: 16px;
  box-shadow: 0 24px 80px rgba(7,29,59,0.24);
  overflow: hidden;
}

.pz-family-dialog-head {
  padding: 20px 22px;
  border-bottom: 1px solid var(--border);
}

.pz-family-dialog-title {
  font-family: 'Inter', sans-serif;
  color: var(--text-1);
  font-size: 18px;
  font-weight: 700;
  letter-spacing: -0.025em;
}

.pz-family-dialog-body {
  padding: 20px 22px;
  color: var(--text-3);
  font-size: 13px;
  line-height: 1.55;
}

.pz-family-dialog-body textarea {
  width: 100%;
  min-height: 128px;
  margin-top: 14px;
  border: 1px solid var(--border);
  border-radius: 11px;
  padding: 12px;
  outline: none;
  color: var(--text-1);
  resize: vertical;
  font: inherit;
}

.pz-family-dialog-body textarea:focus {
  border-color: var(--blue);
  box-shadow: 0 0 0 3px rgba(27,110,204,0.08);
}

.pz-family-dialog-footer {
  padding: 16px 22px;
  background: #FAFBFD;
  border-top: 1px solid var(--border);
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.pz-family-empty {
  min-height: 260px;
  background: var(--white);
  border: 1px solid var(--border);
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 10px;
  color: var(--text-3);
  text-align: center;
}

@media (max-width: 980px) {
  .pz-family-summary,
  .pz-document-checklist,
  .pz-document-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .pz-family-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .pz-family-modal-root {
    padding: 0;
    align-items: stretch;
  }
  .pz-family-modal {
    max-height: none;
    height: 100vh;
    border-radius: 0;
  }
  .pz-family-modal-header {
    padding: 18px;
  }
  .pz-family-body {
    padding: 14px;
  }
  .pz-family-summary,
  .pz-info-grid,
  .pz-person-meta,
  .pz-vehicle-grid,
  .pz-document-checklist,
  .pz-document-grid {
    grid-template-columns: 1fr;
  }
  .pz-family-footer {
    flex-direction: column;
  }
  .pz-family-button {
    width: 100%;
  }
}
`;

interface FamilyData {
  id?: string;
  familyName: string;
  status: string;
  submittedAt: string;
  parent: {
    name: string;
    email: string;
    phone: string;
    address: string;
  };
  guardians: Array<{
    name: string;
    relation: string;
    phone: string;
    vehicle?: {
      name?: string;
      make?: string;
      model?: string;
      color?: string;
      plate_number?: string;
      year?: string;
    };
    vehicleName?: string;
    make?: string;
    model?: string;
    color?: string;
    plateNumber?: string;
    year?: string;
  }>;
  children: Array<{
    name: string;
    age: string;
    grade: string;
    medical: string;
  }>;
  documents?: Array<{
    id: string;
    name: string;
    documentType?: string;
    type: string;
    file_path?: string;
    url?: string;
    status?: "verified" | "rejected" | "pending";
    childId?: string | number | null;
    required?: boolean;
    rejectionReason?: string | null;
  }>;
  documentVerification?: DocumentVerificationStatus;
}

interface ViewProps {
  data: FamilyData;
  onClose: () => void;
  onApprove?: (id?: string) => void | Promise<void>;
  onDeny?: (id?: string, reason?: string) => void | Promise<void>;
}

type FamilyDocument = NonNullable<FamilyData["documents"]>[number];

function safeText(value?: string | number | null, fallback = "Not provided") {
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

function documentUrl(doc: FamilyDocument) {
  if (doc.url) return doc.url;
  if (!doc.file_path) return "";
  if (/^https?:\/\//i.test(doc.file_path)) return doc.file_path;
  return `${LOCAL_BASE}/${doc.file_path}`;
}

function isImageDocument(doc: FamilyDocument) {
  const source = `${doc.type || ""} ${doc.name || ""}`.toLowerCase();
  return ["jpg", "jpeg", "png", "webp", "gif"].some((ext) => source.includes(ext));
}

function getVehicle(guardian: FamilyData["guardians"][number]) {
  const vehicle = guardian.vehicle;
  const flatVehicle = {
    name: guardian.vehicleName,
    make: guardian.make,
    model: guardian.model,
    color: guardian.color,
    plate_number: guardian.plateNumber,
    year: guardian.year,
  };
  const merged = vehicle || flatVehicle;
  return Object.values(merged).some(Boolean) ? merged : null;
}

export default function FamilyView({ data, onClose, onApprove, onDeny }: ViewProps) {
  const [activeTab, setActiveTab] = useState<"info" | "documents">("info");
  const [denyReason, setDenyReason] = useState("");
  const [showDenyConfirm, setShowDenyConfirm] = useState(false);
  const [showApproveConfirm, setShowApproveConfirm] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isDenying, setIsDenying] = useState(false);
  const [documentsState, setDocumentsState] = useState(data.documents || []);
  const [downloadingDocId, setDownloadingDocId] = useState<string | null>(null);
  const [documentVerificationState, setDocumentVerificationState] = useState<DocumentVerificationStatus | null>(
    data.documentVerification || null
  );

  const downloadDocument = async (doc: FamilyDocument) => {
    if (!doc.id) return;
    try {
      setDownloadingDocId(String(doc.id));
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/documents/${doc.id}/download`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        throw new Error(result.error || "Failed to download document");
      }

      const extension = doc.file_path?.includes(".") ? `.${doc.file_path.split(".").pop()}` : "";
      const fileName = `${data.familyName} - ${doc.documentType || doc.name || "Document"}`
        .replace(/[<>:"/\\|?*\u0000-\u001F]/g, "")
        .replace(/\s+/g, " ")
        .trim();
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${fileName || "Document"}${extension}`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      toast.error(err.message || "Failed to download document");
    } finally {
      setDownloadingDocId(null);
    }
  };
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);

  const isPending = data.status === "Pending";
  const documentCount = documentsState.length;
  const pendingDocuments = documentsState.filter((doc) => (doc.status || "pending") === "pending").length;
  const reviewItems = documentVerificationState?.required || [];
  const approvalsRemaining = documentVerificationState
    ? documentVerificationState.summary.total - documentVerificationState.summary.approved
    : 0;

  const refreshDocumentVerification = async () => {
    if (!data.id) return;
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/documents/verification-status?parent_id=${data.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) return;
      setDocumentVerificationState(await response.json());
    } catch {
      // The document cards already update optimistically; this only refreshes the checklist.
    }
  };

  const handleVerifyDocument = async (docId: string) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/documents/${docId}/verify`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      toast.success("Document verified");

      setDocumentsState((prev) =>
        prev.map((doc) => (doc.id === docId ? { ...doc, status: "verified" } : doc))
      );
      await refreshDocumentVerification();
    } catch {
      toast.error("Failed to verify document");
    }
  };

  const submitRejectDocument = async () => {
    if (!selectedDocId || !rejectReason.trim()) return;

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/documents/${selectedDocId}/reject`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reason: rejectReason.trim() }),
      });

      if (!res.ok) throw new Error();

      toast.success("Document rejected and parent notified");
      setDocumentsState((prev) =>
        prev.map((doc) => (doc.id === selectedDocId ? { ...doc, status: "rejected" } : doc))
      );
      await refreshDocumentVerification();
      setShowRejectModal(false);
      setRejectReason("");
      setSelectedDocId(null);
    } catch {
      toast.error("Failed to reject document");
    }
  };

  const handleApprove = async () => {
    if (!onApprove) return;
    setIsApproving(true);
    await onApprove(data.id);
    setIsApproving(false);
    onClose();
  };

  const handleDeny = async () => {
    if (!onDeny || !denyReason.trim()) return;
    setIsDenying(true);
    await onDeny(data.id, denyReason.trim());
    setIsDenying(false);
    onClose();
  };

  const summary = [
    {
      label: "Members",
      value: 1 + data.guardians.length + data.children.length,
      icon: UsersRound,
      tone: { background: "#EFF6FF", color: "#1B6ECC" },
    },
    {
      label: "Children",
      value: data.children.length,
      icon: GraduationCap,
      tone: { background: "#E1F5EE", color: "#1A9E75" },
    },
    {
      label: "Guardians",
      value: data.guardians.length,
      icon: ShieldCheck,
      tone: { background: "#FEF3DC", color: "#EF9F27" },
    },
    {
      label: "Documents",
      value: documentCount,
      icon: FileText,
      tone: { background: "#F4F6FA", color: "#0B2E5A" },
    },
  ];

  return (
    <div className="pz-family-modal-root">
      <style>{FAMILY_VIEW_CSS}</style>
      <div className="pz-family-modal" role="dialog" aria-modal="true" aria-labelledby="family-view-title">
        <div className="pz-family-modal-header">
          <div className="pz-family-title-wrap">
            <div className="pz-family-avatar">{initials(data.familyName)}</div>
            <div>
              <h2 className="pz-family-title" id="family-view-title">
                {data.familyName}
              </h2>
              <div className="pz-family-meta">
                <span className={`pz-family-status ${statusTone(data.status)}`}>
                  <span className="pz-family-dot" />
                  {data.status}
                </span>
                <span>Submitted {formatDate(data.submittedAt)}</span>
                <span>
                  {approvalsRemaining > 0
                    ? `${approvalsRemaining} required approval${approvalsRemaining === 1 ? "" : "s"} remaining`
                    : `${pendingDocuments} documents waiting`}
                </span>
              </div>
            </div>
          </div>
          <button type="button" className="pz-family-close" onClick={onClose} aria-label="Close profile">
            <X size={19} aria-hidden="true" />
          </button>
        </div>

        <div className="pz-family-body">
          <div className="pz-family-summary">
            {summary.map((item) => {
              const Icon = item.icon;
              return (
                <div className="pz-family-summary-card" key={item.label}>
                  <div className="pz-family-summary-icon" style={item.tone}>
                    <Icon size={19} strokeWidth={2.4} aria-hidden="true" />
                  </div>
                  <div>
                    <div className="pz-family-summary-label">{item.label}</div>
                    <div className="pz-family-summary-value">{item.value}</div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pz-family-tabs" aria-label="Profile detail tabs">
            <button
              type="button"
              className={`pz-family-tab ${activeTab === "info" ? "active" : ""}`}
              onClick={() => setActiveTab("info")}
            >
              Profile Information
            </button>
            <button
              type="button"
              className={`pz-family-tab ${activeTab === "documents" ? "active" : ""}`}
              onClick={() => setActiveTab("documents")}
            >
              Documents
            </button>
          </div>

          {activeTab === "info" ? (
            <div className="pz-family-grid">
              <div className="pz-family-stack">
                <section className="pz-family-card">
                  <div className="pz-family-card-head">
                    <div className="pz-family-card-title">Parent Contact</div>
                    <span className="pz-family-status green">
                      <span className="pz-family-dot" />
                      Primary
                    </span>
                  </div>
                  <div className="pz-family-card-body">
                    <div className="pz-info-grid">
                      <div className="pz-info-item">
                        <div className="pz-info-icon">
                          <UserRound size={16} aria-hidden="true" />
                        </div>
                        <div>
                          <div className="pz-info-label">Name</div>
                          <div className="pz-info-value">{safeText(data.parent.name)}</div>
                        </div>
                      </div>
                      <div className="pz-info-item">
                        <div className="pz-info-icon">
                          <Mail size={16} aria-hidden="true" />
                        </div>
                        <div>
                          <div className="pz-info-label">Email</div>
                          <div className="pz-info-value">{safeText(data.parent.email)}</div>
                        </div>
                      </div>
                      <div className="pz-info-item">
                        <div className="pz-info-icon">
                          <Phone size={16} aria-hidden="true" />
                        </div>
                        <div>
                          <div className="pz-info-label">Phone</div>
                          <div className="pz-info-value">{safeText(data.parent.phone)}</div>
                        </div>
                      </div>
                      <div className="pz-info-item">
                        <div className="pz-info-icon">
                          <Home size={16} aria-hidden="true" />
                        </div>
                        <div>
                          <div className="pz-info-label">Address</div>
                          <div className="pz-info-value">{safeText(data.parent.address)}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                <section className="pz-family-card">
                  <div className="pz-family-card-head">
                    <div className="pz-family-card-title">Children</div>
                    <span className="pz-family-status green">
                      <span className="pz-family-dot" />
                      {data.children.length} listed
                    </span>
                  </div>
                  <div className="pz-family-card-body">
                    <div className="pz-family-stack">
                      {data.children.map((child, index) => (
                        <div className="pz-person-card" key={`${child.name}-${index}`}>
                          <div className="pz-person-top">
                            <div>
                              <div className="pz-person-title">{safeText(child.name, `Child ${index + 1}`)}</div>
                              <div className="pz-person-sub">Grade {safeText(child.grade, "N/A")}</div>
                            </div>
                            <span className="pz-person-badge">Child {index + 1}</span>
                          </div>
                          <div className="pz-person-meta">
                            <div className="pz-person-meta-item">
                              <GraduationCap size={14} aria-hidden="true" />
                              <span>Grade {safeText(child.grade, "N/A")}</span>
                            </div>
                            <div className="pz-person-meta-item">
                              <CalendarDays size={14} aria-hidden="true" />
                              <span>{safeText(child.age, "N/A")} years</span>
                            </div>
                          </div>
                          {child.medical ? (
                            <div className="pz-medical-note">
                              <strong>Medical note:</strong> {child.medical}
                            </div>
                          ) : null}
                        </div>
                      ))}
                      {!data.children.length && <div className="pz-family-empty">No children listed.</div>}
                    </div>
                  </div>
                </section>
              </div>

              <section className="pz-family-card">
                <div className="pz-family-card-head">
                  <div className="pz-family-card-title">Guardians</div>
                  <span className="pz-family-status amber">
                    <span className="pz-family-dot" />
                    Pickup access
                  </span>
                </div>
                <div className="pz-family-card-body">
                  <div className="pz-family-stack">
                    {data.guardians.map((guardian, index) => {
                      const vehicle = getVehicle(guardian);
                      return (
                        <div className="pz-person-card" key={`${guardian.name}-${index}`}>
                          <div className="pz-person-top">
                            <div>
                              <div className="pz-person-title">{safeText(guardian.name, `Guardian ${index + 1}`)}</div>
                              <div className="pz-person-sub">{safeText(guardian.relation, "Relation not listed")}</div>
                            </div>
                            <span className="pz-person-badge">Guardian {index + 1}</span>
                          </div>
                          <div className="pz-person-meta">
                            <div className="pz-person-meta-item">
                              <ShieldCheck size={14} aria-hidden="true" />
                              <span>{safeText(guardian.relation)}</span>
                            </div>
                            <div className="pz-person-meta-item">
                              <Phone size={14} aria-hidden="true" />
                              <span>{safeText(guardian.phone)}</span>
                            </div>
                          </div>
                          {vehicle && (
                            <div className="pz-vehicle-panel">
                              <div className="pz-vehicle-title">
                                <CarFront size={14} aria-hidden="true" />
                                Vehicle
                              </div>
                              <div className="pz-vehicle-grid">
                                <div className="pz-person-meta-item">
                                  <span>{safeText(vehicle.name, "Vehicle")}</span>
                                </div>
                                <div className="pz-person-meta-item">
                                  <span>{safeText(vehicle.plate_number, "No plate")}</span>
                                </div>
                                <div className="pz-person-meta-item">
                                  <span>{safeText(vehicle.make, "No make")}</span>
                                </div>
                                <div className="pz-person-meta-item">
                                  <span>{safeText(vehicle.color, "No color")}</span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                    {!data.guardians.length && <div className="pz-family-empty">No guardians listed.</div>}
                  </div>
                </div>
              </section>
            </div>
          ) : (
            <>
            {documentVerificationState && (
              <section className="pz-document-review-summary">
                <div className="pz-document-review-head">
                  <div>
                    <div className="pz-document-review-title">Required Document Review</div>
                    <div className="pz-document-review-copy">
                      QR pickup access is available after every required item is approved.
                    </div>
                  </div>
                  <span className={`pz-family-status ${documentVerificationState.summary.complete ? "green" : "amber"}`}>
                    <span className="pz-family-dot" />
                    {documentVerificationState.summary.complete ? "Complete" : `${approvalsRemaining} remaining`}
                  </span>
                </div>
                <div className="pz-document-checklist">
                  {reviewItems.map((item, index) => (
                    <div className="pz-document-check" key={`${item.key}-${item.childId || index}`}>
                      <div>
                        <div className="pz-document-check-name">
                          {item.childName ? `${item.label} (${item.childName})` : item.label}
                        </div>
                        {item.rejectionReason && (
                          <div className="pz-document-check-note">Reason: {item.rejectionReason}</div>
                        )}
                      </div>
                      <span className={`pz-family-status ${item.approved ? "green" : item.status === "rejected" ? "red" : "amber"}`}>
                        <span className="pz-family-dot" />
                        {item.approved
                          ? "Approved"
                          : item.status === "pending"
                            ? "Review"
                            : item.status === "rejected"
                              ? "Rejected"
                              : "Missing"}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <div className="pz-document-grid">
              {documentsState.map((doc) => {
                const href = documentUrl(doc);
                const status = doc.status || "pending";
                return (
                  <article className="pz-document-card" key={doc.id || doc.name}>
                    <div className="pz-document-head">
                      <div className="pz-document-title-wrap">
                        <div className="pz-document-icon">
                          <FileText size={18} aria-hidden="true" />
                        </div>
                        <div>
                          <div className="pz-document-title">{safeText(doc.name, "Document")}</div>
                          <div className="pz-document-type">{safeText(doc.type, "Unknown type")}</div>
                          <span className={`pz-family-status ${statusTone(status)}`} style={{ marginTop: 8 }}>
                            <span className="pz-family-dot" />
                            {status === "verified" ? "Verified" : status === "rejected" ? "Rejected" : "Pending"}
                          </span>
                          {doc.rejectionReason && (
                            <div className="pz-document-check-note">Reason: {doc.rejectionReason}</div>
                          )}
                        </div>
                      </div>
                      <div className="pz-doc-actions">
                        <button
                          type="button"
                          className="pz-doc-action"
                          onClick={() => downloadDocument(doc)}
                          disabled={!doc.id || downloadingDocId === String(doc.id)}
                          title="Download document"
                          aria-label={`Download ${doc.name || "document"}`}
                        >
                          <Download size={17} aria-hidden="true" />
                        </button>
                        {status === "pending" && (
                          <>
                          <button
                            type="button"
                            className="pz-doc-action verify"
                            onClick={() => handleVerifyDocument(doc.id)}
                            disabled={!doc.id}
                            title="Verify document"
                          >
                            <CheckCircle2 size={17} aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            className="pz-doc-action reject"
                            onClick={() => {
                              setSelectedDocId(doc.id);
                              setShowRejectModal(true);
                            }}
                            disabled={!doc.id}
                            title="Reject document"
                          >
                            <XCircle size={17} aria-hidden="true" />
                          </button>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="pz-document-preview">
                      {href ? (
                        isImageDocument(doc) ? (
                          <img src={href} alt={doc.name} />
                        ) : (
                          <a className="pz-document-link" href={href} target="_blank" rel="noopener noreferrer">
                            <ExternalLink size={16} aria-hidden="true" />
                            Open document
                          </a>
                        )
                      ) : (
                        <span className="pz-document-link">
                          <AlertTriangle size={16} aria-hidden="true" />
                          File not available
                        </span>
                      )}
                    </div>
                  </article>
                );
              })}
              {!documentsState.length && (
                <div className="pz-family-empty">
                  <FileText size={28} aria-hidden="true" />
                  No verification documents uploaded.
                </div>
              )}
            </div>
            </>
          )}
        </div>

        {isPending && (
          <div className="pz-family-footer">
            <button type="button" className="pz-family-button deny" onClick={() => setShowDenyConfirm(true)}>
              <XCircle size={16} aria-hidden="true" />
              Deny Profile
            </button>
            <button type="button" className="pz-family-button approve" onClick={() => setShowApproveConfirm(true)}>
              <CheckCircle2 size={16} aria-hidden="true" />
              Approve Profile
            </button>
          </div>
        )}
      </div>

      {showRejectModal && (
        <div className="pz-family-dialog-layer" role="dialog" aria-modal="true" aria-labelledby="reject-document-title">
          <div className="pz-family-dialog">
            <div className="pz-family-dialog-head">
              <div className="pz-family-dialog-title" id="reject-document-title">
                Reject Document
              </div>
            </div>
            <div className="pz-family-dialog-body">
              Enter a reason for rejection. The parent notification flow stays connected to the existing endpoint.
              <textarea
                value={rejectReason}
                onChange={(event) => setRejectReason(event.target.value)}
                placeholder="Reason for rejection"
              />
            </div>
            <div className="pz-family-dialog-footer">
              <button
                type="button"
                className="pz-family-button"
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectReason("");
                  setSelectedDocId(null);
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="pz-family-button deny"
                disabled={!rejectReason.trim()}
                onClick={submitRejectDocument}
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {showDenyConfirm && (
        <div className="pz-family-dialog-layer" role="dialog" aria-modal="true" aria-labelledby="deny-family-title">
          <div className="pz-family-dialog">
            <div className="pz-family-dialog-head">
              <div className="pz-family-dialog-title" id="deny-family-title">
                Deny Profile
              </div>
            </div>
            <div className="pz-family-dialog-body">
              Are you sure you want to deny this profile? Please provide a reason for the family.
              <textarea
                value={denyReason}
                onChange={(event) => setDenyReason(event.target.value)}
                placeholder="Reason for denial"
              />
            </div>
            <div className="pz-family-dialog-footer">
              <button type="button" className="pz-family-button" onClick={() => setShowDenyConfirm(false)}>
                Cancel
              </button>
              <button
                type="button"
                className="pz-family-button deny"
                disabled={!denyReason.trim() || isDenying}
                onClick={handleDeny}
              >
                {isDenying ? "Denying..." : "Deny"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showApproveConfirm && (
        <div className="pz-family-dialog-layer" role="dialog" aria-modal="true" aria-labelledby="approve-family-title">
          <div className="pz-family-dialog">
            <div className="pz-family-dialog-head">
              <div className="pz-family-dialog-title" id="approve-family-title">
                Approve Profile
              </div>
            </div>
            <div className="pz-family-dialog-body">
              This will approve the family profile and allow the existing account and QR workflows to continue.
            </div>
            <div className="pz-family-dialog-footer">
              <button type="button" className="pz-family-button" onClick={() => setShowApproveConfirm(false)}>
                Cancel
              </button>
              <button
                type="button"
                className="pz-family-button approve"
                disabled={isApproving}
                onClick={handleApprove}
              >
                {isApproving ? "Approving..." : "Approve"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
