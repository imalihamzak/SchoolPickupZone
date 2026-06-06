import { useState } from "react";
import { Car, Pencil, Phone, Save, ShieldCheck, Trash2, UserRound, X } from "lucide-react";
import axios from "axios";
import { toast } from "@/components/ui/toast";
import { AdminSelect } from "@/components/ui/admin-controls";
import { API_BASE_URL } from "@/lib/api/link";
import DeleteGuardianModal from "./DeleteGuardianModal";
import ParentModalPortal from "./ParentModalPortal";
import "./parent-modal.css";
import "./parent-workspace.css";

interface Vehicle {
  id?: number;
  name: string;
  make: string;
  model: string;
  color: string;
  plate_number: string;
  year: string;
}

interface Guardian {
  id: number;
  full_name: string;
  relation: string;
  phone: string;
  status: string;
  vehicle?: Vehicle | null;
}

interface GuardiansViewProps {
  guardians: Guardian[];
  onUpdate: () => void;
}

const relationOptions = [
  { value: "", label: "Select Relation" },
  { value: "Grandparent", label: "Grandparent" },
  { value: "Aunt", label: "Aunt" },
  { value: "Uncle", label: "Uncle" },
  { value: "Family Friend", label: "Family Friend" },
  { value: "Sibling", label: "Sibling" },
  { value: "Other", label: "Other" },
];

const statusOptions = [
  { value: "Active", label: "Active" },
  { value: "Inactive", label: "Inactive" },
];

const vehicleFields = [
  { key: "name", label: "Vehicle Name" },
  { key: "make", label: "Make" },
  { key: "model", label: "Model" },
  { key: "color", label: "Color" },
  { key: "plate_number", label: "Plate Number" },
  { key: "year", label: "Year" },
] as const;

