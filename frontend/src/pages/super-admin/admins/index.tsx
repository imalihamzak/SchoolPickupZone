import { useEffect, useMemo, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import axios from "axios";
import {
  CalendarDays,
  CheckCircle2,
  Edit3,
  Mail,
  MapPin,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  UserRoundCog,
  UsersRound,
} from "lucide-react";
import DashboardLayout from "@/components/layouts/dashboard-layout";
import AddAdminModal from "./components/AddAdminModal";
import EditAdminModal from "./components/EditAdminModal";
import DeleteAdminModal from "./components/DeleteAdminModal";
import Loader from "../../../components/Loader";
import { toast } from "@/components/ui/toast";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { API_BASE_URL } from "@/lib/api/link";
import "../super-admin-theme.css";

type Admin = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  school_name: string;
  location: string;
  subscription_status: string;
  next_billing_date: string;
};

export default function Admins() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [resendingAdminId, setResendingAdminId] = useState<number | null>(null);

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const res = await axios.get(`${API_BASE_URL}/superadmin/admins`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (Array.isArray(res.data)) {
        setAdmins(res.data);
      } else {
        setAdmins([]);
        console.error("Unexpected data structure:", res.data);
      }
    } catch (err) {
      console.error("Failed to fetch admins", err);
      setAdmins([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const openEditModal = (admin: Admin) => {
    setSelectedAdmin(admin);
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (admin: Admin) => {
    setSelectedAdmin(admin);
    setIsDeleteModalOpen(true);
  };

  const resendInvite = async (admin: Admin) => {
    if (!admin.email) {
      toast.error("This admin does not have an email address");
      return;
    }

    try {
      setResendingAdminId(admin.id);
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${API_BASE_URL}/superadmin/admins/${admin.id}/resend-invite`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      toast.success(response.data?.message || "Admin invite email resent");
    } catch (error) {
      console.error("Failed to resend admin invite:", error);
      const message = axios.isAxiosError(error)
        ? error.response?.data?.error || error.response?.data?.message
        : null;
      toast.error(message || "Failed to resend admin invite email");
    } finally {
      setResendingAdminId(null);
    }
  };

  const filteredAdmins = useMemo(
    () =>
      admins.filter((admin) => {
        const query = searchQuery.toLowerCase();
        return (
          `${admin.firstName} ${admin.lastName}`.toLowerCase().includes(query) ||
          (admin.email || "").toLowerCase().includes(query) ||
          (admin.school_name || "").toLowerCase().includes(query) ||
          (admin.location || "").toLowerCase().includes(query)
        );
      }),
    [admins, searchQuery]
  );

  const activeSubscriptions = useMemo(
    () => admins.filter((admin) => admin.subscription_status === "Active").length,
    [admins]
  );

  const schoolCount = useMemo(
    () => new Set(admins.map((admin) => admin.school_name).filter(Boolean)).size,
    [admins]
  );

  return (
    <DashboardLayout role="super-admin">
      <div className="pz-super-page">
        <div className="pz-super-header">
          <div>
            <div className="pz-super-kicker">Platform Admins</div>
            <h1 className="pz-super-title">Admins</h1>
            <div className="pz-super-subtitle">
              Manage school admin accounts, assignments, and subscription visibility.
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
            <button type="button" onClick={() => setIsAddModalOpen(true)} className="pz-super-button primary">
              <Plus size={15} aria-hidden="true" />
              Add Admin
            </button>
          </div>
        </div>

        <div className="pz-super-kpi-grid compact">
          <SummaryCard
            label="Total Admins"
            value={admins.length}
            helper="School admin records"
            icon={<UserRoundCog aria-hidden="true" />}
            tone={{ background: "#EFF6FF", color: "#1B6ECC" }}
            glow="rgba(27,110,204,0.16)"
          />
          <SummaryCard
            label="Active Subscriptions"
            value={activeSubscriptions}
            helper="Attached to admin schools"
            icon={<ShieldCheck aria-hidden="true" />}
            tone={{ background: "#E1F5EE", color: "#1A9E75" }}
            glow="rgba(26,158,117,0.16)"
          />
          <SummaryCard
            label="Schools Represented"
            value={schoolCount}
            helper="Unique school assignments"
            icon={<UsersRound aria-hidden="true" />}
            tone={{ background: "#FEF3DC", color: "#EF9F27" }}
            glow="rgba(239,159,39,0.16)"
          />
        </div>

        <section className="pz-super-card">
          <div className="pz-super-card-header">
            <div>
              <div className="pz-super-card-title">Admin Directory</div>
              <div className="pz-super-subtitle" style={{ marginTop: 4 }}>
                {filteredAdmins.length} matching admin{filteredAdmins.length === 1 ? "" : "s"}
              </div>
            </div>
            <span className="pz-super-badge green">
              <span className="pz-super-badge-dot" />
              Accounts
            </span>
          </div>

          <div className="pz-super-toolbar">
            <div className="pz-super-search">
              <Search size={16} aria-hidden="true" />
              <input
                type="text"
                placeholder="Search admins, schools, email, or location..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
              />
            </div>
          </div>

          <div className="pz-super-table-wrap">
            <table className="pz-super-table">
              <thead>
                <tr>
                  <th>Admin</th>
                  <th>Email</th>
                  <th>School</th>
                  <th>Location</th>
                  <th>Subscription</th>
                  <th>Next Payment</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7}>
                      <div className="pz-super-loading">
                        <Loader />
                      </div>
                    </td>
                  </tr>
                ) : filteredAdmins.length ? (
                  filteredAdmins.map((admin) => (
                    <tr key={admin.id}>
                      <td>
                        <div className="pz-super-entity-cell">
                          <div className="pz-super-avatar">{initials(admin)}</div>
                          <div>
                            <div className="pz-super-entity-name">
                              {admin.firstName} {admin.lastName}
                            </div>
                            <div className="pz-super-entity-sub">Admin ID {admin.id}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="pz-super-entity-cell">
                          <Mail size={15} aria-hidden="true" />
                          <span>{admin.email || "N/A"}</span>
                        </div>
                      </td>
                      <td>{admin.school_name || "N/A"}</td>
                      <td>
                        <div className="pz-super-entity-cell">
                          <MapPin size={15} aria-hidden="true" />
                          <span>{admin.location || "N/A"}</span>
                        </div>
                      </td>
                      <td>
                        <span className={`pz-super-badge ${subscriptionBadgeClass(admin.subscription_status)}`}>
                          <span className="pz-super-badge-dot" />
                          {admin.subscription_status || "N/A"}
                        </span>
                      </td>
                      <td>{admin.next_billing_date ? formatDate(admin.next_billing_date) : "N/A"}</td>
                      <td>
                        <div className="pz-super-table-actions">
                          <button
                            type="button"
                            onClick={() => resendInvite(admin)}
                            className="pz-super-icon-button"
                            disabled={resendingAdminId === admin.id}
                            title="Resend invite email"
                            aria-label={`Resend invite email to ${admin.firstName} ${admin.lastName}`}
                          >
                            {resendingAdminId === admin.id ? (
                              <LoadingSpinner size="xs" />
                            ) : (
                              <Mail size={16} aria-hidden="true" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => openEditModal(admin)}
                            className="pz-super-icon-button"
                            aria-label={`Edit ${admin.firstName} ${admin.lastName}`}
                          >
                            <Edit3 size={16} aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            onClick={() => openDeleteModal(admin)}
                            className="pz-super-icon-button danger"
                            aria-label={`Delete ${admin.firstName} ${admin.lastName}`}
                          >
                            <Trash2 size={16} aria-hidden="true" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7}>
                      <div className="pz-super-empty">No admins available.</div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <AddAdminModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={fetchAdmins}
      />

      {selectedAdmin && (
        <EditAdminModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          adminId={selectedAdmin.id}
          onSave={() => {
            setIsEditModalOpen(false);
            fetchAdmins();
          }}
        />
      )}
      {selectedAdmin && (
        <DeleteAdminModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          admin={{
            id: selectedAdmin.id,
            name: `${selectedAdmin.firstName} ${selectedAdmin.lastName}`,
          }}
          onDelete={async () => {
            const token = localStorage.getItem("token");
            try {
              await axios.delete(`${API_BASE_URL}/superadmin/admins/${selectedAdmin.id}`, {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              });
              setIsDeleteModalOpen(false);
              fetchAdmins();
            } catch (error) {
              console.error("Failed to delete admin:", error);
              toast.error("Failed to delete admin");
            }
          }}
        />
      )}
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

function initials(admin: Admin) {
  const fallback = admin.email?.[0] || "A";
  return `${admin.firstName?.[0] || fallback}${admin.lastName?.[0] || ""}`.toUpperCase();
}

function subscriptionBadgeClass(status?: string) {
  if (status === "Active") return "green";
  if (status === "Cancelled") return "red";
  if (status === "Expiring Soon") return "amber";
  return "gray";
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
