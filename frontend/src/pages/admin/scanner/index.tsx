import { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '@/components/layouts/dashboard-layout';
import { toast } from '@/components/ui/toast';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import AdminPageSkeleton from '@/components/ui/AdminPageSkeleton';
import { API_BASE_URL } from '@/lib/api/link';
import { isQuietEmptyStateResponse } from '@/lib/api/quietEmptyState';
import {
  CheckCircle2,
  Clock3,
  QrCode,
  RefreshCw,
  ShieldCheck,
  UserRound,
  XCircle,
} from 'lucide-react';

type PickupLog = {
  id: number;
  studentName: string;
  studentNames?: string | null;
  studentCount?: number | null;
  familyChildren?: FamilyChild[];
  grade?: string | null;
  guardianName: string;
  guardianRelation?: string | null;
  guardianPhone?: string | null;
  guardName: string;
  carDescription: string;
  status: string;
  rawStatus?: string;
  scannedAt?: string | null;
  scannedAtDisplay?: string;
  dateDisplay?: string;
  rejectionReason?: string | null;
};

type FamilyChild = {
  id: number | string;
  name: string;
  grade?: string | null;
  photoPath?: string | null;
  scanned?: boolean;
};

const SCANNER_CSS = `
.pz-scanner-page {
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

.pz-scanner-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 18px;
  margin-bottom: 22px;
}

.pz-scanner-kicker {
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

.pz-scanner-kicker::before {
  content: "";
  width: 18px;
  height: 2px;
  border-radius: 999px;
  background: var(--teal);
}

.pz-scanner-title {
  font-family: 'Inter', sans-serif;
  font-size: clamp(28px, 3.1vw, 42px);
  line-height: 1.05;
  font-weight: 700;
  margin: 0;
}

.pz-scanner-subtitle {
  color: var(--text-3);
  font-size: 14px;
  margin-top: 8px;
}

.pz-scanner-button {
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
  transition: all 0.18s ease;
}

.pz-scanner-button:hover {
  border-color: rgba(27,110,204,0.35);
  color: var(--blue);
  background: #EFF6FF;
}

.pz-scanner-button.primary {
  background: var(--teal);
  border-color: var(--teal);
  color: white;
}

.pz-scanner-button.danger {
  color: #B42318;
}

.pz-scanner-button:disabled {
  cursor: not-allowed;
  opacity: 0.62;
}

.pz-scanner-stat-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
  margin-bottom: 18px;
}

.pz-scanner-card,
.pz-scanner-stat {
  background: white;
  border: 1px solid var(--border);
  border-radius: 12px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
}

button.pz-scanner-stat {
  width: 100%;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.pz-scanner-stat {
  min-height: 118px;
  padding: 18px;
}

.pz-scanner-stat-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.pz-scanner-stat-label {
  color: var(--text-3);
  font-size: 12px;
  font-weight: 800;
}

.pz-scanner-stat-value {
  margin-top: 14px;
  font-family: 'Inter', sans-serif;
  font-size: 32px;
  font-weight: 800;
}

.pz-scanner-icon {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.pz-scanner-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(340px, 0.44fr);
  gap: 18px;
  align-items: start;
}

.pz-scanner-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 18px 20px;
  border-bottom: 1px solid var(--border);
}

.pz-scanner-card-title {
  font-family: 'Inter', sans-serif;
  font-size: 16px;
  font-weight: 700;
}

.pz-scanner-card-subtitle {
  color: var(--text-3);
  font-size: 12px;
  margin-top: 4px;
}

.pz-scanner-list {
  display: flex;
  flex-direction: column;
}

.pz-scanner-pending {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 16px;
  padding: 18px 20px;
  border-bottom: 1px solid var(--border);
}

.pz-scanner-pending:last-child {
  border-bottom: 0;
}

.pz-scanner-person {
  display: flex;
  gap: 12px;
  min-width: 0;
}

.pz-scanner-avatar {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: linear-gradient(135deg, var(--navy), #123B75);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.pz-scanner-name {
  font-weight: 800;
  color: var(--text-1);
  overflow-wrap: anywhere;
}

.pz-scanner-muted {
  color: var(--text-3);
  font-size: 12px;
  margin-top: 3px;
}

.pz-scanner-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
}

.pz-scanner-pill {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--text-2);
  padding: 5px 9px;
  font-size: 11px;
  font-weight: 800;
}

.pz-scanner-child-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  margin-top: 10px;
}

.pz-scanner-child-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  max-width: 100%;
  min-height: 30px;
  border: 1px solid var(--border);
  border-radius: 999px;
  background: #F8FAFC;
  color: var(--text-1);
  padding: 0 10px;
  font-size: 12px;
  font-weight: 800;
}

.pz-scanner-child-chip span {
  color: var(--text-3);
  font-size: 11px;
}

.pz-scanner-child-chip.scanned {
  border-color: rgba(26,158,117,0.36);
  background: #E1F5EE;
  color: #065F46;
}

.pz-scanner-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: flex-end;
}

.pz-scanner-empty {
  min-height: 260px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 10px;
  color: var(--text-3);
  text-align: center;
  padding: 34px;
}

.pz-scanner-table {
  width: 100%;
  border-collapse: collapse;
}

.pz-scanner-table th,
.pz-scanner-table td {
  text-align: left;
  padding: 13px 16px;
  border-bottom: 1px solid var(--border);
  font-size: 13px;
}

.pz-scanner-table th {
  color: var(--text-3);
  background: var(--surface);
  font-size: 11px;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.pz-scanner-status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border-radius: 999px;
  padding: 5px 9px;
  font-size: 11px;
  font-weight: 900;
}

.pz-scanner-status.completed,
.pz-scanner-status.approved {
  background: #E1F5EE;
  color: #067647;
}

.pz-scanner-status.pending {
  background: #FEF3DC;
  color: #92400E;
}

.pz-scanner-status.cancelled,
.pz-scanner-status.rejected {
  background: #FDEAEA;
  color: #991B1B;
}

.pz-scanner-modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 80;
  background: rgba(7,29,59,0.48);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 18px;
}

.pz-scanner-modal {
  width: min(100%, 460px);
  background: white;
  border-radius: 14px;
  border: 1px solid var(--border);
  box-shadow: 0 22px 70px rgba(7,29,59,0.26);
  padding: 20px;
}

.pz-scanner-modal textarea {
  width: 100%;
  min-height: 112px;
  resize: vertical;
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 12px;
  margin-top: 14px;
  outline: none;
  color: var(--text-1);
}

@media (max-width: 1120px) {
  .pz-scanner-stat-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .pz-scanner-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 720px) {
  .pz-scanner-header,
  .pz-scanner-pending {
    grid-template-columns: 1fr;
  }
  .pz-scanner-header {
    align-items: flex-start;
    flex-direction: column;
  }
  .pz-scanner-stat-grid {
    grid-template-columns: 1fr;
  }
  .pz-scanner-actions {
    justify-content: flex-start;
  }
}
`;

function authHeaders() {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

function statusLabel(status: string) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function studentDisplayName(pickup: PickupLog) {
  return pickup.studentNames || pickup.studentName || 'Student';
}

function studentMeta(pickup: PickupLog) {
  if ((pickup.familyChildren?.length || 0) > 1) {
    return `${pickup.familyChildren?.length} linked students`;
  }
  return `Grade ${pickup.grade || 'N/A'}`;
}

function LinkedChildren({ children }: { children: FamilyChild[] }) {
  return (
    <div className="pz-scanner-child-chips">
      {children.map((child) => (
        <span className={`pz-scanner-child-chip ${child.scanned ? 'scanned' : ''}`} key={child.id}>
          {child.name}
          {child.grade ? <span>Grade {child.grade}</span> : null}
          {child.scanned ? <span>Scanned QR</span> : null}
        </span>
      ))}
    </div>
  );
}

export default function ScannerView() {
  const [pending, setPending] = useState<PickupLog[]>([]);
  const [recent, setRecent] = useState<PickupLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<number | null>(null);
  const [rejecting, setRejecting] = useState<PickupLog | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [recentFilter, setRecentFilter] = useState<'approved' | 'completed' | 'rejected' | null>(null);

  const fetchPickupQueues = async () => {
    setLoading(true);
    try {
      const [pendingRes, recentRes] = await Promise.all([
        fetch(`${API_BASE_URL}/pickups/pending`, { headers: authHeaders() }),
        fetch(`${API_BASE_URL}/pickups?limit=20`, { headers: authHeaders() }),
      ]);

      const pendingData = await pendingRes.json();
      const recentData = await recentRes.json();

      if (!pendingRes.ok) {
        if (isQuietEmptyStateResponse(pendingRes, pendingData)) {
          setPending([]);
          setRecent([]);
          return;
        }
        throw new Error(pendingData.error || 'Failed to load pending pickups');
      }

      setPending(pendingData || []);
      setRecent(recentRes.ok ? recentData || [] : []);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load scanner queue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPickupQueues();
  }, []);

  const stats = useMemo(() => {
    const completed = recent.filter((item) => item.status === 'completed').length;
    const approved = recent.filter((item) => item.status === 'approved').length;
    const rejected = recent.filter((item) => item.status === 'cancelled' || item.status === 'rejected').length;

    return [
      { label: 'Pending Review', value: pending.length, icon: Clock3, tone: '#FEF3DC', color: '#92400E', filter: null, target: 'pending-review' },
      { label: 'Approved', value: approved, icon: ShieldCheck, tone: '#E1F5EE', color: '#067647', filter: 'approved' as const, target: 'recent-activity' },
      { label: 'Completed', value: completed, icon: CheckCircle2, tone: '#EFF6FF', color: '#1B6ECC', filter: 'completed' as const, target: 'recent-activity' },
      { label: 'Rejected', value: rejected, icon: XCircle, tone: '#FDEAEA', color: '#991B1B', filter: 'rejected' as const, target: 'recent-activity' },
    ];
  }, [pending.length, recent]);

  const filteredRecent = recentFilter === null
    ? recent
    : recent.filter((item) =>
        recentFilter === 'rejected'
          ? item.status === 'cancelled' || item.status === 'rejected'
          : item.status === recentFilter
      );

  const approvePickup = async (pickup: PickupLog) => {
    setActionId(pickup.id);
    try {
      const response = await fetch(`${API_BASE_URL}/pickups/${pickup.id}/approve`, {
        method: 'POST',
        headers: authHeaders(),
      });
      const result = await response.json();

      if (!response.ok) throw new Error(result.error || 'Could not approve pickup');
      toast.success(result.message || 'Pickup approved');
      await fetchPickupQueues();
    } catch (err: any) {
      toast.error(err.message || 'Could not approve pickup');
    } finally {
      setActionId(null);
    }
  };

  const submitReject = async () => {
    if (!rejecting) return;
    setActionId(rejecting.id);

    try {
      const response = await fetch(`${API_BASE_URL}/pickups/${rejecting.id}/reject`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ reason: rejectReason.trim() || null }),
      });
      const result = await response.json();

      if (!response.ok) throw new Error(result.error || 'Could not reject pickup');
      toast.success(result.message || 'Pickup rejected');
      setRejecting(null);
      setRejectReason('');
      await fetchPickupQueues();
    } catch (err: any) {
      toast.error(err.message || 'Could not reject pickup');
    } finally {
      setActionId(null);
    }
  };

  if (loading && pending.length === 0 && recent.length === 0) {
    return (
      <DashboardLayout role="admin">
        <AdminPageSkeleton variant="scanner" label="Loading pickup review queue" />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="admin">
      <style>{SCANNER_CSS}</style>
      <div className="pz-scanner-page">
        <div className="pz-scanner-header">
          <div>
            <div className="pz-scanner-kicker">School Admin</div>
            <h1 className="pz-scanner-title">Pickup Review Queue</h1>
            <div className="pz-scanner-subtitle">
              Review exception pickup scans and track final release confirmation.
            </div>
          </div>
          <button type="button" className="pz-scanner-button" onClick={fetchPickupQueues} disabled={loading}>
            {loading ? <LoadingSpinner size="xs" className="pz-loading-inline" /> : <RefreshCw size={15} />}
            Refresh
          </button>
        </div>

        <div className="pz-scanner-stat-grid">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <button
                type="button"
                className="pz-scanner-stat"
                key={stat.label}
                onClick={() => {
                  setRecentFilter(stat.filter);
                  document.getElementById(stat.target)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                aria-label={`Show ${stat.label}`}
              >
                <div className="pz-scanner-stat-top">
                  <div className="pz-scanner-stat-label">{stat.label}</div>
                  <div className="pz-scanner-icon" style={{ background: stat.tone, color: stat.color }}>
                    <Icon size={19} />
                  </div>
                </div>
                <div className="pz-scanner-stat-value">{stat.value}</div>
              </button>
            );
          })}
        </div>

        <div className="pz-scanner-grid">
          <section className="pz-scanner-card" id="pending-review">
            <div className="pz-scanner-card-header">
              <div>
                <div className="pz-scanner-card-title">Pending Review</div>
                <div className="pz-scanner-card-subtitle">{pending.length} request(s) waiting for review</div>
              </div>
              <QrCode size={20} color="#1A9E75" />
            </div>

            {loading ? (
              <div className="pz-scanner-empty">
                <LoadingSpinner size="md" label="Loading pending scans" />
                Loading pending scans...
              </div>
            ) : pending.length ? (
              <div className="pz-scanner-list">
                {pending.map((scan) => (
                  <article className="pz-scanner-pending" key={scan.id}>
                    <div className="pz-scanner-person">
                      <div className="pz-scanner-avatar">
                        <UserRound size={20} />
                      </div>
                      <div>
                        <div className="pz-scanner-name">{studentDisplayName(scan)}</div>
                        <div className="pz-scanner-muted">
                          {studentMeta(scan)} - scanned by {scan.guardName || 'Guard'}
                        </div>
                        {(scan.familyChildren?.length || 0) > 1 && (
                          <LinkedChildren children={scan.familyChildren || []} />
                        )}
                        <div className="pz-scanner-meta">
                          <span className="pz-scanner-pill">
                            {scan.guardianName}
                            {scan.guardianRelation ? ` (${scan.guardianRelation})` : ''}
                          </span>
                          <span className="pz-scanner-pill">{scan.guardianPhone || 'No phone'}</span>
                          <span className="pz-scanner-pill">{scan.carDescription}</span>
                        </div>
                      </div>
                    </div>

                    <div className="pz-scanner-actions">
                      <button
                        type="button"
                        className="pz-scanner-button danger"
                        onClick={() => setRejecting(scan)}
                        disabled={actionId === scan.id}
                      >
                        <XCircle size={16} />
                        Reject
                      </button>
                      <button
                        type="button"
                        className="pz-scanner-button primary"
                        onClick={() => approvePickup(scan)}
                        disabled={actionId === scan.id}
                      >
                        {actionId === scan.id ? <LoadingSpinner size="xs" className="pz-loading-inline" /> : <CheckCircle2 size={16} />}
                        Approve
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="pz-scanner-empty">
                <CheckCircle2 size={26} color="#1A9E75" />
                <strong>No pickup scans need review.</strong>
                <span>Validated guard scans go directly to the release queue and remain visible in activity.</span>
              </div>
            )}
          </section>

          <aside className="pz-scanner-card" id="recent-activity">
            <div className="pz-scanner-card-header">
              <div>
                <div className="pz-scanner-card-title">Recent Activity</div>
                <div className="pz-scanner-card-subtitle">
                  {recentFilter ? `${statusLabel(recentFilter)} pickup workflow records` : 'Latest pickup workflow records'}
                </div>
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table className="pz-scanner-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Pickup</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecent.slice(0, 10).map((item) => (
                    <tr key={item.id}>
                      <td>
                        <div className="pz-scanner-name">{studentDisplayName(item)}</div>
                        <div className="pz-scanner-muted">{item.scannedAtDisplay || item.dateDisplay || ''}</div>
                      </td>
                      <td>
                        <div className="pz-scanner-name">{item.guardianName}</div>
                        <div className="pz-scanner-muted">{item.guardName}</div>
                      </td>
                      <td>
                        <span className={`pz-scanner-status ${item.status}`}>
                          <span style={{ width: 6, height: 6, borderRadius: 999, background: 'currentColor' }} />
                          {statusLabel(item.status)}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {!filteredRecent.length && (
                    <tr>
                      <td colSpan={3}>
                        <div className="pz-scanner-empty" style={{ minHeight: 180 }}>
                          No pickup records yet.
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </aside>
        </div>
      </div>

      {rejecting && (
        <div className="pz-scanner-modal-backdrop">
          <section className="pz-scanner-modal" aria-labelledby="reject-pickup-title">
            <h2 id="reject-pickup-title" className="text-lg font-bold text-slate-950">
              Reject Pickup Request
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Add a reason for rejecting {studentDisplayName(rejecting)}'s pickup request.
            </p>
            <textarea
              value={rejectReason}
              onChange={(event) => setRejectReason(event.target.value)}
              placeholder="Reason for rejection"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" className="pz-scanner-button" onClick={() => setRejecting(null)}>
                Cancel
              </button>
              <button
                type="button"
                className="pz-scanner-button danger"
                onClick={submitReject}
                disabled={actionId === rejecting.id}
              >
                {actionId === rejecting.id ? <LoadingSpinner size="xs" className="pz-loading-inline" /> : <XCircle size={16} />}
                Reject Request
              </button>
            </div>
          </section>
        </div>
      )}
    </DashboardLayout>
  );
}
