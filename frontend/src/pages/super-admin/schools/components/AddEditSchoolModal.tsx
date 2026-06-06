import { useEffect, useMemo, useState } from "react";
import { Building2, CheckCircle2, X } from "lucide-react";
import axios from "axios";
import { toast } from "@/components/ui/toast";
import { API_BASE_URL } from "@/lib/api/link";
import { AdminSelect } from "@/components/ui/admin-controls";
import "../../super-admin-theme.css";

type School = {
  id: string | number;
  name: string;
  address?: string;
  location?: string;
  studentCount?: number;
  student_count?: number;
  plan_id?: number | null;
  plan_name?: string | null;
  billing_interval?: "monthly" | "yearly";
  max_students?: number | null;
  max_families?: number | null;
  max_guards?: number | null;
  used_students?: number;
  used_families?: number;
  used_guards?: number;
  parentCount: number;
  status: string;
  subscriptionEnds: string;
  pending_plan_id?: number | null;
  pending_plan_name?: string | null;
  pending_billing_interval?: "monthly" | "yearly" | null;
};

type PackageOption = {
  id: number;
  name: string;
  max_students?: number | null;
  max_families?: number | null;
  max_guards?: number | null;
  is_active?: boolean;
};

const billingOptions = [
  { value: "monthly", label: "Monthly Billing" },
  { value: "yearly", label: "Yearly Billing" },
];

type Props = {
  isOpen: boolean;
  onClose: () => void;
  selectedSchool: School | null;
  onSave: (updatedSchool: School) => void;
};

