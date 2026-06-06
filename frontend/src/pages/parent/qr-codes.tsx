import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { QRCodeSVG } from "qrcode.react";
import {
  CalendarDays,
  Download,
  MessageSquareText,
  QrCode,
  RefreshCw,
  ShieldOff,
  UserRound,
} from "lucide-react";
import DashboardLayout from "@/components/layouts/dashboard-layout";
import { toast } from "@/components/ui/toast";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { API_BASE_URL } from "@/lib/api/link";
import { isQuietEmptyStateError } from "@/lib/api/quietEmptyState";
import type { DocumentVerificationStatus } from "@/lib/documentVerification";
import ParentPickupMessageModal from "./components/ParentPickupMessageModal";

type QRItem = {
  id: number;
  child: string;
  grade?: string | null;
  for: "parent" | "guardian" | string;
  guardian_id: number | null;
  guardian_name?: string | null;
  guardian_relation?: string | null;
  child_id: number;
  file: string;
  qr_code: string;
  expires_at?: string | null;
  token_version?: number;
};

const PARENT_QR_CSS = `
.pz-parent-qr {
  --navy: #071D3B;
  --blue: #1B6ECC;
  --teal: #1A9E75;
  --surface: #F4F6FA;
  --border: #E2E6EE;
  --text-1: #0A1628;
  --text-2: #4A5568;
  --text-3: #8A96A8;
  color: var(--text-1);
}

.pz-parent-qr-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 18px;
  margin-bottom: 22px;
}

.pz-parent-qr-title {
  font-family: 'Inter', sans-serif;
  font-size: clamp(28px, 3.1vw, 42px);
  line-height: 1.05;
  font-weight: 700;
  margin: 0;
}

.pz-parent-qr-sub {
  color: var(--text-3);
  font-size: 14px;
  margin-top: 8px;
}

.pz-parent-qr-actions,
.pz-parent-qr-card-actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.pz-parent-qr-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 38px;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: white;
  color: var(--text-2);
  padding: 0 14px;
  font-size: 13px;
  font-weight: 800;
}

.pz-parent-qr-button.primary {
  background: var(--teal);
  border-color: var(--teal);
  color: white;
}

.pz-parent-qr-button.danger {
  color: #991B1B;
  background: #FDEAEA;
  border-color: rgba(226,75,74,0.28);
}

.pz-parent-qr-button:disabled {
  cursor: not-allowed;
  opacity: 0.62;
}

.pz-parent-qr-stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
  margin-bottom: 18px;
}

.pz-parent-qr-stat,
.pz-parent-qr-card,
.pz-parent-qr-empty {
  background: white;
  border: 1px solid var(--border);
  border-radius: 12px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
}

.pz-parent-qr-stat {
  min-height: 118px;
  padding: 18px;
}

.pz-parent-qr-stat-label {
  color: var(--text-3);
  font-size: 12px;
  font-weight: 800;
}

.pz-parent-qr-stat-value {
  margin-top: 14px;
  font-family: 'Inter', sans-serif;
  font-size: 32px;
  font-weight: 800;
}

.pz-parent-qr-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}

.pz-parent-qr-card {
  overflow: hidden;
}

.pz-parent-qr-visual {
  display: flex;
  justify-content: center;
  padding: 20px;
  border-bottom: 1px solid var(--border);
}

.pz-parent-qr-svg {
  padding: 12px;
  border-radius: 14px;
  border: 1px solid var(--border);
  background: white;
  box-shadow: inset 0 0 0 6px var(--surface);
}

.pz-parent-qr-info {
  padding: 16px;
}

.pz-parent-qr-name {
  font-weight: 900;
  color: var(--text-1);
}

.pz-parent-qr-meta {
  margin-top: 6px;
  color: var(--text-3);
  font-size: 12px;
}

.pz-parent-qr-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border-radius: 999px;
  background: var(--surface);
  color: var(--text-2);
  padding: 5px 9px;
  font-size: 11px;
  font-weight: 800;
  margin-top: 10px;
  text-transform: capitalize;
}

.pz-parent-qr-card-actions {
  margin-top: 14px;
}

.pz-parent-qr-empty {
  min-height: 320px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 10px;
  color: var(--text-3);
  text-align: center;
  padding: 34px;
}

.pz-parent-qr-requirements {
  width: min(520px, 100%);
  margin-top: 8px;
  display: grid;
  gap: 8px;
  text-align: left;
}

.pz-parent-qr-requirement {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 10px 12px;
  color: var(--text-2);
  font-size: 13px;
}

.pz-parent-qr-requirement strong {
  color: var(--text-1);
}

@media (max-width: 1100px) {
  .pz-parent-qr-grid,
  .pz-parent-qr-stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 720px) {
  .pz-parent-qr-head {
    align-items: flex-start;
    flex-direction: column;
  }
  .pz-parent-qr-grid,
  .pz-parent-qr-stats {
    grid-template-columns: 1fr;
  }
}
`;

