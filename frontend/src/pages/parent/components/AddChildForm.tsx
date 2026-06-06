import { useEffect, useRef, useState } from "react";
import { Baby, Camera, Info, Plus, UploadCloud, X } from "lucide-react";
import axios from "axios";
import { toast } from "@/components/ui/toast";
import { AdminSelect } from "@/components/ui/admin-controls";
import { API_BASE_URL } from "@/lib/api/link";
import ParentModalPortal from "./ParentModalPortal";

interface AddChildFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const gradeOptions = [
  { value: "", label: "Select Grade" },
  { value: "1", label: "Grade 1" },
  { value: "2", label: "Grade 2" },
  { value: "3", label: "Grade 3" },
  { value: "4", label: "Grade 4" },
  { value: "5", label: "Grade 5" },
  { value: "6", label: "Grade 6" },
  { value: "7", label: "Grade 7" },
  { value: "8", label: "Grade 8" },
];

export default function AddChildForm({ isOpen, onClose, onSuccess }: AddChildFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: "",
    age: "",
    grade: "",
    medical: "",
    photo: null as File | null,
  });

  const [errors, setErrors] = useState({
    name: "",
    grade: "",
    photo: "",
  });

  const [photoName, setPhotoName] = useState("");
  const [photoPreview, setPhotoPreview] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    document.body.classList.add("modal-open");
    return () => document.body.classList.remove("modal-open");
  }, [isOpen]);

  useEffect(() => {
    return () => {
      if (photoPreview) URL.revokeObjectURL(photoPreview);
    };
  }, [photoPreview]);

  const validateForm = () => {
    const newErrors = {
      name: formData.name ? "" : "Name is required",
      grade: formData.grade ? "" : "Grade is required",
      photo: formData.photo ? "" : "Child photo is required",
    };

    setErrors(newErrors);
    return !Object.values(newErrors).some((error) => error);
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    const file = e.target.files[0];
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setFormData({ ...formData, photo: file });
    setPhotoName(file.name);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const resetForm = () => {
    setFormData({ name: "", age: "", grade: "", medical: "", photo: null });
    setErrors({ name: "", grade: "", photo: "" });
    setPhotoName("");
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoPreview("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const payload = new FormData();

      payload.append("full_name", formData.name);
      payload.append("age", formData.age);
      payload.append("grade", formData.grade);
      payload.append("medical_info", formData.medical);
      payload.append("photo", formData.photo as File);

      await axios.post(`${API_BASE_URL}/children`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      toast.success("Child added successfully");
      resetForm();
      onClose();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to add child");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <ParentModalPortal>
      <div className="pz-parent-modal-overlay">
      <div className="pz-parent-modal" role="dialog" aria-modal="true" aria-labelledby="add-child-title">
        <div className="pz-parent-modal-head">
          <div className="pz-parent-modal-title-row">
            <div className="pz-parent-modal-icon">
              <Baby size={20} aria-hidden="true" />
            </div>
            <div>
              <h2 className="pz-parent-modal-title" id="add-child-title">
                Add Child
              </h2>
              <div className="pz-parent-modal-subtitle">
                Register a student profile and keep the existing pickup workflow connected.
              </div>
            </div>
          </div>
          <button type="button" onClick={onClose} className="pz-parent-modal-close" aria-label="Close">
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="pz-parent-form">
          <div className="pz-parent-modal-body">
            <div className="pz-parent-form">
              <div className="pz-parent-field">
                <label htmlFor="child-name">
                  Full Name <span className="pz-parent-required">*</span>
                </label>
                <input
                  id="child-name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={errors.name ? "error" : ""}
                  placeholder="Child's full name"
                />
                {errors.name && <p className="pz-parent-error">{errors.name}</p>}
              </div>

              <div className="pz-parent-form-grid">
                <div className="pz-parent-field">
                  <label htmlFor="child-age">Age</label>
                  <input
                    id="child-age"
                    type="number"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                    placeholder="Age in years"
                  />
                </div>

                <div className="pz-parent-field">
                  <label htmlFor="child-grade">
                    Grade <span className="pz-parent-required">*</span>
                  </label>
                  <AdminSelect
                    id="child-grade"
                    value={formData.grade}
                    onChange={(value) => setFormData({ ...formData, grade: value })}
                    options={gradeOptions}
                    ariaLabel="Child grade"
                    className="full"
                    invalid={Boolean(errors.grade)}
                  />
                  {errors.grade && <p className="pz-parent-error">{errors.grade}</p>}
                </div>
              </div>

              <div className="pz-parent-field">
                <label htmlFor="child-medical">Medical Information</label>
                <textarea
                  id="child-medical"
                  value={formData.medical}
                  onChange={(e) => setFormData({ ...formData, medical: e.target.value })}
                  placeholder="Any allergies, medication notes, or medical conditions"
                />
                <p className="pz-parent-help">
                  Share only the details school staff should know during pickup or emergencies.
                </p>
              </div>

              <div className="pz-parent-section">
                <h3 className="pz-parent-section-title">
                  <Camera size={16} aria-hidden="true" />
                  Student Photo
                </h3>
                <div
                  className={`pz-parent-upload-zone ${errors.photo ? "error" : ""}`}
                  onClick={() => fileInputRef.current?.click()}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") fileInputRef.current?.click();
                  }}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handlePhotoChange}
                    className="hidden"
                    accept="image/jpeg,image/png,image/jpg"
                  />
                  {photoName ? (
                    <div className="pz-parent-upload-content">
                      {photoPreview ? (
                        <img src={photoPreview} alt="Selected child" className="pz-parent-upload-preview" />
                      ) : (
                        <div className="pz-parent-upload-icon">
                          <UploadCloud size={21} aria-hidden="true" />
                        </div>
                      )}
                      <div>
                        <div className="pz-parent-upload-title">{photoName}</div>
                        <div className="pz-parent-upload-meta">Click to change photo</div>
                      </div>
                    </div>
                  ) : (
                    <div className="pz-parent-upload-content">
                      <div className="pz-parent-upload-icon">
                        <UploadCloud size={21} aria-hidden="true" />
                      </div>
                      <div>
                        <div className="pz-parent-upload-title">Upload child's photo</div>
                        <div className="pz-parent-upload-meta">JPG or PNG, up to 5MB</div>
                      </div>
                    </div>
                  )}
                </div>
                {errors.photo && <p className="pz-parent-error" style={{ marginTop: 8 }}>{errors.photo}</p>}
              </div>

              <div className="pz-parent-note">
                <Info size={16} aria-hidden="true" />
                <span>This creates the same child record used by your dashboard, profile page, and pickup history.</span>
              </div>
            </div>
          </div>

          <div className="pz-parent-modal-footer">
            <button type="button" onClick={onClose} className="pz-parent-modal-button">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="pz-parent-modal-button primary">
              <Plus size={15} aria-hidden="true" />
              {loading ? "Adding..." : "Add Child"}
            </button>
          </div>
        </form>
      </div>
      </div>
    </ParentModalPortal>
  );
}
