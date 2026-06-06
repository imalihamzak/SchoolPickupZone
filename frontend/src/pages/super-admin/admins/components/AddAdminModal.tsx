import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, UserPlus, X } from "lucide-react";
import axios from "axios";
import { toast } from "@/components/ui/toast";
import { AdminSelect } from "@/components/ui/admin-controls";
import { API_BASE_URL } from "@/lib/api/link";
import { contactStatusClass, useContactAvailability } from "@/lib/hooks/useContactAvailability";
import "../../super-admin-theme.css";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSave?: () => void;
};

type School = {
  id: number;
  name: string;
};

export default function AddAdminModal({ isOpen, onClose, onSave }: Props) {
  const [schools, setSchools] = useState<School[]>([]);
  const [schoolId, setSchoolId] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const emailAvailability = useContactAvailability("email", email, { enabled: isOpen });
  const phoneAvailability = useContactAvailability("phone", phone, { enabled: isOpen });
  const hasAvailabilityBlock =
    emailAvailability.checking ||
    phoneAvailability.checking ||
    emailAvailability.available === false ||
    phoneAvailability.available === false;

  useEffect(() => {
    if (!isOpen) return;
    const fetchSchools = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${API_BASE_URL}/superadmin/schools`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSchools(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error("Failed to fetch schools:", err);
      }
    };

    fetchSchools();
  }, [isOpen]);

  const schoolOptions = useMemo(
    () => [
      { value: "", label: "Select School" },
      ...schools.map((school) => ({ value: String(school.id), label: school.name })),
    ],
    [schools]
  );

  const resetForm = () => {
    setSchoolId("");
    setFirstName("");
    setLastName("");
    setEmail("");
    setPhone("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("token");

    try {
      await axios.post(
        `${API_BASE_URL}/superadmin/admins`,
        { firstName, lastName, email, phone, school_id: schoolId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Admin created successfully and email sent");
      onSave?.();
      resetForm();
      onClose();
    } catch (err: any) {
      console.error("Failed to create admin:", err);
      if (err.response?.status === 409) {
        toast.error("Email already exists. Please use a different email.");
      } else {
        toast.error("Failed to create admin. Please try again.");
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="pz-super-modal-overlay">
      <div className="pz-super-modal" role="dialog" aria-modal="true" aria-labelledby="add-admin-title">
        <div className="pz-super-modal-head">
          <div className="pz-super-modal-title-row">
            <div className="pz-super-modal-icon">
              <UserPlus size={20} aria-hidden="true" />
            </div>
            <div>
              <h2 className="pz-super-modal-title" id="add-admin-title">
                Add Admin
              </h2>
              <div className="pz-super-modal-subtitle">
                Create a school admin account and send the existing invitation email.
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
                <label htmlFor="admin-school">
                  School <span className="pz-super-required">*</span>
                </label>
                <AdminSelect
                  id="admin-school"
                  value={schoolId}
                  onChange={setSchoolId}
                  options={schoolOptions}
                  className="full"
                  ariaLabel="School"
                />
              </div>

              <div className="pz-super-form-grid">
                <div className="pz-super-field">
                  <label htmlFor="admin-first-name">
                    First Name <span className="pz-super-required">*</span>
                  </label>
                  <input
                    id="admin-first-name"
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="e.g. John"
                    required
                  />
                </div>

                <div className="pz-super-field">
                  <label htmlFor="admin-last-name">Last Name</label>
                  <input
                    id="admin-last-name"
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="e.g. Smith"
                  />
                </div>
              </div>

              <div className="pz-super-form-grid">
                <div className="pz-super-field">
                  <label htmlFor="admin-email">
                    Email <span className="pz-super-required">*</span>
                  </label>
                  <input
                    id="admin-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@example.com"
                    required
                  />
                  {emailAvailability.message && (
                    <p className={`pz-super-feedback ${contactStatusClass(emailAvailability)}`}>
                      {emailAvailability.message}
                    </p>
                  )}
                </div>

                <div className="pz-super-field">
                  <label htmlFor="admin-phone">Phone</label>
                  <input
                    id="admin-phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
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
              Create Admin
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
