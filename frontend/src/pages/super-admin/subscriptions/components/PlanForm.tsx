import { useState } from "react";
import { CheckCircle2, MinusCircle, PlusCircle, Save, X, Layers3 } from "lucide-react";
import axios from "axios";
import { toast } from "@/components/ui/toast";
import { API_BASE_URL } from "@/lib/api/link";
import type { FeatureToggleKey, Plan } from "../types/subscription.types";
import "../../super-admin-theme.css";

interface PlanFormProps {
  plan?: Plan | null;
  onClose: () => void;
  onSubmit: (data: Partial<Plan>) => void;
}

const featureToggleOptions: Array<{ key: FeatureToggleKey; label: string }> = [
  { key: "qr_verification", label: "QR Verification" },
  { key: "guardian_management", label: "Guardian Management" },
  { key: "pickup_logs", label: "Pickup Logs" },
  { key: "analytics", label: "Analytics" },
  { key: "document_uploads", label: "Document Uploads" },
  { key: "notifications", label: "Notifications" },
  { key: "device_authorization", label: "Device Authorization" },
];

const defaultFeatureToggles = featureToggleOptions.reduce(
  (acc, option) => {
    acc[option.key] = option.key !== "analytics";
    return acc;
  },
  {} as Record<FeatureToggleKey, boolean>
);

type LimitField = "max_students" | "max_families" | "max_guards" | "storage_limit_mb";

type LimitState = Record<LimitField, string>;
type UnlimitedState = Record<LimitField, boolean>;

const toInputValue = (value?: number | null) => (value === null || value === undefined ? "" : String(value));

