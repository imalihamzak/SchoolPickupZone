import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import axios from "axios";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileCheck2,
  FileText,
  RefreshCw,
  UploadCloud,
  XCircle,
} from "lucide-react";
import DashboardLayout from "@/components/layouts/dashboard-layout";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { toast } from "@/components/ui/toast";
import { API_BASE_URL } from "@/lib/api/link";
import { isQuietEmptyStateError } from "@/lib/api/quietEmptyState";
import {
  REQUIRED_DOCUMENT_TYPES,
  type DocumentVerificationStatus,
} from "@/lib/documentVerification";
import DocumentsView from "./components/DocumentsView";
import UploadDocumentForm from "./components/UploadDocumentForm";

type ParentDocument = {
  id: string;
  type: string;
  childId?: string | number | null;
  childName?: string | null;
  fileName: string;
  filePath?: string;
  url?: string;
  uploadDate: string;
  status: string;
  required: boolean;
  rejectionReason?: string | null;
};

type Child = {
  id: string | number;
  full_name: string;
};

const PARENT_DOCUMENTS_CSS = `
.pz-parent-docs {
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

.pz-parent-docs,
.pz-parent-docs * {
  box-sizing: border-box;
}

.pz-docs-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 18px;
  margin-bottom: 22px;
}

.pz-docs-kicker {
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

.pz-docs-kicker::before {
  content: "";
  width: 18px;
  height: 2px;
  border-radius: 999px;
  background: var(--teal);
}

.pz-docs-title {
  font-family: 'Inter', sans-serif;
  font-size: clamp(28px, 3.2vw, 42px);
  line-height: 1.04;
  letter-spacing: -0.025em;
  font-weight: 700;
  color: var(--text-1);
  margin: 0;
}

.pz-docs-subtitle {
  color: var(--text-3);
  font-size: 14px;
  line-height: 1.5;
  margin-top: 8px;
}

.pz-docs-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  flex-wrap: wrap;
}

.pz-docs-button,
.pz-docs-date {
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

.pz-docs-button {
  border: 1px solid var(--border);
  background: var(--white);
  color: var(--text-2);
  cursor: pointer;
  transition: all 0.18s ease;
}

.pz-docs-button:hover {
  border-color: rgba(27,110,204,0.36);
  background: #EFF6FF;
  color: var(--blue);
}

.pz-docs-button.primary {
  border-color: var(--teal);
  background: var(--teal);
  color: var(--white);
}

.pz-docs-button.primary:hover {
  border-color: var(--teal-light);
  background: var(--teal-light);
  color: var(--white);
}

.pz-docs-date {
  background: var(--white);
  border: 1px solid var(--border);
  color: var(--text-2);
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
}

.pz-docs-stat-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
  margin-bottom: 18px;
}

.pz-docs-stat {
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

.pz-docs-stat::after {
  content: "";
  position: absolute;
  inset: auto -38px -70px auto;
  width: 142px;
  height: 142px;
  border-radius: 50%;
  background: radial-gradient(circle, var(--accent-glow) 0%, transparent 65%);
  pointer-events: none;
}

.pz-docs-stat-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.pz-docs-stat-label {
  color: var(--text-3);
  font-size: 12px;
  font-weight: 800;
}

.pz-docs-stat-icon {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.pz-docs-stat-value {
  font-family: 'Inter', sans-serif;
  font-size: 32px;
  line-height: 1;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.pz-docs-stat-helper {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--text-3);
  font-size: 12px;
  line-height: 1.4;
}

.pz-docs-card {
  background: var(--white);
  border: 1px solid var(--border);
  border-radius: 12px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
  overflow: hidden;
}

.pz-docs-card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 18px 22px;
  border-bottom: 1px solid var(--border);
}

.pz-docs-card-title {
  font-family: 'Inter', sans-serif;
  font-size: 16px;
  font-weight: 700;
  letter-spacing: -0.025em;
}

.pz-docs-card-body {
  padding: 20px 22px 22px;
}

.pz-docs-loading {
  min-height: 360px;
  display: flex;
  align-items: center;
  justify-content: center;
}

@media (max-width: 1180px) {
  .pz-docs-stat-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 760px) {
  .pz-docs-head,
  .pz-docs-card-head {
    align-items: flex-start;
    flex-direction: column;
  }
  .pz-docs-actions {
    justify-content: flex-start;
    width: 100%;
  }
  .pz-docs-button,
  .pz-docs-date {
    width: 100%;
  }
  .pz-docs-stat-grid {
    grid-template-columns: 1fr;
  }
  .pz-docs-card-body {
    padding: 16px 14px;
  }
}
`;

