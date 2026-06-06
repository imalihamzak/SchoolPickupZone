import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Activity,
  ArrowLeft,
  Baby,
  CalendarDays,
  CheckCircle2,
  Clock3,
  HeartPulse,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import axios from "axios";
import DashboardLayout from "@/components/layouts/dashboard-layout";
import { toast } from "@/components/ui/toast";
import { API_BASE_URL, LOCAL_BASE } from "@/lib/api/link";
import { isQuietEmptyStateError } from "@/lib/api/quietEmptyState";

const CHILD_DETAIL_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Inter:wght@400;500;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,300&display=swap');

.pz-child-page {
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
  color: var(--text-1);
  font-family: 'DM Sans', "Segoe UI", Arial, sans-serif;
}

.pz-child-page,
.pz-child-page * {
  box-sizing: border-box;
}

.pz-child-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 18px;
  margin-bottom: 22px;
}

.pz-child-kicker {
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

.pz-child-kicker::before {
  content: "";
  width: 18px;
  height: 2px;
  border-radius: 999px;
  background: var(--teal);
}

.pz-child-title {
  font-family: 'Inter', sans-serif;
  font-size: clamp(28px, 3.2vw, 42px);
  line-height: 1.04;
  letter-spacing: -0.025em;
  font-weight: 700;
  color: var(--text-1);
  margin: 0;
}

.pz-child-subtitle {
  color: var(--text-3);
  font-size: 14px;
  margin-top: 8px;
}

.pz-child-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  flex-wrap: wrap;
}

.pz-child-button,
.pz-child-date-pill {
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

.pz-child-button {
  border: 1px solid var(--border);
  background: var(--white);
  color: var(--text-2);
  cursor: pointer;
  transition: all 0.18s ease;
}

.pz-child-button:hover {
  border-color: rgba(27,110,204,0.36);
  background: #EFF6FF;
  color: var(--blue);
}

.pz-child-date-pill {
  background: var(--white);
  border: 1px solid var(--border);
  color: var(--text-2);
  box-shadow: var(--shadow-sm);
}

.pz-child-hero {
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: var(--radius);
  background:
    radial-gradient(circle at 8% 0%, rgba(45,201,143,0.18), transparent 32%),
    radial-gradient(circle at 100% 100%, rgba(27,110,204,0.18), transparent 36%),
    var(--navy);
  color: var(--white);
  padding: 24px;
  overflow: hidden;
  position: relative;
  margin-bottom: 18px;
}

.pz-child-hero::after {
  content: "";
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px);
  background-size: 36px 36px;
  pointer-events: none;
}

.pz-child-hero-content {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 20px;
  align-items: center;
}

.pz-child-avatar,
.pz-child-avatar-fallback {
  width: 116px;
  height: 116px;
  border-radius: 28px;
  flex-shrink: 0;
}

.pz-child-avatar {
  object-fit: cover;
  border: 1px solid rgba(255,255,255,0.24);
  box-shadow: 0 18px 44px rgba(0,0,0,0.18);
}

.pz-child-avatar-fallback {
  background: rgba(255,255,255,0.08);
  color: var(--white);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(255,255,255,0.14);
}

.pz-child-name {
  font-family: 'Inter', sans-serif;
  font-size: clamp(26px, 3vw, 38px);
  line-height: 1.04;
  letter-spacing: -0.025em;
  font-weight: 700;
  color: var(--white);
}

.pz-child-meta-row {
  display: flex;
  align-items: center;
  gap: 9px;
  flex-wrap: wrap;
  margin-top: 12px;
}

.pz-child-pill {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  border-radius: 999px;
  padding: 5px 10px;
  background: rgba(255,255,255,0.08);
  color: rgba(255,255,255,0.78);
  font-size: 12px;
  font-weight: 800;
}

.pz-child-hero-status {
  min-width: 180px;
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 12px;
  background: rgba(255,255,255,0.06);
  padding: 14px;
}

.pz-child-hero-status-label {
  color: rgba(255,255,255,0.55);
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.pz-child-hero-status-value {
  color: var(--white);
  font-size: 14px;
  font-weight: 800;
  margin-top: 7px;
  line-height: 1.45;
}

.pz-child-stat-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
  margin-bottom: 18px;
}

.pz-child-stat {
  min-height: 136px;
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

.pz-child-stat::after {
  content: "";
  position: absolute;
  inset: auto -38px -70px auto;
  width: 148px;
  height: 148px;
  border-radius: 50%;
  background: radial-gradient(circle, var(--accent-glow) 0%, transparent 65%);
  pointer-events: none;
}

.pz-child-stat:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.pz-child-stat-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
}

