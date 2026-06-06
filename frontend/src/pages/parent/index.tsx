import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import {
  Activity,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileUp,
  MessageSquareText,
  Plus,
  QrCode,
  ShieldCheck,
  UserRound,
  UsersRound,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import DashboardLayout from "@/components/layouts/dashboard-layout";
import { toast } from "@/components/ui/toast";
import { API_BASE_URL, LOCAL_BASE } from "@/lib/api/link";
import { isQuietEmptyStateError } from "@/lib/api/quietEmptyState";
import ChildrenView from "./components/ChildrenView";
import GuardiansView from "./components/GuardiansView";
import AddChildForm from "./components/AddChildForm";
import AddGuardianForm from "./components/AddGuardianForm";
import ActivitySummary from "./components/ActivitySummary";
import ParentPickupMessageModal from "./components/ParentPickupMessageModal";
import UploadDocumentForm from "./components/UploadDocumentForm";
import { REQUIRED_DOCUMENT_TYPES } from "@/lib/documentVerification";

type DashboardDocument = {
  id: string;
  type: string;
  childId?: string | number | null;
  fileName?: string;
  status?: string;
  required?: boolean;
};

const PARENT_DASHBOARD_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Inter:wght@400;500;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,300&display=swap');

.pz-parent-dashboard {
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
  background: var(--surface);
  color: var(--text-1);
  font-family: 'DM Sans', "Segoe UI", Arial, sans-serif;
}

.pz-parent-dashboard,
.pz-parent-dashboard * {
  box-sizing: border-box;
}

.pz-parent-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 18px;
  margin-bottom: 24px;
}

.pz-parent-kicker {
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

.pz-parent-kicker::before {
  content: "";
  width: 18px;
  height: 2px;
  border-radius: 999px;
  background: var(--teal);
}

.pz-parent-title {
  font-family: 'Inter', sans-serif;
  font-size: clamp(28px, 3.2vw, 42px);
  line-height: 1.04;
  letter-spacing: -0.025em;
  font-weight: 700;
  color: var(--text-1);
  margin: 0;
}

.pz-parent-subtitle {
  color: var(--text-3);
  font-size: 14px;
  margin-top: 8px;
}

.pz-parent-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  flex-wrap: wrap;
}

.pz-parent-date-pill,
.pz-parent-button {
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

.pz-parent-date-pill {
  background: var(--white);
  border: 1px solid var(--border);
  color: var(--text-2);
  box-shadow: var(--shadow-sm);
}

.pz-parent-button {
  border: 1px solid var(--border);
  background: var(--white);
  color: var(--text-2);
  cursor: pointer;
  text-decoration: none;
  transition: all 0.18s ease;
}

.pz-parent-button:hover {
  border-color: rgba(27,110,204,0.36);
  background: #EFF6FF;
  color: var(--blue);
}

.pz-parent-button:disabled {
  cursor: not-allowed;
  opacity: 0.62;
}

.pz-parent-button.primary {
  border-color: var(--teal);
  background: var(--teal);
  color: var(--white);
}

.pz-parent-button.primary:hover {
  border-color: var(--teal-light);
  background: var(--teal-light);
  color: var(--white);
}

.pz-parent-kpi-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
  margin-bottom: 18px;
}

.pz-parent-kpi-card {
  background: var(--white);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 20px 22px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-height: 142px;
  position: relative;
  overflow: hidden;
  transition: box-shadow 0.2s ease, transform 0.2s ease;
}

.pz-parent-kpi-card::after {
  content: "";
  position: absolute;
  inset: auto -40px -70px auto;
  width: 150px;
  height: 150px;
  border-radius: 50%;
  background: radial-gradient(circle, var(--accent-glow) 0%, transparent 65%);
  pointer-events: none;
}

.pz-parent-kpi-card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.pz-parent-kpi-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
}

.pz-parent-kpi-label {
  color: var(--text-3);
  font-size: 12px;
  font-weight: 600;
}

