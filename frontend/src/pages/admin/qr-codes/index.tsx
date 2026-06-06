import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import axios from "axios";
import { QRCodeSVG } from "qrcode.react";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Download,
  Mail,
  Phone,
  QrCode,
  RefreshCw,
  Search,
  ShieldCheck,
  ShieldOff,
  UserRound,
  UsersRound,
} from "lucide-react";
import DashboardLayout from "@/components/layouts/dashboard-layout";
import { toast } from "@/components/ui/toast";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import AdminPageSkeleton from "@/components/ui/AdminPageSkeleton";
import { API_BASE_URL } from "@/lib/api/link";
import { isQuietEmptyStateError } from "@/lib/api/quietEmptyState";

const ADMIN_QR_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Inter:wght@400;500;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,300&display=swap');

.pz-qr-page {
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

.pz-qr-page,
.pz-qr-page * {
  box-sizing: border-box;
}

.pz-qr-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 18px;
  margin-bottom: 24px;
}

.pz-qr-kicker {
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

.pz-qr-kicker::before {
  content: "";
  width: 18px;
  height: 2px;
  border-radius: 999px;
  background: var(--teal);
}

.pz-qr-title {
  font-family: 'Inter', sans-serif;
  font-size: clamp(28px, 3.2vw, 42px);
  line-height: 1.04;
  letter-spacing: -0.025em;
  font-weight: 700;
  margin: 0;
  color: var(--text-1);
}

.pz-qr-subtitle {
  color: var(--text-3);
  font-size: 14px;
  margin-top: 8px;
}

.pz-qr-header-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  flex-wrap: wrap;
}

.pz-qr-date-pill,
.pz-qr-button {
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

.pz-qr-date-pill {
  background: var(--white);
  border: 1px solid var(--border);
  color: var(--text-2);
  box-shadow: var(--shadow-sm);
}

.pz-qr-button {
  border: 1px solid var(--border);
  background: var(--white);
  color: var(--text-2);
  cursor: pointer;
  transition: all 0.18s ease;
}

.pz-qr-button:hover {
  color: var(--blue);
  border-color: rgba(27,110,204,0.36);
  background: #EFF6FF;
}

.pz-qr-button.primary {
  background: var(--teal);
  border-color: var(--teal);
  color: var(--white);
}

.pz-qr-button.primary:hover {
  background: var(--teal-light);
  border-color: var(--teal-light);
  color: var(--white);
}

.pz-qr-button.danger {
  border-color: rgba(226,75,74,0.3);
  background: var(--red-pale);
  color: #991B1B;
}

.pz-qr-button.danger:hover {
  border-color: rgba(226,75,74,0.44);
  background: #FBDADA;
  color: #7F1D1D;
}

.pz-qr-button:disabled {
  opacity: 0.64;
  cursor: not-allowed;
}

.pz-qr-stat-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
  margin-bottom: 18px;
}