.pz-child-stat-label {
  color: var(--text-3);
  font-size: 12px;
  font-weight: 700;
}

.pz-child-stat-icon {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.pz-child-stat-icon svg {
  width: 19px;
  height: 19px;
  stroke-width: 2.4;
}

.pz-child-stat-value {
  font-family: 'Inter', 'Segoe UI', Arial, sans-serif;
  font-size: 32px;
  font-weight: 700;
  letter-spacing: 0;
  line-height: 1;
  color: var(--text-1);
  font-variant-numeric: tabular-nums;
}

.pz-child-stat-helper {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--text-3);
  font-size: 12px;
}

.pz-child-stat-helper svg {
  width: 14px;
  height: 14px;
  color: var(--teal);
}

.pz-child-grid {
  display: grid;
  grid-template-columns: minmax(0, 0.58fr) minmax(0, 1fr);
  gap: 16px;
  align-items: start;
}

.pz-child-card {
  background: var(--white);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
}

.pz-child-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 18px 22px;
  border-bottom: 1px solid var(--border);
}

.pz-child-card-title {
  font-family: 'Inter', sans-serif;
  color: var(--text-1);
  font-size: 16px;
  font-weight: 700;
  letter-spacing: -0.025em;
}

.pz-child-card-subtitle {
  color: var(--text-3);
  font-size: 13px;
  margin-top: 4px;
}

.pz-child-card-body {
  padding: 20px 22px 22px;
}

.pz-child-medical {
  border-radius: 12px;
  padding: 14px;
  font-size: 13px;
  line-height: 1.55;
}

.pz-child-medical.safe {
  border: 1px solid rgba(26,158,117,0.18);
  background: var(--teal-pale);
  color: #065F46;
}

.pz-child-medical.notice {
  border: 1px solid rgba(239,159,39,0.24);
  background: var(--amber-pale);
  color: #92400E;
}

.pz-child-info-list {
  display: flex;
  flex-direction: column;
}

.pz-child-info-row,
.pz-child-log-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 0;
  border-bottom: 1px solid var(--border);
}

.pz-child-info-row:last-child,
.pz-child-log-row:last-child {
  border-bottom: 0;
}