export default function GuardiansView({ guardians, onUpdate }: GuardiansViewProps) {
  const [editingGuardian, setEditingGuardian] = useState<Guardian | null>(null);
  const [guardianToDelete, setGuardianToDelete] = useState<Guardian | null>(null);
  const [form, setForm] = useState({
    full_name: "",
    relation: "",
    phone: "",
    status: "Active",
    vehicle: {
      name: "",
      make: "",
      model: "",
      color: "",
      plate_number: "",
      year: "",
    },
  });

  const handleEditClick = (guardian: Guardian) => {
    setEditingGuardian(guardian);
    setForm({
      full_name: guardian.full_name,
      relation: guardian.relation,
      phone: guardian.phone,
      status: guardian.status || "Active",
      vehicle: guardian.vehicle ?? {
        name: "",
        make: "",
        model: "",
        color: "",
        plate_number: "",
        year: "",
      },
    });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editingGuardian) return;

    try {
      const token = localStorage.getItem("token");
      await axios.put(`${API_BASE_URL}/guardians/${editingGuardian.id}`, form, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Guardian updated");
      setEditingGuardian(null);
      onUpdate();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Update failed");
    }
  };

  const deleteGuardian = async () => {
    if (!guardianToDelete) return;

    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API_BASE_URL}/guardians/${guardianToDelete.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Guardian deleted");
      setGuardianToDelete(null);
      onUpdate();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Delete failed");
    }
  };

  return (
    <div className="pz-parent-workspace-view">
      <div className="pz-parent-workspace-heading">
        <div>
          <h2 className="pz-parent-workspace-title">Authorized Guardians</h2>
          <div className="pz-parent-workspace-copy">Trusted contacts approved for student pickup.</div>
        </div>
        <span className="pz-parent-workspace-badge">
          <span className="pz-parent-workspace-dot" />
          {guardians.length}/2 slots used
        </span>
      </div>

      {guardians.length === 0 ? (
        <div className="pz-parent-empty-card">
          <div className="pz-parent-empty-icon">
            <UserRound size={22} aria-hidden="true" />
          </div>
          <div>
            <div className="pz-parent-profile-name">No guardians added yet</div>
            <div className="pz-parent-workspace-copy">Add an authorized contact for pickup access.</div>
          </div>
        </div>
      ) : (
        <div className="pz-parent-workspace-grid">
          {guardians.map((guardian) => (
            <div key={guardian.id} className="pz-parent-profile-card">
              <div className="pz-parent-profile-card-head">
                <div className="pz-parent-profile-identity">
                  <div className="pz-parent-profile-avatar">
                    <UserRound size={25} aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="pz-parent-profile-name">{guardian.full_name}</h3>
                    <p className="pz-parent-profile-meta">{guardian.relation}</p>
                  </div>
                </div>
                <div className="pz-parent-profile-actions">
                  <button className="pz-parent-icon-button" onClick={() => handleEditClick(guardian)} title="Edit">
                    <Pencil size={17} aria-hidden="true" />
                  </button>
                  <button
                    className="pz-parent-icon-button danger"
                    title="Delete"
                    onClick={() => setGuardianToDelete(guardian)}
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
                  <div className="pz-parent-info-copy">{guardian.phone || "No phone number saved"}</div>
                </div>

                {guardian.vehicle ? (
                  <div className="pz-parent-info-panel">
                    <div className="pz-parent-info-label">
                      <Car size={15} aria-hidden="true" />
                      Vehicle Information
                    </div>
                    <div className="pz-parent-info-copy">
                      {guardian.vehicle.name || "Vehicle"} - {guardian.vehicle.color || "Color N/A"} - Plate{" "}
                      {guardian.vehicle.plate_number || "N/A"}
                    </div>
                  </div>
                ) : (
                  <div className="pz-parent-info-panel notice">
                    <div className="pz-parent-info-label">
                      <Car size={15} aria-hidden="true" />
                      Vehicle Information
                    </div>
                    <div className="pz-parent-info-copy">No vehicle details saved yet.</div>
                  </div>
                )}

                <div className="pz-parent-metric-row">
                  <div className="pz-parent-metric">
                    <div className="pz-parent-metric-label">Status</div>
                    <div className="pz-parent-metric-value">{guardian.status || "Active"}</div>
                  </div>
                  <div className="pz-parent-metric">
                    <div className="pz-parent-metric-label">Pickup Role</div>
                    <div className="pz-parent-metric-value">{guardian.relation || "Guardian"}</div>
                  </div>
                </div>

                <div className="pz-parent-profile-footer">
                  <button className="pz-parent-primary-action" onClick={() => handleEditClick(guardian)}>
                    <ShieldCheck size={15} aria-hidden="true" />
                    Manage Guardian
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {editingGuardian && (
        <ParentModalPortal>
          <div className="pz-parent-modal-overlay">
            <div className="pz-parent-modal wide" role="dialog" aria-modal="true" aria-labelledby="edit-guardian-title">
              <div className="pz-parent-modal-head">
                <div className="pz-parent-modal-title-row">
                  <div className="pz-parent-modal-icon">
                    <UserRound size={20} aria-hidden="true" />
                  </div>
                  <div>
                    <h2 className="pz-parent-modal-title" id="edit-guardian-title">
                      Edit Guardian
                    </h2>
                    <div className="pz-parent-modal-subtitle">
                      Update pickup authorization, contact, and vehicle details.
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingGuardian(null)}
                  className="pz-parent-modal-close"
                  aria-label="Close"
                >
                  <X size={18} aria-hidden="true" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="pz-parent-form">
                <div className="pz-parent-modal-body">
                  <div className="pz-parent-form">
                    <div className="pz-parent-form-grid">
                      <div className="pz-parent-field">
                        <label htmlFor="edit-guardian-name">Full Name</label>
                        <input
                          id="edit-guardian-name"
                          value={form.full_name}
                          onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                        />
                      </div>
                      <div className="pz-parent-field">
                        <label htmlFor="edit-guardian-phone">Phone</label>
                        <input
                          id="edit-guardian-phone"
                          value={form.phone}
                          onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        />
                      </div>
                      <div className="pz-parent-field">
                        <label htmlFor="edit-guardian-relation">Relation</label>
                        <AdminSelect
                          id="edit-guardian-relation"
                          value={form.relation}
                          onChange={(value) => setForm({ ...form, relation: value })}
                          options={relationOptions}
                          className="full"
                          ariaLabel="Guardian relation"
                        />
                      </div>
                      <div className="pz-parent-field">
                        <label htmlFor="edit-guardian-status">Status</label>
                        <AdminSelect
                          id="edit-guardian-status"
                          value={form.status}
                          onChange={(value) => setForm({ ...form, status: value })}
                          options={statusOptions}
                          className="full"
                          ariaLabel="Guardian status"
                        />
                      </div>
                    </div>

                    <div className="pz-parent-section">
                      <h3 className="pz-parent-section-title">
                        <Car size={16} aria-hidden="true" />
                        Vehicle Info
                      </h3>
                      <div className="pz-parent-form-grid three">
                        {vehicleFields.map((field) => (
                          <div className="pz-parent-field" key={field.key}>
                            <label htmlFor={`edit-guardian-vehicle-${field.key}`}>{field.label}</label>
                            <input
                              id={`edit-guardian-vehicle-${field.key}`}
                              value={form.vehicle[field.key]}
                              onChange={(e) =>
                                setForm({ ...form, vehicle: { ...form.vehicle, [field.key]: e.target.value } })
                              }
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pz-parent-modal-footer">
                  <button type="button" onClick={() => setEditingGuardian(null)} className="pz-parent-modal-button">
                    Cancel
                  </button>
                  <button type="submit" className="pz-parent-modal-button primary">
                    <Save size={15} aria-hidden="true" />
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        </ParentModalPortal>
      )}

      {guardianToDelete && (
        <DeleteGuardianModal
          isOpen
          onClose={() => setGuardianToDelete(null)}
          guardian={guardianToDelete}
          onDelete={deleteGuardian}
        />
      )}
    </div>
  );
}