.pz-qr-stat-card {
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

.pz-qr-stat-card::after {
  content: "";
  position: absolute;
  inset: auto -34px -70px auto;
  width: 140px;
  height: 140px;
  background: radial-gradient(circle, var(--stat-glow) 0%, transparent 67%);
  pointer-events: none;
}

.pz-qr-stat-top {
  display: flex;
  justify-content: space-between;
  gap: 14px;
  align-items: flex-start;
}

.pz-qr-stat-label {
  color: var(--text-3);
  font-size: 12px;
  font-weight: 700;
}

.pz-qr-stat-icon {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.pz-qr-stat-value {
  font-family: 'Inter', 'Segoe UI', Arial, sans-serif;
  font-size: 34px;
  font-weight: 700;
  line-height: 1;
  letter-spacing: 0;
  color: var(--text-1);
  font-variant-numeric: tabular-nums;
}

.pz-qr-stat-helper {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--text-3);
  font-size: 12px;
  font-weight: 500;
}

.pz-qr-controls {
  background: var(--white);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 16px;
  box-shadow: var(--shadow-sm);
  margin-bottom: 18px;
}

.pz-qr-toolbar {
  display: grid;
  grid-template-columns: minmax(260px, 1fr) auto;
  gap: 14px;
  align-items: center;
}

.pz-qr-select {
  font-size: 14px;
}

.pz-qr-selected-parent {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 12px;
}

.pz-qr-selected-parent-copy {
  min-width: 0;
}

.pz-qr-selected-parent-name {
  color: var(--text-1);
  font-size: 13px;
  font-weight: 800;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pz-qr-selected-parent-meta {
  color: var(--text-3);
  font-size: 11px;
  margin-top: 3px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pz-qr-parent-panel {
  background: var(--white);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
}

.pz-qr-parent-directory-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 18px 20px;
  border-bottom: 1px solid var(--border);
}

.pz-qr-parent-search {
  width: min(360px, 100%);
  min-height: 40px;
  display: flex;
  align-items: center;
  gap: 8px;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--surface);
  color: var(--text-3);
  padding: 0 12px;
}

.pz-qr-parent-search input {
  width: 100%;
  border: 0;
  outline: none;
  background: transparent;
  color: var(--text-1);
  font: inherit;
  font-size: 13px;
}

.pz-qr-parent-list {
  display: grid;
  gap: 10px;
  padding: 16px;
}

.pz-qr-parent-card {
  width: 100%;
  display: grid;
  grid-template-columns: 44px minmax(0, 1fr) auto;
  gap: 12px;
  align-items: center;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: #FFFFFF;
  color: inherit;
  padding: 14px;
  text-align: left;
  cursor: pointer;
  transition: border-color 0.18s ease, box-shadow 0.18s ease, transform 0.18s ease;
}

.pz-qr-parent-card:hover {
  border-color: rgba(27,110,204,0.3);
  box-shadow: 0 10px 28px rgba(7,29,59,0.08);
  transform: translateY(-1px);
}

.pz-qr-parent-avatar {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--teal-pale);
  color: var(--teal);
}

.pz-qr-parent-copy {
  min-width: 0;
}

.pz-qr-parent-name {
  color: var(--text-1);
  font-size: 14px;
  font-weight: 800;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pz-qr-parent-contact {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  color: var(--text-3);
  font-size: 12px;
  margin-top: 6px;
}

.pz-qr-parent-contact span {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.pz-qr-parent-action {
  color: var(--blue);
  font-size: 12px;
  font-weight: 800;
  white-space: nowrap;
}

.pz-qr-tabs {
  display: flex;
  gap: 5px;
  padding: 4px;
  border-radius: 11px;
  background: var(--surface);
  border: 1px solid var(--border);
}

.pz-qr-tab {
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

.pz-qr-tab.active {
  background: var(--white);
  color: var(--text-1);
  box-shadow: var(--shadow-sm);
}

.pz-qr-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(320px, 0.42fr);
  gap: 18px;
  align-items: start;
}

.pz-qr-main,
.pz-qr-side {
  background: var(--white);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
}

.pz-qr-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 18px 20px;
  border-bottom: 1px solid var(--border);
}

.pz-qr-card-title {
  font-family: 'Inter', sans-serif;
  font-size: 16px;
  font-weight: 700;
  letter-spacing: -0.025em;
  color: var(--text-1);
}

.pz-qr-card-subtitle {
  color: var(--text-3);
  font-size: 12px;
  margin-top: 4px;
}

.pz-qr-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 800;
  white-space: nowrap;
  padding: 5px 10px;
  color: #065F46;
  background: var(--teal-pale);
}

.pz-qr-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}

.pz-qr-list {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
  padding: 18px;
}

.pz-qr-card {
  border: 1px solid var(--border);
  border-radius: 14px;
  background: #FAFBFD;
  overflow: hidden;
  transition: transform 0.18s ease, box-shadow 0.18s ease;
}

.pz-qr-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 30px rgba(7,29,59,0.08);
}

