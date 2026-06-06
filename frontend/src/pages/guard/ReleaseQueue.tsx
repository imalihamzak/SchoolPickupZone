import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { toast } from "@/components/ui/toast";
import { LAN_API_BASE } from "@/lib/api/link";
import ParentMessagesPanel from "./ParentMessagesPanel";

type PickupStatus = "pending" | "approved" | "completed" | "cancelled" | "rejected" | string;

type PickupLog = {
  id: number;
  studentName: string;
  studentNames?: string | null;
  studentCount?: number | null;
  familyChildren?: FamilyChild[];
  grade?: string | null;
  parentName?: string | null;
  guardianName: string;
  guardianRelation?: string | null;
  guardianPhone?: string | null;
  guardName?: string | null;
  carDescription: string;
  status: PickupStatus;
  rawStatus?: string | null;
  approvalStatus?: string | null;
  scannedAt?: string | null;
  scannedAtDisplay?: string | null;
  confirmedByName?: string | null;
};

type FamilyChild = {
  id: number | string;
  name: string;
  grade?: string | null;
  photoPath?: string | null;
  scanned?: boolean;
};

type DutyState = {
  dutyRole: "scanner" | "release" | "both" | null;
  isOnDuty: boolean;
  isScanner: boolean;
  isRelease: boolean;
};

type ReleaseQueueResponse = {
  date: string;
  duty: DutyState;
  pickups: PickupLog[];
  stats: {
    total: number;
    pending: number;
    approved: number;
  };
  message?: string;
};

