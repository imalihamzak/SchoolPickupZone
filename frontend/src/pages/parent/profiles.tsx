import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import axios from "axios";
import {
  Baby,
  CalendarDays,
  CheckCircle2,
  FileCheck2,
  FileUp,
  Plus,
  RefreshCw,
  ShieldCheck,
  UploadCloud,
  UserRoundCheck,
  UsersRound,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import DashboardLayout from "@/components/layouts/dashboard-layout";
import { toast } from "@/components/ui/toast";
import ChildrenView from "./components/ChildrenView";
import GuardiansView from "./components/GuardiansView";
import DocumentsView from "./components/DocumentsView";
import AddChildForm from "./components/AddChildForm";
import AddGuardianForm from "./components/AddGuardianForm";
import UploadDocumentForm from "./components/UploadDocumentForm";
import { API_BASE_URL } from "@/lib/api/link";
import { isQuietEmptyStateError } from "@/lib/api/quietEmptyState";
import {
  REQUIRED_DOCUMENT_TYPES,
  type DocumentVerificationStatus,
} from "@/lib/documentVerification";

const PARENT_PROFILES_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Inter:wght@400;500;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,300&display=swap');

.pz-family-profiles {
  --navy: #071D3B;
  --navy-mid: #0B2E5A;
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
  min-height: calc(100vh - 8rem);
  color: var(--text-1);
  font-family: 'DM Sans', "Segoe UI", Arial, sans-serif;
}

.pz-family-profiles,
.pz-family-profiles * {
  box-sizing: border-box;
}

.pz-family-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 18px;
  margin-bottom: 22px;
}

.pz-family-kicker {
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

.pz-family-kicker::before {
  content: "";
  width: 18px;
  height: 2px;
  border-radius: 999px;
  background: var(--teal);
}

.pz-family-title {
  font-family: 'Inter', sans-serif;
  font-size: clamp(28px, 3.2vw, 42px);
  line-height: 1.04;
  letter-spacing: -0.025em;
  font-weight: 700;
  color: var(--text-1);
  margin: 0;
}

.pz-family-subtitle {
  color: var(--text-3);
  font-size: 14px;
  margin-top: 8px;
}

.pz-family-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  flex-wrap: wrap;
}

.pz-family-button,
.pz-family-date-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 38px;
  border-radius: 10px;
  padding: 0 14px;
  font-family: 'DM Sans', sans-serif;
  font-size: 13px;
  font-weight: 800;
  white-space: nowrap;
}

.pz-family-button {
  border: 1px solid var(--border);
  background: var(--white);
  color: var(--text-2);
  cursor: pointer;
  transition: all 0.18s ease;
}

.pz-family-button:hover:not(:disabled) {
  border-color: rgba(27,110,204,0.36);
  background: #EFF6FF;
  color: var(--blue);
}

.pz-family-button.primary {
  border-color: var(--teal);
  background: var(--teal);
  color: var(--white);
}

.pz-family-button.primary:hover:not(:disabled) {
  border-color: var(--teal-light);
  background: var(--teal-light);
  color: var(--white);
}

.pz-family-button:disabled {
  cursor: not-allowed;
  opacity: 0.58;
}

.pz-family-date-pill {
  background: var(--white);
  border: 1px solid var(--border);
  color: var(--text-2);
  box-shadow: var(--shadow-sm);
}

.pz-family-command {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(280px, 0.42fr);
  gap: 16px;
  margin-bottom: 18px;
}

.pz-family-hero {
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: var(--radius);
  background:
    radial-gradient(circle at 8% 0%, rgba(45,201,143,0.18), transparent 32%),
    radial-gradient(circle at 100% 100%, rgba(27,110,204,0.18), transparent 36%),
    var(--navy);
  color: var(--white);
  padding: 22px;
  overflow: hidden;
  position: relative;
  min-height: 174px;
}

.pz-family-hero::after {
  content: "";
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px);
  background-size: 36px 36px;
  pointer-events: none;
}

.pz-family-hero-content {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 24px;
  min-height: 130px;
}

