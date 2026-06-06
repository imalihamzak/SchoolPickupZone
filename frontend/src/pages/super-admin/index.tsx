import { useEffect, useMemo, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  AlertTriangle,
  Building2,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  Download,
  FileBarChart,
  GraduationCap,
  Landmark,
  Plus,
  ReceiptText,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  UsersRound,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import axios from "axios";
import DashboardLayout from "@/components/layouts/dashboard-layout";
import { API_BASE_URL } from "@/lib/api/link";
import "./super-admin-theme.css";

type CountDatum = {
  name: string;
  count: number | string;
};

type RevenueDatum = {
  name: string;
  revenue: number | string;
};

type MonthDatum = {
  month: string;
  count: number | string;
};

type ChangeTrendDatum = {
  month: string;
  change_type: string;
  count: number | string;
};

type Stats = {
  totalSchools: number;
  activeSchools: number;
  suspendedSchools: number;
  totalRevenue: number;
  activeSubscriptions: number;
  mrr: number;
  arr: number;
  activeAdmins: number;
  totalStudents: number;
  totalParents: number;
  totalGuards: number;
  failedPayments: number;
  successfulPayments: number;
  totalPayments: number;
  completedPaymentAttempts: number;
  paymentSuccessRate: number;
  outstandingInvoices: number;
  outstandingAmount: number;
  averageStudentsPerSchool: number;
  newSchoolsThisMonth: number;
  churnRate: number;
  packageDistribution: CountDatum[];
  revenueByPackage: RevenueDatum[];
  newSchoolsByMonth: MonthDatum[];
  upgradeDowngradeTrends: ChangeTrendDatum[];
};

type StatCard = {
  name: string;
  value: string | number;
  helper: string;
  icon: LucideIcon;
  iconTone: CSSProperties;
  glow: string;
};

const chartColors = ["#1B6ECC", "#1A9E75", "#EF9F27", "#E24B4A", "#0B2E5A", "#64748B"];

const quickActions = [
  { name: "Add School", href: "/super-admin/schools", icon: Building2, tone: "blue" },
  { name: "Manage Packages", href: "/super-admin/subscriptions", icon: CircleDollarSign, tone: "amber" },
  { name: "Invoices", href: "/super-admin/subscriptions", icon: ReceiptText, tone: "green" },
  { name: "Admins", href: "/super-admin/admins", icon: ShieldCheck, tone: "gray" },
];

const defaultStats: Stats = {
  totalSchools: 0,
  activeSchools: 0,
  suspendedSchools: 0,
  totalRevenue: 0,
  activeSubscriptions: 0,
  mrr: 0,
  arr: 0,
  activeAdmins: 0,
  totalStudents: 0,
  totalParents: 0,
  totalGuards: 0,
  failedPayments: 0,
  successfulPayments: 0,
  totalPayments: 0,
  completedPaymentAttempts: 0,
  paymentSuccessRate: 0,
  outstandingInvoices: 0,
  outstandingAmount: 0,
  averageStudentsPerSchool: 0,
  newSchoolsThisMonth: 0,
  churnRate: 0,
  packageDistribution: [],
  revenueByPackage: [],
  newSchoolsByMonth: [],
  upgradeDowngradeTrends: [],
};

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState<Stats>(defaultStats);
  const [loadingStats, setLoadingStats] = useState(true);
  const [reportWindow, setReportWindow] = useState<3 | 6 | 12>(12);

  useEffect(() => {
    const fetchStats = async () => {
      setLoadingStats(true);
      try {
        const response = await axios.get(`${API_BASE_URL}/superadmin/dashboard-stats`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        setStats(normalizeStats(response.data));
      } catch (err) {
        console.error("Dashboard stats error:", err);
      } finally {
        setLoadingStats(false);
      }
    };

    fetchStats();
  }, []);

  const packageDistribution = useMemo(
    () =>
      stats.packageDistribution.map((item) => ({
        name: item.name || "Unassigned",
        value: numberValue(item.count),
      })),
    [stats.packageDistribution]
  );

  const revenueByPackage = useMemo(
    () =>
      stats.revenueByPackage.map((item) => ({
        name: item.name || "Unassigned",
        revenue: numberValue(item.revenue),
      })),
    [stats.revenueByPackage]
  );

  const newSchoolsTrend = useMemo(
    () =>
      [...stats.newSchoolsByMonth]
        .sort((a, b) => a.month.localeCompare(b.month))
        .slice(-reportWindow)
        .map((item) => ({
          month: formatMonth(item.month),
          schools: numberValue(item.count),
        })),
    [reportWindow, stats.newSchoolsByMonth]
  );

  const upgradeDowngradeTrend = useMemo(() => {
    const grouped = new Map<string, { rawMonth: string; month: string; upgrades: number; downgrades: number }>();

    stats.upgradeDowngradeTrends.forEach((item) => {
      const current = grouped.get(item.month) || {
        rawMonth: item.month,
        month: formatMonth(item.month),
        upgrades: 0,
        downgrades: 0,
      };

      if (item.change_type === "upgrade") {
        current.upgrades += numberValue(item.count);
      } else if (item.change_type === "downgrade") {
        current.downgrades += numberValue(item.count);
      }

      grouped.set(item.month, current);
    });

    return Array.from(grouped.values())
      .sort((a, b) => a.rawMonth.localeCompare(b.rawMonth))
      .slice(-reportWindow);
  }, [reportWindow, stats.upgradeDowngradeTrends]);

  const statCards = useMemo<StatCard[]>(
    () => [
      {
        name: "Total Schools",
        value: stats.totalSchools,
        helper: `${stats.activeSchools || 0} active / ${stats.suspendedSchools || 0} suspended`,
        icon: Building2,
        iconTone: { background: "#EFF6FF", color: "#1B6ECC" },
        glow: "rgba(27,110,204,0.16)",
      },
      {
        name: "Active Subscriptions",
        value: stats.activeSubscriptions,
        helper: "Schools currently billed",
        icon: ShieldCheck,
        iconTone: { background: "#E1F5EE", color: "#1A9E75" },
        glow: "rgba(26,158,117,0.16)",
      },
      {
        name: "MRR",
        value: formatCurrency(stats.mrr),
        helper: `${formatCurrency(stats.arr)} ARR`,
        icon: CircleDollarSign,
        iconTone: { background: "#FEF3DC", color: "#EF9F27" },
        glow: "rgba(239,159,39,0.16)",
      },
      {
        name: "Total Revenue",
        value: formatCurrency(stats.totalRevenue),
        helper: `${stats.successfulPayments || 0} successful payments`,
        icon: Landmark,
        iconTone: { background: "#F4F6FA", color: "#0B2E5A" },
        glow: "rgba(7,29,59,0.14)",
      },
      {
        name: "Outstanding Invoices",
        value: stats.outstandingInvoices,
        helper: `${formatCurrency(stats.outstandingAmount)} outstanding`,
        icon: ReceiptText,
        iconTone: { background: "#FDEAEA", color: "#E24B4A" },
        glow: "rgba(226,75,74,0.14)",
      },
      {
        name: "Payment Success",
        value: formatPercent(stats.paymentSuccessRate),
        helper: `${stats.failedPayments || 0} failed retry log${stats.failedPayments === 1 ? "" : "s"}`,
        icon: CheckCircle2,
        iconTone: { background: "#E1F5EE", color: "#1A9E75" },
        glow: "rgba(26,158,117,0.16)",
      },
      {
        name: "Average Students",
        value: stats.averageStudentsPerSchool,
        helper: `${stats.totalStudents || 0} students across schools`,
        icon: GraduationCap,
        iconTone: { background: "#EFF6FF", color: "#1B6ECC" },
        glow: "rgba(27,110,204,0.16)",
      },
      {
        name: "Total Families",
        value: stats.totalParents,
        helper: "Parent/family accounts across the platform",
        icon: UsersRound,
        iconTone: { background: "#E1F5EE", color: "#1A9E75" },
        glow: "rgba(26,158,117,0.16)",
      },
      {
        name: "Total Guards",
        value: stats.totalGuards,
        helper: "Guard accounts across all schools",
        icon: ShieldCheck,
        iconTone: { background: "#F4F6FA", color: "#0B2E5A" },
        glow: "rgba(7,29,59,0.14)",
      },
      {
        name: "Churn Rate",
        value: formatPercent(stats.churnRate),
        helper: `${stats.newSchoolsThisMonth || 0} new schools this month`,
        icon: TrendingDown,
        iconTone: { background: "#FEF3DC", color: "#EF9F27" },
        glow: "rgba(239,159,39,0.16)",
      },
    ],
    [stats]
  );

  return (
    <DashboardLayout role="super-admin">
      <div className="pz-super-page">
        <div className="pz-super-header">
          <div>
            <div className="pz-super-kicker">Super Admin</div>
            <h1 className="pz-super-title">Dashboard</h1>
            <div className="pz-super-subtitle">
              Platform analytics, billing health, package movement, and school growth.
            </div>
          </div>
          <div className="pz-super-actions">
            <div className="pz-super-date-pill">
              <CalendarDays size={15} aria-hidden="true" />
              {new Date().toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
              })}
            </div>
            <button
              type="button"
              className="pz-super-button"
              onClick={() => exportDashboardReport(stats)}
            >
              <Download size={15} aria-hidden="true" />
              Export Report
            </button>
            <Link to="/super-admin/schools" className="pz-super-button primary">
              <Plus size={15} aria-hidden="true" />
              Add School
            </Link>
          </div>
        </div>

        <div className="pz-super-kpi-grid">
          {loadingStats ? (
            <SuperKpiSkeletonCards />
          ) : (
            statCards.map((stat) => {
              const Icon = stat.icon;
              return (
                <div
                  className="pz-super-kpi-card"
                  key={stat.name}
                  style={{ "--accent-glow": stat.glow } as CSSProperties}
                >
                  <div className="pz-super-kpi-top">
                    <div className="pz-super-kpi-label">{stat.name}</div>
                    <div className="pz-super-kpi-icon" style={stat.iconTone}>
                      <Icon aria-hidden="true" />
                    </div>
                  </div>
                  <div className="pz-super-kpi-value">{stat.value}</div>
                  <div className="pz-super-kpi-footer">
                    <CheckCircle2 aria-hidden="true" />
                    <span>{stat.helper}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <section className="pz-super-card pz-super-report-card">
          <div className="pz-super-card-header">
            <div>
              <div className="pz-super-card-title">Analytics Report</div>
              <div className="pz-super-subtitle" style={{ marginTop: 4 }}>
                Revenue, package distribution, growth, and plan movement.
              </div>
            </div>
            <div className="pz-super-tabs" role="tablist" aria-label="Report period">
              {[3, 6, 12].map((monthCount) => (
                <button
                  key={monthCount}
                  type="button"
                  className={`pz-super-tab ${reportWindow === monthCount ? "active" : ""}`}
                  onClick={() => setReportWindow(monthCount as 3 | 6 | 12)}
                >
                  {monthCount}M
                </button>
              ))}
            </div>
          </div>

          <div className="pz-super-chart-grid">
            {loadingStats ? (
              <>
                <ChartPanel title="Revenue By Package" badge="Loading" empty={false}>
                  <BarChartSkeleton />
                </ChartPanel>
                <ChartPanel title="Package Distribution" badge="Loading" empty={false}>
                  <BarChartSkeleton />
                </ChartPanel>
                <ChartPanel title="New Schools Per Month" badge="Loading" empty={false}>
                  <LineChartSkeleton />
                </ChartPanel>
                <ChartPanel title="Upgrade And Downgrade Trends" badge="Loading" empty={false}>
                  <BarChartSkeleton />
                </ChartPanel>
              </>
            ) : (
              <>
                <ChartPanel
                  title="Revenue By Package"
                  badge={`${formatCurrency(stats.totalRevenue)} total`}
                  empty={!revenueByPackage.length}
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={revenueByPackage} margin={{ top: 6, right: 8, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E6EE" />
                      <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#8A96A8" }} />
                      <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#8A96A8" }} />
                      <Tooltip formatter={(value) => formatCurrency(Number(value))} contentStyle={tooltipStyle} />
                      <Bar dataKey="revenue" radius={[8, 8, 0, 0]} fill="#1B6ECC" />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartPanel>

                <ChartPanel
                  title="Package Distribution"
                  badge={`${stats.activeSubscriptions} active`}
                  empty={!packageDistribution.length}
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={packageDistribution}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={54}
                        outerRadius={84}
                        paddingAngle={3}
                      >
                        {packageDistribution.map((entry, index) => (
                          <Cell key={entry.name} fill={chartColors[index % chartColors.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `${value} school${Number(value) === 1 ? "" : "s"}`} contentStyle={tooltipStyle} />
                      <Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartPanel>

                <ChartPanel
                  title="New Schools Per Month"
                  badge={`${stats.newSchoolsThisMonth} this month`}
                  empty={!newSchoolsTrend.length}
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={newSchoolsTrend} margin={{ top: 6, right: 8, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E6EE" />
                      <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#8A96A8" }} />
                      <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#8A96A8" }} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Line type="monotone" dataKey="schools" stroke="#1A9E75" strokeWidth={3} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartPanel>

                <ChartPanel
                  title="Upgrade And Downgrade Trends"
                  badge={`${formatPercent(stats.churnRate)} churn`}
                  empty={!upgradeDowngradeTrend.length}
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={upgradeDowngradeTrend} margin={{ top: 6, right: 8, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E6EE" />
                      <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#8A96A8" }} />
                      <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#8A96A8" }} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      <Bar dataKey="upgrades" fill="#1A9E75" radius={[8, 8, 0, 0]} />
                      <Bar dataKey="downgrades" fill="#E24B4A" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartPanel>
              </>
            )}
          </div>
        </section>

        <div className="pz-super-grid">
          <section className="pz-super-card">
            <div className="pz-super-card-header">
              <div>
                <div className="pz-super-card-title">Billing Health</div>
                <div className="pz-super-subtitle" style={{ marginTop: 4 }}>
                  Subscription risk and payment follow-up summary.
                </div>
              </div>
              <span className={`pz-super-badge ${stats.outstandingInvoices ? "amber" : "green"}`}>
                {stats.outstandingInvoices ? <AlertTriangle size={13} aria-hidden="true" /> : <CheckCircle2 size={13} aria-hidden="true" />}
                {stats.outstandingInvoices ? "Needs review" : "Clear"}
              </span>
            </div>
            {loadingStats ? (
              <ReportListSkeleton />
            ) : (
              <div className="pz-super-report-list">
                <ReportRow label="Outstanding invoices" value={stats.outstandingInvoices} />
                <ReportRow label="Outstanding amount" value={formatCurrency(stats.outstandingAmount)} />
                <ReportRow label="Payment success rate" value={formatPercent(stats.paymentSuccessRate)} />
                <ReportRow label="Failed retry logs" value={stats.failedPayments} />
                <ReportRow label="Average students per school" value={stats.averageStudentsPerSchool} />
              </div>
            )}
          </section>

          <section className="pz-super-card">
            <div className="pz-super-card-header">
              <div className="pz-super-card-title">Quick Actions</div>
              <span className="pz-super-badge blue">
                <FileBarChart size={13} aria-hidden="true" />
                Console
              </span>
            </div>
            <div className="pz-super-list">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <Link to={action.href} className="pz-super-list-item" key={action.name}>
                    <div className="pz-super-avatar">
                      <Icon size={17} aria-hidden="true" />
                    </div>
                    <div className="pz-super-list-main">
                      <div className="pz-super-list-title">{action.name}</div>
                      <div className="pz-super-list-detail">Open {action.name.toLowerCase()}</div>
                    </div>
                    <span className={`pz-super-badge ${action.tone}`}>Open</span>
                  </Link>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </DashboardLayout>
  );
}

function ChartPanel({
  title,
  badge,
  empty,
  children,
}: {
  title: string;
  badge: string;
  empty: boolean;
  children: ReactNode;
}) {
  return (
    <div className="pz-super-chart-panel">
      <div className="pz-super-chart-head">
        <div className="pz-super-card-title">{title}</div>
        <span className="pz-super-badge gray">{badge}</span>
      </div>
      <div className="pz-super-chart">
        {empty ? <div className="pz-super-empty compact">No data available yet.</div> : children}
      </div>
    </div>
  );
}

function ReportRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="pz-super-report-row">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function SkeletonLine({ width = "100%" }: { width?: string }) {
  return <div className="pz-skeleton pz-skeleton-line" style={{ width }} />;
}

function SuperKpiSkeletonCards() {
  const skeletonCards = [
    "Total Schools",
    "Active Subscriptions",
    "MRR",
    "Total Revenue",
    "Outstanding Invoices",
    "Payment Success",
    "Average Students",
    "Total Families",
    "Total Guards",
    "Churn Rate",
  ];

  return (
    <>
      {skeletonCards.map((name) => (
        <div
          className="pz-super-kpi-card"
          key={name}
          style={{ "--accent-glow": "rgba(138,150,168,0.12)" } as CSSProperties}
        >
          <div className="pz-super-kpi-top">
            <SkeletonLine width="44%" />
            <div className="pz-skeleton pz-skeleton-icon" />
          </div>
          <div className="pz-skeleton pz-skeleton-value" />
          <div className="pz-super-kpi-footer">
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
        <div className="pz-skeleton pz-chart-skeleton-bar" key={index} style={{ height }} />
      ))}
    </div>
  );
}

function LineChartSkeleton() {
  return (
    <div className="pz-line-chart-skeleton" aria-label="Loading trend chart">
      <div className="pz-skeleton" style={{ width: "92%" }} />
      <div className="pz-skeleton" style={{ width: "74%", marginLeft: "12%" }} />
      <div className="pz-skeleton" style={{ width: "86%", marginLeft: "4%" }} />
      <div className="pz-skeleton" style={{ width: "66%", marginLeft: "24%" }} />
    </div>
  );
}

function ReportListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="pz-super-report-list pz-activity-skeleton" aria-label="Loading billing health">
      {Array.from({ length: rows }).map((_, index) => (
        <div className="pz-super-report-row" key={index}>
          <SkeletonLine width={index % 2 ? "44%" : "58%"} />
          <div style={{ width: 82 }}>
            <SkeletonLine width="100%" />
          </div>
        </div>
      ))}
    </div>
  );
}

function normalizeStats(data: Partial<Stats>): Stats {
  return {
    ...defaultStats,
    ...data,
    totalSchools: numberValue(data.totalSchools),
    activeSchools: numberValue(data.activeSchools),
    suspendedSchools: numberValue(data.suspendedSchools),
    totalRevenue: numberValue(data.totalRevenue),
    activeSubscriptions: numberValue(data.activeSubscriptions),
    mrr: numberValue(data.mrr),
    arr: numberValue(data.arr),
    activeAdmins: numberValue(data.activeAdmins),
    totalStudents: numberValue(data.totalStudents),
    totalParents: numberValue(data.totalParents),
    totalGuards: numberValue(data.totalGuards),
    failedPayments: numberValue(data.failedPayments),
    successfulPayments: numberValue(data.successfulPayments),
    totalPayments: numberValue(data.totalPayments),
    completedPaymentAttempts: numberValue(data.completedPaymentAttempts),
    paymentSuccessRate: numberValue(data.paymentSuccessRate),
    outstandingInvoices: numberValue(data.outstandingInvoices),
    outstandingAmount: numberValue(data.outstandingAmount),
    averageStudentsPerSchool: numberValue(data.averageStudentsPerSchool),
    newSchoolsThisMonth: numberValue(data.newSchoolsThisMonth),
    churnRate: numberValue(data.churnRate),
    packageDistribution: Array.isArray(data.packageDistribution) ? data.packageDistribution : [],
    revenueByPackage: Array.isArray(data.revenueByPackage) ? data.revenueByPackage : [],
    newSchoolsByMonth: Array.isArray(data.newSchoolsByMonth) ? data.newSchoolsByMonth : [],
    upgradeDowngradeTrends: Array.isArray(data.upgradeDowngradeTrends) ? data.upgradeDowngradeTrends : [],
  };
}

function exportDashboardReport(stats: Stats) {
  const rows: Array<Array<string | number>> = [
    ["Metric", "Value"],
    ["Total schools", stats.totalSchools],
    ["Active schools", stats.activeSchools],
    ["Suspended schools", stats.suspendedSchools],
    ["Active subscriptions", stats.activeSubscriptions],
    ["Total revenue", stats.totalRevenue],
    ["MRR", stats.mrr],
    ["ARR", stats.arr],
    ["Total families", stats.totalParents],
    ["Total guards", stats.totalGuards],
    ["Payment success rate", stats.paymentSuccessRate],
    ["Outstanding invoices", stats.outstandingInvoices],
    ["Outstanding amount", stats.outstandingAmount],
    ["Average students per school", stats.averageStudentsPerSchool],
    ["New schools this month", stats.newSchoolsThisMonth],
    ["Churn rate", stats.churnRate],
    [],
    ["Package distribution", "Schools"],
    ...stats.packageDistribution.map((item) => [item.name, numberValue(item.count)]),
    [],
    ["Revenue by package", "Revenue"],
    ...stats.revenueByPackage.map((item) => [item.name, numberValue(item.revenue)]),
    [],
    ["New schools by month", "Schools"],
    ...stats.newSchoolsByMonth.map((item) => [item.month, numberValue(item.count)]),
    [],
    ["Plan movement month", "Change type", "Count"],
    ...stats.upgradeDowngradeTrends.map((item) => [item.month, item.change_type, numberValue(item.count)]),
  ];

  downloadCsv(`super-admin-report-${new Date().toISOString().slice(0, 10)}.csv`, rows);
}

function downloadCsv(filename: string, rows: Array<Array<string | number>>) {
  const csv = rows
    .map((row) =>
      row
        .map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`)
        .join(",")
    )
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function numberValue(value: unknown) {
  const normalized = Number(value ?? 0);
  return Number.isFinite(normalized) ? normalized : 0;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function formatPercent(value: number) {
  return `${numberValue(value).toFixed(1).replace(/\.0$/, "")}%`;
}

function formatMonth(value: string) {
  if (!value) return "N/A";
  const [year, month] = value.split("-");
  const date = new Date(Number(year), Number(month || 1) - 1, 1);
  return date.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
}

const tooltipStyle = {
  border: "1px solid #E2E6EE",
  borderRadius: 10,
  boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
  fontSize: 12,
};
