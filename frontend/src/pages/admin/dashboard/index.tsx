import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  Building2,
  CheckCircle2,
  Clock3,
  QrCode,
  ScanLine,
  ShieldCheck,
  UsersRound,
} from "lucide-react";
import DashboardLayout from "@/components/layouts/dashboard-layout";
import { API_BASE_URL } from "@/lib/api/link";
import { useNavigate } from "react-router-dom";

const ADMIN_DASHBOARD_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Inter:wght@400;500;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,300&display=swap');

.pz-admin-dashboard {
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

.pz-admin-dashboard * {
  box-sizing: border-box;
}

.pz-admin-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 18px;
  margin-bottom: 24px;
}

.pz-admin-kicker {
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

.pz-admin-kicker::before {
  content: "";
  width: 18px;
  height: 2px;
  border-radius: 999px;
  background: var(--teal);
}

.pz-admin-title {
  font-family: 'Inter', sans-serif;
  font-size: clamp(28px, 3.2vw, 42px);
  line-height: 1.04;
  letter-spacing: -0.025em;
  font-weight: 700;
  color: var(--text-1);
  margin: 0;
  font-stretch: normal;
}

.pz-admin-subtitle {
  color: var(--text-3);
  font-size: 14px;
  margin-top: 8px;
}

.pz-admin-date-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: var(--white);
  border: 1px solid var(--border);
  color: var(--text-2);
  border-radius: 999px;
  padding: 9px 14px;
  font-size: 13px;
  font-weight: 600;
  box-shadow: var(--shadow-sm);
  white-space: nowrap;
}

.pz-kpi-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
  margin-bottom: 18px;
}

.pz-kpi-card {
  background: var(--white);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 20px 22px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-height: 142px;
  transition: box-shadow 0.2s ease, transform 0.2s ease;
  position: relative;
  overflow: hidden;
}

button.pz-kpi-card {
  width: 100%;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.pz-kpi-card::after {
  content: "";
  position: absolute;
  inset: auto -40px -70px auto;
  width: 150px;
  height: 150px;
  border-radius: 50%;
  background: radial-gradient(circle, var(--accent-glow) 0%, transparent 65%);
  pointer-events: none;
}

.pz-kpi-card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.pz-kpi-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
}

.pz-kpi-label {
  color: var(--text-3);
  font-size: 12px;
  font-weight: 600;
}

.pz-kpi-icon {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.pz-kpi-icon svg {
  width: 19px;
  height: 19px;
  stroke-width: 2.4;
}

.pz-kpi-value {
  font-family: 'Inter', 'Segoe UI', Arial, sans-serif;
  font-size: 34px;
  font-weight: 700;
  letter-spacing: 0;
  line-height: 1;
  color: var(--text-1);
  font-stretch: normal;
  font-variant-numeric: tabular-nums;
}

.pz-kpi-footer {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--text-3);
  font-size: 12px;
}

.pz-kpi-footer svg {
  width: 14px;
  height: 14px;
  color: var(--teal);
}

.pz-limit-card {
  background: var(--white);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 20px 22px;
  margin-bottom: 18px;
  box-shadow: var(--shadow-sm);
}

.pz-limit-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
  margin-bottom: 18px;
}

.pz-limit-title {
  font-family: 'Inter', sans-serif;
  font-size: 15px;
  font-weight: 700;
  color: var(--text-1);
  letter-spacing: -0.025em;
}

.pz-limit-subtitle {
  color: var(--text-3);
  font-size: 12px;
  margin-top: 4px;
}

.pz-limit-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
}

.pz-limit-item {
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 14px;
  background: var(--surface);
}

.pz-limit-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 10px;
}

.pz-limit-label {
  color: var(--text-2);
  font-size: 12px;
  font-weight: 700;
}

.pz-limit-value {
  color: var(--text-1);
  font-size: 12px;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.pz-limit-track {
  height: 8px;
  border-radius: 999px;
  background: #E2E6EE;
  overflow: hidden;
}

.pz-limit-fill {
  height: 100%;
  border-radius: inherit;
  background: var(--teal);
}

.pz-limit-fill.amber {
  background: var(--amber);
}

.pz-limit-fill.red {
  background: var(--red);
}

.pz-admin-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(320px, 0.62fr);
  gap: 16px;
  margin-bottom: 18px;
}