const RELEASE_QUEUE_CSS = `
.pz-release-page {
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
  font-family: 'DM Sans', 'Segoe UI', Arial, sans-serif;
}

.pz-release-page,
.pz-release-page * {
  box-sizing: border-box;
}

.pz-release-hero {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 18px;
  margin-bottom: 22px;
}

.pz-release-kicker {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--teal);
  font-size: 11px;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0;
  margin-bottom: 8px;
}

.pz-release-kicker::before {
  content: "";
  width: 22px;
  height: 2px;
  border-radius: 999px;
  background: currentColor;
}

.pz-release-title {
  margin: 0;
  color: var(--text-1);
  font-family: 'Inter', 'Segoe UI', Arial, sans-serif;
  font-size: clamp(30px, 3.6vw, 44px);
  line-height: 1.08;
  font-weight: 800;
  letter-spacing: 0;
}

.pz-release-subtitle {
  max-width: 680px;
  margin-top: 10px;
  color: var(--text-2);
  font-size: 15px;
  line-height: 1.7;
}

.pz-release-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.pz-release-button {
  min-height: 42px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--white);
  color: var(--text-1);
  padding: 0 14px;
  font-size: 13px;
  font-weight: 900;
  cursor: pointer;
  transition: all 0.18s ease;
}

.pz-release-button:hover:not(:disabled) {
  border-color: rgba(27,110,204,0.36);
  color: var(--blue);
  background: #EFF6FF;
}

.pz-release-button.primary {
  border-color: var(--teal);
  background: var(--teal);
  color: var(--white);
}

.pz-release-button.primary:hover:not(:disabled) {
  border-color: var(--teal-light);
  background: var(--teal-light);
  color: var(--white);
}

.pz-release-button:disabled {
  cursor: not-allowed;
  opacity: 0.62;
}

.pz-release-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 320px;
  gap: 18px;
  align-items: start;
}

.pz-release-side-stack {
  display: grid;
  gap: 18px;
  align-items: start;
}

.pz-release-panel,
.pz-release-side-card {
  background: var(--white);
  border: 1px solid var(--border);
  border-radius: 14px;
  box-shadow: 0 12px 34px rgba(7,29,59,0.07);
  overflow: hidden;
}

.pz-release-panel-head,
.pz-release-side-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 18px 20px;
  border-bottom: 1px solid var(--border);
}

.pz-release-panel-title,
.pz-release-side-title {
  color: var(--text-1);
  font-family: 'Inter', 'Segoe UI', Arial, sans-serif;
  font-size: 16px;
  font-weight: 900;
}

.pz-release-panel-subtitle,
.pz-release-side-subtitle {
  margin-top: 4px;
  color: var(--text-3);
  font-size: 12px;
  line-height: 1.5;
}

.pz-release-list {
  display: grid;
  gap: 12px;
  padding: 14px;
}

.pz-release-card {
  border: 1px solid var(--border);
  border-radius: 13px;
  background: #FAFBFD;
  padding: 14px;
}

.pz-release-card-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.pz-release-student {
  display: flex;
  align-items: center;
  gap: 11px;
  min-width: 0;
}

.pz-release-avatar {
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
  flex-shrink: 0;
}

.pz-release-name {
  color: var(--text-1);
  font-size: 15px;
  font-weight: 900;
  overflow-wrap: anywhere;
}

.pz-release-meta {
  margin-top: 3px;
  color: var(--text-3);
  font-size: 12px;
}

.pz-release-status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border-radius: 999px;
  padding: 5px 10px;
  font-size: 11px;
  font-weight: 900;
  white-space: nowrap;
}

.pz-release-status.pending {
  color: #92400E;
  background: var(--amber-pale);
}

.pz-release-status.approved,
.pz-release-status.completed {
  color: #065F46;
  background: var(--teal-pale);
}

.pz-release-status.cancelled,
.pz-release-status.rejected {
  color: #991B1B;
  background: var(--red-pale);
}

.pz-release-dot {
  width: 6px;
  height: 6px;
  border-radius: 999px;
  background: currentColor;
}

.pz-release-details {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.pz-release-detail {
  min-height: 64px;
  border: 1px solid var(--border);
  border-radius: 11px;
  background: var(--white);
  padding: 10px 11px;
}

.pz-release-label {
  color: var(--text-3);
  font-size: 10px;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0;
}

.pz-release-value {
  margin-top: 4px;
  color: var(--text-1);
  font-size: 13px;
  font-weight: 900;
  line-height: 1.4;
  overflow-wrap: anywhere;
}

.pz-release-student-list {
  grid-column: 1 / -1;
}

.pz-release-child-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  margin-top: 8px;
}

.pz-release-child-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 30px;
  max-width: 100%;
  border: 1px solid var(--border);
  border-radius: 999px;
  background: #F8FAFC;
  color: var(--text-1);
  padding: 0 10px;
  font-size: 12px;
  font-weight: 900;
}

.pz-release-child-chip span {
  color: var(--text-3);
  font-size: 11px;
}

.pz-release-child-chip.scanned {
  border-color: rgba(26,158,117,0.36);
  background: var(--teal-pale);
  color: #065F46;
}

.pz-release-card-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 12px;
}

.pz-release-empty {
  min-height: 320px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 34px 22px;
  color: var(--text-3);
  text-align: center;
}

.pz-release-empty-icon {
  width: 58px;
  height: 58px;
  border-radius: 17px;
  background: var(--surface);
  border: 1px solid var(--border);
  color: var(--teal);
  display: grid;
  place-items: center;
}

.pz-release-side-card {
  position: sticky;
  top: 0;
}

.pz-release-side-body {
  padding: 16px;
  display: grid;
  gap: 12px;
}

.pz-release-stat {
  border: 1px solid var(--border);
  border-radius: 12px;
  background: #FAFBFD;
  padding: 14px;
}

.pz-release-stat-label {
  color: var(--text-3);
  font-size: 11px;
  font-weight: 900;
}

.pz-release-stat-value {
  margin-top: 8px;
  color: var(--text-1);
  font-family: 'Inter', 'Segoe UI', Arial, sans-serif;
  font-size: 26px;
  font-weight: 900;
}

.pz-release-duty-pill {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  border-radius: 999px;
  padding: 6px 10px;
  background: var(--teal-pale);
  color: #065F46;
  font-size: 12px;
  font-weight: 900;
  text-transform: capitalize;
}

.pz-release-duty-pill.off {
  color: #92400E;
  background: var(--amber-pale);
}

.pz-release-error {
  border: 1px solid rgba(226,75,74,0.26);
  background: var(--red-pale);
  color: #991B1B;
  border-radius: 12px;
  padding: 12px;
  font-size: 13px;
  font-weight: 800;
  line-height: 1.45;
}

@media (max-width: 1080px) {
  .pz-release-grid {
    grid-template-columns: 1fr;
  }

  .pz-release-side-card {
    position: static;
  }
}

@media (max-width: 760px) {
  .pz-release-hero {
    align-items: flex-start;
    flex-direction: column;
  }

  .pz-release-actions,
  .pz-release-button {
    width: 100%;
  }

  .pz-release-details {
    grid-template-columns: 1fr;
  }

  .pz-release-card-top {
    flex-direction: column;
  }

  .pz-release-card-actions {
    justify-content: stretch;
  }
}
`;

