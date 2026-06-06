import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  RefreshCw,
  Save,
  ShieldCheck,
  Smartphone,
  UsersRound,
} from "lucide-react";
import DashboardLayout from "@/components/layouts/dashboard-layout";
import { AdminDatePicker } from "@/components/ui/admin-controls";
import { toast } from "@/components/ui/toast";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import AdminPageSkeleton from "@/components/ui/AdminPageSkeleton";
import { API_BASE_URL } from "@/lib/api/link";

type DutyRole = "scanner" | "release" | "both" | null;

type RosterGuard = {
  id: number;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  phone?: string | null;
  status?: string | null;
  deviceCount: number;
  dutyRole: DutyRole;
  isOnDuty: boolean;
};

type RosterResponse = {
  date: string;
  guards: RosterGuard[];
  summary: {
    scanner: number;
    release: number;
    both: number;
    off: number;
  };
};

const DUTY_ROSTER_CSS = `
.pz-duty-page {
  --navy: #071D3B;
  --blue: #1B6ECC;
  --teal: #1A9E75;
  --teal-light: #2DC98F;
  --teal-pale: #E1F5EE;
  --amber: #EF9F27;
  --amber-pale: #FEF3DC;
  --red-pale: #FDEAEA;
  --white: #FFFFFF;
  --surface: #F4F6FA;
  --border: #E2E6EE;
  --text-1: #0A1628;
  --text-2: #4A5568;
  --text-3: #8A96A8;
  color: var(--text-1);
  font-family: 'DM Sans', 'Segoe UI', Arial, sans-serif;
}

.pz-duty-page,
.pz-duty-page * {
  box-sizing: border-box;
}

.pz-duty-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 18px;
  margin-bottom: 24px;
}

.pz-duty-kicker {
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

.pz-duty-kicker::before {
  content: "";
  width: 18px;
  height: 2px;
  border-radius: 999px;
  background: currentColor;
}

.pz-duty-title {
  margin: 0;
  color: var(--text-1);
  font-family: 'Inter', 'Segoe UI', Arial, sans-serif;
  font-size: clamp(28px, 3.2vw, 42px);
  line-height: 1.04;
  font-weight: 700;
  letter-spacing: 0;
}

.pz-duty-subtitle {
  margin-top: 8px;
  color: var(--text-3);
  font-size: 14px;
  line-height: 1.6;
  max-width: 760px;
}

.pz-duty-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  flex-wrap: wrap;
}

.pz-duty-date-wrap {
  min-width: 170px;
}

.pz-duty-button {
  min-height: 38px;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--white);
  color: var(--text-2);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 0 14px;
  font-size: 13px;
  font-weight: 800;
  cursor: pointer;
  transition: all 0.18s ease;
}

.pz-duty-button:hover:not(:disabled) {
  color: var(--blue);
  border-color: rgba(27,110,204,0.36);
  background: #EFF6FF;
}

.pz-duty-button.primary {
  border-color: var(--teal);
  background: var(--teal);
  color: var(--white);
}

.pz-duty-button.primary:hover:not(:disabled) {
  border-color: var(--teal-light);
  background: var(--teal-light);
  color: var(--white);
}

.pz-duty-button:disabled {
  opacity: 0.62;
  cursor: not-allowed;
}

.pz-duty-stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
  margin-bottom: 18px;
}

.pz-duty-stat {
  background: var(--white);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 16px;
  min-height: 118px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
}

button.pz-duty-stat {
  width: 100%;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.pz-duty-stat-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.pz-duty-stat-label {
  color: var(--text-3);
  font-size: 12px;
  font-weight: 800;
}

.pz-duty-stat-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: grid;
  place-items: center;
  background: var(--teal-pale);
  color: var(--teal);
}

.pz-duty-stat-value {
  margin-top: 14px;
  color: var(--text-1);
  font-family: 'Inter', 'Segoe UI', Arial, sans-serif;
  font-size: 28px;
  font-weight: 800;
  line-height: 1;
}

.pz-duty-stat-helper {
  margin-top: 7px;
  color: var(--text-3);
  font-size: 12px;
}

.pz-duty-panel {
  background: var(--white);
  border: 1px solid var(--border);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
}

.pz-duty-panel-head {
  min-height: 72px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 18px 20px;
  border-bottom: 1px solid var(--border);
}

.pz-duty-panel-title {
  color: var(--text-1);
  font-family: 'Inter', 'Segoe UI', Arial, sans-serif;
  font-size: 16px;
  font-weight: 800;
}

.pz-duty-panel-subtitle {
  margin-top: 4px;
  color: var(--text-3);
  font-size: 12px;
}

.pz-duty-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border-radius: 999px;
  padding: 5px 10px;
  background: var(--teal-pale);
  color: #065F46;
  font-size: 11px;
  font-weight: 900;
  white-space: nowrap;
}

.pz-duty-table-wrap {
  overflow-x: auto;
}

.pz-duty-table {
  width: 100%;
  border-collapse: collapse;
}

.pz-duty-table th {
  text-align: left;
  background: var(--surface);
  color: var(--text-3);
  font-size: 11px;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border);
  white-space: nowrap;
}

.pz-duty-table td {
  padding: 14px 16px;
  border-bottom: 1px solid var(--border);
  vertical-align: middle;
  color: var(--text-2);
  font-size: 13px;
}

.pz-duty-table tbody tr:last-child td {
  border-bottom: 0;
}

.pz-duty-person {
  display: grid;
  grid-template-columns: 42px minmax(0, 1fr);
  gap: 11px;
  align-items: center;
  min-width: 240px;
}

.pz-duty-avatar {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  background: linear-gradient(135deg, var(--navy), #123B75);
  color: var(--white);
  display: grid;
  place-items: center;
  font-family: 'Inter', 'Segoe UI', Arial, sans-serif;
  font-size: 12px;
  font-weight: 900;
}

.pz-duty-name {
  color: var(--text-1);
  font-size: 14px;
  font-weight: 900;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pz-duty-meta {
  margin-top: 3px;
  color: var(--text-3);
  font-size: 12px;
}

.pz-duty-status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border-radius: 999px;
  padding: 5px 10px;
  background: var(--surface);
  color: var(--text-2);
  font-size: 11px;
  font-weight: 900;
  text-transform: capitalize;
}

.pz-duty-status.active {
  background: var(--teal-pale);
  color: #065F46;
}

.pz-duty-status.inactive {
  background: var(--red-pale);
  color: #991B1B;
}

.pz-duty-dot {
  width: 6px;
  height: 6px;
  border-radius: 999px;
  background: currentColor;
}

.pz-duty-role-control {
  display: inline-flex;
  gap: 4px;
  padding: 4px;
  border: 1px solid var(--border);
  border-radius: 11px;
  background: var(--surface);
}

.pz-duty-role-button {
  min-width: 76px;
  min-height: 32px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: var(--text-3);
  font-size: 12px;
  font-weight: 900;
  cursor: pointer;
  transition: all 0.18s ease;
}

.pz-duty-role-button.active {
  background: var(--white);
  color: var(--text-1);
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
}

.pz-duty-role-button.scanner.active {
  color: var(--blue);
}

.pz-duty-role-button.release.active,
.pz-duty-role-button.both.active {
  color: var(--teal);
}

.pz-duty-empty {
  min-height: 280px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: var(--text-3);
  text-align: center;
  padding: 40px 22px;
}

.pz-duty-empty-icon {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  background: var(--surface);
  border: 1px solid var(--border);
  color: var(--teal);
  display: grid;
  place-items: center;
}

@media (max-width: 980px) {
  .pz-duty-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .pz-duty-actions {
    width: 100%;
    justify-content: stretch;
  }

  .pz-duty-date-wrap,
  .pz-duty-button {
    flex: 1 1 160px;
  }

  .pz-duty-stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .pz-duty-stats {
    grid-template-columns: 1fr;
  }

  .pz-duty-panel-head {
    align-items: flex-start;
    flex-direction: column;
  }

  .pz-duty-role-control {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    width: 100%;
  }

  .pz-duty-role-button {
    min-width: 0;
  }
}
`;