.pz-parent-kpi-icon {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.pz-parent-kpi-icon svg {
  width: 19px;
  height: 19px;
  stroke-width: 2.4;
}

.pz-parent-kpi-value {
  font-family: 'Inter', 'Segoe UI', Arial, sans-serif;
  font-size: 34px;
  font-weight: 700;
  letter-spacing: 0;
  line-height: 1;
  color: var(--text-1);
  font-variant-numeric: tabular-nums;
}

.pz-parent-kpi-footer {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--text-3);
  font-size: 12px;
}

.pz-parent-kpi-footer svg {
  width: 14px;
  height: 14px;
  color: var(--teal);
}

.pz-parent-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(320px, 0.62fr);
  gap: 16px;
  margin-bottom: 18px;
}

.pz-parent-card {
  background: var(--white);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
}

.pz-parent-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 18px 22px;
  border-bottom: 1px solid var(--border);
}

.pz-parent-card-title {
  font-family: 'Inter', sans-serif;
  font-size: 15px;
  font-weight: 700;
  letter-spacing: -0.025em;
  color: var(--text-1);
  line-height: 1.08;
}

.pz-parent-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: 800;
  padding: 4px 10px;
  border-radius: 999px;
  white-space: nowrap;
}

.pz-parent-badge.green {
  background: var(--teal-pale);
  color: #065F46;
}

.pz-parent-badge.blue {
  background: #EFF6FF;
  color: #1D4ED8;
}

.pz-parent-badge.amber {
  background: var(--amber-pale);
  color: #92400E;
}

.pz-parent-badge.gray {
  background: var(--surface-2);
  color: var(--text-2);
}

.pz-parent-badge-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}

.pz-parent-list {
  display: flex;
  flex-direction: column;
}

.pz-parent-list-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 22px;
  border-bottom: 1px solid var(--border);
}

.pz-parent-list-item:last-child {
  border-bottom: none;
}

.pz-parent-avatar {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--navy-mid);
  color: var(--white);
  font-size: 12px;
  font-weight: 800;
  flex-shrink: 0;
  overflow: hidden;
}

.pz-parent-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.pz-parent-list-main {
  min-width: 0;
  flex: 1;
}

.pz-parent-list-title {
  color: var(--text-1);
  font-size: 13px;
  font-weight: 800;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pz-parent-list-detail {
  color: var(--text-3);
  font-size: 12px;
  margin-top: 3px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pz-parent-list-time {
  color: var(--text-3);
  font-size: 11px;
  white-space: nowrap;
}

.pz-parent-empty {
  min-height: 180px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-3);
  font-size: 14px;
  text-align: center;
  padding: 28px;
}

.pz-parent-chart-wrap {
  padding: 20px 22px;
}

.pz-parent-chart-wrap .pz-chart-skeleton {
  height: 138px;
}

.pz-parent-bars {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  height: 138px;
}

.pz-parent-bar-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 7px;
  min-width: 0;
}

.pz-parent-bar {
  width: 100%;
  border-radius: 7px 7px 2px 2px;
  background: linear-gradient(180deg, var(--teal-light), var(--teal));
  min-height: 6px;
}

.pz-parent-bar-label {
  color: var(--text-3);
  font-size: 10px;
  white-space: nowrap;
}

.pz-parent-snapshot {
  padding: 4px 0;
}

.pz-parent-tabbar {
  display: flex;
  gap: 4px;
  background: var(--surface);
  border-radius: 10px;
  padding: 4px;
  flex-wrap: wrap;
}

.pz-parent-tab {
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: var(--text-3);
  cursor: pointer;
  font-family: 'DM Sans', sans-serif;
  font-size: 12px;
  font-weight: 800;
  min-height: 30px;
  padding: 0 13px;
  transition: all 0.18s ease;
}

.pz-parent-tab.active {
  background: var(--white);
  color: var(--text-1);
  box-shadow: var(--shadow-sm);
}

.pz-parent-workspace-body {
  padding: 20px 22px 22px;
}