export default function AddEditSchoolModal({ isOpen, onClose, selectedSchool, onSave }: Props) {
  const isEdit = Boolean(selectedSchool);
  const [schoolName, setSchoolName] = useState("");
  const [address, setAddress] = useState("");
  const [studentCount, setStudentCount] = useState(0);
  const [packageId, setPackageId] = useState("");
  const [billingInterval, setBillingInterval] = useState<"monthly" | "yearly">("monthly");
  const [packages, setPackages] = useState<PackageOption[]>([]);

  useEffect(() => {
    if (selectedSchool) {
      setSchoolName(selectedSchool.name);
      setAddress(selectedSchool.location || selectedSchool.address || "");
      setStudentCount(selectedSchool.student_count || selectedSchool.studentCount || 0);
      setPackageId(selectedSchool.pending_plan_id ? String(selectedSchool.pending_plan_id) : selectedSchool.plan_id ? String(selectedSchool.plan_id) : "");
      setBillingInterval(selectedSchool.pending_billing_interval || selectedSchool.billing_interval || "monthly");
    } else {
      setSchoolName("");
      setAddress("");
      setStudentCount(0);
      setPackageId("");
      setBillingInterval("monthly");
    }
  }, [selectedSchool, isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const fetchPackages = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(`${API_BASE_URL}/superadmin/plans`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setPackages(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error("Failed to fetch packages:", error);
      }
    };

    fetchPackages();
  }, [isOpen]);

  const packageOptions = useMemo(
    () => [
      { value: "", label: "Select package", disabled: true },
      ...packages.map((item) => ({
        value: String(item.id),
        label: item.is_active === false ? `${item.name} (inactive)` : item.name,
        disabled: item.is_active === false,
      })),
    ],
    [packages]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const selectedPackage = packages.find((item) => String(item.id) === packageId);

    if (!selectedPackage) {
      toast.error("A subscription package is required for every school.");
      return;
    }

    const currentUsage = {
      students: Math.max(studentCount, Number(selectedSchool?.used_students || 0)),
      families: Number(selectedSchool?.used_families || 0),
      guards: Number(selectedSchool?.used_guards || 0),
    };
    const limitChecks = [
      { label: "students", usage: currentUsage.students, limit: selectedPackage.max_students },
      { label: "families", usage: currentUsage.families, limit: selectedPackage.max_families },
      { label: "guards", usage: currentUsage.guards, limit: selectedPackage.max_guards },
    ];
    const exceededLimit = limitChecks.find(
      (check) => check.limit !== null && check.limit !== undefined && check.usage > check.limit
    );

    if (exceededLimit) {
      toast.error(
        `${selectedPackage.name} allows ${exceededLimit.limit} ${exceededLimit.label}, but this school uses ${exceededLimit.usage}. Choose a higher package or reduce usage first.`
      );
      return;
    }

    const schoolData = {
      name: schoolName,
      location: address,
      student_count: studentCount,
      plan_id: packageId ? Number(packageId) : null,
      billing_interval: billingInterval,
    };

    const updatedSchool: School = {
      id: selectedSchool?.id || Math.random().toString(),
      name: schoolName,
      address,
      studentCount,
      plan_id: packageId ? Number(packageId) : null,
      plan_name: selectedPackage?.name || null,
      billing_interval: billingInterval,
      parentCount: selectedSchool?.parentCount || 0,
      status: selectedSchool?.status || "active",
      subscriptionEnds: selectedSchool?.subscriptionEnds || "Dec 31, 2025",
    };

    const token = localStorage.getItem("token");

    try {
      if (selectedSchool) {
        await axios.put(
          `${API_BASE_URL}/superadmin/schools/${selectedSchool.id}`,
          schoolData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success("School updated successfully!");
      } else {
        await axios.post(`${API_BASE_URL}/superadmin/schools`, schoolData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success("School created successfully!");
      }

      onSave(updatedSchool);
      onClose();
    } catch (error) {
      console.error("Failed to save school:", error);
      const message = axios.isAxiosError(error)
        ? error.response?.data?.error || "Failed to save school."
        : "Failed to save school.";
      toast.error(message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="pz-super-modal-overlay">
      <div className="pz-super-modal" role="dialog" aria-modal="true" aria-labelledby="school-modal-title">
        <div className="pz-super-modal-head">
          <div className="pz-super-modal-title-row">
            <div className="pz-super-modal-icon">
              <Building2 size={20} aria-hidden="true" />
            </div>
            <div>
              <h2 className="pz-super-modal-title" id="school-modal-title">
                {isEdit ? "Edit School" : "Add School"}
              </h2>
              <div className="pz-super-modal-subtitle">
                {isEdit ? "Update the selected school record." : "Create a new school in the platform registry."}
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
              <div className="pz-super-form-grid">
                <div className="pz-super-field">
                  <label htmlFor="school-name">
                    School Name <span className="pz-super-required">*</span>
                  </label>
                  <input
                    type="text"
                    id="school-name"
                    value={schoolName}
                    onChange={(e) => setSchoolName(e.target.value)}
                    placeholder="Enter school name"
                    required
                  />
                </div>

                <div className="pz-super-field">
                  <label htmlFor="school-location">Address / Location</label>
                  <input
                    type="text"
                    id="school-location"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="123 Main St"
                  />
                </div>

                <div className="pz-super-field">
                  <label htmlFor="student-count">Number of Students</label>
                  <input
                    type="number"
                    id="student-count"
                    value={studentCount}
                    onChange={(e) => setStudentCount(Number.parseInt(e.target.value, 10) || 0)}
                    placeholder="e.g. 300"
                    min={0}
                  />
                </div>

                <div className="pz-super-field">
                  <label htmlFor="school-package">
                    Package <span className="pz-super-required">*</span>
                  </label>
                  <AdminSelect
                    id="school-package"
                    value={packageId}
                    onChange={setPackageId}
                    options={packageOptions}
                    className="full"
                    ariaLabel="Package"
                  />
                </div>

                <div className="pz-super-field">
                  <label htmlFor="school-billing-interval">Billing Interval</label>
                  <AdminSelect
                    id="school-billing-interval"
                    value={billingInterval}
                    onChange={(value) => setBillingInterval(value as "monthly" | "yearly")}
                    options={billingOptions}
                    className="full"
                    ariaLabel="Billing Interval"
                    disabled={!packageId}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="pz-super-modal-footer">
            <button type="button" onClick={onClose} className="pz-super-button">
              Cancel
            </button>
            <button type="submit" className="pz-super-button primary">
              <CheckCircle2 size={15} aria-hidden="true" />
              {isEdit ? "Update School" : "Add School"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