export function PlanForm({ plan, onClose, onSubmit }: PlanFormProps) {
  const [name, setName] = useState(plan?.name || "");
  const [monthlyPrice, setMonthlyPrice] = useState(
    plan?.monthly_price !== undefined ? String(plan.monthly_price) : plan?.price ? String(plan.price) : ""
  );
  const [yearlyPrice, setYearlyPrice] = useState(
    plan?.yearly_price !== undefined ? String(plan.yearly_price) : ""
  );
  const [gracePeriodDays, setGracePeriodDays] = useState(
    plan?.grace_period_days !== undefined ? String(plan.grace_period_days) : "7"
  );
  const [isActive, setIsActive] = useState(plan?.is_active ?? true);
  const [features, setFeatures] = useState<string[]>(plan?.features?.length ? plan.features : [""]);
  const [featureToggles, setFeatureToggles] = useState<Record<FeatureToggleKey, boolean>>({
    ...defaultFeatureToggles,
    ...(plan?.feature_toggles || {}),
  });
  const [limits, setLimits] = useState<LimitState>({
    max_students: toInputValue(plan?.max_students),
    max_families: toInputValue(plan?.max_families),
    max_guards: toInputValue(plan?.max_guards),
    storage_limit_mb: toInputValue(plan?.storage_limit_mb),
  });
  const [unlimited, setUnlimited] = useState<UnlimitedState>({
    max_students: plan?.max_students === null || plan?.max_students === undefined,
    max_families: plan?.max_families === null || plan?.max_families === undefined,
    max_guards: plan?.max_guards === null || plan?.max_guards === undefined,
    storage_limit_mb: plan?.storage_limit_mb === null || plan?.storage_limit_mb === undefined,
  });

  const handleLimitChange = (field: LimitField, value: string) => {
    setLimits((current) => ({ ...current, [field]: value }));
  };

  const toggleUnlimited = (field: LimitField) => {
    setUnlimited((current) => {
      const nextValue = !current[field];
      if (nextValue) {
        setLimits((limitsCurrent) => ({ ...limitsCurrent, [field]: "" }));
      }
      return { ...current, [field]: nextValue };
    });
  };

  const resolveLimit = (field: LimitField) => {
    if (unlimited[field]) return null;
    const value = Number(limits[field]);
    return Number.isFinite(value) ? value : 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanFeatures = features.map((feature) => feature.trim()).filter(Boolean);
    const payload = {
      name,
      monthly_price: Number(monthlyPrice),
      yearly_price: Number(yearlyPrice),
      price: Number(monthlyPrice),
      billing_interval: "monthly",
      max_students: resolveLimit("max_students"),
      max_families: resolveLimit("max_families"),
      max_guards: resolveLimit("max_guards"),
      storage_limit_mb: resolveLimit("storage_limit_mb"),
      grace_period_days: Number(gracePeriodDays),
      features: cleanFeatures,
      feature_toggles: featureToggles,
      is_active: isActive,
    };

    try {
      if (plan) {
        await axios.put(`${API_BASE_URL}/superadmin/plans/${plan.id}`, payload, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        toast.success("Package updated successfully");
      } else {
        await axios.post(`${API_BASE_URL}/superadmin/plans`, payload, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        toast.success("Package created successfully");
      }

      onSubmit({
        id: plan?.id,
        name,
        price: Number(monthlyPrice),
        interval: "monthly",
        monthly_price: Number(monthlyPrice),
        yearly_price: Number(yearlyPrice),
        max_students: payload.max_students,
        max_families: payload.max_families,
        max_guards: payload.max_guards,
        storage_limit_mb: payload.storage_limit_mb,
        grace_period_days: payload.grace_period_days,
        features: cleanFeatures,
        feature_toggles: featureToggles,
        is_active: isActive,
      });
      onClose();
    } catch (error: any) {
      const message = error.response?.data?.error || "Failed to save package. Please try again.";
      toast.error(message);
    }
  };

  const addFeature = () => {
    setFeatures([...features, ""]);
  };

  const removeFeature = (index: number) => {
    const newFeatures = features.filter((_, i) => i !== index);
    if (newFeatures.length === 0) newFeatures.push("");
    setFeatures(newFeatures);
  };

  const updateFeature = (index: number, value: string) => {
    const newFeatures = [...features];
    newFeatures[index] = value;
    setFeatures(newFeatures);
  };

  const toggleFeature = (key: FeatureToggleKey) => {
    setFeatureToggles((current) => ({ ...current, [key]: !current[key] }));
  };

  return (
    <div className="pz-super-modal-overlay">
      <div className="pz-super-modal wide" role="dialog" aria-modal="true" aria-labelledby="plan-form-title">
        <div className="pz-super-modal-head">
          <div className="pz-super-modal-title-row">
            <div className="pz-super-modal-icon">
              <Layers3 size={20} aria-hidden="true" />
            </div>
            <div>
              <h2 className="pz-super-modal-title" id="plan-form-title">
                {plan ? "Edit Package" : "Create Package"}
              </h2>
              <div className="pz-super-modal-subtitle">
                Configure pricing, limits, and enabled modules for schools.
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
                  <label htmlFor="plan-name">
                    Package Name <span className="pz-super-required">*</span>
                  </label>
                  <input
                    type="text"
                    id="plan-name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="e.g. Starter, Growth, Enterprise"
                    required
                  />
                </div>

                <div className="pz-super-form-grid nested">
                  <div className="pz-super-field">
                    <label htmlFor="monthly-price">
                      Monthly Price <span className="pz-super-required">*</span>
                    </label>
                    <input
                      type="number"
                      id="monthly-price"
                      value={monthlyPrice}
                      onChange={(event) => setMonthlyPrice(event.target.value)}
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      required
                    />
                  </div>

                  <div className="pz-super-field">
                    <label htmlFor="yearly-price">
                      Yearly Price <span className="pz-super-required">*</span>
                    </label>
                    <input
                      type="number"
                      id="yearly-price"
                      value={yearlyPrice}
                      onChange={(event) => setYearlyPrice(event.target.value)}
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="pz-super-form-grid">
                <div className="pz-super-field">
                  <label htmlFor="grace-period">Grace Period Days</label>
                  <input
                    type="number"
                    id="grace-period"
                    value={gracePeriodDays}
                    onChange={(event) => setGracePeriodDays(event.target.value)}
                    min="0"
                    step="1"
                    placeholder="7"
                    required
                  />
                </div>

                <div className="pz-super-limit-item">
                  <div className="pz-super-section-title" style={{ marginBottom: 8 }}>
                    Package Status
                  </div>
                  <label className="pz-super-inline-check" style={{ marginTop: 0 }}>
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={() => setIsActive((current) => !current)}
                    />
                    <span>Available for school assignment and checkout</span>
                  </label>
                </div>
              </div>

              <div className="pz-super-form-section">
                <div className="pz-super-section-title">Package Limits</div>
                <div className="pz-super-limit-grid">
                  <LimitInput
                    id="max-students"
                    label="Students"
                    value={limits.max_students}
                    unlimited={unlimited.max_students}
                    onChange={(value) => handleLimitChange("max_students", value)}
                    onToggleUnlimited={() => toggleUnlimited("max_students")}
                  />
                  <LimitInput
                    id="max-families"
                    label="Families"
                    value={limits.max_families}
                    unlimited={unlimited.max_families}
                    onChange={(value) => handleLimitChange("max_families", value)}
                    onToggleUnlimited={() => toggleUnlimited("max_families")}
                  />
                  <LimitInput
                    id="max-guards"
                    label="Guards"
                    value={limits.max_guards}
                    unlimited={unlimited.max_guards}
                    onChange={(value) => handleLimitChange("max_guards", value)}
                    onToggleUnlimited={() => toggleUnlimited("max_guards")}
                  />
                  <LimitInput
                    id="storage-limit"
                    label="Storage MB"
                    value={limits.storage_limit_mb}
                    unlimited={unlimited.storage_limit_mb}
                    onChange={(value) => handleLimitChange("storage_limit_mb", value)}
                    onToggleUnlimited={() => toggleUnlimited("storage_limit_mb")}
                  />
                </div>
              </div>

              <div className="pz-super-form-section">
                <div className="pz-super-section-title">Feature Access</div>
                <div className="pz-super-toggle-grid">
                  {featureToggleOptions.map((option) => (
                    <label key={option.key} className="pz-super-toggle-row">
                      <input
                        type="checkbox"
                        checked={featureToggles[option.key]}
                        onChange={() => toggleFeature(option.key)}
                      />
                      <span>{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="pz-super-form-section">
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                  <div className="pz-super-section-title" style={{ marginBottom: 0 }}>
                    Package Features
                  </div>
                  <button type="button" onClick={addFeature} className="pz-super-button">
                    <PlusCircle size={15} aria-hidden="true" />
                    Add Feature
                  </button>
                </div>

                <div className="pz-super-form" style={{ marginTop: 12 }}>
                  {features.map((feature, index) => (
                    <div key={index} className="pz-super-feature-row">
                      <CheckCircle2 size={17} aria-hidden="true" style={{ color: "var(--teal)" }} />
                      <input
                        type="text"
                        value={feature}
                        onChange={(event) => updateFeature(index, event.target.value)}
                        placeholder="e.g. Daily reports, CSV export"
                      />
                      <button
                        type="button"
                        onClick={() => removeFeature(index)}
                        className="pz-super-icon-button danger"
                        aria-label="Remove feature"
                      >
                        <MinusCircle size={16} aria-hidden="true" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="pz-super-modal-footer">
            <button type="button" onClick={onClose} className="pz-super-button">
              Cancel
            </button>
            <button type="submit" className="pz-super-button primary">
              <Save size={15} aria-hidden="true" />
              {plan ? "Save Changes" : "Create Package"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function LimitInput({
  id,
  label,
  value,
  unlimited,
  onChange,
  onToggleUnlimited,
}: {
  id: string;
  label: string;
  value: string;
  unlimited: boolean;
  onChange: (value: string) => void;
  onToggleUnlimited: () => void;
}) {
  return (
    <div className="pz-super-limit-item">
      <div className="pz-super-field">
        <label htmlFor={id}>{label}</label>
        <input
          id={id}
          type="number"
          min="0"
          step="1"
          value={value}
          disabled={unlimited}
          onChange={(event) => onChange(event.target.value)}
          placeholder={unlimited ? "Unlimited" : "0"}
          required={!unlimited}
        />
      </div>
      <label className="pz-super-inline-check">
        <input type="checkbox" checked={unlimited} onChange={onToggleUnlimited} />
        <span>Unlimited</span>
      </label>
    </div>
  );
}
