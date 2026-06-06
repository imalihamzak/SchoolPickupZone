import { useEffect, useState } from "react";
import { Save, X } from "lucide-react";
import { toast } from "@/components/ui/toast";
import { API_BASE_URL } from "@/lib/api/link";
import { AdminSelect } from "@/components/ui/admin-controls";
import { contactStatusClass, useContactAvailability } from "@/lib/hooks/useContactAvailability";

type UserFormData = {
  id?: string;
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
  phone: string;
  role: string;
  status: string;
};

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  userData: any;
  onUpdate: (updatedUser: any) => void;
}

export default function EditUserModal({ isOpen, onClose, userData, onUpdate }: EditUserModalProps) {
  const [formData, setFormData] = useState<UserFormData>({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    phone: "",
    role: "parent",
    status: "inactive",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const emailAvailability = useContactAvailability("email", formData.email, {
    enabled: isOpen,
    excludeUserId: userData?.id,
  });
  const phoneAvailability = useContactAvailability("phone", formData.phone, {
    enabled: isOpen,
    excludeUserId: userData?.id,
  });
  const hasAvailabilityBlock =
    emailAvailability.checking ||
    phoneAvailability.checking ||
    emailAvailability.available === false ||
    phoneAvailability.available === false;
  const roleOptions = [
    { value: "parent", label: "Parent" },
    { value: "guard", label: "Guard" },
  ];
  const statusOptions = [
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
  ];

  useEffect(() => {
    if (userData) {
      setFormData(userData);
    }
  }, [userData]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.firstName?.trim()) newErrors.firstName = "First name is required";
    if (!formData.lastName?.trim()) newErrors.lastName = "Last name is required";
    if (!formData.email?.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validateForm()) return;
    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/admin/parentguard/${userData.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (!response.ok) {
        toast.error(data.error || "Failed to update user");
      } else {
        toast.success("User updated successfully");
        onUpdate(data);
        onClose();
      }
    } catch (err) {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="pz-user-modal-overlay">
      <div className="pz-user-modal" role="dialog" aria-modal="true" aria-labelledby="edit-user-title">
        <div className="pz-user-modal-head">
          <div className="pz-user-modal-title-row">
            <div className="pz-user-modal-icon">
              <Save size={20} aria-hidden="true" />
            </div>
            <div>
              <h2 className="pz-user-modal-title" id="edit-user-title">
                Edit User
              </h2>
              <div className="pz-user-modal-subtitle">Update account details without changing existing device links.</div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="pz-user-modal-close"
            disabled={loading}
            aria-label="Close"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="pz-user-form">
          <div className="pz-user-modal-body">
            <div className="pz-user-form">
              <div className="pz-user-form-grid">
                <div className="pz-user-field">
                  <label htmlFor="edit-first-name">First Name</label>
                  <input
                    id="edit-first-name"
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    className={errors.firstName ? "error" : ""}
                  />
                  {errors.firstName && <p className="pz-user-error">{errors.firstName}</p>}
                </div>

                <div className="pz-user-field">
                  <label htmlFor="edit-last-name">Last Name</label>
                  <input
                    id="edit-last-name"
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    className={errors.lastName ? "error" : ""}
                  />
                  {errors.lastName && <p className="pz-user-error">{errors.lastName}</p>}
                </div>
              </div>

              <div className="pz-user-field">
                <label htmlFor="edit-email">Email</label>
                <input
                  id="edit-email"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={errors.email ? "error" : ""}
                />
                {errors.email && <p className="pz-user-error">{errors.email}</p>}
                {emailAvailability.message && !errors.email && (
                  <p className={`pz-user-feedback ${contactStatusClass(emailAvailability)}`}>
                    {emailAvailability.message}
                  </p>
                )}
              </div>

              <div className="pz-user-field">
                <label htmlFor="edit-phone">Mobile Number</label>
                <input id="edit-phone" type="tel" name="phone" value={formData.phone} onChange={handleChange} />
                {phoneAvailability.message && (
                  <p className={`pz-user-feedback ${contactStatusClass(phoneAvailability)}`}>
                    {phoneAvailability.message}
                  </p>
                )}
              </div>

              <div className="pz-user-form-grid">
                <div className="pz-user-field">
                  <label htmlFor="edit-role">Role</label>
                  <AdminSelect
                    id="edit-role"
                    value={formData.role}
                    onChange={(value) => setFormData((prev) => ({ ...prev, role: value }))}
                    options={roleOptions}
                    ariaLabel="Role"
                    className="full"
                  />
                </div>
                <div className="pz-user-field">
                  <label htmlFor="edit-status">Status</label>
                  <AdminSelect
                    id="edit-status"
                    value={formData.status}
                    onChange={(value) => setFormData((prev) => ({ ...prev, status: value }))}
                    options={statusOptions}
                    ariaLabel="Status"
                    className="full"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="pz-user-modal-footer">
            <button type="button" onClick={onClose} className="pz-users-button">
              Cancel
            </button>
            <button type="submit" disabled={loading || hasAvailabilityBlock} className="pz-users-button primary">
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
