import { useEffect, useMemo, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import axios from "axios";
import {
  Building2,
  CalendarDays,
  CheckCircle2,
  Edit3,
  MapPin,
  Plus,
  Search,
  ShieldOff,
  Trash2,
  UsersRound,
} from "lucide-react";
import DashboardLayout from "@/components/layouts/dashboard-layout";
import AddEditSchoolModal from "./components/AddEditSchoolModal";
import Loader from "../../../components/Loader";
import { API_BASE_URL } from "@/lib/api/link";
import DeleteConfirmationModal from "./components/DeleteConfirmationModal";
import "../super-admin-theme.css";

interface School {
  id: number;
  name: string;
  location: string;
  student_count: number;
  status: "Active" | "Suspended";
  suspension_reason?: string | null;
  suspended_at?: string | null;
  plan_id?: number | null;
  plan_name?: string | null;
  billing_interval?: "monthly" | "yearly";
  max_students?: number | null;
  max_families?: number | null;
  max_guards?: number | null;
  used_students?: number;
  used_families?: number;
  used_guards?: number;
  subscription_status?: string | null;
  next_billing_date?: string | null;
  pending_plan_id?: number | null;
  pending_plan_name?: string | null;
  pending_billing_interval?: "monthly" | "yearly" | null;
  pending_change_type?: string | null;
  pending_change_effective_at?: string | null;
}

export default function SchoolsManagement() {
  const [schools, setSchools] = useState<School[]>([]);
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddSchoolModalOpen, setIsAddSchoolModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchSchools();
  }, []);

  const fetchSchools = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE_URL}/superadmin/schools`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSchools(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Failed to fetch schools:", err);
    } finally {
      setLoading(false);
    }
  };

  const openAddSchoolModal = () => {
    setSelectedSchool(null);
    setIsAddSchoolModalOpen(true);
  };

  const openEditSchoolModal = (school: School) => {
    setSelectedSchool(school);
    setIsAddSchoolModalOpen(true);
  };

  const openDeleteModal = (school: School) => {
    setSelectedSchool(school);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteSchool = async () => {
    if (!selectedSchool) return;

    try {
      await axios.delete(`${API_BASE_URL}/superadmin/schools/${selectedSchool.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSchools(schools.filter((s) => s.id !== selectedSchool.id));
      setIsDeleteModalOpen(false);
      setSelectedSchool(null);
    } catch (err) {
      console.error("Failed to delete school:", err);
    }
  };

  const toggleSchoolStatus = async (school: School) => {
    const nextStatus = school.status === "Suspended" ? "Active" : "Suspended";

    try {
      await axios.patch(
        `${API_BASE_URL}/superadmin/schools/${school.id}/status`,
        {
          status: nextStatus,
          reason: nextStatus === "Suspended" ? "Suspended by Super Admin" : null,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      await fetchSchools();
    } catch (err) {
      console.error("Failed to update school status:", err);
    }
  };

  const filteredSchools = useMemo(
    () =>
      schools.filter((school) => {
        const query = searchQuery.toLowerCase();
        return (
          school.name.toLowerCase().includes(query) ||
          (school.location || "").toLowerCase().includes(query)
        );
      }),
    [schools, searchQuery]
  );

  const activeSchools = useMemo(
    () => schools.filter((school) => school.status !== "Suspended").length,
    [schools]
  );

  const suspendedSchools = useMemo(
    () => schools.filter((school) => school.status === "Suspended").length,
    [schools]
  );

  const totalStudents = useMemo(
    () => schools.reduce((sum, school) => sum + Number(school.student_count || 0), 0),
    [schools]
  );

  return (
    <DashboardLayout role="super-admin">
      <div className="pz-super-page">
        <div className="pz-super-header">
          <div>
            <div className="pz-super-kicker">Platform Schools</div>
            <h1 className="pz-super-title">Schools</h1>
            <div className="pz-super-subtitle">
              Manage school records, student totals, and subscription status.
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
            <button type="button" onClick={openAddSchoolModal} className="pz-super-button primary">
              <Plus size={15} aria-hidden="true" />
              Add School
            </button>
          </div>
        </div>

        <div className="pz-super-kpi-grid compact">
          <SummaryCard
            label="Total Schools"
            value={schools.length}
            helper="Registered schools"
            icon={<Building2 aria-hidden="true" />}
            tone={{ background: "#EFF6FF", color: "#1B6ECC" }}
            glow="rgba(27,110,204,0.16)"
          />
          <SummaryCard
            label="Active Schools"
            value={activeSchools}
            helper={`${suspendedSchools} suspended`}
            icon={<CheckCircle2 aria-hidden="true" />}
            tone={{ background: "#E1F5EE", color: "#1A9E75" }}
            glow="rgba(26,158,117,0.16)"
          />
          <SummaryCard
            label="Students"
            value={totalStudents}
            helper="Across all schools"
            icon={<UsersRound aria-hidden="true" />}
            tone={{ background: "#FEF3DC", color: "#EF9F27" }}
            glow="rgba(239,159,39,0.16)"
          />
        </div>

        <section className="pz-super-card">
          <div className="pz-super-card-header">
            <div>
              <div className="pz-super-card-title">School Registry</div>
              <div className="pz-super-subtitle" style={{ marginTop: 4 }}>
                {filteredSchools.length} matching school{filteredSchools.length === 1 ? "" : "s"}
              </div>
            </div>
            <span className="pz-super-badge blue">
              <span className="pz-super-badge-dot" />
              Directory
            </span>
          </div>

          <div className="pz-super-toolbar">
            <div className="pz-super-search">
              <Search size={16} aria-hidden="true" />
              <input
                type="text"
                placeholder="Search schools or locations..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
              />
            </div>
          </div>

          <div className="pz-super-table-wrap">
            <table className="pz-super-table">
              <thead>
                <tr>
                  <th>School</th>
                  <th>Location</th>
                  <th>Students</th>
                  <th>Package</th>
                  <th>Subscription</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6}>
                      <div className="pz-super-loading">
                        <Loader />
                      </div>
                    </td>
                  </tr>
                ) : filteredSchools.length ? (
                  filteredSchools.map((school) => {
                    const displayPackageName = school.pending_plan_name || school.plan_name || "No package";
                    const displayBillingInterval = school.pending_billing_interval || school.billing_interval || "monthly";
                    const displayPackageId = school.pending_plan_id || school.plan_id;

                    return (
                    <tr key={school.id}>
                      <td>
                        <div className="pz-super-entity-cell">
                          <div className="pz-super-avatar">
                            <Building2 size={17} aria-hidden="true" />
                          </div>
                          <div>
                            <div className="pz-super-entity-name">{school.name}</div>
                            <div className="pz-super-entity-sub">School ID {school.id}</div>
                            <span className={`pz-super-badge ${school.status === "Suspended" ? "red" : "green"}`}>
                              <span className="pz-super-badge-dot" />
                              {school.status || "Active"}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="pz-super-entity-cell">
                          <MapPin size={15} aria-hidden="true" />
                          <span>{school.location || "No location"}</span>
                        </div>
                      </td>
                      <td>
                        <div className="pz-super-entity-name">{school.student_count ?? 0}</div>
                        <div className="pz-super-entity-sub">
                          Live usage {school.used_students ?? 0}/{formatLimit(school.max_students)}
                        </div>
                      </td>
                      <td>
                        <div className="pz-super-entity-name">{displayPackageName}</div>
                        {displayPackageId && (
                          <div className="pz-super-entity-sub">
                            {displayBillingInterval} | Package ID {displayPackageId}
                          </div>
                        )}
                        {school.pending_plan_name && (
                          <>
                            <span className="pz-super-badge amber" style={{ marginTop: 6 }}>
                              <span className="pz-super-badge-dot" />
                              {formatChangeType(school.pending_change_type)}
                            </span>
                            <div className="pz-super-entity-sub" style={{ marginTop: 5 }}>
                              Current: {school.plan_name || "No package"} until {formatDate(school.pending_change_effective_at)}
                            </div>
                          </>
                        )}
                        <div className="pz-super-entity-sub">
                          Families {school.used_families ?? 0}/{formatLimit(school.max_families)}
                        </div>
                        <div className="pz-super-entity-sub">
                          Guards {school.used_guards ?? 0}/{formatLimit(school.max_guards)}
                        </div>
                      </td>
                      <td>
                        <span className={`pz-super-badge ${subscriptionBadgeClass(school.subscription_status)}`}>
                          <span className="pz-super-badge-dot" />
                          {school.subscription_status || "Inactive"}
                        </span>
                        {school.next_billing_date && (
                          <div className="pz-super-entity-sub" style={{ marginTop: 5 }}>
                            Next: {formatDate(school.next_billing_date)}
                          </div>
                        )}
                      </td>
                      <td>
                        <div className="pz-super-table-actions">
                          <button
                            type="button"
                            onClick={() => openEditSchoolModal(school)}
                            className="pz-super-icon-button"
                            aria-label={`Edit ${school.name}`}
                          >
                            <Edit3 size={16} aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleSchoolStatus(school)}
                            className={`pz-super-icon-button ${school.status === "Suspended" ? "" : "danger"}`}
                            aria-label={school.status === "Suspended" ? `Reactivate ${school.name}` : `Suspend ${school.name}`}
                          >
                            {school.status === "Suspended" ? (
                              <CheckCircle2 size={16} aria-hidden="true" />
                            ) : (
                              <ShieldOff size={16} aria-hidden="true" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => openDeleteModal(school)}
                            className="pz-super-icon-button danger"
                            aria-label={`Delete ${school.name}`}
                          >
                            <Trash2 size={16} aria-hidden="true" />
                          </button>
                        </div>
                      </td>
                    </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6}>
                      <div className="pz-super-empty">No schools available.</div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        entityName={selectedSchool?.name || ""}
        onDelete={handleDeleteSchool}
      />

      <AddEditSchoolModal
        isOpen={isAddSchoolModalOpen}
        onClose={() => setIsAddSchoolModalOpen(false)}
        selectedSchool={selectedSchool as any}
        onSave={() => fetchSchools()}
      />
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

function subscriptionBadgeClass(status?: string | null) {
  if (status === "Active") return "green";
  if (status === "Expiring Soon") return "amber";
  if (status === "Cancelled" || status === "Inactive") return "red";
  return "gray";
}

function formatDate(value?: string | null) {
  if (!value) return "N/A";
  return new Date(value).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatChangeType(value?: string | null) {
  if (value === "downgrade") return "Scheduled downgrade";
  if (value === "upgrade") return "Upgrade selected";
  return "Package selected";
}

function formatLimit(value?: number | null) {
  return value === null || value === undefined ? "Unlimited" : value;
}
