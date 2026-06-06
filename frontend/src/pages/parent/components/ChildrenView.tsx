import { useEffect, useState } from "react";
import {
  ArrowRight,
  Baby,
  Camera,
  HeartPulse,
  Info,
  Pencil,
  Save,
  ShieldCheck,
  Trash2,
  UploadCloud,
  UserRound,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API_BASE_URL, LOCAL_BASE } from "@/lib/api/link";
import { toast } from "@/components/ui/toast";
import { AdminSelect } from "@/components/ui/admin-controls";
import DeleteChildModal from "./DeleteChildModal";
import ParentModalPortal from "./ParentModalPortal";
import "./parent-modal.css";
import "./parent-workspace.css";

interface Child {
  id: number;
  full_name: string;
  age: number;
  grade: number;
  medical_info?: string;
  photo_path?: string;
}

interface PickupLog {
  child_id: number;
  pickup_time: string;
  status: string;
}

interface ChildrenViewProps {
  children: Child[];
  pickupLogs: PickupLog[];
  onUpdate: () => void;
}

const gradeOptions = [
  { value: "", label: "Select Grade" },
  ...Array.from({ length: 8 }, (_, index) => {
    const grade = String(index + 1);
    return { value: grade, label: `Grade ${grade}` };
  }),
];

export default function ChildrenView({ children, pickupLogs, onUpdate }: ChildrenViewProps) {
  const [editingChild, setEditingChild] = useState<Child | null>(null);
  const [childToDelete, setChildToDelete] = useState<Child | null>(null);
  const [formData, setFormData] = useState({
    full_name: "",
    age: "",
    grade: "",
    medical_info: "",
    photo: null as File | null,
  });
  const [preview, setPreview] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleEditClick = (child: Child) => {
    setEditingChild(child);
    setFormData({
      full_name: child.full_name,
      age: child.age.toString(),
      grade: child.grade.toString(),
      medical_info: child.medical_info || "",
      photo: null,
    });
    setPreview(child.photo_path ? `${LOCAL_BASE}/${child.photo_path}` : null);
  };

  const closeEditModal = () => {
    setEditingChild(null);
    setPreview(null);
    setFormData({
      full_name: "",
      age: "",
      grade: "",
      medical_info: "",
      photo: null,
    });
  };

  function getMedicalSeverityColor(info: string) {
    const safeKeywords = ["all good", "no issue", "clear", "healthy", "none", "normal", "fine", "okay", "fit"];
    const dangerKeywords = [
      "asthma",
      "epilepsy",
      "diabetes",
      "seizure",
      "cancer",
      "heart",
      "allergy",
      "anaphylaxis",
      "condition",
      "disease",
      "medication",
      "syndrome",
      "disorder",
    ];

    const text = info.toLowerCase();
    const isSafe = safeKeywords.some((kw) => text.includes(kw));
    const isDanger = dangerKeywords.some((kw) => text.includes(kw));

    if (isDanger && !isSafe) return "danger";
    if (isSafe && !isDanger) return "safe";
    return "notice";
  }

  useEffect(() => {
    if (formData.photo) {
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result as string);
      reader.readAsDataURL(formData.photo);
    }
  }, [formData.photo]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editingChild) return;

    try {
      const token = localStorage.getItem("token");
      const fd = new FormData();
      fd.append("full_name", formData.full_name);
      fd.append("age", formData.age);
      fd.append("grade", formData.grade);
      fd.append("medical_info", formData.medical_info);
      if (formData.photo) {
        fd.append("photo", formData.photo);
      } else {
        fd.append("photo_path", editingChild.photo_path || "");
      }

      await axios.put(`${API_BASE_URL}/children/${editingChild.id}`, fd, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success("Child updated successfully");
      closeEditModal();
      onUpdate();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to update child");
    }
  };

  const deleteChild = async () => {
    if (!childToDelete) return;
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API_BASE_URL}/children/${childToDelete.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Child deleted successfully");
      setChildToDelete(null);
      onUpdate();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to delete child");
    }
  };

  return (
    <div className="pz-parent-workspace-view">
      <div className="pz-parent-workspace-heading">
        <div>
          <h2 className="pz-parent-workspace-title">My Children</h2>
          <div className="pz-parent-workspace-copy">Student profiles connected to your pickup access.</div>
        </div>
        <span className="pz-parent-workspace-badge">
          <span className="pz-parent-workspace-dot" />
          {children.length} profile{children.length === 1 ? "" : "s"}
        </span>
      </div>

      {children.length === 0 ? (
        <div className="pz-parent-empty-card">
          <div className="pz-parent-empty-icon">
            <Baby size={22} aria-hidden="true" />
          </div>
          <div>
            <div className="pz-parent-profile-name">No children added yet</div>
            <div className="pz-parent-workspace-copy">Add a child to start building your pickup profile.</div>
          </div>
        </div>
      ) : (
      <div className="pz-parent-workspace-grid">
        {children.map((child) => {
          const logs = (pickupLogs ?? []).filter((log) => log.child_id === child.id);
          const pickupCount = logs.length;
          const severity = getMedicalSeverityColor(child.medical_info || "");

          return (
            <div key={child.id} className="pz-parent-profile-card">
              <div className="pz-parent-profile-card-head">
                <div className="pz-parent-profile-identity">
                  <div className="pz-parent-profile-avatar">
                    {child.photo_path ? (
                      <img src={`${LOCAL_BASE}/${child.photo_path}`} alt={child.full_name} />
                    ) : (
                      <UserRound size={26} aria-hidden="true" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <h3 className="pz-parent-profile-name">{child.full_name}</h3>
                    <p className="pz-parent-profile-meta">
                      Grade {child.grade} - {child.age} years old
                    </p>
                  </div>
                </div>
                <div className="pz-parent-profile-actions">
                  <button className="pz-parent-icon-button" onClick={() => handleEditClick(child)} title="Edit">
                    <Pencil size={17} aria-hidden="true" />
                  </button>
                  <button
                    className="pz-parent-icon-button danger"
                    title="Delete"
                    onClick={() => setChildToDelete(child)}
                  >
                    <Trash2 size={17} aria-hidden="true" />
                  </button>
                </div>
              </div>

              <div className="pz-parent-profile-body">
                <div className={`pz-parent-info-panel ${severity}`}>
                  <div className="pz-parent-info-label">
                    <HeartPulse size={15} aria-hidden="true" />
                    Medical Information
                  </div>
                  <div className="pz-parent-info-copy">
                    {child.medical_info || "No medical notes saved for this child."}
                  </div>
                </div>

                <div className="pz-parent-metric-row">
                  <div className="pz-parent-metric">
                    <div className="pz-parent-metric-label">Pickup Records</div>
                    <div className="pz-parent-metric-value">
                      {pickupCount > 0
                        ? `${pickupCount} pickup${pickupCount > 1 ? "s" : ""} recorded`
                        : "No pickup records"}
                    </div>
                  </div>
                  <div className="pz-parent-metric">
                    <div className="pz-parent-metric-label">Profile Status</div>
                    <div className="pz-parent-metric-value">Active</div>
                  </div>
                </div>

                <div className="pz-parent-profile-footer">
                  <button
                    className="pz-parent-primary-action"
                    onClick={() => navigate(`/parent/child/${child.id}`)}
                  >
                    <ShieldCheck size={15} aria-hidden="true" />
                    View Full Details
                    <ArrowRight size={15} aria-hidden="true" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      )}

      {editingChild && (
        <ParentModalPortal>
          <div className="pz-parent-modal-overlay">
          <div className="pz-parent-modal" role="dialog" aria-modal="true" aria-labelledby="edit-child-title">
            <div className="pz-parent-modal-head">
              <div className="pz-parent-modal-title-row">
                <div className="pz-parent-modal-icon">
                  <Baby size={20} aria-hidden="true" />
                </div>
                <div>
                  <h2 className="pz-parent-modal-title" id="edit-child-title">
                    Edit Child
                  </h2>
                  <div className="pz-parent-modal-subtitle">
                    Update the student profile while keeping pickup history connected.
                  </div>
                </div>
              </div>
              <button type="button" onClick={closeEditModal} className="pz-parent-modal-close" aria-label="Close">
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="pz-parent-form">
              <div className="pz-parent-modal-body">
                <div className="pz-parent-form">
                  <div className="pz-parent-field">
                    <label htmlFor="edit-child-name">Full Name</label>
                    <input
                      id="edit-child-name"
                      type="text"
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    />
                  </div>

                  <div className="pz-parent-form-grid">
                    <div className="pz-parent-field">
                      <label htmlFor="edit-child-age">Age</label>
                      <input
                        id="edit-child-age"
                        type="number"
                        value={formData.age}
                        onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                      />
                    </div>
                    <div className="pz-parent-field">
                      <label htmlFor="edit-child-grade">Grade</label>
                      <AdminSelect
                        id="edit-child-grade"
                        value={formData.grade}
                        onChange={(value) => setFormData({ ...formData, grade: value })}
                        options={gradeOptions}
                        ariaLabel="Child grade"
                        className="full"
                      />
                    </div>
                  </div>

                  <div className="pz-parent-field">
                    <label htmlFor="edit-child-medical">Medical Info</label>
                    <textarea
                      id="edit-child-medical"
                      value={formData.medical_info}
                      onChange={(e) => setFormData({ ...formData, medical_info: e.target.value })}
                    />
                  </div>

                  <div className="pz-parent-section">
                    <h3 className="pz-parent-section-title">
                      <Camera size={16} aria-hidden="true" />
                      Student Photo
                    </h3>
                    <label className="pz-parent-upload-zone">
                      <input
                        type="file"
                        onChange={(e) => setFormData({ ...formData, photo: e.target.files?.[0] || null })}
                        className="hidden"
                        accept="image/jpeg,image/png,image/jpg"
                      />
                      <div className="pz-parent-upload-content">
                        {preview ? (
                          <img src={preview} alt="Selected child" className="pz-parent-upload-preview" />
                        ) : (
                          <div className="pz-parent-upload-icon">
                            <UploadCloud size={21} aria-hidden="true" />
                          </div>
                        )}
                        <div>
                          <div className="pz-parent-upload-title">
                            {formData.photo?.name || "Upload child photo"}
                          </div>
                          <div className="pz-parent-upload-meta">JPG or PNG, up to 5MB</div>
                        </div>
                      </div>
                    </label>
                  </div>

                  <div className="pz-parent-note">
                    <Info size={16} aria-hidden="true" />
                    <span>Changes are saved to the same child record used by pickup scans and dashboard views.</span>
                  </div>
                </div>
              </div>

              <div className="pz-parent-modal-footer">
                <button type="button" onClick={closeEditModal} className="pz-parent-modal-button">
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

      {childToDelete && (
        <DeleteChildModal
          isOpen
          onClose={() => setChildToDelete(null)}
          child={childToDelete}
          onDelete={deleteChild}
        />
      )}
    </div>
  );
}