export default function ParentDocumentsPage() {
  const [documents, setDocuments] = useState<ParentDocument[]>([]);
  const [children, setChildren] = useState<Child[]>([]);
  const [verification, setVerification] = useState<DocumentVerificationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploadOpen, setUploadOpen] = useState(false);

  const fetchDocuments = async () => {
    try {
      const token = localStorage.getItem("token");
      const [documentsRes, verificationRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/documents`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_BASE_URL}/documents/verification-status`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      setDocuments(Array.isArray(documentsRes.data) ? documentsRes.data : []);
      setVerification(verificationRes.data || null);
    } catch (err: any) {
      if (isQuietEmptyStateError(err)) {
        setDocuments([]);
        setVerification(null);
        return;
      }
      toast.error(err.response?.data?.error || "Failed to fetch documents");
    }
  };

  const fetchChildren = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_BASE_URL}/children`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setChildren(Array.isArray(res.data) ? res.data : []);
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to fetch children");
    }
  };

  const refreshPage = async () => {
    setLoading(true);
    await Promise.all([fetchDocuments(), fetchChildren()]);
    setLoading(false);
  };

  useEffect(() => {
    refreshPage();
  }, []);

  const approvedCount = documents.filter((doc) =>
    ["approved", "verified"].includes(String(doc.status || "").toLowerCase())
  ).length;
  const pendingCount = documents.filter((doc) => String(doc.status || "").toLowerCase() === "pending").length;
  const rejectedCount = documents.filter((doc) => String(doc.status || "").toLowerCase() === "rejected").length;
  const missingCount = verification?.summary.missing ?? 0;

  const stats = useMemo(
    () => [
      {
        label: "Uploaded",
        value: documents.length,
        helper: "Documents submitted",
        icon: FileText,
        tone: { background: "#EFF6FF", color: "#1B6ECC" },
        glow: "rgba(27,110,204,0.16)",
      },
      {
        label: "Approved",
        value: approvedCount,
        helper: "Verified records",
        icon: CheckCircle2,
        tone: { background: "#E1F5EE", color: "#1A9E75" },
        glow: "rgba(26,158,117,0.16)",
      },
      {
        label: "Waiting",
        value: pendingCount,
        helper: "Under school review",
        icon: Clock3,
        tone: { background: "#FEF3DC", color: "#EF9F27" },
        glow: "rgba(239,159,39,0.16)",
      },
      {
        label: "Needs Work",
        value: rejectedCount + missingCount,
        helper: "Rejected or missing",
        icon: rejectedCount ? XCircle : AlertTriangle,
        tone: { background: "#FDEAEA", color: "#E24B4A" },
        glow: "rgba(226,75,74,0.14)",
      },
    ],
    [approvedCount, documents.length, missingCount, pendingCount, rejectedCount]
  );

  return (
    <DashboardLayout role="parent">
      <style>{PARENT_DOCUMENTS_CSS}</style>
      <div className="pz-parent-docs">
        <header className="pz-docs-head">
          <div>
            <div className="pz-docs-kicker">Parent Portal</div>
            <h1 className="pz-docs-title">Documents</h1>
            <div className="pz-docs-subtitle">
              Upload, review, and track the documents required for QR pickup access.
            </div>
          </div>
          <div className="pz-docs-actions">
            <div className="pz-docs-date">
              <CalendarDays size={15} aria-hidden="true" />
              {new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
            </div>
            <button type="button" className="pz-docs-button" onClick={refreshPage}>
              <RefreshCw size={15} aria-hidden="true" />
              Refresh
            </button>
            <button type="button" className="pz-docs-button primary" onClick={() => setUploadOpen(true)}>
              <UploadCloud size={15} aria-hidden="true" />
              Upload Document
            </button>
          </div>
        </header>

        <section className="pz-docs-stat-grid" aria-label="Document summary">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                className="pz-docs-stat"
                key={stat.label}
                style={{ "--accent-glow": stat.glow } as CSSProperties}
              >
                <div className="pz-docs-stat-top">
                  <div className="pz-docs-stat-label">{stat.label}</div>
                  <div className="pz-docs-stat-icon" style={stat.tone}>
                    <Icon size={19} aria-hidden="true" />
                  </div>
                </div>
                <div className="pz-docs-stat-value">{stat.value}</div>
                <div className="pz-docs-stat-helper">
                  <CheckCircle2 size={14} aria-hidden="true" />
                  {stat.helper}
                </div>
              </div>
            );
          })}
        </section>

        <section className="pz-docs-card">
          <div className="pz-docs-card-head">
            <div>
              <div className="pz-docs-card-title">Uploaded Documents</div>
              <div className="pz-docs-subtitle">
                School admins review these records before QR codes are generated.
              </div>
            </div>
            <FileCheck2 size={21} color="#1A9E75" aria-hidden="true" />
          </div>
          <div className="pz-docs-card-body">
            {loading ? (
              <div className="pz-docs-loading">
                <LoadingSpinner size="lg" label="Loading documents" />
              </div>
            ) : (
              <DocumentsView
                documents={documents}
                requiredTypes={REQUIRED_DOCUMENT_TYPES}
                verificationStatus={verification || undefined}
                onRefresh={fetchDocuments}
              />
            )}
          </div>
        </section>
      </div>

      {uploadOpen && (
        <UploadDocumentForm
          isOpen={uploadOpen}
          onClose={() => setUploadOpen(false)}
          onUploadSuccess={fetchDocuments}
          requiredTypes={REQUIRED_DOCUMENT_TYPES}
          existingDocuments={documents}
          children={children}
        />
      )}
    </DashboardLayout>
  );
}