.pz-admin-card {
  background: var(--white);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
}

.pz-admin-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 18px 22px;
  border-bottom: 1px solid var(--border);
}

.pz-admin-card-title {
  font-family: 'Inter', sans-serif;
  font-size: 15px;
  font-weight: 700;
  letter-spacing: -0.025em;
  color: var(--text-1);
  line-height: 1.08;
  font-stretch: normal;
}

.pz-admin-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 999px;
  white-space: nowrap;
}

.pz-admin-badge.green {
  background: var(--teal-pale);
  color: #065F46;
}

.pz-admin-badge.blue {
  background: #EFF6FF;
  color: #1D4ED8;
}

.pz-admin-badge.amber {
  background: var(--amber-pale);
  color: #92400E;
}

.pz-admin-badge.gray {
  background: var(--surface-2);
  color: var(--text-2);
}

.pz-admin-badge-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}

.pz-chart-wrap {
  height: 292px;
  padding: 18px 18px 14px;
}

.pz-chart-empty,
.pz-table-empty {
  display: flex;
  min-height: 180px;
  align-items: center;
  justify-content: center;
  color: var(--text-3);
  font-size: 14px;
  text-align: center;
  padding: 28px;
}

.pz-skeleton {
  position: relative;
  overflow: hidden;
  background: linear-gradient(90deg, #EEF2F7 0%, #F7F9FC 50%, #EEF2F7 100%);
  background-size: 220% 100%;
  border-radius: 999px;
  animation: pzSkeletonPulse 1.4s ease-in-out infinite;
}

.pz-skeleton::after {
  content: "";
  position: absolute;
  inset: 0;
  transform: translateX(-100%);
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.72), transparent);
  animation: pzSkeletonShimmer 1.4s ease-in-out infinite;
}

@keyframes pzSkeletonPulse {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}

@keyframes pzSkeletonShimmer {
  100% { transform: translateX(100%); }
}

.pz-skeleton-line {
  height: 11px;
}

.pz-skeleton-value {
  width: 70px;
  height: 34px;
  border-radius: 9px;
}

.pz-skeleton-icon {
  width: 38px;
  height: 38px;
  border-radius: 10px;
}

.pz-chart-skeleton {
  height: 100%;
  display: flex;
  align-items: flex-end;
  gap: 10px;
  padding: 18px 8px 8px;
}

.pz-chart-skeleton-bar {
  flex: 1;
  min-width: 18px;
  border-radius: 8px 8px 4px 4px;
}

.pz-line-chart-skeleton {
  height: 100%;
  display: grid;
  grid-template-rows: repeat(4, 1fr);
  gap: 18px;
  padding: 18px 8px 8px;
}

.pz-line-chart-skeleton .pz-skeleton {
  height: 10px;
  border-radius: 999px;
}

.pz-activity-skeleton .pz-skeleton-line {
  margin-top: 4px;
}

.pz-table-skeleton-row td {
  padding: 15px 16px;
}

.pz-table-skeleton-cell {
  height: 13px;
  border-radius: 999px;
}

@media (prefers-reduced-motion: reduce) {
  .pz-skeleton,
  .pz-skeleton::after {
    animation: none;
  }
}

.pz-activity-list {
  display: flex;
  flex-direction: column;
}

.pz-activity-item {
  display: flex;
  gap: 12px;
  padding: 14px 22px;
  border-bottom: 1px solid var(--border);
}

.pz-activity-item:last-child {
  border-bottom: none;
}

.pz-activity-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: var(--teal);
  margin-top: 7px;
  box-shadow: 0 0 0 4px rgba(26,158,117,0.12);
  flex-shrink: 0;
}

.pz-activity-text {
  min-width: 0;
  flex: 1;
}