.pz-parent-workspace-body > .space-y-6 > h2 {
  font-family: 'Inter', sans-serif;
  font-size: 16px;
  font-weight: 700;
  letter-spacing: -0.025em;
  color: var(--text-1);
}

.pz-parent-workspace-body .shadow-sm {
  box-shadow: none;
}

.pz-parent-workspace-body .rounded-xl {
  border-radius: var(--radius);
}

@media (max-width: 1180px) {
  .pz-parent-kpi-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .pz-parent-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 760px) {
  .pz-parent-dashboard {
    min-height: auto;
  }
  .pz-parent-header {
    align-items: flex-start;
    flex-direction: column;
  }
  .pz-parent-actions {
    justify-content: flex-start;
    width: 100%;
  }
  .pz-parent-button,
  .pz-parent-date-pill {
    width: 100%;
  }
  .pz-parent-kpi-grid {
    grid-template-columns: 1fr;
  }
  .pz-parent-card-header {
    align-items: flex-start;
    flex-direction: column;
  }
  .pz-parent-workspace-body {
    padding: 16px 14px;
  }
}
`;

type ParentStat = {
  name: string;
  value: string | number;
  helper: string;
  icon: LucideIcon;
  iconTone: CSSProperties;
  glow: string;
};

export default function ParentDashboard() {
  const [children, setChildren] = useState<any[]>([]);
  const [guardians, setGuardians] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [addChildModalOpen, setAddChildModalOpen] = useState(false);
  const [addGuardianModalOpen, setAddGuardianModalOpen] = useState(false);
  const [uploadDocumentModalOpen, setUploadDocumentModalOpen] = useState(false);
  const [pickupMessageModalOpen, setPickupMessageModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("children");
  const [qrCode, setQrCode] = useState<any>(null);
  const [pickupLogs, setPickupLogs] = useState<any[]>([]);
  const [documents, setDocuments] = useState<DashboardDocument[]>([]);
  const [loadingChildren, setLoadingChildren] = useState(true);
  const [loadingGuardians, setLoadingGuardians] = useState(true);
  const [loadingActivities, setLoadingActivities] = useState(true);
  const [loadingPickupLogs, setLoadingPickupLogs] = useState(true);
  const [loadingQrCode, setLoadingQrCode] = useState(true);

  const fetchPickupLogs = async () => {
    setLoadingPickupLogs(true);
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
    } finally {
      setLoadingPickupLogs(false);
    }
  };

  const fetchQRCode = async () => {
    setLoadingQrCode(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_BASE_URL}/qrcode/count`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setQrCode(res.data);
    } catch {
      setQrCode(null);
    } finally {
      setLoadingQrCode(false);
    }
  };

  const fetchChildren = async () => {
    setLoadingChildren(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_BASE_URL}/children`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setChildren(Array.isArray(res.data) ? res.data : []);
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to fetch children");
    } finally {
      setLoadingChildren(false);
    }
  };

  const fetchGuardians = async () => {
    setLoadingGuardians(true);
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
    } finally {
      setLoadingGuardians(false);
    }
  };

  const fetchDocuments = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_BASE_URL}/documents`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDocuments(Array.isArray(res.data) ? res.data : []);
    } catch (err: any) {
      if (isQuietEmptyStateError(err)) {
        setDocuments([]);
        return;
      }
      toast.error(err.response?.data?.error || "Failed to fetch documents");
    }
  };

  const fetchActivities = async () => {
    setLoadingActivities(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_BASE_URL}/pickups`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const mapped = (Array.isArray(res.data) ? res.data : []).map((log: any) => {
        const pickupDate = new Date(log.pickup_time);
        return {
          id: log.id,
          type: "pickup",
          date: isNaN(pickupDate.getTime())
            ? "No date"
            : pickupDate.toLocaleDateString(undefined, {
                year: "numeric",
                month: "short",
                day: "numeric",
              }),
          time: isNaN(pickupDate.getTime())
            ? "No time"
            : pickupDate.toLocaleTimeString(undefined, {
                hour: "2-digit",
                minute: "2-digit",
              }),
          guard: log.guardian_name || log.guard_name || "Authorized guardian",
          status: log.status || "Completed",
        };
      });

      setActivities(mapped);
    } catch (err: any) {
      if (isQuietEmptyStateError(err)) {
        setActivities([]);
        return;
      }
      toast.error(err.response?.data?.error || "Failed to fetch activity logs");
    } finally {
      setLoadingActivities(false);
    }
  };

  useEffect(() => {
    fetchChildren();
    fetchGuardians();
    fetchActivities();
    fetchQRCode();
    fetchPickupLogs();
    fetchDocuments();
  }, []);

  const sortedPickupLogs = useMemo(
    () =>
      [...pickupLogs].sort((a, b) => {
        const aTime = new Date(a.pickup_time || 0).getTime();
        const bTime = new Date(b.pickup_time || 0).getTime();
        return bTime - aTime;
      }),
    [pickupLogs]
  );

  const activeGuardians = useMemo(
    () =>
      guardians.filter((guardian) =>
        String(guardian.status || "").toLowerCase() === "active"
      ).length,
    [guardians]
  );

  const statCards = useMemo<ParentStat[]>(
    () => [
      {
        name: "Children",
        value: children.length,
        helper: "Registered family students",
        icon: UserRound,
        iconTone: { background: "#EFF6FF", color: "#1B6ECC" },
        glow: "rgba(27,110,204,0.16)",
      },
      {
        name: "Guardians",
        value: guardians.length,
        helper: `${activeGuardians} active pickup contacts`,
        icon: UsersRound,
        iconTone: { background: "#E1F5EE", color: "#1A9E75" },
        glow: "rgba(26,158,117,0.16)",
      },
      {
        name: "Active QR Codes",
        value: qrCode?.count ?? 0,
        helper: "Available access codes",
        icon: QrCode,
        iconTone: { background: "#FEF3DC", color: "#EF9F27" },
        glow: "rgba(239,159,39,0.16)",
      },
      {
        name: "Pickup Records",
        value: pickupLogs.length,
        helper: "Loaded from pickup history",
        icon: ShieldCheck,
        iconTone: { background: "#F4F6FA", color: "#0B2E5A" },
        glow: "rgba(7,29,59,0.14)",
      },
    ],
    [activeGuardians, children.length, guardians.length, pickupLogs.length, qrCode?.count]
  );

  const activityByDay = useMemo(() => {
    const buckets = Array.from({ length: 7 }).map((_, index) => {
      const date = new Date();
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() - (6 - index));
      return {
        key: date.toISOString().slice(0, 10),
        label: date.toLocaleDateString("en-US", { weekday: "short" }),
        count: 0,
      };
    });

    sortedPickupLogs.forEach((log) => {
      const date = new Date(log.pickup_time);
      if (isNaN(date.getTime())) return;
      const key = date.toISOString().slice(0, 10);
      const bucket = buckets.find((item) => item.key === key);
      if (bucket) bucket.count += 1;
    });

    return buckets;
  }, [sortedPickupLogs]);

  const maxDailyPickups = Math.max(1, ...activityByDay.map((item) => item.count));
  const recentActivities = activities.slice(0, 5);
  const loadingStats = loadingChildren || loadingGuardians || loadingPickupLogs || loadingQrCode;
  const loadingSnapshot = loadingGuardians || loadingQrCode;
  const openPickupMessageModal = () => {
    if (!loadingChildren && children.length === 0) {
      toast.error("Add a child before messaging pickup staff.");
      return;
    }
    setPickupMessageModalOpen(true);
  };

  return (
    <DashboardLayout role="parent">
      <style>{PARENT_DASHBOARD_CSS}</style>
      <div className="pz-parent-dashboard">
        <div className="pz-parent-header">
          <div>
            <div className="pz-parent-kicker">Parent Portal</div>
            <h1 className="pz-parent-title">Dashboard</h1>
            <div className="pz-parent-subtitle">
              Family pickup access, children, guardians, and recent verification activity.
            </div>
          </div>
          <div className="pz-parent-actions">
            <div className="pz-parent-date-pill">
              <Clock3 size={15} aria-hidden="true" />
              {new Date().toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
              })}
            </div>
            <button
              type="button"
              className="pz-parent-button"
              onClick={openPickupMessageModal}
              disabled={loadingChildren}
            >
              <MessageSquareText size={15} aria-hidden="true" />
              Message Pickup Team
            </button>
            <button
              type="button"
              className="pz-parent-button primary"
              onClick={() => setAddChildModalOpen(true)}
            >
              <Plus size={15} aria-hidden="true" />
              Add Child
            </button>
            <button
              type="button"
              className="pz-parent-button"
              onClick={() => setAddGuardianModalOpen(true)}
            >
              <Plus size={15} aria-hidden="true" />
              Add Guardian
            </button>
            <button
              type="button"
              className="pz-parent-button"
              onClick={() => setUploadDocumentModalOpen(true)}
            >
              <FileUp size={15} aria-hidden="true" />
              Upload Document
            </button>
          </div>
        </div>

        <div className="pz-parent-kpi-grid">
          {loadingStats ? (
            <ParentKpiSkeletonCards />
          ) : (
            statCards.map((stat) => {
              const Icon = stat.icon;
              return (
                <div
                  className="pz-parent-kpi-card"
                  key={stat.name}
                  style={{ "--accent-glow": stat.glow } as CSSProperties}
                >
                  <div className="pz-parent-kpi-top">
                    <div className="pz-parent-kpi-label">{stat.name}</div>
                    <div className="pz-parent-kpi-icon" style={stat.iconTone}>
                      <Icon aria-hidden="true" />
                    </div>
                  </div>
                  <div className="pz-parent-kpi-value">{stat.value}</div>
                  <div className="pz-parent-kpi-footer">
                    <CheckCircle2 aria-hidden="true" />
                    <span>{stat.helper}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="pz-parent-grid">
          <section className="pz-parent-card">
            <div className="pz-parent-card-header">
              <div>
                <div className="pz-parent-card-title">Children Overview</div>
                <div className="pz-parent-subtitle" style={{ marginTop: 4 }}>
                  {children.length} student profile{children.length === 1 ? "" : "s"} connected
                </div>
              </div>
              <span className="pz-parent-badge blue">
                <span className="pz-parent-badge-dot" />
                Family
              </span>
            </div>
            {loadingChildren ? (
              <ParentListSkeleton rows={4} />
            ) : children.length ? (
              <div className="pz-parent-list">
                {children.slice(0, 5).map((child) => (
                  <div className="pz-parent-list-item" key={child.id}>
                    <div className="pz-parent-avatar">
                      {child.photo_path ? (
                        <img src={`${LOCAL_BASE}/${child.photo_path}`} alt={child.full_name} />
                      ) : (
                        initials(child.full_name)
                      )}
                    </div>
                    <div className="pz-parent-list-main">
                      <div className="pz-parent-list-title">{child.full_name || "Unnamed child"}</div>
                      <div className="pz-parent-list-detail">
                        Grade {child.grade || "N/A"} - {child.age || "N/A"} years old
                      </div>
                    </div>
                    <span className="pz-parent-badge green">Active</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="pz-parent-empty">No children added yet.</div>
            )}
          </section>

          <section className="pz-parent-card">
            <div className="pz-parent-card-header">
              <div className="pz-parent-card-title">Recent Activity</div>
              <span className="pz-parent-badge green">
                <span className="pz-parent-badge-dot" />
                Live
              </span>
            </div>
            {loadingActivities ? (
              <ParentListSkeleton rows={4} />
            ) : recentActivities.length ? (
              <div className="pz-parent-list">
                {recentActivities.map((activityItem) => (
                  <div className="pz-parent-list-item" key={activityItem.id}>
                    <div className="pz-parent-avatar" style={{ background: "#1A9E75" }}>
                      <Activity size={17} aria-hidden="true" />
                    </div>
                    <div className="pz-parent-list-main">
                      <div className="pz-parent-list-title">Pickup by {activityItem.guard}</div>
                      <div className="pz-parent-list-detail">
                        {activityItem.date} - {activityItem.status}
                      </div>
                    </div>
                    <div className="pz-parent-list-time">{activityItem.time}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="pz-parent-empty">No recent pickup activity yet.</div>
            )}
          </section>
        </div>

        <div className="pz-parent-grid">
          <section className="pz-parent-card">
            <div className="pz-parent-card-header">
              <div className="pz-parent-card-title">Pickup Activity</div>
              <span className="pz-parent-badge gray">
                <CalendarDays size={13} aria-hidden="true" />
                Last 7 days
              </span>
            </div>
            <div className="pz-parent-chart-wrap">
              {loadingPickupLogs ? (
                <BarChartSkeleton />
              ) : (
                <div className="pz-parent-bars" aria-label="Pickup activity by day">
                  {activityByDay.map((item) => (
                    <div className="pz-parent-bar-col" key={item.key}>
                      <div
                        className="pz-parent-bar"
                        style={{ height: `${Math.max(6, (item.count / maxDailyPickups) * 118)}px` }}
                        title={`${item.count} pickups`}
                      />
                      <div className="pz-parent-bar-label">{item.label}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          <section className="pz-parent-card">
            <div className="pz-parent-card-header">
              <div className="pz-parent-card-title">Family Access Snapshot</div>
              <span className="pz-parent-badge amber">
                <QrCode size={13} aria-hidden="true" />
                QR
              </span>
            </div>
            {loadingSnapshot ? (
              <ParentListSkeleton rows={3} />
            ) : (
            <div className="pz-parent-list pz-parent-snapshot">
              <div className="pz-parent-list-item">
                <div className="pz-parent-avatar" style={{ background: "#0B2E5A" }}>
                  <UsersRound size={17} aria-hidden="true" />
                </div>
                <div className="pz-parent-list-main">
                  <div className="pz-parent-list-title">Authorized guardians</div>
                  <div className="pz-parent-list-detail">
                    {activeGuardians} active of {guardians.length} total guardian records
                  </div>
                </div>
              </div>
              <div className="pz-parent-list-item">
                <div className="pz-parent-avatar" style={{ background: "#1B6ECC" }}>
                  <QrCode size={17} aria-hidden="true" />
                </div>
                <div className="pz-parent-list-main">
                  <div className="pz-parent-list-title">QR access</div>
                  <div className="pz-parent-list-detail">{qrCode?.count ?? 0} active pickup code records</div>
                </div>
              </div>
              <div className="pz-parent-list-item">
                <div className="pz-parent-avatar" style={{ background: "#1A9E75" }}>
                  <ShieldCheck size={17} aria-hidden="true" />
                </div>
                <div className="pz-parent-list-main">
                  <div className="pz-parent-list-title">Profile management</div>
                  <div className="pz-parent-list-detail">Review children, guardians, and pickup documents</div>
                </div>
                <Link to="/parent/qr-codes" className="pz-parent-button">
                  Open
                </Link>
              </div>
            </div>
            )}
          </section>
        </div>

        <section className="pz-parent-card">
          <div className="pz-parent-card-header">
            <div>
              <div className="pz-parent-card-title">Family Workspace</div>
              <div className="pz-parent-subtitle" style={{ marginTop: 4 }}>
                Existing children, guardians, and pickup history tools.
              </div>
            </div>
            <div className="pz-parent-tabbar" role="tablist" aria-label="Parent dashboard tabs">
              {["children", "guardians", "activity"].map((tab) => (
                <button
                  key={tab}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === tab}
                  onClick={() => setActiveTab(tab)}
                  className={`pz-parent-tab ${activeTab === tab ? "active" : ""}`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="pz-parent-workspace-body">
            {activeTab === "children" && (
              loadingChildren ? <ParentListSkeleton rows={3} /> : <ChildrenView children={children} pickupLogs={pickupLogs} onUpdate={fetchChildren} />
            )}
            {activeTab === "guardians" && (
              loadingGuardians ? <ParentListSkeleton rows={3} /> : <GuardiansView guardians={guardians} onUpdate={fetchGuardians} />
            )}
            {activeTab === "activity" && (loadingActivities ? <ParentListSkeleton rows={3} /> : <ActivitySummary />)}
          </div>
        </section>
      </div>

      {addChildModalOpen && (
        <AddChildForm
          isOpen={addChildModalOpen}
          onClose={() => setAddChildModalOpen(false)}
          onSuccess={fetchChildren}
        />
      )}

      {addGuardianModalOpen && (
        <AddGuardianForm
          isOpen={addGuardianModalOpen}
          onClose={() => setAddGuardianModalOpen(false)}
          onSubmit={fetchGuardians}
        />
      )}

      <ParentPickupMessageModal
        isOpen={pickupMessageModalOpen}
        childrenCount={children.length}
        onClose={() => setPickupMessageModalOpen(false)}
        onSent={fetchPickupLogs}
      />

      {uploadDocumentModalOpen && (
        <UploadDocumentForm
          isOpen={uploadDocumentModalOpen}
          onClose={() => setUploadDocumentModalOpen(false)}
          onUploadSuccess={fetchDocuments}
          requiredTypes={REQUIRED_DOCUMENT_TYPES}
          existingDocuments={documents}
          children={children}
        />
      )}
    </DashboardLayout>
  );
}

function initials(name?: string) {
  if (!name) return "NA";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function SkeletonLine({ width = "100%" }: { width?: string }) {
  return <div className="pz-skeleton pz-skeleton-line" style={{ width }} />;
}

function ParentKpiSkeletonCards() {
  const skeletonCards = [
    { name: "Children", glow: "rgba(27,110,204,0.16)" },
    { name: "Guardians", glow: "rgba(26,158,117,0.16)" },
    { name: "Active QR Codes", glow: "rgba(239,159,39,0.16)" },
    { name: "Pickup Records", glow: "rgba(7,29,59,0.14)" },
  ];

  return (
    <>
      {skeletonCards.map((item) => (
        <div
          className="pz-parent-kpi-card"
          key={item.name}
          style={{ "--accent-glow": item.glow } as CSSProperties}
        >
          <div className="pz-parent-kpi-top">
            <SkeletonLine width="44%" />
            <div className="pz-skeleton pz-skeleton-icon" />
          </div>
          <div className="pz-skeleton pz-skeleton-value" />
          <div className="pz-parent-kpi-footer">
            <SkeletonLine width="70%" />
          </div>
        </div>
      ))}
    </>
  );
}

function ParentListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="pz-parent-list pz-activity-skeleton" aria-label="Loading dashboard content">
      {Array.from({ length: rows }).map((_, index) => (
        <div className="pz-parent-list-item" key={index}>
          <div className="pz-skeleton" style={{ width: 38, height: 38, borderRadius: 10 }} />
          <div className="pz-parent-list-main">
            <SkeletonLine width={index % 2 ? "58%" : "72%"} />
            <SkeletonLine width={index % 2 ? "82%" : "64%"} />
          </div>
          <div style={{ width: 54 }}>
            <SkeletonLine width="100%" />
          </div>
        </div>
      ))}
    </div>
  );
}

function BarChartSkeleton() {
  const heights = [38, 72, 48, 118, 88, 56, 132];
  return (
    <div className="pz-chart-skeleton" aria-label="Loading pickup activity chart">
      {heights.map((height, index) => (
        <div className="pz-skeleton pz-chart-skeleton-bar" key={index} style={{ height }} />
      ))}
    </div>
  );
}