.pz-child-row-icon {
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

.pz-child-row-main {
  min-width: 0;
  flex: 1;
}

.pz-child-row-title {
  color: var(--text-1);
  font-size: 13px;
  font-weight: 800;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pz-child-row-copy {
  color: var(--text-3);
  font-size: 12px;
  margin-top: 3px;
  line-height: 1.45;
}

.pz-child-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border-radius: 999px;
  padding: 4px 9px;
  background: var(--teal-pale);
  color: #065F46;
  font-size: 11px;
  font-weight: 800;
  white-space: nowrap;
}

.pz-child-empty {
  color: var(--text-3);
  font-size: 13px;
  padding: 18px 0 4px;
}

@media (max-width: 1180px) {
  .pz-child-hero-content,
  .pz-child-grid {
    grid-template-columns: 1fr;
  }
  .pz-child-hero-status {
    min-width: 0;
  }
  .pz-child-stat-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 760px) {
  .pz-child-head,
  .pz-child-card-header {
    align-items: flex-start;
    flex-direction: column;
  }
  .pz-child-actions,
  .pz-child-button,
  .pz-child-date-pill {
    width: 100%;
  }
  .pz-child-stat-grid {
    grid-template-columns: 1fr;
  }
  .pz-child-hero,
  .pz-child-card-body {
    padding: 16px;
  }
  .pz-child-avatar,
  .pz-child-avatar-fallback {
    width: 92px;
    height: 92px;
    border-radius: 22px;
  }
}
`;

type DetailStat = {
  label: string;
  value: string | number;
  helper: string;
  icon: LucideIcon;
  iconTone: CSSProperties;
  glow: string;
};

export default function ChildDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [child, setChild] = useState<any>(null);
  const [pickupLogs, setPickupLogs] = useState<any[]>([]);

  const fetchChild = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_BASE_URL}/children/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setChild(res.data);
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to load child info");
    }
  };

  const fetchPickupLogs = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_BASE_URL}/pickups`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const logs = Array.isArray(res.data) ? res.data : [];
      const childLogs = logs.filter((log: any) => String(log.child_id) === String(id));
      setPickupLogs(childLogs);
    } catch (err: any) {
      if (isQuietEmptyStateError(err)) {
        setPickupLogs([]);
        return;
      }
      toast.error("Failed to load pickup logs");
    }
  };

  useEffect(() => {
    fetchChild();
    fetchPickupLogs();
  }, [id]);

  const sortedPickupLogs = useMemo(
    () =>
      [...pickupLogs].sort((a, b) => {
        const aTime = new Date(a.pickup_time || a.created_at || 0).getTime();
        const bTime = new Date(b.pickup_time || b.created_at || 0).getTime();
        return bTime - aTime;
      }),
    [pickupLogs]
  );

  const lastPickup = sortedPickupLogs[0];
  const medicalInfo = child?.medical_info?.trim();
  const medicalState = getMedicalState(medicalInfo);

  const stats = useMemo<DetailStat[]>(
    () => [
      {
        label: "Total Pickups",
        value: pickupLogs.length,
        helper: "Recorded for this student",
        icon: ShieldCheck,
        iconTone: { background: "#E1F5EE", color: "#1A9E75" },
        glow: "rgba(26,158,117,0.16)",
      },
      {
        label: "Grade",
        value: child?.grade ?? "-",
        helper: "Current school grade",
        icon: Baby,
        iconTone: { background: "#EFF6FF", color: "#1B6ECC" },
        glow: "rgba(27,110,204,0.16)",
      },
      {
        label: "Age",
        value: child?.age ? `${child.age}` : "-",
        helper: child?.age ? "Years old" : "Not provided",
        icon: UserRound,
        iconTone: { background: "#FEF3DC", color: "#EF9F27" },
        glow: "rgba(239,159,39,0.16)",
      },
      {
        label: "Last Pickup",
        value: lastPickup ? formatShortDate(lastPickup.pickup_time || lastPickup.created_at) : "None",
        helper: lastPickup ? "Latest event loaded" : "No recent pickup",
        icon: Clock3,
        iconTone: { background: "#F4F6FA", color: "#0B2E5A" },
        glow: "rgba(7,29,59,0.14)",
      },
    ],
    [child?.age, child?.grade, lastPickup, pickupLogs.length]
  );

  return (
    <DashboardLayout role="parent">
      <style>{CHILD_DETAIL_CSS}</style>
      <div className="pz-child-page">
        <header className="pz-child-head">
          <div>
            <div className="pz-child-kicker">Student Profile</div>
            <h1 className="pz-child-title">{child?.full_name || "Child Profile"}</h1>
            <div className="pz-child-subtitle">
              Review student details, medical notes, and pickup history in one view.
            </div>
          </div>
          <div className="pz-child-actions">
            <button type="button" onClick={() => navigate(-1)} className="pz-child-button">
              <ArrowLeft size={15} aria-hidden="true" />
              Back
            </button>
            <div className="pz-child-date-pill">
              <CalendarDays size={15} aria-hidden="true" />
              {new Date().toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
              })}
            </div>
          </div>
        </header>

        <section className="pz-child-hero">
          <div className="pz-child-hero-content">
            {child?.photo_path ? (
              <img src={`${LOCAL_BASE}/${child.photo_path}`} alt={child.full_name} className="pz-child-avatar" />
            ) : (
              <div className="pz-child-avatar-fallback">
                <UserRound size={50} aria-hidden="true" />
              </div>
            )}

            <div>
              <div className="pz-child-kicker" style={{ color: "#2DC98F", marginBottom: 10 }}>
                Active Student
              </div>
              <div className="pz-child-name">{child?.full_name || "Loading student..."}</div>
              <div className="pz-child-meta-row">
                <span className="pz-child-pill">
                  <Baby size={14} aria-hidden="true" />
                  Grade {child?.grade ?? "-"}
                </span>
                <span className="pz-child-pill">
                  <UserRound size={14} aria-hidden="true" />
                  {child?.age ? `${child.age} years old` : "Age not provided"}
                </span>
                <span className="pz-child-pill">
                  <ShieldCheck size={14} aria-hidden="true" />
                  {pickupLogs.length} pickup records
                </span>
              </div>
            </div>

            <div className="pz-child-hero-status">
              <div className="pz-child-hero-status-label">Latest Pickup</div>
              <div className="pz-child-hero-status-value">
                {lastPickup
                  ? `${formatDateTime(lastPickup.pickup_time || lastPickup.created_at)}`
                  : "No pickup activity has been recorded yet."}
              </div>
            </div>
          </div>
        </section>

        <section className="pz-child-stat-grid" aria-label="Student summary">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                className="pz-child-stat"
                key={stat.label}
                style={{ "--accent-glow": stat.glow } as CSSProperties}
              >
                <div className="pz-child-stat-top">
                  <div className="pz-child-stat-label">{stat.label}</div>
                  <div className="pz-child-stat-icon" style={stat.iconTone}>
                    <Icon aria-hidden="true" />
                  </div>
                </div>
                <div className="pz-child-stat-value">{stat.value}</div>
                <div className="pz-child-stat-helper">
                  <CheckCircle2 aria-hidden="true" />
                  <span>{stat.helper}</span>
                </div>
              </div>
            );
          })}
        </section>

        <div className="pz-child-grid">
          <section className="pz-child-card">
            <div className="pz-child-card-header">
              <div>
                <div className="pz-child-card-title">Student Details</div>
                <div className="pz-child-card-subtitle">Profile information used during pickup checks.</div>
              </div>
            </div>
            <div className="pz-child-card-body">
              <div className="pz-child-info-list">
                <div className="pz-child-info-row">
                  <div className="pz-child-row-icon">
                    <Baby size={17} aria-hidden="true" />
                  </div>
                  <div className="pz-child-row-main">
                    <div className="pz-child-row-title">Grade</div>
                    <div className="pz-child-row-copy">Grade {child?.grade ?? "not provided"}</div>
                  </div>
                  <span className="pz-child-badge">Student</span>
                </div>
                <div className="pz-child-info-row">
                  <div className="pz-child-row-icon">
                    <UserRound size={17} aria-hidden="true" />
                  </div>
                  <div className="pz-child-row-main">
                    <div className="pz-child-row-title">Age</div>
                    <div className="pz-child-row-copy">
                      {child?.age ? `${child.age} years old` : "No age saved for this profile"}
                    </div>
                  </div>
                </div>
                <div className="pz-child-info-row">
                  <div className="pz-child-row-icon">
                    <HeartPulse size={17} aria-hidden="true" />
                  </div>
                  <div className="pz-child-row-main">
                    <div className="pz-child-row-title">Medical status</div>
                    <div className="pz-child-row-copy">
                      {medicalInfo ? "Notes available for pickup staff." : "No medical notes saved."}
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: 18 }}>
                <div className="pz-child-card-title" style={{ fontSize: 15, marginBottom: 10 }}>
                  Medical Information
                </div>
                <div className={`pz-child-medical ${medicalState}`}>
                  {medicalInfo || "No medical information has been added for this child."}
                </div>
              </div>
            </div>
          </section>

          <section className="pz-child-card">
            <div className="pz-child-card-header">
              <div>
                <div className="pz-child-card-title">Pickup History</div>
                <div className="pz-child-card-subtitle">Recent verification events for this student.</div>
              </div>
              <span className="pz-child-badge">
                <Activity size={13} aria-hidden="true" />
                {pickupLogs.length} total
              </span>
            </div>
            <div className="pz-child-card-body">
              {sortedPickupLogs.length ? (
                <div className="pz-child-info-list">
                  {sortedPickupLogs.slice(0, 8).map((log) => (
                    <div className="pz-child-log-row" key={log.id ?? `${log.child_id}-${log.pickup_time}`}>
                      <div className="pz-child-row-icon">
                        <ShieldCheck size={17} aria-hidden="true" />
                      </div>
                      <div className="pz-child-row-main">
                        <div className="pz-child-row-title">
                          {log.guardian_name || log.guard_name || "Pickup recorded"}
                        </div>
                        <div className="pz-child-row-copy">
                          {formatDateTime(log.pickup_time || log.created_at)} - {log.status || "Recorded"}
                        </div>
                      </div>
                      <span className="pz-child-badge">{log.gate || "Pickup"}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="pz-child-empty">No pickup records have been recorded for this child yet.</div>
              )}
            </div>
          </section>
        </div>
      </div>
    </DashboardLayout>
  );
}

function getMedicalState(value?: string) {
  if (!value) return "safe";
  const text = value.toLowerCase();
  const safeWords = ["all good", "no issue", "clear", "healthy", "none", "normal", "fine", "okay"];
  return safeWords.some((word) => text.includes(word)) ? "safe" : "notice";
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

function formatShortDate(value?: string) {
  if (!value) return "None";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "None";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}
