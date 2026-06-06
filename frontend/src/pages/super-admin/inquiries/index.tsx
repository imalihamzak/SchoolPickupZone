import { useEffect, useMemo, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import axios from "axios";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  Inbox,
  Mail,
  MessageSquareText,
  Search,
} from "lucide-react";
import DashboardLayout from "@/components/layouts/dashboard-layout";
import { AdminSelect } from "@/components/ui/admin-controls";
import { toast } from "@/components/ui/toast";
import { API_BASE_URL } from "@/lib/api/link";
import "../super-admin-theme.css";

type InquiryStatus = "New" | "In Progress" | "Closed";

type Inquiry = {
  id: number;
  school_id: number | null;
  user_id: number | null;
  name: string;
  email: string;
  phone: string | null;
  subject: string | null;
  message: string;
  source: string | null;
  status: InquiryStatus;
  created_at: string;
  updated_at: string | null;
  school_name: string | null;
  user_first_name: string | null;
  user_last_name: string | null;
};

type InquirySummary = {
  total: number;
  new: number;
  inProgress: number;
  closed: number;
};

const defaultSummary: InquirySummary = {
  total: 0,
  new: 0,
  inProgress: 0,
  closed: 0,
};

const statusFilterOptions = [
  { value: "all", label: "All Statuses" },
  { value: "New", label: "New" },
  { value: "In Progress", label: "In Progress" },
  { value: "Closed", label: "Closed" },
];

const statusOptions = [
  { value: "New", label: "New" },
  { value: "In Progress", label: "In Progress" },
  { value: "Closed", label: "Closed" },
];

