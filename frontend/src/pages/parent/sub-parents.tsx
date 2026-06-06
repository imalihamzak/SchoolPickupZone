import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Car,
  Info,
  Pencil,
  Phone,
  Plus,
  Save,
  ShieldCheck,
  Trash2,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";
import DashboardLayout from "@/components/layouts/dashboard-layout";
import { AdminSelect } from "@/components/ui/admin-controls";
import { toast } from "@/components/ui/toast";
import { API_BASE_URL } from "@/lib/api/link";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import ParentModalPortal from "./components/ParentModalPortal";
import "./components/parent-modal.css";
import "./components/parent-workspace.css";

type Vehicle = {
  id?: number;
  name: string;
  make: string;
  model: string;
  color: string;
  plate_number: string;
  year: string;
};

type SecondParent = {
  id: number;
  full_name: string;
  relation: string;
  phone: string;
  status: string;
  vehicle?: Vehicle | null;
};

type SecondParentForm = {
  full_name: string;
  relation: string;
  phone: string;
  status: string;
  vehicle: Vehicle;
};

const SECOND_PARENT_CSS = `
.pz-second-parent-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.pz-second-parent-limit {
  border: 1px solid var(--border);
  border-radius: 12px;
  background: var(--white);
  padding: 14px 16px;
  margin-bottom: 16px;
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 12px;
}

.pz-second-parent-limit-icon {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: var(--teal-pale);
  color: var(--teal);
  display: flex;
  align-items: center;
  justify-content: center;
}

.pz-second-parent-limit-title {
  color: var(--text-1);
  font-size: 14px;
  font-weight: 800;
}

.pz-second-parent-limit-copy {
  color: var(--text-3);
  font-size: 12px;
  margin-top: 3px;
}

.pz-second-parent-status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border-radius: 999px;
  background: var(--teal-pale);
  color: #065F46;
  padding: 5px 10px;
  font-size: 11px;
  font-weight: 800;
}

.pz-second-parent-status.inactive {
  background: var(--red-pale);
  color: #991B1B;
}

@media (max-width: 760px) {
  .pz-second-parent-limit {
    grid-template-columns: auto 1fr;
  }

  .pz-second-parent-limit .pz-second-parent-status {
    grid-column: 1 / -1;
    justify-content: center;
  }
}
`;

const relationOptions = [
  { value: "", label: "Select Relation" },
  { value: "Mother", label: "Mother" },
  { value: "Father", label: "Father" },
  { value: "Parent", label: "Parent" },
  { value: "Step Parent", label: "Step Parent" },
  { value: "Guardian", label: "Guardian" },
  { value: "Other", label: "Other" },
];

const statusOptions = [
  { value: "Active", label: "Active" },
  { value: "Inactive", label: "Inactive" },
];

const vehicleFields = [
  { key: "name", label: "Vehicle Name", placeholder: "e.g. Toyota Highlander" },
  { key: "make", label: "Make", placeholder: "e.g. Toyota" },
  { key: "model", label: "Model", placeholder: "e.g. Highlander" },
  { key: "color", label: "Color", placeholder: "e.g. White" },
  { key: "plate_number", label: "Plate Number", placeholder: "e.g. ABC-123" },
  { key: "year", label: "Year", placeholder: "e.g. 2024" },
] as const;

const emptyVehicle = (): Vehicle => ({
  name: "",
  make: "",
  model: "",
  color: "",
  plate_number: "",
  year: "",
});

const emptyForm = (): SecondParentForm => ({
  full_name: "",
  relation: "",
  phone: "",
  status: "Active",
  vehicle: emptyVehicle(),
});

const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

function vehicleSummary(vehicle?: Vehicle | null) {
  if (!vehicle) return "No vehicle details saved";
  const detail = [vehicle.name, vehicle.color, vehicle.plate_number ? `Plate ${vehicle.plate_number}` : ""]
    .filter(Boolean)
    .join(" - ");
  return detail || "No vehicle details saved";
}