const roleOptions: Array<{ value: DutyRole; label: string; className: string }> = [
  { value: null, label: "Off", className: "off" },
  { value: "scanner", label: "Scanner", className: "scanner" },
  { value: "release", label: "Release", className: "release" },
  { value: "both", label: "Both", className: "both" },
];

export default function DutyRoster() {
  const [date, setDate] = useState(() => formatYmd(new Date()));
  const [guards, setGuards] = useState<RosterGuard[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dutyFilter, setDutyFilter] = useState<"scanner" | "release" | "both" | "available" | null>(null);

  const summary = useMemo(() => {
    const scanner = guards.filter((guard) => guard.dutyRole === "scanner" || guard.dutyRole === "both").length;
    const release = guards.filter((guard) => guard.dutyRole === "release" || guard.dutyRole === "both").length;
    const both = guards.filter((guard) => guard.dutyRole === "both").length;
    const off = guards.length - guards.filter((guard) => guard.dutyRole).length;
    return { scanner, release, both, off };
  }, [guards]);

  const activeGuards = guards.filter((guard) => String(guard.status || "").toLowerCase() === "active");
  const displayedGuards = dutyFilter === null
    ? guards
    : guards.filter((guard) => {
        if (dutyFilter === "available") return String(guard.status || "").toLowerCase() === "active";
        if (dutyFilter === "both") return guard.dutyRole === "both";
        return guard.dutyRole === dutyFilter || guard.dutyRole === "both";
      });

  const fetchRoster = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/admin/duty-roster?date=${encodeURIComponent(date)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to load duty roster.");
      setGuards((data as RosterResponse).guards || []);
    } catch (err: any) {
      toast.error(err.message || "Failed to load duty roster.");
      setGuards([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoster();
  }, [date]);

  const setDutyRole = (guardId: number, dutyRole: DutyRole) => {
    setGuards((current) =>
      current.map((guard) =>
        guard.id === guardId
          ? {
              ...guard,
              dutyRole,
              isOnDuty: Boolean(dutyRole),
            }
          : guard
      )
    );
  };

  const saveRoster = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      const assignments = guards
        .filter((guard) => guard.dutyRole)
        .map((guard) => ({ guardId: guard.id, dutyRole: guard.dutyRole }));

      const response = await fetch(`${API_BASE_URL}/admin/duty-roster`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ date, assignments }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to save duty roster.");
      setGuards((data as RosterResponse).guards || []);
      toast.success("Duty roster saved.");
    } catch (err: any) {
      toast.error(err.message || "Failed to save duty roster.");
    } finally {
      setSaving(false);
    }
  };

  const statCards = [
    { label: "Scanner Duty", value: summary.scanner, helper: "Can scan incoming pickup QR codes", icon: ShieldCheck, filter: "scanner" as const },
    { label: "Release Duty", value: summary.release, helper: "Receives queue and confirms child release", icon: ClipboardCheck, filter: "release" as const },
    { label: "Both Roles", value: summary.both, helper: "Can scan and confirm release", icon: CheckCircle2, filter: "both" as const },
    { label: "Available Guards", value: activeGuards.length, helper: `${summary.off} currently off duty`, icon: UsersRound, filter: "available" as const },
  ];

  if (loading && guards.length === 0) {
    return (
      <DashboardLayout role="admin">
        <AdminPageSkeleton variant="roster" label="Loading daily duty roster" />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="admin">
      <style>{DUTY_ROSTER_CSS}</style>
      <div className="pz-duty-page">
        <div className="pz-duty-header">
          <div>
            <div className="pz-duty-kicker">Pickup Operations</div>
            <h1 className="pz-duty-title">Daily Duty Roster</h1>
            <div className="pz-duty-subtitle">
              Assign today&apos;s scanner guard and release guard from existing school staff accounts.
            </div>
          </div>
          <div className="pz-duty-actions">
            <div className="pz-duty-date-wrap">
              <AdminDatePicker value={date} onChange={setDate} ariaLabel="Roster date" className="compact" />
            </div>
            <button type="button" className="pz-duty-button" onClick={fetchRoster} disabled={loading || saving}>
              <RefreshCw size={15} aria-hidden="true" />
              Refresh
            </button>
            <button type="button" className="pz-duty-button primary" onClick={saveRoster} disabled={loading || saving}>
              {saving ? <LoadingSpinner size="xs" className="pz-loading-inline" /> : <Save size={15} aria-hidden="true" />}
              Save Roster
            </button>
          </div>
        </div>

        <div className="pz-duty-stats">
          {statCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <button
                type="button"
                className="pz-duty-stat"
                key={stat.label}
                onClick={() => setDutyFilter((current) => current === stat.filter ? null : stat.filter)}
                aria-label={`Filter by ${stat.label}`}
              >
                <div className="pz-duty-stat-top">
                  <div className="pz-duty-stat-label">{stat.label}</div>
                  <div className="pz-duty-stat-icon">
                    <Icon size={18} aria-hidden="true" />
                  </div>
                </div>
                <div className="pz-duty-stat-value">{loading ? "..." : stat.value}</div>
                <div className="pz-duty-stat-helper">{stat.helper}</div>
              </button>
            );
          })}
        </div>

        <section className="pz-duty-panel">
          <div className="pz-duty-panel-head">
            <div>
              <div className="pz-duty-panel-title">Guard Assignments</div>
              <div className="pz-duty-panel-subtitle">
                Scanner handles car QR scan. Release confirms the child has left the school.
              </div>
            </div>
            <span className="pz-duty-badge">
              <CalendarDays size={13} aria-hidden="true" />
              {formatDisplayDate(date)}
            </span>
          </div>

          <div className="pz-duty-table-wrap">
            <table className="pz-duty-table">
              <thead>
                <tr>
                  <th>Guard / Teacher</th>
                  <th>Status</th>
                  <th>Devices</th>
                  <th>Duty Role</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={4}>
                      <div className="pz-duty-empty">
                        <LoadingSpinner size="lg" label="Loading duty roster" />
                        <strong>Loading duty roster...</strong>
                      </div>
                    </td>
                  </tr>
                )}

                {!loading &&
                  displayedGuards.map((guard) => {
                    const name = fullName(guard);
                    return (
                      <tr key={guard.id}>
                        <td>
                          <div className="pz-duty-person">
                            <div className="pz-duty-avatar">{initials(name)}</div>
                            <div>
                              <div className="pz-duty-name">{name}</div>
                              <div className="pz-duty-meta">{guard.email || guard.phone || "No contact saved"}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className={`pz-duty-status ${String(guard.status || "").toLowerCase()}`}>
                            <span className="pz-duty-dot" />
                            {guard.status || "active"}
                          </span>
                        </td>
                        <td>
                          <span className="pz-duty-badge">
                            <Smartphone size={13} aria-hidden="true" />
                            {guard.deviceCount}
                          </span>
                        </td>
                        <td>
                          <div className="pz-duty-role-control" aria-label={`Duty role for ${name}`}>
                            {roleOptions.map((option) => (
                              <button
                                type="button"
                                key={option.label}
                                className={`pz-duty-role-button ${option.className} ${
                                  guard.dutyRole === option.value ? "active" : ""
                                }`}
                                onClick={() => setDutyRole(guard.id, option.value)}
                              >
                                {option.label}
                              </button>
                            ))}
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                {!loading && displayedGuards.length === 0 && (
                  <tr>
                    <td colSpan={4}>
                      <div className="pz-duty-empty">
                        <div className="pz-duty-empty-icon">
                          <UsersRound size={24} aria-hidden="true" />
                        </div>
                        <strong>{dutyFilter ? "No guards match this card." : "No guard accounts found."}</strong>
                        <span>
                          {dutyFilter
                            ? "Click the selected card again to show the complete roster."
                            : "Create guard or teacher accounts from User Management, then assign them here."}
                        </span>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}

function fullName(guard: RosterGuard) {
  return [guard.firstName, guard.lastName].filter(Boolean).join(" ").trim() || guard.email || "Guard";
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return `${parts[0]?.[0] || "G"}${parts[1]?.[0] || ""}`.toUpperCase();
}

function formatYmd(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDisplayDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
}