function authHeaders() {
  const token = localStorage.getItem("token");
  return { Authorization: `Bearer ${token}` };
}

function fileNameFromPath(file: string) {
  return file.split("/").pop() || file;
}

function formatExpiry(value?: string | null) {
  if (!value) return "No expiry";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "No expiry";
  return date.toLocaleDateString();
}

export default function ParentQRCodes() {
  const [qrCodes, setQrCodes] = useState<QRItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [revokingId, setRevokingId] = useState<number | null>(null);
  const [messageModalOpen, setMessageModalOpen] = useState(false);
  const [documentVerification, setDocumentVerification] = useState<DocumentVerificationStatus | null>(null);
  const documentsBlocked = Boolean(documentVerification && !documentVerification.summary.complete);

  const fetchQRCodes = async () => {
    setLoading(true);
    try {
      try {
        const { data: verification } = await axios.get(`${API_BASE_URL}/documents/verification-status`, {
          headers: authHeaders(),
        });
        setDocumentVerification(verification || null);

        if (verification?.summary && !verification.summary.complete) {
          setQrCodes([]);
          return;
        }
      } catch (verificationErr: any) {
        const code = verificationErr.response?.data?.code;
        if (code !== "FEATURE_DISABLED" && code !== "PACKAGE_REQUIRED") {
          throw verificationErr;
        }
        setDocumentVerification(null);
      }

      const { data } = await axios.get(`${API_BASE_URL}/qrcode`, {
        headers: authHeaders(),
      });
      setQrCodes(Array.isArray(data) ? data : []);
    } catch (err: any) {
      if (err.response?.data?.code === "DOCUMENT_VERIFICATION_REQUIRED") {
        setDocumentVerification(err.response.data.verification || null);
        setQrCodes([]);
      } else if (isQuietEmptyStateError(err)) {
        setDocumentVerification(null);
        setQrCodes([]);
      } else {
        toast.error(err.response?.data?.error || "Failed to load QR codes");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQRCodes();
  }, []);

  const generateQRCodes = async () => {
    if (documentsBlocked) return;
    setGenerating(true);
    try {
      await axios.post(`${API_BASE_URL}/qrcode/generate`, {}, { headers: authHeaders() });
      toast.success("QR codes regenerated");
      await fetchQRCodes();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to regenerate QR codes");
    } finally {
      setGenerating(false);
    }
  };

  const downloadQRCode = (file: string) => {
    const token = localStorage.getItem("token");
    const url = `${API_BASE_URL}/qrcode/download?file=${encodeURIComponent(fileNameFromPath(file))}&token=${encodeURIComponent(token || "")}`;
    window.open(url, "_blank");
  };

  const revokeQRCode = async (qr: QRItem) => {
    const confirmed = window.confirm(`Revoke this QR code for ${qr.child || "this student"}?`);
    if (!confirmed) return;

    setRevokingId(qr.id);
    try {
      await axios.patch(`${API_BASE_URL}/qrcode/${qr.id}/revoke`, {}, { headers: authHeaders() });
      setQrCodes((current) => current.filter((item) => item.id !== qr.id));
      toast.success("QR code revoked");
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to revoke QR code");
    } finally {
      setRevokingId(null);
    }
  };

  const stats = useMemo(() => {
    const parentCodes = qrCodes.filter((qr) => qr.for === "parent").length;
    const guardianCodes = qrCodes.length - parentCodes;
    const studentCount = new Set(qrCodes.map((qr) => qr.child_id)).size;

    return [
      { label: "Active QR Codes", value: qrCodes.length, icon: QrCode },
      { label: "Students", value: studentCount, icon: UserRound },
      { label: "Guardian Codes", value: guardianCodes, icon: ShieldOff },
    ];
  }, [qrCodes]);

  return (
    <DashboardLayout role="parent">
      <style>{PARENT_QR_CSS}</style>
      <div className="pz-parent-qr">
        <div className="pz-parent-qr-head">
          <div>
            <h1 className="pz-parent-qr-title">QR Codes</h1>
            <div className="pz-parent-qr-sub">Family pickup access for parents and guardians.</div>
          </div>
          <div className="pz-parent-qr-actions">
            <button type="button" className="pz-parent-qr-button" onClick={() => setMessageModalOpen(true)}>
              <MessageSquareText size={15} />
              Message Pickup Team
            </button>
            <button type="button" className="pz-parent-qr-button" onClick={fetchQRCodes} disabled={loading}>
              {loading ? <LoadingSpinner size="xs" className="pz-loading-inline" /> : <RefreshCw size={15} />}
              Refresh
            </button>
            <button type="button" className="pz-parent-qr-button primary" onClick={generateQRCodes} disabled={generating || documentsBlocked}>
              {generating ? <LoadingSpinner size="xs" className="pz-loading-inline" /> : <QrCode size={15} />}
              Regenerate
            </button>
          </div>
        </div>

        <div className="pz-parent-qr-stats">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <section className="pz-parent-qr-stat" key={stat.label}>
                <div className="pz-parent-qr-stat-label">{stat.label}</div>
                <div className="pz-parent-qr-stat-value">{stat.value}</div>
                <div className="pz-parent-qr-pill">
                  <Icon size={13} />
                  Active
                </div>
              </section>
            );
          })}
        </div>

        {loading ? (
          <div className="pz-parent-qr-empty">
            <LoadingSpinner size="md" label="Loading QR codes" />
            Loading QR codes...
          </div>
        ) : documentsBlocked ? (
          <div className="pz-parent-qr-empty">
            <QrCode size={28} color="#EF9F27" />
            <strong>Document approval is required first.</strong>
            <span>QR pickup access becomes available after the required records are approved by your school.</span>
            <div className="pz-parent-qr-requirements">
              {documentVerification?.required.map((item, index) => (
                <div className="pz-parent-qr-requirement" key={`${item.key}-${item.childId || index}`}>
                  <strong>{item.childName ? `${item.label} (${item.childName})` : item.label}</strong>
                  <span>
                    {item.approved
                      ? "Approved"
                      : item.status === "pending"
                        ? "Waiting review"
                        : item.status === "rejected"
                          ? "Rejected"
                          : "Missing"}
                  </span>
                </div>
              ))}
            </div>
            <a className="pz-parent-qr-button primary" href="/parent/documents">
              Open Documents
            </a>
          </div>
        ) : qrCodes.length ? (
          <div className="pz-parent-qr-grid">
            {qrCodes.map((qr) => (
              <article className="pz-parent-qr-card" key={qr.id}>
                <div className="pz-parent-qr-visual">
                  <div className="pz-parent-qr-svg">
                    <QRCodeSVG value={qr.qr_code || ""} size={150} />
                  </div>
                </div>
                <div className="pz-parent-qr-info">
                  <div className="pz-parent-qr-name">{qr.child || "Student"}</div>
                  <div className="pz-parent-qr-meta">
                    {qr.grade ? `Grade ${qr.grade} - ` : ""}
                    {qr.for === "parent" ? "Parent" : qr.guardian_name || "Guardian"}
                  </div>
                  <span className="pz-parent-qr-pill">
                    <CalendarDays size={13} />
                    {formatExpiry(qr.expires_at)}
                  </span>
                  <div className="pz-parent-qr-card-actions">
                    <button type="button" className="pz-parent-qr-button primary" onClick={() => downloadQRCode(qr.file)}>
                      <Download size={15} />
                      Download
                    </button>
                    <button
                      type="button"
                      className="pz-parent-qr-button danger"
                      onClick={() => revokeQRCode(qr)}
                      disabled={revokingId === qr.id}
                    >
                      {revokingId === qr.id ? <LoadingSpinner size="xs" className="pz-loading-inline" /> : <ShieldOff size={15} />}
                      Revoke
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="pz-parent-qr-empty">
            <QrCode size={28} color="#1A9E75" />
            <strong>No active QR codes.</strong>
            <button type="button" className="pz-parent-qr-button primary" onClick={generateQRCodes} disabled={generating || documentsBlocked}>
              {generating ? <LoadingSpinner size="xs" className="pz-loading-inline" /> : <QrCode size={15} />}
              Regenerate
            </button>
          </div>
        )}
      </div>
      <ParentPickupMessageModal
        isOpen={messageModalOpen}
        childrenCount={1}
        onClose={() => setMessageModalOpen(false)}
        onSent={fetchQRCodes}
      />
    </DashboardLayout>
  );
}