.pz-family-hero-title {
  font-family: 'Inter', sans-serif;
  font-size: clamp(24px, 2.4vw, 34px);
  line-height: 1.08;
  letter-spacing: -0.025em;
  font-weight: 700;
  max-width: 620px;
}

.pz-family-hero-title span {
  color: var(--teal-light);
}

.pz-family-hero-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.pz-family-pill {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  border-radius: 999px;
  padding: 5px 10px;
  background: rgba(255,255,255,0.08);
  color: rgba(255,255,255,0.78);
  font-size: 12px;
  font-weight: 700;
}

.pz-family-side-panel,
.pz-family-card {
  background: var(--white);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
}

.pz-family-side-panel {
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.pz-family-side-title,
.pz-family-card-title {
  font-family: 'Inter', sans-serif;
  color: var(--text-1);
  letter-spacing: -0.025em;
  font-weight: 700;
}

.pz-family-side-title {
  font-size: 15px;
}

.pz-family-readiness {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.pz-family-readiness-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 10px 12px;
  color: var(--text-2);
  font-size: 13px;
  font-weight: 700;
}

.pz-family-readiness-state {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--text-3);
  font-size: 12px;
  font-weight: 800;
}

.pz-family-readiness-state.ready {
  color: var(--teal);
}

.pz-family-readiness-state.missing {
  color: var(--amber);
}

.pz-family-stat-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
  margin-bottom: 18px;
}

.pz-family-stat {
  min-height: 142px;
  background: var(--white);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 20px 22px;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: 14px;
  transition: box-shadow 0.2s ease, transform 0.2s ease;
}

.pz-family-stat::after {
  content: "";
  position: absolute;
  inset: auto -38px -70px auto;
  width: 148px;
  height: 148px;
  border-radius: 50%;
  background: radial-gradient(circle, var(--accent-glow) 0%, transparent 65%);
  pointer-events: none;
}

.pz-family-stat:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.pz-family-stat-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
}

.pz-family-stat-label {
  color: var(--text-3);
  font-size: 12px;
  font-weight: 700;
}

.pz-family-stat-icon {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.pz-family-stat-icon svg {
  width: 19px;
  height: 19px;
  stroke-width: 2.4;
}

.pz-family-stat-value {
  font-family: 'Inter', 'Segoe UI', Arial, sans-serif;
  font-size: 34px;
  font-weight: 700;
  letter-spacing: 0;
  line-height: 1;
  color: var(--text-1);
  font-variant-numeric: tabular-nums;
}

.pz-family-stat-footer {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--text-3);
  font-size: 12px;
}

.pz-family-stat-footer svg {
  width: 14px;
  height: 14px;
  color: var(--teal);
}

.pz-family-main-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(280px, 0.32fr);
  gap: 16px;
  align-items: start;
}

.pz-family-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 18px 22px;
  border-bottom: 1px solid var(--border);
}

.pz-family-card-title {
  font-size: 16px;
}

.pz-family-card-subtitle {
  color: var(--text-3);
  font-size: 13px;
  margin-top: 4px;
}

.pz-family-tabs {
  display: flex;
  gap: 4px;
  background: var(--surface);
  border-radius: 10px;
  padding: 4px;
  flex-wrap: nowrap;
  white-space: nowrap;
}

.pz-family-tab {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  flex: 0 0 auto;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: var(--text-3);
  cursor: pointer;
  font-family: 'DM Sans', sans-serif;
  font-size: 12px;
  font-weight: 800;
  min-height: 32px;
  padding: 0 12px;
  transition: all 0.18s ease;
}

.pz-family-tab.active {
  background: var(--white);
  color: var(--text-1);
  box-shadow: var(--shadow-sm);
}

.pz-family-tab-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  border-radius: 999px;
  background: var(--surface-2);
  color: var(--text-2);
  font-size: 11px;
}

.pz-family-tab.active .pz-family-tab-count {
  background: var(--teal-pale);
  color: var(--teal);
}

.pz-family-workspace-body {
  padding: 20px 22px 22px;
}

.pz-family-aside {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.pz-family-mini-list {
  display: flex;
  flex-direction: column;
}

.pz-family-mini-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 0;
  border-bottom: 1px solid var(--border);
}

