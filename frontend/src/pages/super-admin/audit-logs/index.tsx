import { useEffect, useMemo, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import axios from "axios";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Download,
  Search,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import DashboardLayout from "@/components/layouts/dashboard-layout";
import { AdminSelect } from "@/components/ui/admin-controls";
import { toast } from "@/components/ui/toast";
import { API_BASE_URL } from "@/lib/api/link";
import "../super-admin-theme.css";

type AuditLog = {
  id: number;
  actor_id: number | null;
  actor_role: string | null;
  actor_email: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  entity_name: string | null;
  status: "success" | "failed";
  request_method: string | null;
  request_path: string | null;
  ip_address: string | null;
  user_agent: string | null;
  metadata: any;
  error_message: string | null;
  created_at: string;
};

type AuditSummary = {
  total: number;
  successful: number;
  failed: number;
  actors: number;
};

const defaultSummary: AuditSummary = {
  total: 0,
  successful: 0,
  failed: 0,
  actors: 0,
};

const statusOptions = [
  { value: "all", label: "All Statuses" },
  { value: "success", label: "Success" },
  { value: "failed", label: "Failed" },
];

const entityOptions = [
  { value: "all", label: "All Entities" },
  { value: "school", label: "Schools" },
  { value: "admin", label: "Admins" },
  { value: "package", label: "Packages" },
  { value: "subscription", label: "Subscriptions" },
  { value: "billing_retry", label: "Billing Retries" },
];

const actionOptions = [
  { value: "all", label: "All Actions" },
  { value: "school.create", label: "School Created" },
  { value: "school.update", label: "School Updated" },
  { value: "school.suspend", label: "School Suspended" },
  { value: "school.reactivate", label: "School Reactivated" },
  { value: "school.delete", label: "School Deleted" },
  { value: "admin.create", label: "Admin Created" },
  { value: "admin.update", label: "Admin Updated" },
  { value: "admin.delete", label: "Admin Deleted" },
  { value: "package.create", label: "Package Created" },
  { value: "package.update", label: "Package Updated" },
  { value: "package.delete", label: "Package Deleted" },
  { value: "subscription.cancel", label: "Subscription Cancelled" },
  { value: "subscription.reactivate", label: "Subscription Reactivated" },
  { value: "subscription.change_plan", label: "Package Changed" },
  { value: "billing.process_retries", label: "Retries Processed" },
];

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [summary, setSummary] = useState<AuditSummary>(defaultSummary);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [entityFilter, setEntityFilter] = useState("all");
  const [actionFilter, setActionFilter] = useState("all");

  const authHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  });

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ limit: "250" });
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (entityFilter !== "all") params.set("entity_type", entityFilter);
      if (actionFilter !== "all") params.set("action", actionFilter);
      if (search.trim()) params.set("search", search.trim());

      const response = await axios.get(`${API_BASE_URL}/superadmin/audit-logs?${params.toString()}`, {
        headers: authHeaders(),
      });

      setLogs(Array.isArray(response.data.logs) ? response.data.logs : []);
      setSummary(response.data.summary || defaultSummary);
    } catch (error: any) {
      console.error("Failed to load audit logs:", error);
      toast.error(error.response?.data?.error || "Failed to load audit logs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(fetchAuditLogs, 200);
    return () => window.clearTimeout(timer);
  }, [search, statusFilter, entityFilter, actionFilter]);

  const filteredFailureCount = useMemo(
    () => logs.filter((log) => log.status === "failed").length,
    [logs]
  );

  return (
    <DashboardLayout role="super-admin">
      <div className="pz-super-page">
        <div className="pz-super-header">
          <div>
            <div className="pz-super-kicker">Security</div>
            <h1 className="pz-super-title">Audit Logs</h1>
            <div className="pz-super-subtitle">
              Review Super Admin changes across schools, packages, admins, subscriptions, and billing retries.
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
            <button type="button" className="pz-super-button" onClick={() => exportAuditLogs(logs)}>
              <Download size={15} aria-hidden="true" />
              Export
            </button>
          </div>
        </div>

        <div className="pz-super-kpi-grid compact">
          <SummaryCard
            label="Total Events"
            value={summary.total}
            helper="All retained audit entries"
            icon={<ClipboardList aria-hidden="true" />}
            tone={{ background: "#EFF6FF", color: "#1B6ECC" }}
            glow="rgba(27,110,204,0.16)"
          />
          <SummaryCard
            label="Successful"
            value={summary.successful}
            helper="Completed Super Admin actions"
            icon={<CheckCircle2 aria-hidden="true" />}
            tone={{ background: "#E1F5EE", color: "#1A9E75" }}
            glow="rgba(26,158,117,0.16)"
          />
          <SummaryCard
            label="Failed"
            value={summary.failed}
            helper={`${filteredFailureCount} in current view`}
            icon={<AlertTriangle aria-hidden="true" />}
            tone={{ background: "#FDEAEA", color: "#E24B4A" }}
            glow="rgba(226,75,74,0.14)"
          />
          <SummaryCard
            label="Actors"
            value={summary.actors}
            helper="Super Admin accounts recorded"
            icon={<UserRound aria-hidden="true" />}
            tone={{ background: "#F4F6FA", color: "#0B2E5A" }}
            glow="rgba(7,29,59,0.14)"
          />
        </div>

        <section className="pz-super-card">
          <div className="pz-super-card-header">
            <div>
              <div className="pz-super-card-title">Audit Trail</div>
              <div className="pz-super-subtitle" style={{ marginTop: 4 }}>
                Showing latest 250 matching records.
              </div>
            </div>
            <span className={`pz-super-badge ${summary.failed ? "amber" : "green"}`}>
              <ShieldCheck size={13} aria-hidden="true" />
              {summary.failed ? "Review failures" : "Clean"}
            </span>
          </div>

          <div className="pz-super-toolbar">
            <div className="pz-super-search">
              <Search size={16} aria-hidden="true" />
              <input
                type="text"
                placeholder="Search actor, action, entity, or path..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
            <AdminSelect
              value={statusFilter}
              onChange={setStatusFilter}
              options={statusOptions}
              ariaLabel="Audit status"
            />
            <AdminSelect
              value={entityFilter}
              onChange={setEntityFilter}
              options={entityOptions}
              ariaLabel="Audit entity"
            />
            <AdminSelect
              value={actionFilter}
              onChange={setActionFilter}
              options={actionOptions}
              ariaLabel="Audit action"
            />
          </div>

          {loading ? (
            <div className="pz-super-loading">Loading audit logs...</div>
          ) : logs.length ? (
            <AuditTable logs={logs} />
          ) : (
            <div className="pz-super-empty">No audit records match the current filters.</div>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}

function SummaryCard({
  label,
  value,
  helper,
  icon,
  tone,
  glow,
}: {
  label: string;
  value: string | number;
  helper: string;
  icon: ReactNode;
  tone: CSSProperties;
  glow: string;
}) {
  return (
    <div className="pz-super-kpi-card" style={{ "--accent-glow": glow } as CSSProperties}>
      <div className="pz-super-kpi-top">
        <div className="pz-super-kpi-label">{label}</div>
        <div className="pz-super-kpi-icon" style={tone}>
          {icon}
        </div>
      </div>
      <div className="pz-super-kpi-value">{value}</div>
      <div className="pz-super-kpi-footer">
        <CheckCircle2 aria-hidden="true" />
        <span>{helper}</span>
      </div>
    </div>
  );
}

function AuditTable({ logs }: { logs: AuditLog[] }) {
  return (
    <div className="pz-super-table-wrap">
      <table className="pz-super-table">
        <thead>
          <tr>
            <th>Time</th>
            <th>Actor</th>
            <th>Action</th>
            <th>Entity</th>
            <th>Status</th>
            <th>Request</th>
            <th>Details</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr key={log.id}>
              <td>{formatDateTime(log.created_at)}</td>
              <td>
                <div className="pz-super-entity-name">{log.actor_email || "Unknown"}</div>
                <div className="pz-super-entity-sub">{log.actor_role || "N/A"}</div>
              </td>
              <td>
                <div className="pz-super-entity-name">{formatAction(log.action)}</div>
                <div className="pz-super-entity-sub">{log.action}</div>
              </td>
              <td>
                <div className="pz-super-entity-name">{log.entity_name || log.entity_id || "N/A"}</div>
                <div className="pz-super-entity-sub">{log.entity_type}</div>
              </td>
              <td>
                <span className={`pz-super-badge ${log.status === "success" ? "green" : "red"}`}>
                  {log.status}
                </span>
              </td>
              <td>
                <div className="pz-super-entity-name">{log.request_method || "N/A"}</div>
                <div className="pz-super-entity-sub">{log.request_path || "N/A"}</div>
              </td>
              <td>
                <div className="pz-super-entity-name">{log.error_message || summarizeMetadata(log.metadata)}</div>
                <div className="pz-super-entity-sub">{log.ip_address || "No IP recorded"}</div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function formatAction(action: string) {
  return action
    .split(".")
    .map((part) => part.replace(/_/g, " "))
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function summarizeMetadata(metadata: any) {
  if (!metadata) return "No details";
  if (metadata.response?.message) return metadata.response.message;
  if (metadata.response?.processed !== undefined) return `${metadata.response.processed} retry attempts processed`;
  if (metadata.body?.status) return `Status: ${metadata.body.status}`;
  if (metadata.body?.plan_id) return `Package ID: ${metadata.body.plan_id}`;
  return "View exported CSV for full metadata";
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  return date.toLocaleString();
}

function exportAuditLogs(logs: AuditLog[]) {
  const rows: Array<Array<string | number>> = [
    ["Time", "Actor", "Role", "Action", "Entity Type", "Entity", "Status", "Method", "Path", "IP", "Error", "Metadata"],
    ...logs.map((log) => [
      log.created_at || "",
      log.actor_email || "",
      log.actor_role || "",
      log.action,
      log.entity_type,
      log.entity_name || log.entity_id || "",
      log.status,
      log.request_method || "",
      log.request_path || "",
      log.ip_address || "",
      log.error_message || "",
      JSON.stringify(log.metadata || {}),
    ]),
  ];

  downloadCsv(`super-admin-audit-logs-${new Date().toISOString().slice(0, 10)}.csv`, rows);
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
