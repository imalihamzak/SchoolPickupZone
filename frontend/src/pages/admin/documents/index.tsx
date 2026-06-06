import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Download,
  ExternalLink,
  FileCheck2,
  FileText,
  Mail,
  Phone,
  RefreshCw,
  Search,
  ShieldCheck,
  UserRound,
  X,
  XCircle,
} from "lucide-react";
import DashboardLayout from "@/components/layouts/dashboard-layout";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import AdminPageSkeleton from "@/components/ui/AdminPageSkeleton";
import { toast } from "@/components/ui/toast";
import { AdminSelect } from "@/components/ui/admin-controls";
import { API_BASE_URL } from "@/lib/api/link";
import { isQuietEmptyStateError } from "@/lib/api/quietEmptyState";

type AdminDocument = {
  id: string | number;
  parentId: string | number;
  parentName: string;
  parentEmail?: string | null;
  parentPhone?: string | null;
  parentStatus?: string | null;
  type: string;
  childId?: string | number | null;
  childName?: string | null;
  fileName: string;
  filePath?: string;
  url?: string;
  uploadDate: string;
  uploadedAt?: string;
  status: string;
  required: boolean;
  rejectionReason?: string | null;
};

type StatusFilter = "all" | "pending" | "verified" | "rejected";

type ParentDocumentGroup = {
  id: string;
  parentId: string | number;
  parentName: string;
  parentEmail?: string | null;
  parentPhone?: string | null;
  parentStatus?: string | null;
  documents: AdminDocument[];
  pendingCount: number;
  verifiedCount: number;
  rejectedCount: number;
  requiredCount: number;
};