export default function SubParents() {
  const [secondParents, setSecondParents] = useState<SecondParent[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalMode, setModalMode] = useState<"add" | "edit" | null>(null);
  const [editingParent, setEditingParent] = useState<SecondParent | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SecondParent | null>(null);
  const [form, setForm] = useState<SecondParentForm>(() => emptyForm());
  const [submitting, setSubmitting] = useState(false);

  const slotUsed = secondParents.length >= 1;
  const activeCount = useMemo(
    () => secondParents.filter((item) => String(item.status || "Active").toLowerCase() === "active").length,
    [secondParents]
  );

  const fetchSecondParents = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${API_BASE_URL}/guardians/second-parents`, {
        headers: authHeaders(),
      });
      setSecondParents(Array.isArray(data) ? data : []);
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to load second parent");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSecondParents();
  }, []);

  useEffect(() => {
    if (!modalMode && !deleteTarget) return;
    document.body.classList.add("modal-open");
    return () => document.body.classList.remove("modal-open");
  }, [modalMode, deleteTarget]);

  const openAddModal = () => {
    setEditingParent(null);
    setForm(emptyForm());
    setModalMode("add");
  };

  const openEditModal = (parent: SecondParent) => {
    setEditingParent(parent);
    setForm({
      full_name: parent.full_name || "",
      relation: parent.relation || "",
      phone: parent.phone || "",
      status: parent.status || "Active",
      vehicle: parent.vehicle || emptyVehicle(),
    });
    setModalMode("edit");
  };

  const closeModal = () => {
    setModalMode(null);
    setEditingParent(null);
    setForm(emptyForm());
  };

  const updateVehicle = (key: keyof Vehicle, value: string) => {
    setForm((current) => ({
      ...current,
      vehicle: {
        ...current.vehicle,
        [key]: value,
      },
    }));
  };

  const validateForm = () => {
    if (!form.full_name.trim() || !form.relation.trim() || !form.phone.trim()) {
      toast.error("Please complete the second parent details");
      return false;
    }

    if (vehicleFields.some((field) => !form.vehicle[field.key].trim())) {
      toast.error("Please complete all required vehicle details");
      return false;
    }

    return true;
  };

  const submitForm = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!modalMode || !validateForm()) return;

    setSubmitting(true);
    try {
      const payload = {
        full_name: form.full_name,
        relation: form.relation,
        phone: form.phone,
        status: form.status,
        vehicle: form.vehicle,
      };

      if (modalMode === "edit" && editingParent) {
        await axios.put(`${API_BASE_URL}/guardians/second-parents/${editingParent.id}`, payload, {
          headers: authHeaders(),
        });
        toast.success("Second parent updated");
      } else {
        await axios.post(`${API_BASE_URL}/guardians/second-parents`, payload, {
          headers: authHeaders(),
        });
        toast.success("Second parent added");
      }

      closeModal();
      fetchSecondParents();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Unable to save second parent");
    } finally {
      setSubmitting(false);
    }
  };

  const deleteSecondParent = async () => {
    if (!deleteTarget) return;

    setSubmitting(true);
    try {
      await axios.delete(`${API_BASE_URL}/guardians/second-parents/${deleteTarget.id}`, {
        headers: authHeaders(),
      });
      toast.success("Second parent removed");
      setDeleteTarget(null);
      fetchSecondParents();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Unable to remove second parent");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout role="parent">
      <style>{SECOND_PARENT_CSS}</style>
      <div className="pz-parent-workspace-view">
        <div className="pz-parent-workspace-heading">
          <div>
            <h1 className="pz-parent-workspace-title">Second Parent</h1>
            <div className="pz-parent-workspace-copy">One additional parent pickup contact for this family.</div>
          </div>
          <div className="pz-second-parent-actions">
            <span className="pz-parent-workspace-badge">
              <span className="pz-parent-workspace-dot" />
              {secondParents.length}/1 slot used
            </span>
            <button
              type="button"
              className="pz-parent-primary-action"
              onClick={openAddModal}
              disabled={slotUsed || loading}
            >
              <Plus size={15} aria-hidden="true" />
              Add Second Parent
            </button>
          </div>
        </div>

        <div className="pz-second-parent-limit">
          <div className="pz-second-parent-limit-icon">
            <UsersRound size={21} aria-hidden="true" />
          </div>
          <div>
            <div className="pz-second-parent-limit-title">Second parent slot</div>
            <div className="pz-second-parent-limit-copy">
              Guardian slots stay separate, so the existing 2 guardian limit is not changed.
            </div>
          </div>
          <span className={`pz-second-parent-status ${activeCount ? "" : "inactive"}`}>
            {activeCount ? "Active" : slotUsed ? "Inactive" : "Available"}
          </span>
        </div>

        {loading ? (
          <div className="pz-parent-workspace-loading">
            <LoadingSpinner size="sm" label="Loading second parent" />
          </div>
        ) : secondParents.length === 0 ? (
          <div className="pz-parent-empty-card">
            <div className="pz-parent-empty-icon">
              <UserRound size={22} aria-hidden="true" />
            </div>
            <div>
              <div className="pz-parent-profile-name">No second parent added</div>
              <div className="pz-parent-workspace-copy">Add one parent pickup contact when needed.</div>
            </div>
          </div>
        ) : (
          <div className="pz-parent-workspace-grid">
            {secondParents.map((parent) => (
              <article className="pz-parent-profile-card" key={parent.id}>
                <div className="pz-parent-profile-card-head">
                  <div className="pz-parent-profile-identity">
                    <div className="pz-parent-profile-avatar">
                      <UserRound size={25} aria-hidden="true" />
                    </div>
                    <div className="min-w-0">
                      <h2 className="pz-parent-profile-name">{parent.full_name}</h2>
                      <p className="pz-parent-profile-meta">{parent.relation}</p>
                    </div>
                  </div>
                  <div className="pz-parent-profile-actions">
                    <button
                      type="button"
                      className="pz-parent-icon-button"
                      onClick={() => openEditModal(parent)}
                      title="Edit"
                    >
                      <Pencil size={17} aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      className="pz-parent-icon-button danger"
                      onClick={() => setDeleteTarget(parent)}
                      title="Delete"
                    >
                      <Trash2 size={17} aria-hidden="true" />
                    </button>
                  </div>
                </div>

                <div className="pz-parent-profile-body">
                  <div className="pz-parent-info-panel safe">
                    <div className="pz-parent-info-label">
                      <Phone size={15} aria-hidden="true" />
                      Contact
                    </div>
                    <div className="pz-parent-info-copy">{parent.phone || "No phone number saved"}</div>
                  </div>

                  <div className="pz-parent-info-panel">
                    <div className="pz-parent-info-label">
                      <Car size={15} aria-hidden="true" />
                      Vehicle Information
                    </div>
                    <div className="pz-parent-info-copy">{vehicleSummary(parent.vehicle)}</div>
                  </div>

                  <div className="pz-parent-metric-row">
                    <div className="pz-parent-metric">
                      <div className="pz-parent-metric-label">Status</div>
                      <div className="pz-parent-metric-value">{parent.status || "Active"}</div>
                    </div>
                    <div className="pz-parent-metric">
                      <div className="pz-parent-metric-label">Pickup Role</div>
                      <div className="pz-parent-metric-value">Second Parent</div>
                    </div>
                  </div>

                  <div className="pz-parent-profile-footer">
                    <button className="pz-parent-primary-action" onClick={() => openEditModal(parent)}>
                      <ShieldCheck size={15} aria-hidden="true" />
                      Manage Second Parent
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {modalMode && (
          <ParentModalPortal>
            <div className="pz-parent-modal-overlay">
              <div className="pz-parent-modal wide" role="dialog" aria-modal="true" aria-labelledby="second-parent-title">
                <div className="pz-parent-modal-head">
                  <div className="pz-parent-modal-title-row">
                    <div className="pz-parent-modal-icon">
                      <UserRound size={20} aria-hidden="true" />
                    </div>
                    <div>
                      <h2 className="pz-parent-modal-title" id="second-parent-title">
                        {modalMode === "edit" ? "Edit Second Parent" : "Add Second Parent"}
                      </h2>
                      <div className="pz-parent-modal-subtitle">
                        Save pickup authorization, contact, and vehicle details.
                      </div>
                    </div>
                  </div>
                  <button type="button" onClick={closeModal} className="pz-parent-modal-close" aria-label="Close">
                    <X size={18} aria-hidden="true" />
                  </button>
                </div>

                <form onSubmit={submitForm} className="pz-parent-form">
                  <div className="pz-parent-modal-body">
                    <div className="pz-parent-form">
                      <div className="pz-parent-field">
                        <label htmlFor="second-parent-name">
                          Full Name <span className="pz-parent-required">*</span>
                        </label>
                        <input
                          id="second-parent-name"
                          value={form.full_name}
                          onChange={(event) => setForm({ ...form, full_name: event.target.value })}
                          placeholder="Second parent's full name"
                        />
                      </div>

                      <div className="pz-parent-form-grid">
                        <div className="pz-parent-field">
                          <label htmlFor="second-parent-relation">
                            Relation to Child <span className="pz-parent-required">*</span>
                          </label>
                          <AdminSelect
                            id="second-parent-relation"
                            value={form.relation}
                            onChange={(value) => setForm({ ...form, relation: value })}
                            options={relationOptions}
                            ariaLabel="Second parent relation"
                            className="full"
                          />
                        </div>

                        <div className="pz-parent-field">
                          <label htmlFor="second-parent-phone">
                            Phone Number <span className="pz-parent-required">*</span>
                          </label>
                          <input
                            id="second-parent-phone"
                            type="tel"
                            value={form.phone}
                            onChange={(event) => setForm({ ...form, phone: event.target.value })}
                            placeholder="Contact phone number"
                          />
                        </div>
                      </div>

                      {modalMode === "edit" && (
                        <div className="pz-parent-field">
                          <label htmlFor="second-parent-status">Status</label>
                          <AdminSelect
                            id="second-parent-status"
                            value={form.status}
                            onChange={(value) => setForm({ ...form, status: value })}
                            options={statusOptions}
                            ariaLabel="Second parent status"
                            className="full"
                          />
                        </div>
                      )}

                      <div className="pz-parent-section">
                        <h3 className="pz-parent-section-title">
                          <Car size={16} aria-hidden="true" />
                          Vehicle Information
                        </h3>
                        <div className="pz-parent-form-grid three">
                          {vehicleFields.map((field) => (
                            <div className="pz-parent-field" key={field.key}>
                              <label htmlFor={`second-parent-vehicle-${field.key}`}>
                                {field.label} <span className="pz-parent-required">*</span>
                              </label>
                              <input
                                id={`second-parent-vehicle-${field.key}`}
                                type={field.key === "year" ? "number" : "text"}
                                value={form.vehicle[field.key]}
                                onChange={(event) => updateVehicle(field.key, event.target.value)}
                                placeholder={field.placeholder}
                              />
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="pz-parent-note">
                        <Info size={16} aria-hidden="true" />
                        <span>This second parent receives pickup QR access without using a guardian slot.</span>
                      </div>
                    </div>
                  </div>

                  <div className="pz-parent-modal-footer">
                    <button type="button" onClick={closeModal} className="pz-parent-modal-button">
                      Cancel
                    </button>
                    <button type="submit" disabled={submitting} className="pz-parent-modal-button primary">
                      <Save size={15} aria-hidden="true" />
                      {submitting ? "Saving..." : "Save Second Parent"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </ParentModalPortal>
        )}

        {deleteTarget && (
          <ParentModalPortal>
            <div className="pz-parent-modal-overlay">
              <div className="pz-parent-modal small" role="dialog" aria-modal="true" aria-labelledby="delete-second-parent-title">
                <div className="pz-parent-modal-head">
                  <div className="pz-parent-modal-title-row">
                    <div className="pz-parent-modal-icon danger">
                      <Trash2 size={20} aria-hidden="true" />
                    </div>
                    <div>
                      <h2 className="pz-parent-modal-title" id="delete-second-parent-title">
                        Remove Second Parent
                      </h2>
                      <div className="pz-parent-modal-subtitle">
                        Remove this contact from family pickup access.
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(null)}
                    className="pz-parent-modal-close"
                    aria-label="Close"
                  >
                    <X size={18} aria-hidden="true" />
                  </button>
                </div>
                <div className="pz-parent-modal-body">
                  <div className="pz-parent-form">
                    <div className="pz-parent-info-panel danger">
                      <div className="pz-parent-info-label">Confirm removal</div>
                      <div className="pz-parent-info-copy">
                        {deleteTarget.full_name} will no longer have second parent pickup access.
                      </div>
                    </div>
                  </div>
                </div>
                <div className="pz-parent-modal-footer">
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(null)}
                    className="pz-parent-modal-button"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={deleteSecondParent}
                    disabled={submitting}
                    className="pz-parent-modal-button danger"
                  >
                    <Trash2 size={15} aria-hidden="true" />
                    {submitting ? "Removing..." : "Remove"}
                  </button>
                </div>
              </div>
            </div>
          </ParentModalPortal>
        )}
      </div>
    </DashboardLayout>
  );
}