export default function ReleaseQueue() {
  const [queue, setQueue] = useState<ReleaseQueueResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [confirmingId, setConfirmingId] = useState<number | null>(null);

  const pickups = queue?.pickups || [];
  const stats = useMemo(() => {
    const approved = pickups.filter((pickup) => pickup.rawStatus === "approved").length;
    const pending = pickups.filter((pickup) => pickup.rawStatus === "pending").length;
    return { approved, pending, total: pickups.length };
  }, [pickups]);

  const fetchQueue = async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${LAN_API_BASE}/pickups/release-queue`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to load release queue.");
      setQueue(data);
      setError("");
    } catch (err: any) {
      setError(err.message || "Failed to load release queue.");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
    const interval = window.setInterval(() => fetchQueue({ silent: true }), 5000);
    return () => window.clearInterval(interval);
  }, []);

  const confirmPickup = async (pickupId: number) => {
    setConfirmingId(pickupId);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${LAN_API_BASE}/pickups/${pickupId}/confirm`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not confirm pickup.");
      toast.success(data.message || "Pickup release confirmed.");
      await fetchQueue({ silent: true });
    } catch (err: any) {
      toast.error(err.message || "Could not confirm pickup.");
    } finally {
      setConfirmingId(null);
    }
  };

  if (loading) {
    return (
      <div className="pz-release-page">
        <style>{RELEASE_QUEUE_CSS}</style>
        <ReleaseQueueSkeleton />
      </div>
    );
  }

  const dutyRole = queue?.duty?.dutyRole || "off";
  const isReleaseGuard = Boolean(queue?.duty?.isRelease);

  return (
    <div className="pz-release-page">
      <style>{RELEASE_QUEUE_CSS}</style>

      <div className="pz-release-hero">
        <div>
          <div className="pz-release-kicker">Release Duty</div>
          <h1 className="pz-release-title">Pickup Release Queue</h1>
          <div className="pz-release-subtitle">
            View scanned cars, call students for pickup, and confirm when the child has left the school.
          </div>
        </div>
        <div className="pz-release-actions">
          <button type="button" className="pz-release-button" onClick={() => fetchQueue()} disabled={loading}>
            <RefreshCw size={16} aria-hidden="true" />
            Refresh
          </button>
        </div>
      </div>

      <div className="pz-release-grid">
        <section className="pz-release-panel">
          <div className="pz-release-panel-head">
            <div>
              <div className="pz-release-panel-title">Active Pickup Requests</div>
              <div className="pz-release-panel-subtitle">
                Ready requests can be confirmed by the active release guard.
              </div>
            </div>
            <span className={`pz-release-duty-pill ${isReleaseGuard ? "" : "off"}`}>
              <span className="pz-release-dot" />
              {dutyRole}
            </span>
          </div>

          {error && <div className="pz-release-list"><div className="pz-release-error">{error}</div></div>}

          {!error && !isReleaseGuard && (
            <div className="pz-release-empty">
              <div className="pz-release-empty-icon">
                <ShieldCheck size={25} aria-hidden="true" />
              </div>
              <strong>You are not assigned as release guard today.</strong>
              <span>The daily duty roster controls who receives this queue and confirms final release.</span>
            </div>
          )}

          {!error && isReleaseGuard && pickups.length === 0 && (
            <div className="pz-release-empty">
              <div className="pz-release-empty-icon">
                <Clock3 size={25} aria-hidden="true" />
              </div>
              <strong>No pickup requests are waiting.</strong>
              <span>Scanned pickup requests will appear here automatically.</span>
            </div>
          )}

          {!error && isReleaseGuard && pickups.length > 0 && (
            <div className="pz-release-list">
              {pickups.map((pickup) => (
                <article className="pz-release-card" key={pickup.id}>
                  <div className="pz-release-card-top">
                    <div className="pz-release-student">
                      <div className="pz-release-avatar">{initials(studentDisplayName(pickup))}</div>
                      <div>
                        <div className="pz-release-name">{studentDisplayName(pickup)}</div>
                        <div className="pz-release-meta">
                          {studentMeta(pickup)} / Request #{pickup.id}
                        </div>
                      </div>
                    </div>
                    <span className={`pz-release-status ${statusTone(pickup)}`}>
                      <span className="pz-release-dot" />
                      {statusLabel(pickup)}
                    </span>
                  </div>

                  <div className="pz-release-details">
                    {(pickup.familyChildren?.length || 0) > 1 && (
                      <LinkedChildren children={pickup.familyChildren || []} />
                    )}
                    <Info label="Pickup Person" value={`${pickup.guardianName}${pickup.guardianRelation ? ` (${pickup.guardianRelation})` : ""}`} />
                    <Info label="Phone" value={pickup.guardianPhone || "Not provided"} />
                    <Info label="Vehicle" value={pickup.carDescription || "No vehicle registered"} />
                    <Info label="Scanned By" value={pickup.guardName || "Guard"} />
                  </div>

                  <div className="pz-release-card-actions">
                    {pickup.rawStatus === "approved" ? (
                      <button
                        type="button"
                        className="pz-release-button primary"
                        disabled={confirmingId === pickup.id}
                        onClick={() => confirmPickup(pickup.id)}
                      >
                        {confirmingId === pickup.id ? (
                          <LoadingSpinner size="xs" className="pz-loading-inline" />
                        ) : (
                          <CheckCircle2 size={17} aria-hidden="true" />
                        )}
                        Confirm Child Released
                      </button>
                    ) : (
                      <button type="button" className="pz-release-button" disabled>
                        <Clock3 size={17} aria-hidden="true" />
                        Waiting for Review
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <aside className="pz-release-side-stack">
          <section className="pz-release-side-card">
            <div className="pz-release-side-head">
              <div>
                <div className="pz-release-side-title">Duty Snapshot</div>
                <div className="pz-release-side-subtitle">
                  {queue?.date ? formatDisplayDate(queue.date) : "Today"}
                </div>
              </div>
              <CalendarDays size={19} color="#1A9E75" aria-hidden="true" />
            </div>
            <div className="pz-release-side-body">
              <Stat label="Total Queue" value={stats.total} />
              <Stat label="Ready To Release" value={stats.approved} />
              <Stat label="Pending Review" value={stats.pending} />
            </div>
          </section>
          <ParentMessagesPanel />
        </aside>
      </div>
    </div>
  );
}

function studentDisplayName(pickup: PickupLog) {
  return pickup.studentNames || pickup.studentName || "Student";
}

function studentMeta(pickup: PickupLog) {
  if ((pickup.familyChildren?.length || 0) > 1) {
    return `${pickup.familyChildren?.length} linked students`;
  }
  return pickup.grade ? `Grade ${pickup.grade}` : "Grade not set";
}

function LinkedChildren({ children }: { children: FamilyChild[] }) {
  return (
    <div className="pz-release-detail pz-release-student-list">
      <div className="pz-release-label">Linked Children</div>
      <div className="pz-release-child-chips">
        {children.map((child) => (
          <span className={`pz-release-child-chip ${child.scanned ? "scanned" : ""}`} key={child.id}>
            {child.name}
            {child.grade ? <span>Grade {child.grade}</span> : null}
            {child.scanned ? <span>Scanned QR</span> : null}
          </span>
        ))}
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="pz-release-detail">
      <div className="pz-release-label">{label}</div>
      <div className="pz-release-value">{value}</div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="pz-release-stat">
      <div className="pz-release-stat-label">{label}</div>
      <div className="pz-release-stat-value">{value}</div>
    </div>
  );
}

function SkeletonLine({ width = "100%" }: { width?: string }) {
  return <div className="pz-skeleton pz-skeleton-line" style={{ width }} />;
}

function ReleaseQueueSkeleton() {
  return (
    <>
      <div className="pz-release-hero">
        <div style={{ width: "min(580px, 100%)" }}>
          <SkeletonLine width="24%" />
          <div style={{ marginTop: 14 }}>
            <div className="pz-skeleton" style={{ width: "78%", height: 40, borderRadius: 11 }} />
          </div>
          <div style={{ marginTop: 12 }}>
            <SkeletonLine width="92%" />
          </div>
        </div>
        <div className="pz-skeleton" style={{ width: 112, height: 40, borderRadius: 10 }} />
      </div>

      <div className="pz-release-grid">
        <section className="pz-release-panel">
          <div className="pz-release-panel-head">
            <div style={{ minWidth: 220 }}>
              <SkeletonLine width="56%" />
              <div style={{ marginTop: 8 }}>
                <SkeletonLine width="84%" />
              </div>
            </div>
            <SkeletonLine width="80px" />
          </div>
          <div className="pz-release-list">
            {Array.from({ length: 3 }).map((_, index) => (
              <div className="pz-release-card" key={index}>
                <div className="pz-release-card-top">
                  <div className="pz-release-student">
                    <div className="pz-skeleton pz-skeleton-icon" />
                    <div style={{ minWidth: 180 }}>
                      <SkeletonLine width="72%" />
                      <div style={{ marginTop: 8 }}>
                        <SkeletonLine width="52%" />
                      </div>
                    </div>
                  </div>
                  <SkeletonLine width="92px" />
                </div>
                <div className="pz-release-details">
                  {Array.from({ length: 4 }).map((__, detailIndex) => (
                    <div className="pz-release-detail" key={detailIndex}>
                      <SkeletonLine width="48%" />
                      <div style={{ marginTop: 8 }}>
                        <SkeletonLine width="78%" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
        <aside className="pz-release-side-card">
          <div className="pz-release-side-head">
            <div style={{ minWidth: 160 }}>
              <SkeletonLine width="64%" />
              <div style={{ marginTop: 8 }}>
                <SkeletonLine width="52%" />
              </div>
            </div>
            <div className="pz-skeleton pz-skeleton-icon" />
          </div>
          <div className="pz-release-side-body">
            {Array.from({ length: 3 }).map((_, index) => (
              <div className="pz-release-stat" key={index}>
                <SkeletonLine width="46%" />
                <div style={{ marginTop: 10 }}>
                  <SkeletonLine width="24%" />
                </div>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </>
  );
}

function statusTone(pickup: PickupLog) {
  if (pickup.rawStatus === "rejected") return "rejected";
  if (pickup.status === "cancelled") return "cancelled";
  if (pickup.rawStatus === "approved") return "approved";
  if (pickup.status === "completed") return "completed";
  return "pending";
}

function statusLabel(pickup: PickupLog) {
  if (pickup.rawStatus === "approved") return "Ready to release";
  if (pickup.rawStatus === "pending") return "Pending review";
  if (pickup.status === "completed") return "Released";
  if (pickup.status === "cancelled" || pickup.rawStatus === "rejected") return "Rejected";
  return "Pending";
}

function initials(name: string) {
  const parts = String(name || "Student").trim().split(/\s+/).filter(Boolean);
  return `${parts[0]?.[0] || "S"}${parts[1]?.[0] || ""}`.toUpperCase();
}

function formatDisplayDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
}
