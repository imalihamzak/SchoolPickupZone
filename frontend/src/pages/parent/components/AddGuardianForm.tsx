import { useEffect, useState } from "react";
import { Car, Info, Plus, UserPlus, X } from "lucide-react";
import axios from "axios";
import { toast } from "@/components/ui/toast";
import { AdminSelect } from "@/components/ui/admin-controls";
import { API_BASE_URL } from "@/lib/api/link";
import ParentModalPortal from "./ParentModalPortal";

interface AddGuardianFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
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

const vehicleFields = [
  { key: "name", label: "Vehicle Name", placeholder: "e.g. BMW X7" },
  { key: "make", label: "Make", placeholder: "e.g. BMW" },
  { key: "model", label: "Model", placeholder: "e.g. M60i xDrive" },
  { key: "color", label: "Color", placeholder: "e.g. Black" },
  { key: "plate_number", label: "Plate Number", placeholder: "e.g. LUX-786" },
  { key: "year", label: "Year", placeholder: "e.g. 2024" },
] as const;

export default function AddGuardianForm({ isOpen, onClose, onSubmit }: AddGuardianFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    relation: "",
    phone: "",
    vehicle: {
      name: "",
      make: "",
      model: "",
      color: "",
      plate_number: "",
      year: "",
    },
  });

  const [errors, setErrors] = useState({
    name: "",
    relation: "",
    phone: "",
    vehicle: {
      name: "",
      make: "",
      model: "",
      color: "",
      plate_number: "",
      year: "",
    },
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    document.body.classList.add("modal-open");
    return () => document.body.classList.remove("modal-open");
  }, [isOpen]);

  const resetForm = () => {
    setFormData({
      name: "",
      relation: "",
      phone: "",
      vehicle: {
        name: "",
        make: "",
        model: "",
        color: "",
        plate_number: "",
        year: "",
      },
    });
    setErrors({
      name: "",
      relation: "",
      phone: "",
      vehicle: {
        name: "",
        make: "",
        model: "",
        color: "",
        plate_number: "",
        year: "",
      },
    });
  };

  const validateForm = () => {
    const vehicleErrors = {
      name: formData.vehicle.name ? "" : "Vehicle name is required",
      make: formData.vehicle.make ? "" : "Make is required",
      model: formData.vehicle.model ? "" : "Model is required",
      color: formData.vehicle.color ? "" : "Color is required",
      plate_number: formData.vehicle.plate_number ? "" : "Plate number is required",
      year: formData.vehicle.year ? "" : "Year is required",
    };

    const newErrors = {
      name: formData.name ? "" : "Name is required",
      relation: formData.relation ? "" : "Relation is required",
      phone: formData.phone ? "" : "Phone number is required",
      vehicle: vehicleErrors,
    };

    setErrors(newErrors);

    const isGuardianValid = !newErrors.name && !newErrors.relation && !newErrors.phone;
    const isVehicleValid = !Object.values(vehicleErrors).some((err) => err);

    return isGuardianValid && isVehicleValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const isValid = validateForm();
    if (!isValid) {
      toast.error("Please fill all required fields");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${API_BASE_URL}/guardians`,
        {
          full_name: formData.name,
          relation: formData.relation,
          phone: formData.phone,
          vehicle: formData.vehicle,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      toast.success("Guardian added successfully");
      onSubmit(response.data);
      onClose();
      resetForm();
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.error || "Failed to add guardian");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <ParentModalPortal>
      <div className="pz-parent-modal-overlay">
      <div className="pz-parent-modal wide" role="dialog" aria-modal="true" aria-labelledby="add-guardian-title">
        <div className="pz-parent-modal-head">
          <div className="pz-parent-modal-title-row">
            <div className="pz-parent-modal-icon">
              <UserPlus size={20} aria-hidden="true" />
            </div>
            <div>
              <h2 className="pz-parent-modal-title" id="add-guardian-title">
                Add Guardian
              </h2>
              <div className="pz-parent-modal-subtitle">
                Authorize a trusted pickup contact and connect their vehicle details.
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
                <label htmlFor="guardian-name">
                  Full Name <span className="pz-parent-required">*</span>
                </label>
                <input
                  id="guardian-name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={errors.name ? "error" : ""}
                  placeholder="Guardian's full name"
                />
                {errors.name && <p className="pz-parent-error">{errors.name}</p>}
              </div>

              <div className="pz-parent-form-grid">
                <div className="pz-parent-field">
                  <label htmlFor="guardian-relation">
                    Relation to Child <span className="pz-parent-required">*</span>
                  </label>
                  <AdminSelect
                    id="guardian-relation"
                    value={formData.relation}
                    onChange={(value) => setFormData({ ...formData, relation: value })}
                    options={relationOptions}
                    ariaLabel="Guardian relation"
                    className="full"
                    invalid={Boolean(errors.relation)}
                  />
                  {errors.relation && <p className="pz-parent-error">{errors.relation}</p>}
                </div>

                <div className="pz-parent-field">
                  <label htmlFor="guardian-phone">
                    Phone Number <span className="pz-parent-required">*</span>
                  </label>
                  <input
                    id="guardian-phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className={errors.phone ? "error" : ""}
                    placeholder="Contact phone number"
                  />
                  {errors.phone && <p className="pz-parent-error">{errors.phone}</p>}
                </div>
              </div>

              <div className="pz-parent-section">
                <h3 className="pz-parent-section-title">
                  <Car size={16} aria-hidden="true" />
                  Vehicle Information
                </h3>
                <div className="pz-parent-form-grid three">
                  {vehicleFields.map((field) => (
                    <div className="pz-parent-field" key={field.key}>
                      <label htmlFor={`guardian-vehicle-${field.key}`}>
                        {field.label} <span className="pz-parent-required">*</span>
                      </label>
                      <input
                        id={`guardian-vehicle-${field.key}`}
                        type={field.key === "year" ? "number" : "text"}
                        value={formData.vehicle[field.key]}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            vehicle: { ...formData.vehicle, [field.key]: e.target.value },
                          })
                        }
                        className={errors.vehicle[field.key] ? "error" : ""}
                        placeholder={field.placeholder}
                      />
                      {errors.vehicle[field.key] && (
                        <p className="pz-parent-error">{errors.vehicle[field.key]}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="pz-parent-note">
                <Info size={16} aria-hidden="true" />
                <span>
                  This guardian will be authorized for pickup and can receive a QR code through the existing flow.
                </span>
              </div>
            </div>
          </div>

          <div className="pz-parent-modal-footer">
            <button type="button" onClick={onClose} className="pz-parent-modal-button">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="pz-parent-modal-button primary">
              <Plus size={15} aria-hidden="true" />
              {loading ? "Adding..." : "Add Guardian"}
            </button>
          </div>
        </form>
      </div>
      </div>
    </ParentModalPortal>
  );
}