.pz-activity-title {
  color: var(--text-1);
  font-size: 13px;
  font-weight: 700;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pz-activity-detail {
  color: var(--text-3);
  font-size: 12px;
  margin-top: 3px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pz-activity-time {
  color: var(--text-3);
  font-size: 11px;
  white-space: nowrap;
}

.pz-table-wrap {
  overflow-x: auto;
}

.pz-admin-table {
  width: 100%;
  border-collapse: collapse;
}

.pz-admin-table th {
  text-align: left;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--text-3);
  padding: 12px 16px;
  border-bottom: 1px solid var(--border);
  white-space: nowrap;
  background: var(--surface);
}

.pz-admin-table td {
  padding: 14px 16px;
  font-size: 13.5px;
  color: var(--text-2);
  border-bottom: 1px solid var(--border);
  vertical-align: middle;
}

.pz-admin-table tbody tr:last-child td {
  border-bottom: none;
}

.pz-admin-table tbody tr:hover td {
  background: #FAFBFD;
}

.pz-student-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}

.pz-avatar {
  width: 34px;
  height: 34px;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--navy-mid);
  color: var(--white);
  font-size: 11px;
  font-weight: 800;
  letter-spacing: -0.02em;
  flex-shrink: 0;
}

.pz-student-name {
  color: var(--text-1);
  font-weight: 700;
}

.pz-student-sub {
  color: var(--text-3);
  font-size: 11px;
  margin-top: 1px;
}

