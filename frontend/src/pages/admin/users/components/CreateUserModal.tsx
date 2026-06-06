import { useState } from "react";
import { UserPlus, X } from "lucide-react";
import { AdminSelect } from "@/components/ui/admin-controls";
import { contactStatusClass, useContactAvailability } from "@/lib/hooks/useContactAvailability";

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (userData: any) => Promise<boolean | void>;
}

export default function CreateUserModal({ isOpen, onClose, onSubmit }: CreateUserModalProps) {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    role: "parent",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const emailAvailability = useContactAvailability("email", formData.email, { enabled: isOpen });
  const phoneAvailability = useContactAvailability("phone", formData.phone, { enabled: isOpen });
  const hasAvailabilityBlock =
    emailAvailability.checking ||
    phoneAvailability.checking ||
    emailAvailability.available === false ||
    phoneAvailability.available === false;
  const roleOptions = [
    { value: "parent", label: "Parent" },
    { value: "guard", label: "Guard" },
  ];
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) newErrors.firstName = "First name is required";
    if (!formData.lastName.trim()) newErrors.lastName = "Last name is required";

    if (!formData.email.trim()) {
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
      const created = await onSubmit(formData);
      if (created !== false) {
        setFormData({
          firstName: "",
          lastName: "",
          email: "",
          phone: "",
          role: "parent",
        });
      }
    } catch (error) {
      console.error("Create user failed:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="pz-user-modal-overlay">
      <div className="pz-user-modal" role="dialog" aria-modal="true" aria-labelledby="create-user-title">
        <div className="pz-user-modal-head">
          <div className="pz-user-modal-title-row">
            <div className="pz-user-modal-icon">
              <UserPlus size={20} aria-hidden="true" />
            </div>
            <div>
              <h2 className="pz-user-modal-title" id="create-user-title">
                Add New User
              </h2>
              <div className="pz-user-modal-subtitle">Create a parent or guard account for this school.</div>
            </div>
          </div>
          <button type="button" onClick={onClose} className="pz-user-modal-close" aria-label="Close">
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="pz-user-form">
          <div className="pz-user-modal-body">
            <div className="pz-user-form">
              <div className="pz-user-form-grid">
                <div className="pz-user-field">
                  <label htmlFor="create-first-name">First Name</label>
                  <input
                    id="create-first-name"
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    className={errors.firstName ? "error" : ""}
                    placeholder="Enter first name"
                  />
                  {errors.firstName && <p className="pz-user-error">{errors.firstName}</p>}
                </div>

                <div className="pz-user-field">
                  <label htmlFor="create-last-name">Last Name</label>
                  <input
                    id="create-last-name"
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    className={errors.lastName ? "error" : ""}
                    placeholder="Enter last name"
                  />
                  {errors.lastName && <p className="pz-user-error">{errors.lastName}</p>}
                </div>
              </div>

              <div className="pz-user-field">
                <label htmlFor="create-email">Email</label>
                <input
                  id="create-email"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={errors.email ? "error" : ""}
                  placeholder="Enter email address"
                />
                {errors.email && <p className="pz-user-error">{errors.email}</p>}
                {emailAvailability.message && !errors.email && (
                  <p className={`pz-user-feedback ${contactStatusClass(emailAvailability)}`}>
                    {emailAvailability.message}
                  </p>
                )}
              </div>

              <div className="pz-user-field">
                <label htmlFor="create-phone">Mobile Number</label>
                <input
                  id="create-phone"
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Enter mobile number"
                />
                {phoneAvailability.message && (
                  <p className={`pz-user-feedback ${contactStatusClass(phoneAvailability)}`}>
                    {phoneAvailability.message}
                  </p>
                )}
              </div>

              <div className="pz-user-field">
                <label htmlFor="create-role">Role</label>
                <AdminSelect
                  id="create-role"
                  value={formData.role}
                  onChange={(value) => setFormData((prev) => ({ ...prev, role: value }))}
                  options={roleOptions}
                  ariaLabel="Role"
                  className="full"
                />
              </div>

              <div className="pz-user-note">
                PickupZone will email this user a secure link to set their own password.
              </div>
            </div>
          </div>

          <div className="pz-user-modal-footer">
            <button type="button" onClick={onClose} className="pz-users-button">
              Cancel
            </button>
            <button type="submit" disabled={loading || hasAvailabilityBlock} className="pz-users-button primary">
              {loading ? "Adding..." : "Add User"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