export default function SuperAdminInquiriesPage() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [summary, setSummary] = useState<InquirySummary>(defaultSummary);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const authHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  });

  const fetchInquiries = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (search.trim()) params.set("search", search.trim());

      const response = await axios.get(`${API_BASE_URL}/inquiries/superadmin?${params.toString()}`, {
        headers: authHeaders(),
      });

      setInquiries(Array.isArray(response.data.inquiries) ? response.data.inquiries : []);
      setSummary(response.data.summary || defaultSummary);
    } catch (error: any) {
      console.error("Failed to load inquiries:", error);
      toast.error(error.response?.data?.error || "Failed to load inquiries.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(fetchInquiries, 200);
    return () => window.clearTimeout(timer);
  }, [search, statusFilter]);

  const openCount = useMemo(
    () => inquiries.filter((inquiry) => inquiry.status !== "Closed").length,
    [inquiries]
  );

  const updateStatus = async (inquiryId: number, status: string) => {
    try {
      setUpdatingId(inquiryId);
      await axios.patch(
        `${API_BASE_URL}/inquiries/superadmin/${inquiryId}/status`,
        { status },
        { headers: authHeaders() }
      );
      setInquiries((current) =>
        current.map((inquiry) =>
          inquiry.id === inquiryId ? { ...inquiry, status: status as InquiryStatus } : inquiry
        )
      );
      fetchInquiries();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to update inquiry.");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <DashboardLayout role="super-admin">
      <div className="pz-super-page">
        <div className="pz-super-header">
          <div>
            <div className="pz-super-kicker">Support</div>
            <h1 className="pz-super-title">Contact Inquiries</h1>
            <div className="pz-super-subtitle">
              Review payment, blocked-account, and public contact messages from school admins and visitors.
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
          </div>
        </div>

        <div className="pz-super-kpi-grid compact">
          <SummaryCard
            label="Total Inquiries"
            value={summary.total}
            helper="All received messages"
            icon={<Inbox aria-hidden="true" />}
            tone={{ background: "#EFF6FF", color: "#1B6ECC" }}
            glow="rgba(27,110,204,0.16)"
          />
          <SummaryCard
            label="New"
            value={summary.new}
            helper={`${openCount} still open in current view`}
            icon={<Mail aria-hidden="true" />}
            tone={{ background: "#FEF3DC", color: "#92400E" }}
            glow="rgba(239,159,39,0.16)"
          />
          <SummaryCard
            label="Closed"
            value={summary.closed}
            helper={`${summary.inProgress} in progress`}
            icon={<CheckCircle2 aria-hidden="true" />}
            tone={{ background: "#E1F5EE", color: "#1A9E75" }}
            glow="rgba(26,158,117,0.16)"
          />
        </div>

        <section className="pz-super-card">
          <div className="pz-super-card-header">
            <div>
              <div className="pz-super-card-title">Inquiry Inbox</div>
              <div className="pz-super-subtitle" style={{ marginTop: 4 }}>
                Showing latest 300 matching records.
              </div>
            </div>
            <span className={`pz-super-badge ${summary.new ? "amber" : "green"}`}>
              <MessageSquareText size={13} aria-hidden="true" />
              {summary.new ? "Needs review" : "Clear"}
            </span>
          </div>

          <div className="pz-super-toolbar">
            <div className="pz-super-search">
              <Search size={16} aria-hidden="true" />
              <input
                type="text"
                placeholder="Search name, email, school, subject, or message..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
            <AdminSelect
              value={statusFilter}
              onChange={setStatusFilter}
              options={statusFilterOptions}
              ariaLabel="Inquiry status filter"
            />
          </div>

          {loading ? (
            <div className="pz-super-loading">Loading inquiries...</div>
          ) : inquiries.length ? (
            <InquiryTable inquiries={inquiries} updatingId={updatingId} onStatusChange={updateStatus} />
          ) : (
            <div className="pz-super-empty">No inquiries match the current filters.</div>
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

function InquiryTable({
  inquiries,
  updatingId,
  onStatusChange,
}: {
  inquiries: Inquiry[];
  updatingId: number | null;
  onStatusChange: (id: number, status: string) => void;
}) {
  return (
    <div className="pz-super-table-wrap">
      <table className="pz-super-table">
        <thead>
          <tr>
            <th>Received</th>
            <th>Sender</th>
            <th>School</th>
            <th>Subject</th>
            <th>Message</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {inquiries.map((inquiry) => (
            <tr key={inquiry.id}>
              <td>
                <div className="pz-super-entity-name">{formatDate(inquiry.created_at)}</div>
                <div className="pz-super-entity-sub">
                  <Clock3 size={11} aria-hidden="true" style={{ display: "inline", marginRight: 4 }} />
                  {inquiry.source || "contact"}
                </div>
              </td>
              <td>
                <div className="pz-super-entity-name">{inquiry.name}</div>
                <div className="pz-super-entity-sub">{inquiry.email}</div>
                {inquiry.phone && <div className="pz-super-entity-sub">{inquiry.phone}</div>}
              </td>
              <td>
                <div className="pz-super-entity-name">{inquiry.school_name || "Not linked"}</div>
                <div className="pz-super-entity-sub">
                  {inquiry.school_id ? `School #${inquiry.school_id}` : "Public inquiry"}
                </div>
              </td>
              <td>
                <div className="pz-super-entity-name">{inquiry.subject || "Contact request"}</div>
                <div className="pz-super-entity-sub">
                  User {inquiry.user_id ? `#${inquiry.user_id}` : "not linked"}
                </div>
              </td>
              <td style={{ minWidth: 260, maxWidth: 420 }}>
                <div className="pz-super-entity-name" style={{ whiteSpace: "normal", lineHeight: 1.45 }}>
                  {inquiry.message}
                </div>
              </td>
              <td style={{ minWidth: 170 }}>
                <AdminSelect
                  value={inquiry.status}
                  onChange={(status) => onStatusChange(inquiry.id, status)}
                  options={statusOptions}
                  ariaLabel={`Inquiry ${inquiry.id} status`}
                  disabled={updatingId === inquiry.id}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function formatDate(value: string | null | undefined) {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  return date.toLocaleString();
}