@media (max-width: 1180px) {
  .pz-kpi-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .pz-admin-grid {
    grid-template-columns: 1fr;
  }
  .pz-limit-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 680px) {
  .pz-admin-dashboard {
    min-height: auto;
  }
  .pz-admin-header {
    align-items: flex-start;
    flex-direction: column;
  }
  .pz-kpi-grid {
    grid-template-columns: 1fr;
  }
  .pz-limit-header {
    flex-direction: column;
  }
  .pz-limit-grid {
    grid-template-columns: 1fr;
  }
  .pz-admin-card-header {
    align-items: flex-start;
    flex-direction: column;
  }
  .pz-chart-wrap {
    height: 250px;
    padding: 14px 8px 12px;
  }
}
`;

interface Stat {
  name: string;
  value: string | number;
  icon: LucideIcon;
  iconTone: CSSProperties;
  glow: string;
  helper: string;
  href: string;
}

interface ScanData {
  hour?: string;
  day?: string;
  scans: number;
}

interface QRScan {
  id: number;
  studentName: string;
  guardianName: string;
  carDescription: string;
  time: string;
  date: string;
  guardName: string;
  status: string;
}

interface PackageLimitUsage {
  used: number;
  limit: number | null;
}

interface PackageUsage {
  planName?: string | null;
  billingInterval?: string | null;
  status?: string | null;
  students: PackageLimitUsage;
  families: PackageLimitUsage;
  guards: PackageLimitUsage;
  storage?: PackageLimitUsage | null;
}

const statConfig = [
  {
    key: "students",
    name: "Total Students",
    icon: Building2,
    iconTone: { background: "#EFF6FF", color: "#1B6ECC" },
    glow: "rgba(27,110,204,0.16)",
    helper: "Registered in your school",
    href: "/admin/profiles",
  },
  {
    key: "parents",
    name: "Total Parents",
    icon: UsersRound,
    iconTone: { background: "#E1F5EE", color: "#1A9E75" },
    glow: "rgba(26,158,117,0.16)",
    helper: "Parent accounts",
    href: "/admin/profiles",
  },
  {
    key: "guards",
    name: "Total Guards",
    icon: ShieldCheck,
    iconTone: { background: "#FEF3DC", color: "#EF9F27" },
    glow: "rgba(239,159,39,0.16)",
    helper: "Security users",
    href: "/admin/users",
  },
  {
    key: "qrCodes",
    name: "Total QR Codes",
    icon: QrCode,
    iconTone: { background: "#F4F6FA", color: "#0B2E5A" },
    glow: "rgba(7,29,59,0.14)",
    helper: "Generated access codes",
    href: "/admin/qr-codes",
  },
] as const;

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

function statusClass(status?: string) {
  const normalized = (status || "").toLowerCase();
  if (normalized.includes("pending")) return "amber";
  if (normalized.includes("denied") || normalized.includes("fail")) return "gray";
  return "green";
}

function todayLabel() {
  return new Date().toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stat[]>([]);
  const [dailyScans, setDailyScans] = useState<ScanData[]>([]);
  const [weeklyScans, setWeeklyScans] = useState<ScanData[]>([]);
  const [qrScans, setQrScans] = useState<QRScan[]>([]);
  const [packageUsage, setPackageUsage] = useState<PackageUsage | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingDaily, setLoadingDaily] = useState(true);
  const [loadingWeekly, setLoadingWeekly] = useState(true);
  const [loadingRecent, setLoadingRecent] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");

    setLoadingStats(true);
    fetch(`${API_BASE_URL}/dashboard/stats`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        setStats(
          statConfig.map((item) => ({
            name: item.name,
            value: data?.[item.key] ?? 0,
            icon: item.icon,
            iconTone: item.iconTone,
            glow: item.glow,
            helper: item.helper,
            href: item.href,
          }))
        );
        setPackageUsage(data?.packageUsage ?? null);
      })
      .catch(() => {
        setStats([]);
        setPackageUsage(null);
      })
      .finally(() => setLoadingStats(false));

    setLoadingDaily(true);
    fetch(`${API_BASE_URL}/pickups/stats/today`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setDailyScans(Array.isArray(data) ? data : []))
      .catch(() => setDailyScans([]))
      .finally(() => setLoadingDaily(false));

    setLoadingWeekly(true);
    fetch(`${API_BASE_URL}/pickups/stats/week`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setWeeklyScans(Array.isArray(data) ? data : []))
      .catch(() => setWeeklyScans([]))
      .finally(() => setLoadingWeekly(false));

    setLoadingRecent(true);
    fetch(`${API_BASE_URL}/pickups/recent`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setQrScans(Array.isArray(data) ? data : []))
      .catch((err) => {
        console.error("Failed to fetch recent QR scans:", err);
        setQrScans([]);
      })
      .finally(() => setLoadingRecent(false));
  }, []);

  const recentActivity = useMemo(() => qrScans.slice(0, 5), [qrScans]);
  const todayScanTotal = useMemo(
    () => dailyScans.reduce((sum, item) => sum + Number(item.scans || 0), 0),
    [dailyScans]
  );
  const dashboardStats = useMemo<Stat[]>(
    () =>
      stats.length
        ? stats
        : statConfig.map((item) => ({
            name: item.name,
            value: 0,
            icon: item.icon,
            iconTone: item.iconTone,
            glow: item.glow,
            helper: item.helper,
            href: item.href,
          })),
    [stats]
  );
  const loadingSnapshot = loadingDaily || loadingRecent;

  return (
    <DashboardLayout role="admin">
      <style>{ADMIN_DASHBOARD_CSS}</style>
      <div className="pz-admin-dashboard">
        <div className="pz-admin-header">
          <div>
            <div className="pz-admin-kicker">School Admin</div>
            <h1 className="pz-admin-title">Dashboard</h1>
            <div className="pz-admin-subtitle">
              Live QR activity, school totals, and recent pickup verification.
            </div>
          </div>
          <div className="pz-admin-date-pill">
            <Clock3 size={15} aria-hidden="true" />
            {todayLabel()}
          </div>
        </div>

        <div className="pz-kpi-grid">
          {loadingStats ? (
            <KpiSkeletonCards />
          ) : (
            dashboardStats.map((stat) => {
              const Icon = stat.icon;
              return (
                <button
                  type="button"
                  className="pz-kpi-card"
                  key={stat.name}
                  style={{ "--accent-glow": stat.glow } as CSSProperties}
                  onClick={() => navigate(stat.href)}
                  aria-label={`Open ${stat.name}`}
                >
                  <div className="pz-kpi-top">
                    <div className="pz-kpi-label">{stat.name}</div>
                    <div className="pz-kpi-icon" style={stat.iconTone}>
                      <Icon aria-hidden="true" />
                    </div>
                  </div>
                  <div className="pz-kpi-value">{stat.value}</div>
                  <div className="pz-kpi-footer">
                    <CheckCircle2 aria-hidden="true" />
                    <span>{stat.helper}</span>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {loadingStats ? (
          <PackageUsageSkeleton />
        ) : (
          <PackageUsageCard usage={packageUsage} />
        )}

        <div className="pz-admin-grid">
          <div className="pz-admin-card">
            <div className="pz-admin-card-header">
              <div>
                <div className="pz-admin-card-title">Today's QR Scans</div>
                <div className="pz-admin-subtitle" style={{ marginTop: 4 }}>
                  {todayScanTotal} scans recorded today
                </div>
              </div>
              <span className="pz-admin-badge blue">
                <span className="pz-admin-badge-dot" />
                Today
              </span>
            </div>
            <div className="pz-chart-wrap">
              {loadingDaily ? (
                <BarChartSkeleton />
              ) : dailyScans.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dailyScans}>
                    <CartesianGrid stroke="#E2E6EE" vertical={false} />
                    <XAxis dataKey="hour" tick={{ fill: "#8A96A8", fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "#8A96A8", fontSize: 12 }} axisLine={false} tickLine={false} />
                    <Tooltip cursor={{ fill: "rgba(27,110,204,0.06)" }} contentStyle={tooltipStyle} />
                    <Bar dataKey="scans" fill="#1A9E75" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="pz-chart-empty">No scan data available for today.</div>
              )}
            </div>
          </div>

          <div className="pz-admin-card">
            <div className="pz-admin-card-header">
              <div className="pz-admin-card-title">Recent Activity</div>
              <span className="pz-admin-badge green">
                <span className="pz-admin-badge-dot" />
                Live
              </span>
            </div>
            {loadingRecent ? (
              <ActivityListSkeleton />
            ) : recentActivity.length ? (
              <div className="pz-activity-list">
                {recentActivity.map((scan) => (
                  <div className="pz-activity-item" key={scan.id}>
                    <div className="pz-activity-dot" />
                    <div className="pz-activity-text">
                      <div className="pz-activity-title">{scan.studentName}</div>
                      <div className="pz-activity-detail">
                        {scan.guardianName} / {scan.guardName || "Guard not assigned"}
                      </div>
                    </div>
                    <div className="pz-activity-time">{scan.time}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="pz-table-empty">No recent QR scans found.</div>
            )}
          </div>
        </div>

        <div className="pz-admin-grid">
          <div className="pz-admin-card">
            <div className="pz-admin-card-header">
              <div className="pz-admin-card-title">Weekly QR Scans</div>
              <span className="pz-admin-badge gray">
                <Activity size={13} aria-hidden="true" />
                This week
              </span>
            </div>
            <div className="pz-chart-wrap">
              {loadingWeekly ? (
                <LineChartSkeleton />
              ) : weeklyScans.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={weeklyScans}>
                    <CartesianGrid stroke="#E2E6EE" vertical={false} />
                    <XAxis dataKey="day" tick={{ fill: "#8A96A8", fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "#8A96A8", fontSize: 12 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Line
                      type="monotone"
                      dataKey="scans"
                      stroke="#1B6ECC"
                      strokeWidth={3}
                      dot={{ fill: "#1B6ECC", r: 5, strokeWidth: 0 }}
                      activeDot={{ r: 7, fill: "#1A9E75" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="pz-chart-empty">No weekly scan data available.</div>
              )}
            </div>
          </div>

          <div className="pz-admin-card">
            <div className="pz-admin-card-header">
              <div className="pz-admin-card-title">System Snapshot</div>
              <span className="pz-admin-badge amber">
                <ScanLine size={13} aria-hidden="true" />
                QR
              </span>
            </div>
            {loadingSnapshot ? (
              <ActivityListSkeleton rows={3} />
            ) : (
              <div className="pz-activity-list">
              <div className="pz-activity-item">
                <div className="pz-activity-dot" />
                <div className="pz-activity-text">
                  <div className="pz-activity-title">Scans today</div>
                  <div className="pz-activity-detail">{todayScanTotal} verified scan events</div>
                </div>
              </div>
              <div className="pz-activity-item">
                <div className="pz-activity-dot" />
                <div className="pz-activity-text">
                  <div className="pz-activity-title">Recent records</div>
                  <div className="pz-activity-detail">{qrScans.length} latest pickup records loaded</div>
                </div>
              </div>
              <div className="pz-activity-item">
                <div className="pz-activity-dot" />
                <div className="pz-activity-text">
                  <div className="pz-activity-title">Verification mode</div>
                  <div className="pz-activity-detail">Existing Pickup Zone QR workflow</div>
                </div>
              </div>
            </div>
            )}
          </div>
        </div>

        <div className="pz-admin-card">
          <div className="pz-admin-card-header">
            <div className="pz-admin-card-title">Recent QR Code Scans</div>
            <span className="pz-admin-badge green">
              <span className="pz-admin-badge-dot" />
              {loadingRecent ? "Loading" : `${qrScans.length} records`}
            </span>
          </div>
          <div className="pz-table-wrap">
            <table className="pz-admin-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Guardian</th>
                  <th>Car</th>
                  <th>Time</th>
                  <th>Guard</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {loadingRecent ? (
                  <TableSkeletonRows />
                ) : (
                  <>
                    {qrScans.map((scan) => (
                      <tr key={scan.id}>
                        <td>
                          <div className="pz-student-cell">
                            <div className="pz-avatar">{initials(scan.studentName)}</div>
                            <div>
                              <div className="pz-student-name">{scan.studentName}</div>
                              <div className="pz-student-sub">{scan.date || "No date"}</div>
                            </div>
                          </div>
                        </td>
                        <td>{scan.guardianName || "N/A"}</td>
                        <td>{scan.carDescription || "N/A"}</td>
                        <td>{scan.time || "N/A"}</td>
                        <td>{scan.guardName || "N/A"}</td>
                        <td>
                          <span className={`pz-admin-badge ${statusClass(scan.status)}`}>
                            <span className="pz-admin-badge-dot" />
                            {scan.status || "Completed"}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {!qrScans.length && (
                      <tr>
                        <td colSpan={6}>
                          <div className="pz-table-empty">No recent QR scans found.</div>
                        </td>
                      </tr>
                    )}
                  </>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function PackageUsageCard({ usage }: { usage: PackageUsage | null }) {
  if (!usage) {
    return (
      <section className="pz-limit-card">
        <div className="pz-limit-header">
          <div>
            <div className="pz-limit-title">Package Usage</div>
            <div className="pz-limit-subtitle">No active package limits are available for this school.</div>
          </div>
          <span className="pz-admin-badge gray">
            <span className="pz-admin-badge-dot" />
            Not assigned
          </span>
        </div>
      </section>
    );
  }

  const resources = [
    { key: "students", label: "Students", unit: "" },
    { key: "families", label: "Families", unit: "" },
    { key: "guards", label: "Guards", unit: "" },
    { key: "storage", label: "Storage", unit: " MB" },
  ] as const;

  return (
    <section className="pz-limit-card">
      <div className="pz-limit-header">
        <div>
          <div className="pz-limit-title">Package Usage</div>
          <div className="pz-limit-subtitle">
            {usage.planName || "Current package"} / {usage.billingInterval || "monthly"} billing
          </div>
        </div>
        <span className={`pz-admin-badge ${statusClass(usage.status || "")}`}>
          <span className="pz-admin-badge-dot" />
          {usage.status || "Package"}
        </span>
      </div>
      <div className="pz-limit-grid">
        {resources.map((resource) => (
          <LimitMeter
            key={resource.key}
            label={resource.label}
            unit={resource.unit}
            usage={usage[resource.key] ?? { used: 0, limit: null }}
          />
        ))}
      </div>
    </section>
  );
}

function LimitMeter({
  label,
  unit,
  usage,
}: {
  label: string;
  unit: string;
  usage: PackageLimitUsage;
}) {
  const used = Number(usage.used || 0);
  const limit = usage.limit === null || usage.limit === undefined ? null : Number(usage.limit);
  const percent = limit === null
    ? 100
    : limit <= 0
      ? used > 0 ? 100 : 0
      : Math.min(100, Math.round((used / limit) * 100));
  const tone = limit !== null && percent >= 100 ? "red" : percent >= 85 ? "amber" : "";

  return (
    <div className="pz-limit-item">
      <div className="pz-limit-row">
        <div className="pz-limit-label">{label}</div>
        <div className="pz-limit-value">
          {formatUsageValue(used, unit)}/{limit === null ? "Unlimited" : formatUsageValue(limit, unit)}
        </div>
      </div>
      <div className="pz-limit-track" aria-label={`${label} package usage`}>
        <div className={`pz-limit-fill ${tone}`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

function formatUsageValue(value: number, unit: string) {
  const normalized = Number.isInteger(value) ? String(value) : value.toFixed(2);
  return `${normalized}${unit}`;
}

function PackageUsageSkeleton() {
  return (
    <section className="pz-limit-card">
      <div className="pz-limit-header">
        <div style={{ minWidth: 220 }}>
          <SkeletonLine width="52%" />
          <div style={{ marginTop: 8 }}>
            <SkeletonLine width="78%" />
          </div>
        </div>
        <SkeletonLine width="88px" />
      </div>
      <div className="pz-limit-grid">
        {Array.from({ length: 4 }).map((_, index) => (
          <div className="pz-limit-item" key={index}>
            <SkeletonLine width="66%" />
            <div style={{ marginTop: 12 }}>
              <SkeletonLine width="100%" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function SkeletonLine({ width = "100%" }: { width?: string }) {
  return <div className="pz-skeleton pz-skeleton-line" style={{ width }} />;
}

function KpiSkeletonCards({ muted = false }: { muted?: boolean }) {
  return (
    <>
      {statConfig.map((item) => (
        <div
          className="pz-kpi-card"
          key={item.name}
          style={{ "--accent-glow": muted ? "rgba(138,150,168,0.12)" : item.glow } as CSSProperties}
        >
          <div className="pz-kpi-top">
            <SkeletonLine width="44%" />
            <div className="pz-skeleton pz-skeleton-icon" />
          </div>
          <div className="pz-skeleton pz-skeleton-value" />
          <div className="pz-kpi-footer">
            <SkeletonLine width="70%" />
          </div>
        </div>
      ))}
    </>
  );
}

function BarChartSkeleton() {
  const heights = [38, 72, 48, 118, 88, 56, 132, 64];
  return (
    <div className="pz-chart-skeleton" aria-label="Loading chart">
      {heights.map((height, index) => (
        <div
          className="pz-skeleton pz-chart-skeleton-bar"
          key={index}
          style={{ height }}
        />
      ))}
    </div>
  );
}

function LineChartSkeleton() {
  return (
    <div className="pz-line-chart-skeleton" aria-label="Loading weekly chart">
      <div className="pz-skeleton" style={{ width: "92%" }} />
      <div className="pz-skeleton" style={{ width: "74%", marginLeft: "12%" }} />
      <div className="pz-skeleton" style={{ width: "86%", marginLeft: "4%" }} />
      <div className="pz-skeleton" style={{ width: "66%", marginLeft: "24%" }} />
    </div>
  );
}

function ActivityListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="pz-activity-list pz-activity-skeleton" aria-label="Loading activity">
      {Array.from({ length: rows }).map((_, index) => (
        <div className="pz-activity-item" key={index}>
          <div className="pz-skeleton" style={{ width: 9, height: 9, marginTop: 7 }} />
          <div className="pz-activity-text">
            <SkeletonLine width={index % 2 ? "58%" : "72%"} />
            <SkeletonLine width={index % 2 ? "82%" : "64%"} />
          </div>
          <div style={{ width: 52 }}>
            <SkeletonLine width="100%" />
          </div>
        </div>
      ))}
    </div>
  );
}

function TableSkeletonRows({ rows = 5 }: { rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, index) => (
        <tr className="pz-table-skeleton-row" key={index}>
          <td>
            <div className="pz-student-cell">
              <div className="pz-skeleton" style={{ width: 34, height: 34, borderRadius: 9 }} />
              <div style={{ flex: 1 }}>
                <div className="pz-skeleton pz-table-skeleton-cell" style={{ width: "128px", marginBottom: 7 }} />
                <div className="pz-skeleton pz-table-skeleton-cell" style={{ width: "86px" }} />
              </div>
            </div>
          </td>
          <td><div className="pz-skeleton pz-table-skeleton-cell" style={{ width: "120px" }} /></td>
          <td><div className="pz-skeleton pz-table-skeleton-cell" style={{ width: "110px" }} /></td>
          <td><div className="pz-skeleton pz-table-skeleton-cell" style={{ width: "70px" }} /></td>
          <td><div className="pz-skeleton pz-table-skeleton-cell" style={{ width: "90px" }} /></td>
          <td><div className="pz-skeleton pz-table-skeleton-cell" style={{ width: "78px" }} /></td>
        </tr>
      ))}
    </>
  );
}

const tooltipStyle = {
  border: "1px solid #E2E6EE",
  borderRadius: 10,
  boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
  fontSize: 12,
};