const ADMIN_DOCUMENTS_CSS = `
.pz-admin-docs {
  --navy: #071D3B;
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
  --border: #E2E6EE;
  --text-1: #0A1628;
  --text-2: #4A5568;
  --text-3: #8A96A8;
  color: var(--text-1);
  font-family: 'DM Sans', "Segoe UI", Arial, sans-serif;
}

.pz-admin-docs,
.pz-admin-docs * {
  box-sizing: border-box;
}

.pz-admin-docs-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 18px;
  margin-bottom: 22px;
}

.pz-admin-docs-kicker {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  color: var(--teal);
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  margin-bottom: 8px;
}

.pz-admin-docs-kicker::before {
  content: "";
  width: 18px;
  height: 2px;
  border-radius: 999px;
  background: var(--teal);
}

.pz-admin-docs-title {
  font-family: 'Inter', sans-serif;
  font-size: clamp(28px, 3.2vw, 42px);
  line-height: 1.04;
  letter-spacing: -0.025em;
  font-weight: 700;
  color: var(--text-1);
  margin: 0;
}

.pz-admin-docs-subtitle {
  color: var(--text-3);
  font-size: 14px;
  line-height: 1.5;
  margin-top: 8px;
}

.pz-admin-docs-actions,
.pz-admin-docs-toolbar {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  flex-wrap: wrap;
}

.pz-admin-docs-button,
.pz-admin-docs-date {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 38px;
  border-radius: 10px;
  padding: 0 14px;
  font-size: 13px;
  font-weight: 800;
  white-space: nowrap;
}

.pz-admin-docs-button {
  border: 1px solid var(--border);
  background: var(--white);
  color: var(--text-2);
  cursor: pointer;
  text-decoration: none;
  transition: all 0.18s ease;
}

.pz-admin-docs-button:hover:not(:disabled) {
  border-color: rgba(27,110,204,0.36);
  background: #EFF6FF;
  color: var(--blue);
}

.pz-admin-docs-button.primary {
  border-color: var(--teal);
  background: var(--teal);
  color: var(--white);
}

.pz-admin-docs-button.primary:hover:not(:disabled) {
  border-color: var(--teal-light);
  background: var(--teal-light);
  color: var(--white);
}

.pz-admin-docs-button.danger {
  border-color: rgba(226,75,74,0.28);
  color: var(--red);
}

.pz-admin-docs-button.danger:hover:not(:disabled) {
  background: var(--red-pale);
  border-color: rgba(226,75,74,0.42);
  color: var(--red);
}

.pz-admin-docs-button:disabled {
  cursor: not-allowed;
  opacity: 0.58;
}

.pz-admin-docs-date {
  background: var(--white);
  border: 1px solid var(--border);
  color: var(--text-2);
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
}

.pz-admin-docs-stat-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
  margin-bottom: 18px;
}

.pz-admin-docs-stat {
  min-height: 128px;
  background: var(--white);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 18px 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  position: relative;
  overflow: hidden;
}

button.pz-admin-docs-stat {
  width: 100%;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.pz-admin-docs-stat::after {
  content: "";
  position: absolute;
  inset: auto -38px -70px auto;
  width: 142px;
  height: 142px;
  border-radius: 50%;
  background: radial-gradient(circle, var(--accent-glow) 0%, transparent 65%);
  pointer-events: none;
}

.pz-admin-docs-stat-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.pz-admin-docs-stat-label {
  color: var(--text-3);
  font-size: 12px;
  font-weight: 800;
}

.pz-admin-docs-stat-icon {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.pz-admin-docs-stat-value {
  font-family: 'Inter', sans-serif;
  font-size: 32px;
  line-height: 1;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.pz-admin-docs-stat-helper {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--text-3);
  font-size: 12px;
}

.pz-admin-docs-card {
  background: var(--white);
  border: 1px solid var(--border);
  border-radius: 12px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
  overflow: hidden;
}

.pz-admin-docs-card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 18px 22px;
  border-bottom: 1px solid var(--border);
}

.pz-admin-docs-card-title {
  font-family: 'Inter', sans-serif;
  font-size: 16px;
  font-weight: 700;
  letter-spacing: -0.025em;
}

.pz-admin-docs-search {
  width: min(360px, 100%);
  min-height: 38px;
  display: flex;
  align-items: center;
  gap: 8px;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--surface);
  padding: 0 12px;
  color: var(--text-3);
}

.pz-admin-docs-search input {
  width: 100%;
  border: 0;
  outline: none;
  background: transparent;
  color: var(--text-1);
  font: inherit;
  font-size: 13px;
}

.pz-admin-docs-list {
  display: grid;
  gap: 12px;
  padding: 16px;
}

.pz-admin-parent-card {
  width: 100%;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 16px;
  padding: 16px;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: #FFFFFF;
  color: inherit;
  text-align: left;
  cursor: pointer;
  transition: border-color 0.18s ease, box-shadow 0.18s ease, transform 0.18s ease;
}

.pz-admin-parent-card:hover {
  border-color: rgba(27,110,204,0.28);
  box-shadow: 0 10px 28px rgba(7,29,59,0.08);
  transform: translateY(-1px);
}

.pz-admin-parent-main {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  min-width: 0;
}

.pz-admin-parent-avatar {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: var(--teal-pale);
  color: var(--teal);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.pz-admin-parent-info {
  min-width: 0;
}

.pz-admin-parent-name {
  color: var(--text-1);
  font-size: 14px;
  font-weight: 800;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pz-admin-parent-contact,
.pz-admin-parent-counts {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 6px;
  color: var(--text-3);
  font-size: 12px;
}

.pz-admin-parent-contact span,
.pz-admin-parent-counts span {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.pz-admin-parent-action {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  color: var(--blue);
  font-size: 12px;
  font-weight: 800;
  white-space: nowrap;
}

.pz-admin-doc-parent-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
  padding: 16px;
  border-bottom: 1px solid var(--border);
  background: linear-gradient(135deg, #FFFFFF 0%, #F7FFFC 100%);
}

.pz-admin-doc-parent-title {
  color: var(--text-1);
  font-family: 'Inter', sans-serif;
  font-size: 16px;
  font-weight: 700;
  letter-spacing: -0.025em;
}

.pz-admin-doc-parent-sub {
  color: var(--text-3);
  font-size: 12px;
  line-height: 1.45;
  margin-top: 5px;
}

.pz-admin-doc-card {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 16px;
  padding: 16px;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: #FFFFFF;
}

.pz-admin-doc-main {
  min-width: 0;
}

.pz-admin-doc-top {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  min-width: 0;
}

.pz-admin-doc-icon {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  background: #EFF6FF;
  color: var(--blue);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.pz-admin-doc-title-wrap {
  min-width: 0;
}

.pz-admin-doc-title {
  color: var(--text-1);
  font-size: 14px;
  font-weight: 800;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pz-admin-doc-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  color: var(--text-3);
  font-size: 12px;
  margin-top: 5px;
}

.pz-admin-doc-family {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 12px;
  color: var(--text-2);
  font-size: 12px;
}

.pz-admin-doc-family span {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  min-width: 0;
}

.pz-admin-doc-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border-radius: 999px;
  padding: 4px 9px;
  font-size: 11px;
  font-weight: 800;
  white-space: nowrap;
}

.pz-admin-doc-pill.green {
  background: var(--teal-pale);
  color: #065F46;
}

.pz-admin-doc-pill.amber {
  background: var(--amber-pale);
  color: #92400E;
}

.pz-admin-doc-pill.red {
  background: var(--red-pale);
  color: #991B1B;
}

.pz-admin-doc-pill.gray {
  background: var(--surface);
  color: var(--text-2);
}

.pz-admin-doc-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}

.pz-admin-doc-actions {
  display: flex;
  align-items: flex-start;
  justify-content: flex-end;
  gap: 8px;
  flex-wrap: wrap;
}

.pz-admin-doc-reason {
  margin-top: 10px;
  color: #991B1B;
  background: var(--red-pale);
  border: 1px solid rgba(226,75,74,0.16);
  border-radius: 10px;
  padding: 8px 10px;
  font-size: 12px;
  line-height: 1.45;
}

.pz-admin-doc-empty,
.pz-admin-doc-loading {
  min-height: 260px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 10px;
  color: var(--text-3);
  text-align: center;
  padding: 30px;
}

.pz-admin-doc-dialog-layer {
  position: fixed;
  inset: 0;
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: rgba(7,29,59,0.54);
  backdrop-filter: blur(5px);
}

.pz-admin-doc-dialog {
  width: min(520px, 100%);
  background: #FFFFFF;
  border-radius: 14px;
  box-shadow: 0 24px 80px rgba(7,29,59,0.28);
  overflow: hidden;
}

.pz-admin-doc-dialog-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
  padding: 18px 20px;
  background: var(--navy);
  color: #FFFFFF;
}

.pz-admin-doc-dialog-title {
  font-family: 'Inter', sans-serif;
  font-size: 18px;
  font-weight: 700;
  margin: 0;
}

.pz-admin-doc-dialog-copy {
  color: rgba(255,255,255,0.65);
  font-size: 12px;
  margin-top: 5px;
}

.pz-admin-doc-close {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  border: 1px solid rgba(255,255,255,0.14);
  background: rgba(255,255,255,0.08);
  color: #FFFFFF;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.pz-admin-doc-dialog-body {
  padding: 18px 20px;
}

.pz-admin-doc-dialog-body textarea {
  width: 100%;
  min-height: 112px;
  border: 1px solid var(--border);
  border-radius: 11px;
  padding: 11px 12px;
  outline: none;
  resize: vertical;
  font: inherit;
  font-size: 14px;
}

.pz-admin-doc-dialog-body textarea:focus {
  border-color: var(--blue);
  box-shadow: 0 0 0 3px rgba(27,110,204,0.08);
}

.pz-admin-doc-dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 14px 20px 18px;
  border-top: 1px solid var(--border);
}

@media (max-width: 1180px) {
  .pz-admin-docs-stat-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 760px) {
  .pz-admin-docs-head,
  .pz-admin-docs-card-head {
    align-items: flex-start;
    flex-direction: column;
  }
  .pz-admin-docs-actions,
  .pz-admin-docs-toolbar,
  .pz-admin-docs-search {
    justify-content: flex-start;
    width: 100%;
  }
  .pz-admin-docs-button,
  .pz-admin-docs-date {
    width: 100%;
  }
  .pz-admin-docs-stat-grid {
    grid-template-columns: 1fr;
  }
  .pz-admin-doc-card {
    grid-template-columns: 1fr;
  }
  .pz-admin-parent-card,
  .pz-admin-doc-parent-head {
    grid-template-columns: 1fr;
  }
  .pz-admin-parent-action {
    justify-content: flex-start;
  }
  .pz-admin-doc-actions {
    justify-content: flex-start;
  }
  .pz-admin-doc-dialog-footer {
    flex-direction: column-reverse;
  }
}
`;

