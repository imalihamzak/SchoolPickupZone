import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, UserRoundCog, X } from "lucide-react";
import axios from "axios";
import { toast } from "@/components/ui/toast";
import { AdminSelect } from "@/components/ui/admin-controls";
import { API_BASE_URL } from "@/lib/api/link";
import { contactStatusClass, useContactAvailability } from "@/lib/hooks/useContactAvailability";
import "../../super-admin-theme.css";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  adminId: number;
  onSave: () => void;
};

type School = {
  id: number;
  name: string;
};

export default function EditAdminModal({ isOpen, onClose, adminId, onSave }: Props) {
  const [schools, setSchools] = useState<School[]>([]);
  const [schoolId, setSchoolId] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const emailAvailability = useContactAvailability("email", email, {
    enabled: isOpen,
    excludeUserId: adminId,
  });
  const phoneAvailability = useContactAvailability("phone", phone, {
    enabled: isOpen,
    excludeUserId: adminId,
  });
  const hasAvailabilityBlock =
    emailAvailability.checking ||
    phoneAvailability.checking ||
    emailAvailability.available === false ||
    phoneAvailability.available === false;

  useEffect(() => {
    if (!isOpen) return;

    const token = localStorage.getItem("token");

    const fetchSchools = async () => {
      const res = await axios.get(`${API_BASE_URL}/superadmin/schools`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSchools(Array.isArray(res.data) ? res.data : []);
    };

    const fetchAdminDetails = async () => {
      const res = await axios.get(`${API_BASE_URL}/superadmin/admins/${adminId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = res.data;
      setFirstName(data.firstName || "");
      setLastName(data.lastName || "");
      setEmail(data.email || "");
      setPhone(data.phone || "");
      setPassword("");
      setSchoolId(data.school_id ? String(data.school_id) : "");
    };

    fetchSchools().catch((err) => console.error("Failed to fetch schools:", err));
    fetchAdminDetails().catch((err) => console.error("Failed to fetch admin:", err));
  }, [isOpen, adminId]);

  const schoolOptions = useMemo(
    () => [
      { value: "", label: "Select School" },
      ...schools.map((school) => ({ value: String(school.id), label: school.name })),
    ],
    [schools]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("token");

    try {
      await axios.put(
        `${API_BASE_URL}/superadmin/admins/${adminId}`,
        {
          firstName,
          lastName,
          email,
          phone,
          password,
          school_id: schoolId,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      toast.success("Admin updated successfully");
      onSave();
      onClose();
    } catch (err: any) {
      console.error("Failed to update admin:", err);
      if (err.response?.status === 409) {
        toast.error("Email already exists. Please use a different one.");
      } else {
        toast.error("Failed to update admin. Please try again.");
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="pz-super-modal-overlay">
      <div className="pz-super-modal" role="dialog" aria-modal="true" aria-labelledby="edit-admin-title">
        <div className="pz-super-modal-head">
          <div className="pz-super-modal-title-row">
            <div className="pz-super-modal-icon">
              <UserRoundCog size={20} aria-hidden="true" />
            </div>
            <div>
              <h2 className="pz-super-modal-title" id="edit-admin-title">
                Edit Admin
              </h2>
              <div className="pz-super-modal-subtitle">
                Update admin profile details while keeping the existing account workflow intact.
              </div>
            </div>
          </div>
          <button type="button" onClick={onClose} className="pz-super-modal-close" aria-label="Close">
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="pz-super-form">
          <div className="pz-super-modal-body">
            <div className="pz-super-form">
              <div className="pz-super-field">
                <label htmlFor="edit-admin-school">
                  School <span className="pz-super-required">*</span>
                </label>
                <AdminSelect
                  id="edit-admin-school"
                  value={schoolId}
                  onChange={setSchoolId}
                  options={schoolOptions}
                  className="full"
                  ariaLabel="School"
                />
              </div>

              <div className="pz-super-form-grid">
                <div className="pz-super-field">
                  <label htmlFor="edit-admin-first-name">
                    First Name <span className="pz-super-required">*</span>
                  </label>
                  <input
                    id="edit-admin-first-name"
                    type="text"
                    value={firstName}
                    onChange={(event) => setFirstName(event.target.value)}
                    required
                  />
                </div>

                <div className="pz-super-field">
                  <label htmlFor="edit-admin-last-name">Last Name</label>
                  <input
                    id="edit-admin-last-name"
                    type="text"
                    value={lastName}
                    onChange={(event) => setLastName(event.target.value)}
                  />
                </div>
              </div>

              <div className="pz-super-form-grid">
                <div className="pz-super-field">
                  <label htmlFor="edit-admin-email">
                    Email <span className="pz-super-required">*</span>
                  </label>
                  <input
                    id="edit-admin-email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                  />
                  {emailAvailability.message && (
                    <p className={`pz-super-feedback ${contactStatusClass(emailAvailability)}`}>
                      {emailAvailability.message}
                    </p>
                  )}
                </div>

                <div className="pz-super-field">
                  <label htmlFor="edit-admin-phone">Phone</label>
                  <input
                    id="edit-admin-phone"
                    type="text"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    placeholder="+1 (123) 456-7890"
                  />
                  {phoneAvailability.message && (
                    <p className={`pz-super-feedback ${contactStatusClass(phoneAvailability)}`}>
                      {phoneAvailability.message}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="pz-super-modal-footer">
            <button type="button" onClick={onClose} className="pz-super-button">
              Cancel
            </button>
            <button type="submit" className="pz-super-button primary" disabled={hasAvailabilityBlock}>
              <CheckCircle2 size={15} aria-hidden="true" />
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