.pz-qr-visual {
  background: var(--white);
  padding: 18px;
  display: flex;
  justify-content: center;
  border-bottom: 1px solid var(--border);
}

.pz-qr-svg-wrap {
  padding: 12px;
  border-radius: 14px;
  border: 1px solid var(--border);
  background: var(--white);
  box-shadow: inset 0 0 0 6px var(--surface);
}

.pz-qr-info {
  padding: 14px;
  text-align: center;
}

.pz-qr-child {
  color: var(--text-1);
  font-size: 14px;
  font-weight: 800;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pz-qr-meta {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border-radius: 999px;
  background: var(--surface);
  color: var(--text-2);
  padding: 5px 10px;
  font-size: 11px;
  font-weight: 800;
  margin-top: 8px;
  text-transform: capitalize;
}

.pz-qr-download {
  margin: 12px auto 0;
}

.pz-qr-actions {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 12px;
}

.pz-qr-actions .pz-qr-button {
  min-height: 36px;
  padding: 0 12px;
}

.pz-qr-empty {
  min-height: 300px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  text-align: center;
  color: var(--text-3);
  padding: 40px 22px;
}

.pz-qr-empty-icon {
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

.pz-qr-side {
  position: sticky;
  top: 0;
}

.pz-qr-side-section {
  padding: 18px 20px;
  border-bottom: 1px solid var(--border);
}

.pz-qr-side-section:last-child {
  border-bottom: 0;
}

.pz-qr-side-title {
  color: var(--text-1);
  font-size: 13px;
  font-weight: 800;
  margin-bottom: 12px;
}

.pz-qr-meter-row {
  display: grid;
  grid-template-columns: 76px 1fr;
  gap: 14px;
  align-items: center;
}

.pz-qr-meter {
  width: 76px;
  height: 76px;
  border-radius: 50%;
  background: conic-gradient(var(--teal) var(--meter-angle), var(--surface-2) 0);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.pz-qr-meter::after {
  content: "";
  position: absolute;
  inset: 8px;
  border-radius: 50%;
  background: var(--white);
}

.pz-qr-meter span {
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

.pz-qr-copy {
  color: var(--text-3);
  font-size: 12px;
  line-height: 1.55;
}

.pz-qr-copy strong {
  color: var(--text-1);
  font-family: 'Inter', 'Segoe UI', Arial, sans-serif;
  font-variant-numeric: tabular-nums;
}

.pz-qr-mini-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.pz-qr-mini-item {
  display: grid;
  grid-template-columns: 36px minmax(0, 1fr);
  gap: 10px;
  align-items: center;
  padding: 11px;
  border: 1px solid var(--border);
  border-radius: 11px;
  background: #FAFBFD;
}

.pz-qr-mini-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: var(--navy-mid);
  color: var(--white);
  display: flex;
  align-items: center;
  justify-content: center;
}

.pz-qr-mini-title {
  color: var(--text-1);
  font-size: 13px;
  font-weight: 800;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pz-qr-mini-sub {
  color: var(--text-3);
  font-size: 11px;
  margin-top: 2px;
}

@media (max-width: 1180px) {
  .pz-qr-stat-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .pz-qr-grid {
    grid-template-columns: 1fr;
  }
  .pz-qr-side {
    position: static;
  }
  .pz-qr-list {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 760px) {
  .pz-qr-header {
    align-items: flex-start;
    flex-direction: column;
  }
  .pz-qr-header-actions {
    justify-content: flex-start;
  }
  .pz-qr-stat-grid,
  .pz-qr-list {
    grid-template-columns: 1fr;
  }
  .pz-qr-toolbar {
    grid-template-columns: 1fr;
  }
  .pz-qr-selected-parent,
  .pz-qr-parent-directory-head {
    align-items: flex-start;
    flex-direction: column;
  }
  .pz-qr-parent-search {
    width: 100%;
  }
  .pz-qr-parent-card {
    grid-template-columns: 44px minmax(0, 1fr);
  }
  .pz-qr-parent-action {
    grid-column: 2;
  }
  .pz-qr-tabs {
    overflow-x: auto;
  }
  .pz-qr-card-header {
    align-items: flex-start;
    flex-direction: column;
  }
}
`;

interface QRItem {
  id: number;
  child: string;
  for: string;
  file: string;
  qr_code: string;
  guardian_id: number | null;
  guardian_name?: string | null;
  guardian_contact_type?: string | null;
  child_id: number;
  status?: string;
  expires_at?: string | null;
  token_version?: number;
}

interface Parent {
  id: number;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  status?: string | null;
}

type QRTab = string;

function todayLabel() {
  return new Date().toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function qrOwnerLabel(qr: Pick<QRItem, "for" | "guardian_name">) {
  if (qr.for === "parent") return "Primary Parent";
  if (qr.for === "second_parent") return qr.guardian_name ? `Second Parent - ${qr.guardian_name}` : "Second Parent";
  return qr.guardian_name || "Guardian";
}

function parentFullName(parent?: Parent | null) {
  if (!parent) return "Parent";
  return [parent.firstName, parent.lastName].filter(Boolean).join(" ").trim() || parent.email || "Parent";
}

export default function QRCodePage() {
  const [qrCodes, setQrCodes] = useState<QRItem[]>([]);
  const [activeTab, setActiveTab] = useState<QRTab>("all");
  const [childrenMap, setChildrenMap] = useState<Record<number, string>>({});
  const [parents, setParents] = useState<Parent[]>([]);
  const [selectedParentId, setSelectedParentId] = useState<number | null>(null);
  const [parentSearch, setParentSearch] = useState("");
  const [parentsLoading, setParentsLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [revokingId, setRevokingId] = useState<number | null>(null);
  const qrRequestId = useRef(0);

  const token = localStorage.getItem("token");

  const fetchParents = async () => {
    setParentsLoading(true);
    try {
      const { data } = await axios.get(`${API_BASE_URL}/admin/parents`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setParents(data);
    } catch (err: any) {
      if (isQuietEmptyStateError(err)) {
        setParents([]);
        return;
      }
      toast.error("Failed to load parents");
    } finally {
      setParentsLoading(false);
    }
  };

  const applyMaps = (childData: any[]) => {
    const childMapTemp: Record<number, string> = {};
    childData.forEach((child: any) => {
      childMapTemp[child.id] = child.full_name;
    });

    setChildrenMap(childMapTemp);
  };

  const fetchData = async (parentId: number) => {
    const requestId = ++qrRequestId.current;
    setLoading(true);
    setQrCodes([]);
    setChildrenMap({});
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [qrRes, childRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/qrcode?parent_id=${parentId}`, { headers }),
        axios.get(`${API_BASE_URL}/children?parent_id=${parentId}`, { headers }),
      ]);

      if (requestId !== qrRequestId.current) return;
      applyMaps(childRes.data);
      setQrCodes(qrRes.data || []);
    } catch (err: any) {
      if (requestId !== qrRequestId.current) return;
      if (isQuietEmptyStateError(err)) {
        applyMaps([]);
        setQrCodes([]);
        return;
      }
      toast.error(err.response?.data?.error || "Failed to load QR data");
    } finally {
      if (requestId === qrRequestId.current) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchParents();
  }, []);

  useEffect(() => {
    if (selectedParentId) {
      setActiveTab("all");
      fetchData(selectedParentId);
    } else {
      qrRequestId.current += 1;
      setQrCodes([]);
      setChildrenMap({});
      setActiveTab("all");
      setLoading(false);
    }
  }, [selectedParentId]);

  const downloadQRCode = (file: string) => {
    const url = `${API_BASE_URL}/qrcode/download?file=${encodeURIComponent(file)}&token=${encodeURIComponent(token || "")}`;
    window.open(url, "_blank");
  };

  const revokeQRCode = async (qr: QRItem) => {
    const ownerLabel = qr.for === "parent" ? "parent" : qr.for === "second_parent" ? "second parent" : "guardian";
    const confirmed = window.confirm(
      `Revoke this ${ownerLabel} QR code for ${childrenMap[qr.child_id] || qr.child || "this student"}?`
    );
    if (!confirmed) return;

    setRevokingId(qr.id);
    try {
      await axios.patch(
        `${API_BASE_URL}/qrcode/${qr.id}/revoke`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setQrCodes((current) => current.filter((item) => item.id !== qr.id));
      toast.success("QR code revoked");
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to revoke QR code");
    } finally {
      setRevokingId(null);
    }
  };

  const filterQRCodes = () => {
    if (activeTab === "all") {
      return qrCodes;
    }

    if (activeTab === "parent") {
      return qrCodes.filter((qr) => qr.for === "parent");
    }

    if (activeTab === "second-parent") {
      return qrCodes.filter((qr) => qr.for === "second_parent");
    }

    const guardianId = Number(activeTab.replace("guardian-", ""));
    if (!guardianId) return [];
    return qrCodes.filter((qr) => qr.for === "guardian" && qr.guardian_id === guardianId);
  };

  const selectedParent = parents.find((parent) => parent.id === selectedParentId) || null;
  const selectedParentName = parentFullName(selectedParent);
  const filteredParents = useMemo(() => {
    const search = parentSearch.trim().toLowerCase();
    if (!search) return parents;

    return parents.filter((parent) =>
      [
        parentFullName(parent),
        parent.email,
        parent.phone,
        parent.status,
      ].filter(Boolean).join(" ").toLowerCase().includes(search)
    );
  }, [parentSearch, parents]);

  const filteredQRCodes = filterQRCodes();
  const parentQRs = qrCodes.filter((qr) => qr.for === "parent").length;
  const secondParentQRs = qrCodes.filter((qr) => qr.for === "second_parent").length;
  const guardianQRs = qrCodes.filter((qr) => qr.for === "guardian").length;
  const guardianTabs = Array.from(
    qrCodes
      .filter((qr) => qr.for === "guardian" && qr.guardian_id)
      .reduce((map, qr) => {
        map.set(Number(qr.guardian_id), qr.guardian_name || `Guardian ${map.size + 1}`);
        return map;
      }, new Map<number, string>())
      .entries()
  ).map(([id, label]) => ({ key: `guardian-${id}`, label }));
  const tabOptions = [
    { key: "all", label: "All" },
    { key: "parent", label: "Primary Parent" },
    ...(secondParentQRs ? [{ key: "second-parent", label: "Second Parent" }] : []),
    ...guardianTabs,
  ];
  const tabKeys = tabOptions.map((tab) => tab.key).join("|");
  const activeTabLabel = tabOptions.find((tab) => tab.key === activeTab)?.label || "Guardian";
  const uniqueChildren = new Set(qrCodes.map((qr) => qr.child_id)).size;
  const coverage = uniqueChildren
    ? Math.min(100, Math.round((qrCodes.length / Math.max(uniqueChildren * 3, 1)) * 100))
    : 0;

  useEffect(() => {
    if (!tabOptions.some((tab) => tab.key === activeTab)) {
      setActiveTab("all");
    }
  }, [activeTab, tabKeys]);

  useEffect(() => {
    if (!parentsLoading && selectedParentId && !selectedParent) {
      setSelectedParentId(null);
    }
  }, [parentsLoading, selectedParent, selectedParentId]);

  const statCards = [
    {
      label: "Total QR Codes",
      value: qrCodes.length,
      helper: "Selected parent scope",
      icon: QrCode,
      tone: { background: "#EFF6FF", color: "#1B6ECC" },
      glow: "rgba(27,110,204,0.16)",
    },
    {
      label: "Parent Codes",
      value: parentQRs,
      helper: "Primary pickup access",
      icon: UserRound,
      tone: { background: "#E1F5EE", color: "#1A9E75" },
      glow: "rgba(26,158,117,0.16)",
    },
    {
      label: "Guardian Codes",
      value: guardianQRs,
      helper: "Delegated pickup access",
      icon: ShieldCheck,
      tone: { background: "#FEF3DC", color: "#EF9F27" },
      glow: "rgba(239,159,39,0.16)",
    },
    {
      label: "Second Parent Codes",
      value: secondParentQRs,
      helper: "Secondary parent access",
      icon: UsersRound,
      tone: { background: "#F4F6FA", color: "#0B2E5A" },
      glow: "rgba(7,29,59,0.14)",
    },
  ];

  if (parentsLoading && parents.length === 0) {
    return (
      <DashboardLayout role="admin">
        <AdminPageSkeleton variant="qr-directory" label="Loading parent QR directory" />
      </DashboardLayout>
    );
  }

  if (selectedParentId && loading && qrCodes.length === 0) {
    return (
      <DashboardLayout role="admin">
        <AdminPageSkeleton variant="qr-codes" label="Loading parent QR codes" />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="admin">
      <style>{ADMIN_QR_CSS}</style>
      <div className="pz-qr-page">
        <div className="pz-qr-header">
          <div>
            <div className="pz-qr-kicker">School Admin</div>
            <h1 className="pz-qr-title">QR Codes</h1>
            <div className="pz-qr-subtitle">
              {selectedParent
                ? `Manage pickup QR access for ${selectedParentName}.`
                : "Select a parent to view their primary, second-parent, and guardian QR codes."}
            </div>
          </div>
          <div className="pz-qr-header-actions">
            <div className="pz-qr-date-pill">
              <CalendarDays size={15} aria-hidden="true" />
              {todayLabel()}
            </div>
            <button
              type="button"
              className="pz-qr-button"
              onClick={() => (selectedParentId ? fetchData(selectedParentId) : fetchParents())}
              disabled={selectedParentId ? loading : parentsLoading}
            >
              {(selectedParentId ? loading : parentsLoading) ? (
                <LoadingSpinner size="xs" className="pz-loading-inline" />
              ) : (
                <RefreshCw size={15} aria-hidden="true" />
              )}
              Refresh
            </button>
          </div>
        </div>

        {!selectedParent ? (
          <section className="pz-qr-parent-panel">
            <div className="pz-qr-parent-directory-head">
              <div>
                <div className="pz-qr-card-title">Parents</div>
                <div className="pz-qr-card-subtitle">
                  {parentsLoading
                    ? "Loading parent accounts..."
                    : `${filteredParents.length} of ${parents.length} parent${parents.length === 1 ? "" : "s"} shown.`}
                </div>
              </div>
              <label className="pz-qr-parent-search">
                <Search size={15} aria-hidden="true" />
                <input
                  type="search"
                  value={parentSearch}
                  onChange={(event) => setParentSearch(event.target.value)}
                  placeholder="Search parent by name, email, or phone..."
                  aria-label="Search parents"
                />
              </label>
            </div>

            {parentsLoading ? (
              <div className="pz-qr-empty">
                <LoadingSpinner size="lg" label="Loading parents" />
              </div>
            ) : filteredParents.length ? (
              <div className="pz-qr-parent-list">
                {filteredParents.map((parent) => (
                  <button
                    type="button"
                    className="pz-qr-parent-card"
                    key={parent.id}
                    onClick={() => setSelectedParentId(parent.id)}
                  >
                    <div className="pz-qr-parent-avatar">
                      <UserRound size={19} aria-hidden="true" />
                    </div>
                    <div className="pz-qr-parent-copy">
                      <div className="pz-qr-parent-name" title={parentFullName(parent)}>
                        {parentFullName(parent)}
                      </div>
                      <div className="pz-qr-parent-contact">
                        {parent.email && (
                          <span>
                            <Mail size={13} aria-hidden="true" />
                            {parent.email}
                          </span>
                        )}
                        {parent.phone && (
                          <span>
                            <Phone size={13} aria-hidden="true" />
                            {parent.phone}
                          </span>
                        )}
                        {parent.status && <span>Status: {parent.status}</span>}
                      </div>
                    </div>
                    <div className="pz-qr-parent-action">View QR Codes</div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="pz-qr-empty">
                <div className="pz-qr-empty-icon">
                  <Search size={22} aria-hidden="true" />
                </div>
                <strong>{parentSearch.trim() ? "No parents match this search." : "No parent accounts available."}</strong>
                <span>
                  {parentSearch.trim()
                    ? "Try another name, email address, or phone number."
                    : "Parent accounts will appear here after they are registered for this school."}
                </span>
              </div>
            )}
          </section>
        ) : (
          <>
            <div className="pz-qr-stat-grid">
              {statCards.map((stat) => {
                const Icon = stat.icon;
                return (
                  <div
                    className="pz-qr-stat-card"
                    key={stat.label}
                    style={{ "--stat-glow": stat.glow } as CSSProperties}
                  >
                    <div className="pz-qr-stat-top">
                      <div className="pz-qr-stat-label">{stat.label}</div>
                      <div className="pz-qr-stat-icon" style={stat.tone}>
                        <Icon size={19} strokeWidth={2.4} aria-hidden="true" />
                      </div>
                    </div>
                    <div className="pz-qr-stat-value">{stat.value}</div>
                    <div className="pz-qr-stat-helper">
                      <CheckCircle2 size={14} aria-hidden="true" />
                      <span>{stat.helper}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pz-qr-controls">
              <div className="pz-qr-toolbar">
                <div className="pz-qr-selected-parent">
                  <button type="button" className="pz-qr-button" onClick={() => setSelectedParentId(null)}>
                    <ArrowLeft size={15} aria-hidden="true" />
                    Back to Parents
                  </button>
                  <div className="pz-qr-selected-parent-copy">
                    <div className="pz-qr-selected-parent-name">{selectedParentName}</div>
                    <div className="pz-qr-selected-parent-meta">
                      {[selectedParent.email, selectedParent.phone].filter(Boolean).join(" - ") || "Selected parent account"}
                    </div>
                  </div>
                </div>

                <div className="pz-qr-tabs" aria-label="QR owner filters">
                  {tabOptions.map((tab) => (
                    <button
                      type="button"
                      key={tab.key}
                      className={`pz-qr-tab ${activeTab === tab.key ? "active" : ""}`}
                      onClick={() => setActiveTab(tab.key)}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="pz-qr-grid">
              <section className="pz-qr-main">
                <div className="pz-qr-card-header">
                  <div>
                    <div className="pz-qr-card-title">{activeTabLabel} QR Inventory</div>
                    <div className="pz-qr-card-subtitle">
                      {loading
                        ? "Loading QR records..."
                        : `${filteredQRCodes.length} code${filteredQRCodes.length === 1 ? "" : "s"} shown for ${selectedParentName}.`}
                    </div>
                  </div>
                  <span className="pz-qr-badge">
                    <span className="pz-qr-dot" />
                    Selected parent
                  </span>
                </div>

                {loading ? (
                  <div className="pz-qr-empty">
                    <LoadingSpinner size="lg" label="Loading QR codes" />
                  </div>
                ) : filteredQRCodes.length ? (
                  <div className="pz-qr-list">
                    {filteredQRCodes.map((qr, index) => (
                      <article className="pz-qr-card" key={qr.id || `${qr.file}-${index}`}>
                        <div className="pz-qr-visual">
                          <div className="pz-qr-svg-wrap">
                            <QRCodeSVG value={qr.qr_code || ""} size={150} />
                          </div>
                        </div>
                        <div className="pz-qr-info">
                          <div className="pz-qr-child">{childrenMap[qr.child_id] || qr.child || "Student"}</div>
                          <span className="pz-qr-meta">
                            <span className="pz-qr-dot" />
                            {qrOwnerLabel(qr)} QR v{qr.token_version || 1}
                          </span>
                          <div className="pz-qr-actions">
                            <button
                              type="button"
                              onClick={() => downloadQRCode(qr.file.split("/").pop() || "")}
                              className="pz-qr-button primary"
                            >
                              <Download size={15} aria-hidden="true" />
                              Download
                            </button>
                            <button
                              type="button"
                              onClick={() => revokeQRCode(qr)}
                              className="pz-qr-button danger"
                              disabled={revokingId === qr.id}
                            >
                              {revokingId === qr.id ? (
                                <LoadingSpinner size="xs" className="pz-loading-inline" />
                              ) : (
                                <ShieldOff size={15} aria-hidden="true" />
                              )}
                              Revoke
                            </button>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className="pz-qr-empty">
                    <div className="pz-qr-empty-icon">
                      <Search size={22} aria-hidden="true" />
                    </div>
                    <strong>No QR codes available in this tab.</strong>
                    <span>Switch owner tabs or return to the parent list.</span>
                  </div>
                )}
              </section>

              <aside className="pz-qr-side">
                <div className="pz-qr-card-header">
                  <div>
                    <div className="pz-qr-card-title">QR Coverage</div>
                    <div className="pz-qr-card-subtitle">Selected parent access snapshot</div>
                  </div>
                  <span className="pz-qr-badge">
                    <QrCode size={13} aria-hidden="true" />
                    Live
                  </span>
                </div>

                <div className="pz-qr-side-section">
                  <div className="pz-qr-meter-row">
                    <div className="pz-qr-meter" style={{ "--meter-angle": `${coverage * 3.6}deg` } as CSSProperties}>
                      <span>{coverage}%</span>
                    </div>
                    <div className="pz-qr-copy">
                      <strong>{qrCodes.length}</strong> total QR records across <strong>{uniqueChildren}</strong> students for this parent.
                    </div>
                  </div>
                </div>

                <div className="pz-qr-side-section">
                  <div className="pz-qr-side-title">Selected Parent</div>
                  <div className="pz-qr-mini-item">
                    <div className="pz-qr-mini-icon">
                      <UserRound size={16} aria-hidden="true" />
                    </div>
                    <div>
                      <div className="pz-qr-mini-title">{selectedParentName}</div>
                      <div className="pz-qr-mini-sub">QR records are limited to this parent account</div>
                    </div>
                  </div>
                </div>

                <div className="pz-qr-side-section">
                  <div className="pz-qr-side-title">Owner Breakdown</div>
                  <div className="pz-qr-mini-list">
                    <div className="pz-qr-mini-item">
                      <div className="pz-qr-mini-icon" style={{ background: "#1A9E75" }}>
                        <UserRound size={16} aria-hidden="true" />
                      </div>
                      <div>
                        <div className="pz-qr-mini-title">{parentQRs} primary parent codes</div>
                        <div className="pz-qr-mini-sub">Primary access records</div>
                      </div>
                    </div>
                    <div className="pz-qr-mini-item">
                      <div className="pz-qr-mini-icon" style={{ background: "#0B2E5A" }}>
                        <UsersRound size={16} aria-hidden="true" />
                      </div>
                      <div>
                        <div className="pz-qr-mini-title">{secondParentQRs} second parent codes</div>
                        <div className="pz-qr-mini-sub">Secondary parent access records</div>
                      </div>
                    </div>
                    <div className="pz-qr-mini-item">
                      <div className="pz-qr-mini-icon" style={{ background: "#EF9F27" }}>
                        <ShieldCheck size={16} aria-hidden="true" />
                      </div>
                      <div>
                        <div className="pz-qr-mini-title">{guardianQRs} guardian codes</div>
                        <div className="pz-qr-mini-sub">Delegated access records</div>
                      </div>
                    </div>
                  </div>
                </div>
              </aside>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