.pz-family-mini-row:last-child {
  border-bottom: 0;
}

.pz-family-mini-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: var(--teal-pale);
  color: var(--teal);
}

.pz-family-mini-main {
  min-width: 0;
  flex: 1;
}

.pz-family-mini-title {
  color: var(--text-1);
  font-size: 13px;
  font-weight: 800;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pz-family-mini-copy {
  color: var(--text-3);
  font-size: 12px;
  margin-top: 3px;
  line-height: 1.45;
}

.pz-family-empty {
  color: var(--text-3);
  font-size: 13px;
  padding: 18px 0 4px;
}

.pz-family-workspace-body > .space-y-6 > h2 {
  display: none;
}

.pz-family-workspace-body .bg-white.border.rounded-xl.shadow-sm.overflow-hidden {
  border-color: var(--border);
  border-radius: var(--radius);
  box-shadow: none;
}

.pz-family-workspace-body .bg-white.border.rounded-xl.shadow-sm.overflow-hidden:hover {
  box-shadow: var(--shadow-md);
}

.pz-family-workspace-body .text-lg.font-medium.text-gray-900 {
  font-family: 'DM Sans', sans-serif;
  font-size: 15px;
  font-weight: 800;
  letter-spacing: 0;
}

.pz-family-workspace-body .text-sm.text-gray-500,
.pz-family-workspace-body .text-gray-500 {
  color: var(--text-3);
}

.pz-family-workspace-body .bg-blue-600 {
  background: var(--teal) !important;
}

.pz-family-workspace-body .hover\\:bg-blue-700:hover {
  background: var(--teal-light) !important;
}

.pz-family-workspace-body .bg-blue-100,
.pz-family-workspace-body .bg-purple-100 {
  background: var(--teal-pale) !important;
}

.pz-family-workspace-body .text-blue-600,
.pz-family-workspace-body .text-purple-600 {
  color: var(--teal) !important;
}

.pz-family-workspace-body table {
  border-collapse: collapse;
}

.pz-family-workspace-body thead th {
  background: var(--surface);
  color: var(--text-3);
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.06em;
}

.pz-family-workspace-body tbody td {
  color: var(--text-2);
}

@media (max-width: 1180px) {
  .pz-family-command,
  .pz-family-main-grid {
    grid-template-columns: 1fr;
  }
  .pz-family-stat-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 760px) {
  .pz-family-profiles {
    min-height: auto;
  }
  .pz-family-head,
  .pz-family-card-header {
    align-items: flex-start;
    flex-direction: column;
  }
  .pz-family-actions {
    justify-content: flex-start;
    width: 100%;
  }
  .pz-family-button,
  .pz-family-date-pill {
    width: 100%;
  }
  .pz-family-hero,
  .pz-family-side-panel,
  .pz-family-workspace-body {
    padding: 16px;
  }
  .pz-family-stat-grid {
    grid-template-columns: 1fr;
  }
  .pz-family-tabs,
  .pz-family-tab {
    width: 100%;
  }
  .pz-family-tabs {
    flex-wrap: wrap;
  }
}
`;

type ProfileTab = "children" | "guardians" | "documents";

type ProfileDocument = {
  id: string;
  type: string;
  childId?: string;
  childName?: string;
  fileName: string;
  filePath?: string;
  url?: string;
  uploadDate: string;
  status: string;
  required: boolean;
  rejectionReason?: string | null;
};

type ProfileStat = {
  label: string;
  value: string | number;
  helper: string;
  icon: LucideIcon;
  iconTone: CSSProperties;
  glow: string;
};

const requiredDocumentTypes = REQUIRED_DOCUMENT_TYPES;

const tabs: Array<{ id: ProfileTab; label: string; icon: LucideIcon }> = [
  { id: "children", label: "Children", icon: Baby },
  { id: "guardians", label: "Guardians", icon: UsersRound },
  { id: "documents", label: "Documents", icon: FileCheck2 },
];

export default function ParentProfiles() {
  const [activeTab, setActiveTab] = useState<ProfileTab>("children");
  const [addChildModalOpen, setAddChildModalOpen] = useState(false);
  const [addGuardianModalOpen, setAddGuardianModalOpen] = useState(false);
  const [uploadDocumentModalOpen, setUploadDocumentModalOpen] = useState(false);
  const [allDocuments, setAllDocuments] = useState<ProfileDocument[]>([]);
  const [documentVerification, setDocumentVerification] = useState<DocumentVerificationStatus | null>(null);
  const [pickupLogs, setPickupLogs] = useState<any[]>([]);
  const [children, setChildren] = useState<any[]>([]);
  const [guardians, setGuardians] = useState<any[]>([]);

  const fetchPickupLogs = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_BASE_URL}/pickups`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPickupLogs(Array.isArray(res.data) ? res.data : []);
    } catch (err: any) {
      if (isQuietEmptyStateError(err)) {
        setPickupLogs([]);
        return;
      }
      toast.error(err.response?.data?.error || "Failed to fetch pickup logs");
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

  const fetchGuardians = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_BASE_URL}/guardians`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setGuardians(Array.isArray(res.data) ? res.data : []);
    } catch (err: any) {
      if (isQuietEmptyStateError(err)) {
        setGuardians([]);
        return;
      }
      toast.error(err.response?.data?.error || "Failed to fetch guardians");
    }
  };

  const fetchDocuments = async () => {
    try {
      const token = localStorage.getItem("token");
      const [documentsRes, verificationRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/documents`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${API_BASE_URL}/documents/verification-status`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      setAllDocuments(Array.isArray(documentsRes.data) ? documentsRes.data : []);
      setDocumentVerification(verificationRes.data || null);
    } catch (err: any) {
      if (isQuietEmptyStateError(err)) {
        setAllDocuments([]);
        setDocumentVerification(null);
        return;
      }
      toast.error(err.response?.data?.error || "Failed to fetch documents");
    }
  };

  const refreshProfiles = () => {
    fetchChildren();
    fetchGuardians();
    fetchPickupLogs();
    fetchDocuments();
  };

  useEffect(() => {
    refreshProfiles();
  }, []);

  const requiredDocumentsStatus = useMemo(
    () =>
      documentVerification?.required?.length
        ? documentVerification.required.map((item) => ({
            type: item.childName ? `${item.label} (${item.childName})` : item.label,
            uploaded: item.approved,
          }))
        : requiredDocumentTypes.map((type) => ({ type, uploaded: false })),
    [documentVerification]
  );

  const missingRequiredDocuments = documentVerification
    ? documentVerification.summary.total - documentVerification.summary.approved
    : requiredDocumentsStatus.filter((doc) => !doc.uploaded).length;
  const verifiedDocuments = allDocuments.filter((doc) =>
    ["approved", "verified"].includes(String(doc.status || "").toLowerCase())
  ).length;

  const activeGuardians = useMemo(
    () =>
      guardians.filter((guardian) =>
        String(guardian.status || "").toLowerCase() === "active"
      ).length,
    [guardians]
  );

  const sortedPickupLogs = useMemo(
    () =>
      [...pickupLogs].sort((a, b) => {
        const aTime = new Date(a.pickup_time || a.created_at || 0).getTime();
        const bTime = new Date(b.pickup_time || b.created_at || 0).getTime();
        return bTime - aTime;
      }),
    [pickupLogs]
  );

  const profileStats = useMemo<ProfileStat[]>(
    () => [
      {
        label: "Children",
        value: children.length,
        helper: "Student profiles connected",
        icon: Baby,
        iconTone: { background: "#EFF6FF", color: "#1B6ECC" },
        glow: "rgba(27,110,204,0.16)",
      },
      {
        label: "Guardians",
        value: guardians.length,
        helper: `${activeGuardians} active pickup contacts`,
        icon: UserRoundCheck,
        iconTone: { background: "#E1F5EE", color: "#1A9E75" },
        glow: "rgba(26,158,117,0.16)",
      },
      {
        label: "Documents",
        value: allDocuments.length,
        helper: `${verifiedDocuments} verified records`,
        icon: FileCheck2,
        iconTone: { background: "#FEF3DC", color: "#EF9F27" },
        glow: "rgba(239,159,39,0.16)",
      },
      {
        label: "Pickup History",
        value: pickupLogs.length,
        helper: "Events loaded for this family",
        icon: ShieldCheck,
        iconTone: { background: "#F4F6FA", color: "#0B2E5A" },
        glow: "rgba(7,29,59,0.14)",
      },
    ],
    [activeGuardians, allDocuments.length, children.length, guardians.length, pickupLogs.length, verifiedDocuments]
  );

  const tabCounts: Record<ProfileTab, number> = {
    children: children.length,
    guardians: guardians.length,
    documents: allDocuments.length,
  };

  const activeAction = useMemo(() => {
    if (activeTab === "children") {
      return {
        label: "Add Child",
        icon: Plus,
        disabled: false,
        onClick: () => setAddChildModalOpen(true),
      };
    }

    if (activeTab === "guardians") {
      return {
        label: guardians.length >= 2 ? "Guardian limit reached" : "Add Guardian",
        icon: Plus,
        disabled: guardians.length >= 2,
        onClick: () => setAddGuardianModalOpen(true),
      };
    }

    return {
      label: "Upload Document",
      icon: UploadCloud,
      disabled: false,
      onClick: () => setUploadDocumentModalOpen(true),
    };
  }, [activeTab, guardians.length]);

  const ActiveActionIcon = activeAction.icon;

  return (
    <DashboardLayout role="parent">
      <style>{PARENT_PROFILES_CSS}</style>
      <div className="pz-family-profiles">
        <header className="pz-family-head">
          <div>
            <div className="pz-family-kicker">Parent Portal</div>
            <h1 className="pz-family-title">Family Profiles</h1>
            <div className="pz-family-subtitle">
              Manage children, authorized guardians, and pickup documents from one focused workspace.
            </div>
          </div>
          <div className="pz-family-actions">
            <div className="pz-family-date-pill">
              <CalendarDays size={15} aria-hidden="true" />
              {new Date().toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
              })}
            </div>
            <button type="button" className="pz-family-button" onClick={refreshProfiles}>
              <RefreshCw size={15} aria-hidden="true" />
              Refresh
            </button>
            <button
              type="button"
              className="pz-family-button primary"
              onClick={activeAction.onClick}
              disabled={activeAction.disabled}
            >
              <ActiveActionIcon size={15} aria-hidden="true" />
              {activeAction.label}
            </button>
          </div>
        </header>

        <section className="pz-family-stat-grid" aria-label="Family profile stats">
          {profileStats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                className="pz-family-stat"
                key={stat.label}
                style={{ "--accent-glow": stat.glow } as CSSProperties}
              >
                <div className="pz-family-stat-top">
                  <div className="pz-family-stat-label">{stat.label}</div>
                  <div className="pz-family-stat-icon" style={stat.iconTone}>
                    <Icon aria-hidden="true" />
                  </div>
                </div>
                <div className="pz-family-stat-value">{stat.value}</div>
                <div className="pz-family-stat-footer">
                  <CheckCircle2 aria-hidden="true" />
                  <span>{stat.helper}</span>
                </div>
              </div>
            );
          })}
        </section>

        <div className="pz-family-main-grid">
          <section className="pz-family-card">
            <div className="pz-family-card-header">
              <div>
                <div className="pz-family-card-title">Profile Workspace</div>
                <div className="pz-family-card-subtitle">
                  Add, update, review, and remove family pickup records.
                </div>
              </div>
              <div className="pz-family-tabs" role="tablist" aria-label="Family profile tabs">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      role="tab"
                      aria-selected={activeTab === tab.id}
                      className={`pz-family-tab ${activeTab === tab.id ? "active" : ""}`}
                      onClick={() => setActiveTab(tab.id)}
                    >
                      <Icon size={14} aria-hidden="true" />
                      {tab.label}
                      <span className="pz-family-tab-count">{tabCounts[tab.id]}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pz-family-workspace-body">
              {activeTab === "children" && (
                <ChildrenView children={children} pickupLogs={pickupLogs} onUpdate={fetchChildren} />
              )}

              {activeTab === "guardians" && (
                <GuardiansView guardians={guardians} onUpdate={fetchGuardians} />
              )}

              {activeTab === "documents" && (
                <DocumentsView
                  documents={allDocuments}
                  requiredTypes={requiredDocumentTypes}
                  verificationStatus={documentVerification || undefined}
                  onRefresh={fetchDocuments}
                />
              )}
            </div>
          </section>

          <aside className="pz-family-aside">
            <section className="pz-family-card">
              <div className="pz-family-card-header">
                <div>
                  <div className="pz-family-card-title">Access Summary</div>
                  <div className="pz-family-card-subtitle">Current family pickup coverage.</div>
                </div>
              </div>
              <div className="pz-family-workspace-body">
                <div className="pz-family-mini-list">
                  <div className="pz-family-mini-row">
                    <div className="pz-family-mini-icon">
                      <Baby size={17} aria-hidden="true" />
                    </div>
                    <div className="pz-family-mini-main">
                      <div className="pz-family-mini-title">Student profiles</div>
                      <div className="pz-family-mini-copy">{children.length} children connected to pickup access.</div>
                    </div>
                  </div>
                  <div className="pz-family-mini-row">
                    <div className="pz-family-mini-icon">
                      <UsersRound size={17} aria-hidden="true" />
                    </div>
                    <div className="pz-family-mini-main">
                      <div className="pz-family-mini-title">Guardian capacity</div>
                      <div className="pz-family-mini-copy">
                        {guardians.length}/2 guardian slots used, {activeGuardians} active.
                      </div>
                    </div>
                  </div>
                  <div className="pz-family-mini-row">
                    <div className="pz-family-mini-icon">
                      <FileCheck2 size={17} aria-hidden="true" />
                    </div>
                    <div className="pz-family-mini-main">
                      <div className="pz-family-mini-title">Required documents</div>
                      <div className="pz-family-mini-copy">
                        {missingRequiredDocuments === 0
                          ? "All required records are approved."
                          : `${missingRequiredDocuments} required approval${missingRequiredDocuments === 1 ? "" : "s"} remaining.`}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="pz-family-card">
              <div className="pz-family-card-header">
                <div>
                  <div className="pz-family-card-title">Recent Pickup Logs</div>
                  <div className="pz-family-card-subtitle">Latest family verification events.</div>
                </div>
              </div>
              <div className="pz-family-workspace-body">
                {sortedPickupLogs.length ? (
                  <div className="pz-family-mini-list">
                    {sortedPickupLogs.slice(0, 4).map((log) => (
                      <div className="pz-family-mini-row" key={log.id ?? `${log.child_id}-${log.pickup_time}`}>
                        <div className="pz-family-mini-icon">
                          <ShieldCheck size={17} aria-hidden="true" />
                        </div>
                        <div className="pz-family-mini-main">
                          <div className="pz-family-mini-title">
                            {log.child_name || log.student_name || "Pickup event"}
                          </div>
                          <div className="pz-family-mini-copy">
                            {formatDateTime(log.pickup_time || log.created_at)} - {log.status || "Recorded"}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="pz-family-empty">No pickup logs loaded yet.</div>
                )}
              </div>
            </section>
          </aside>
        </div>
      </div>

      {addChildModalOpen && (
        <AddChildForm
          isOpen={addChildModalOpen}
          onClose={() => setAddChildModalOpen(false)}
          onSuccess={() => {
            fetchChildren();
            fetchDocuments();
          }}
        />
      )}

      {addGuardianModalOpen && (
        <AddGuardianForm
          isOpen={addGuardianModalOpen}
          onClose={() => setAddGuardianModalOpen(false)}
          onSubmit={fetchGuardians}
        />
      )}

      {uploadDocumentModalOpen && (
        <UploadDocumentForm
          isOpen={uploadDocumentModalOpen}
          onClose={() => setUploadDocumentModalOpen(false)}
          onUploadSuccess={fetchDocuments}
          requiredTypes={requiredDocumentTypes}
          existingDocuments={allDocuments}
          children={children}
        />
      )}
    </DashboardLayout>
  );
}

function formatDateTime(value?: string) {
  if (!value) return "No time recorded";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "No time recorded";
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