function normalizeStatus(status?: string) {
  const value = String(status || "").toLowerCase();
  if (value === "approved" || value === "verified") return "verified";
  if (value === "rejected" || value === "denied") return "rejected";
  return "pending";
}

function statusTone(status?: string) {
  const normalized = normalizeStatus(status);
  if (normalized === "verified") return "green";
  if (normalized === "rejected") return "red";
  return "amber";
}

function statusLabel(status?: string) {
  const normalized = normalizeStatus(status);
  if (normalized === "verified") return "Verified";
  if (normalized === "rejected") return "Rejected";
  return "Pending";
}

function formatDocumentName(doc: AdminDocument) {
  if (doc.type === "Child Photo" && doc.childName) return `${doc.type} (${doc.childName})`;
  return doc.childName ? `${doc.type} - ${doc.childName}` : doc.type;
}

function downloadFileName(doc: AdminDocument) {
  const extension = doc.fileName.includes(".") ? `.${doc.fileName.split(".").pop()}` : "";
  const safe = `${doc.parentName} - ${formatDocumentName(doc)}`
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return `${safe || "Document"}${extension}`;
}

export default function AdminDocumentsPage() {
  const [documents, setDocuments] = useState<AdminDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [selectedParentId, setSelectedParentId] = useState<string | null>(null);
  const [rejectingDoc, setRejectingDoc] = useState<AdminDocument | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/documents/school`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) {
        if (isQuietEmptyStateError({ response: { status: res.status, data } })) {
          setDocuments([]);
          return;
        }
        throw new Error(data.error || "Failed to fetch documents");
      }
      setDocuments(Array.isArray(data) ? data : []);
    } catch (err: any) {
      toast.error(err.message || "Failed to fetch documents");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const verifyDocument = async (doc: AdminDocument) => {
    try {
      setActionId(doc.id);
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/documents/${doc.id}/verify`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to verify document");
      toast.success(data.message || "Document verified");
      await fetchDocuments();
    } catch (err: any) {
      toast.error(err.message || "Failed to verify document");
    } finally {
      setActionId(null);
    }
  };

  const rejectDocument = async () => {
    if (!rejectingDoc || !rejectReason.trim()) {
      toast.error("Enter a rejection reason");
      return;
    }

    try {
      setActionId(rejectingDoc.id);
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/documents/${rejectingDoc.id}/reject`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reason: rejectReason.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to reject document");
      toast.success(data.message || "Document rejected");
      setRejectingDoc(null);
      setRejectReason("");
      await fetchDocuments();
    } catch (err: any) {
      toast.error(err.message || "Failed to reject document");
    } finally {
      setActionId(null);
    }
  };

  const downloadDocument = async (doc: AdminDocument) => {
    try {
      setActionId(doc.id);
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/documents/${doc.id}/download`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Failed to download document");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = downloadFileName(doc);
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      toast.error(err.message || "Failed to download document");
    } finally {
      setActionId(null);
    }
  };

  const parentGroups = useMemo<ParentDocumentGroup[]>(() => {
    const map = new Map<string, ParentDocumentGroup>();

    documents.forEach((doc) => {
      const id = String(doc.parentId);
      const existing = map.get(id);
      if (existing) {
        existing.documents.push(doc);
        return;
      }

      map.set(id, {
        id,
        parentId: doc.parentId,
        parentName: doc.parentName || "Parent",
        parentEmail: doc.parentEmail,
        parentPhone: doc.parentPhone,
        parentStatus: doc.parentStatus,
        documents: [doc],
        pendingCount: 0,
        verifiedCount: 0,
        rejectedCount: 0,
        requiredCount: 0,
      });
    });

    return Array.from(map.values())
      .map((group) => {
        const sortedDocuments = [...group.documents].sort((left, right) => {
          const leftTime = new Date(left.uploadedAt || left.uploadDate || 0).getTime();
          const rightTime = new Date(right.uploadedAt || right.uploadDate || 0).getTime();
          return rightTime - leftTime;
        });
        return {
          ...group,
          documents: sortedDocuments,
          pendingCount: sortedDocuments.filter((doc) => normalizeStatus(doc.status) === "pending").length,
          verifiedCount: sortedDocuments.filter((doc) => normalizeStatus(doc.status) === "verified").length,
          rejectedCount: sortedDocuments.filter((doc) => normalizeStatus(doc.status) === "rejected").length,
          requiredCount: sortedDocuments.filter((doc) => doc.required).length,
        };
      })
      .sort((left, right) => {
        if (right.pendingCount !== left.pendingCount) return right.pendingCount - left.pendingCount;
        return left.parentName.localeCompare(right.parentName);
      });
  }, [documents]);

  const searchNeedle = searchTerm.trim().toLowerCase();

  const filteredParents = useMemo(() => {
    return parentGroups.filter((group) => {
      const statusMatches =
        statusFilter === "all" ||
        group.documents.some((doc) => normalizeStatus(doc.status) === statusFilter);
      const haystack = [
        group.parentName,
        group.parentEmail,
        group.parentPhone,
        ...group.documents.flatMap((doc) => [doc.type, doc.childName, doc.fileName, doc.uploadDate]),
      ].filter(Boolean).join(" ").toLowerCase();
      return statusMatches && (!searchNeedle || haystack.includes(searchNeedle));
    });
  }, [parentGroups, searchNeedle, statusFilter]);

  const selectedParent = selectedParentId
    ? parentGroups.find((group) => group.id === selectedParentId) || null
    : null;
  const selectedDocuments = selectedParent
    ? selectedParent.documents.filter((doc) => {
        const statusMatches = statusFilter === "all" || normalizeStatus(doc.status) === statusFilter;
        const haystack = [
          doc.type,
          doc.childName,
          doc.fileName,
          doc.uploadDate,
          doc.status,
          doc.rejectionReason,
        ].filter(Boolean).join(" ").toLowerCase();
        return statusMatches && (!searchNeedle || haystack.includes(searchNeedle));
      })
    : [];

  useEffect(() => {
    if (selectedParentId && !parentGroups.some((group) => group.id === selectedParentId)) {
      setSelectedParentId(null);
    }
  }, [parentGroups, selectedParentId]);

  const pendingCount = documents.filter((doc) => normalizeStatus(doc.status) === "pending").length;
  const verifiedCount = documents.filter((doc) => normalizeStatus(doc.status) === "verified").length;
  const rejectedCount = documents.filter((doc) => normalizeStatus(doc.status) === "rejected").length;
  const requiredCount = documents.filter((doc) => doc.required).length;

  const stats = [
    {
      label: "Total Documents",
      value: documents.length,
      helper: `${requiredCount} required records`,
      icon: FileText,
      tone: { background: "#EFF6FF", color: "#1B6ECC" },
      glow: "rgba(27,110,204,0.16)",
      action: () => {
        setStatusFilter("all");
        setSelectedParentId(null);
      },
    },
    {
      label: "Waiting Review",
      value: pendingCount,
      helper: "Need admin action",
      icon: Clock3,
      tone: { background: "#FEF3DC", color: "#EF9F27" },
      glow: "rgba(239,159,39,0.16)",
      action: () => {
        setStatusFilter("pending");
        setSelectedParentId(null);
      },
    },
    {
      label: "Verified",
      value: verifiedCount,
      helper: "Approved records",
      icon: CheckCircle2,
      tone: { background: "#E1F5EE", color: "#1A9E75" },
      glow: "rgba(26,158,117,0.16)",
      action: () => {
        setStatusFilter("verified");
        setSelectedParentId(null);
      },
    },
    {
      label: "Rejected",
      value: rejectedCount,
      helper: "Need parent update",
      icon: XCircle,
      tone: { background: "#FDEAEA", color: "#E24B4A" },
      glow: "rgba(226,75,74,0.14)",
      action: () => {
        setStatusFilter("rejected");
        setSelectedParentId(null);
      },
    },
  ];

  if (loading && documents.length === 0) {
    return (
      <DashboardLayout role="admin">
        <AdminPageSkeleton variant="documents" label="Loading documents" />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="admin">
      <style>{ADMIN_DOCUMENTS_CSS}</style>
      <div className="pz-admin-docs">
        <header className="pz-admin-docs-head">
          <div>
            <div className="pz-admin-docs-kicker">School Admin</div>
            <h1 className="pz-admin-docs-title">Documents</h1>
            <div className="pz-admin-docs-subtitle">
              Review uploaded parent documents directly without opening each parent profile.
            </div>
          </div>
          <div className="pz-admin-docs-actions">
            <div className="pz-admin-docs-date">
              <CalendarDays size={15} aria-hidden="true" />
              {new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
            </div>
            <button type="button" className="pz-admin-docs-button" onClick={fetchDocuments} disabled={loading}>
              {loading ? <LoadingSpinner size="xs" className="pz-loading-inline" /> : <RefreshCw size={15} aria-hidden="true" />}
              Refresh
            </button>
          </div>
        </header>

        <section className="pz-admin-docs-stat-grid" aria-label="Document review summary">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <button
                type="button"
                className="pz-admin-docs-stat"
                key={stat.label}
                style={{ "--accent-glow": stat.glow } as CSSProperties}
                onClick={stat.action}
                aria-label={`Filter by ${stat.label}`}
              >
                <div className="pz-admin-docs-stat-top">
                  <div className="pz-admin-docs-stat-label">{stat.label}</div>
                  <div className="pz-admin-docs-stat-icon" style={stat.tone}>
                    <Icon size={19} aria-hidden="true" />
                  </div>
                </div>
                <div className="pz-admin-docs-stat-value">{stat.value}</div>
                <div className="pz-admin-docs-stat-helper">
                  <ShieldCheck size={14} aria-hidden="true" />
                  {stat.helper}
                </div>
              </button>
            );
          })}
        </section>

        <section className="pz-admin-docs-card">
          <div className="pz-admin-docs-card-head">
            <div>
              <div className="pz-admin-docs-card-title">Document Review Queue</div>
              <div className="pz-admin-docs-subtitle">
                {selectedParent
                  ? `${selectedDocuments.length} document${selectedDocuments.length === 1 ? "" : "s"} uploaded by ${selectedParent.parentName}.`
                  : `${filteredParents.length} of ${parentGroups.length} parent${parentGroups.length === 1 ? "" : "s"} shown.`}
              </div>
            </div>
            <div className="pz-admin-docs-toolbar">
              <div className="pz-admin-docs-search">
                <Search size={15} aria-hidden="true" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search parent, child, or document..."
                />
              </div>
              <AdminSelect
                value={statusFilter}
                onChange={(value) => setStatusFilter(value as StatusFilter)}
                ariaLabel="Document status"
                options={[
                  { value: "all", label: "All Statuses" },
                  { value: "pending", label: "Pending" },
                  { value: "verified", label: "Verified" },
                  { value: "rejected", label: "Rejected" },
                ]}
              />
            </div>
          </div>

          {loading ? (
            <div className="pz-admin-doc-loading">
              <LoadingSpinner size="lg" label="Loading documents" />
            </div>
          ) : selectedParent ? (
            <>
              <div className="pz-admin-doc-parent-head">
                <div>
                  <div className="pz-admin-doc-parent-title">{selectedParent.parentName}</div>
                  <div className="pz-admin-doc-parent-sub">
                    {selectedParent.documents.length} uploaded document{selectedParent.documents.length === 1 ? "" : "s"}
                    {selectedParent.parentEmail ? ` - ${selectedParent.parentEmail}` : ""}
                    {selectedParent.parentPhone ? ` - ${selectedParent.parentPhone}` : ""}
                  </div>
                </div>
                <button type="button" className="pz-admin-docs-button" onClick={() => setSelectedParentId(null)}>
                  <ArrowLeft size={15} aria-hidden="true" />
                  Back to Parents
                </button>
              </div>
              {selectedDocuments.length ? (
                <div className="pz-admin-docs-list">
                  {selectedDocuments.map((doc) => {
                    const normalizedStatus = normalizeStatus(doc.status);
                    return (
                      <article className="pz-admin-doc-card" key={doc.id}>
                        <div className="pz-admin-doc-main">
                          <div className="pz-admin-doc-top">
                            <div className="pz-admin-doc-icon">
                              <FileCheck2 size={19} aria-hidden="true" />
                            </div>
                            <div className="pz-admin-doc-title-wrap">
                              <div className="pz-admin-doc-title" title={formatDocumentName(doc)}>
                                {formatDocumentName(doc)}
                              </div>
                              <div className="pz-admin-doc-meta">
                                <span className={`pz-admin-doc-pill ${statusTone(doc.status)}`}>
                                  <span className="pz-admin-doc-dot" />
                                  {statusLabel(doc.status)}
                                </span>
                                <span className="pz-admin-doc-pill gray">{doc.required ? "Required" : "Optional"}</span>
                                <span>{doc.uploadDate}</span>
                                <span title={doc.fileName}>{doc.fileName}</span>
                              </div>
                            </div>
                          </div>

                          {doc.rejectionReason && (
                            <div className="pz-admin-doc-reason">
                              Reason: {doc.rejectionReason}
                            </div>
                          )}
                        </div>

                        <div className="pz-admin-doc-actions">
                          {doc.url && (
                            <a
                              className="pz-admin-docs-button"
                              href={doc.url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <ExternalLink size={15} aria-hidden="true" />
                              Open
                            </a>
                          )}
                          <button
                            type="button"
                            className="pz-admin-docs-button"
                            onClick={() => downloadDocument(doc)}
                            disabled={actionId === doc.id}
                          >
                            {actionId === doc.id ? <LoadingSpinner size="xs" className="pz-loading-inline" /> : <Download size={15} aria-hidden="true" />}
                            Download
                          </button>
                          {normalizedStatus === "pending" && (
                            <>
                              <button
                                type="button"
                                className="pz-admin-docs-button primary"
                                onClick={() => verifyDocument(doc)}
                                disabled={actionId === doc.id}
                              >
                                {actionId === doc.id ? <LoadingSpinner size="xs" className="pz-loading-inline" /> : <CheckCircle2 size={15} aria-hidden="true" />}
                                Approve
                              </button>
                              <button
                                type="button"
                                className="pz-admin-docs-button danger"
                                onClick={() => setRejectingDoc(doc)}
                                disabled={actionId === doc.id}
                              >
                                <XCircle size={15} aria-hidden="true" />
                                Reject
                              </button>
                            </>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
              ) : (
                <div className="pz-admin-doc-empty">
                  <AlertTriangle size={28} aria-hidden="true" />
                  <strong>No documents match this status.</strong>
                  <span>Change the status filter or go back to the parent list.</span>
                </div>
              )}
            </>
          ) : filteredParents.length ? (
            <div className="pz-admin-docs-list">
              {filteredParents.map((parent) => {
                const latestDoc = parent.documents[0];
                return (
                  <button
                    type="button"
                    className="pz-admin-parent-card"
                    key={parent.id}
                    onClick={() => setSelectedParentId(parent.id)}
                  >
                    <div className="pz-admin-parent-main">
                      <div className="pz-admin-parent-avatar">
                        <UserRound size={19} aria-hidden="true" />
                      </div>
                      <div className="pz-admin-parent-info">
                        <div className="pz-admin-parent-name" title={parent.parentName}>
                          {parent.parentName}
                        </div>
                        <div className="pz-admin-parent-contact">
                          {parent.parentEmail && (
                            <span>
                              <Mail size={13} aria-hidden="true" />
                              {parent.parentEmail}
                            </span>
                          )}
                          {parent.parentPhone && (
                            <span>
                              <Phone size={13} aria-hidden="true" />
                              {parent.parentPhone}
                            </span>
                          )}
                        </div>
                        <div className="pz-admin-parent-counts">
                          <span className="pz-admin-doc-pill gray">{parent.documents.length} documents</span>
                          <span className="pz-admin-doc-pill amber">{parent.pendingCount} pending</span>
                          <span className="pz-admin-doc-pill green">{parent.verifiedCount} verified</span>
                          {parent.rejectedCount > 0 && (
                            <span className="pz-admin-doc-pill red">{parent.rejectedCount} rejected</span>
                          )}
                          {latestDoc && <span>Latest upload: {latestDoc.uploadDate}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="pz-admin-parent-action">
                      View Documents
                      <ExternalLink size={14} aria-hidden="true" />
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="pz-admin-doc-empty">
              <AlertTriangle size={28} aria-hidden="true" />
              <strong>No parents match this view.</strong>
              <span>Uploaded parent documents will appear here for direct review.</span>
            </div>
          )}
        </section>
      </div>

      {rejectingDoc && (
        <div className="pz-admin-doc-dialog-layer" role="dialog" aria-modal="true" aria-labelledby="reject-document-title">
          <section className="pz-admin-doc-dialog">
            <div className="pz-admin-doc-dialog-head">
              <div>
                <h2 className="pz-admin-doc-dialog-title" id="reject-document-title">
                  Reject Document
                </h2>
                <div className="pz-admin-doc-dialog-copy">
                  The parent will be notified and asked to upload an updated document.
                </div>
              </div>
              <button
                type="button"
                className="pz-admin-doc-close"
                onClick={() => {
                  setRejectingDoc(null);
                  setRejectReason("");
                }}
                aria-label="Close"
              >
                <X size={17} aria-hidden="true" />
              </button>
            </div>
            <div className="pz-admin-doc-dialog-body">
              <textarea
                value={rejectReason}
                onChange={(event) => setRejectReason(event.target.value)}
                placeholder="Reason for rejection"
              />
            </div>
            <div className="pz-admin-doc-dialog-footer">
              <button
                type="button"
                className="pz-admin-docs-button"
                onClick={() => {
                  setRejectingDoc(null);
                  setRejectReason("");
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="pz-admin-docs-button danger"
                onClick={rejectDocument}
                disabled={actionId === rejectingDoc.id}
              >
                {actionId === rejectingDoc.id ? <LoadingSpinner size="xs" className="pz-loading-inline" /> : <XCircle size={15} aria-hidden="true" />}
                Reject Document
              </button>
            </div>
          </section>
        </div>
      )}
    </DashboardLayout>
  );
}
