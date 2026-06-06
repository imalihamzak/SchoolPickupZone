import { Trash2, X } from "lucide-react";
import type { Plan } from "../types/subscription.types";
import "../../super-admin-theme.css";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  plan: Plan;
  onDelete: () => void;
};

export default function DeletePlanModal({ isOpen, onClose, plan, onDelete }: Props) {
  if (!isOpen) return null;

  return (
    <div className="pz-super-modal-overlay">
      <div className="pz-super-modal sm" role="dialog" aria-modal="true" aria-labelledby="delete-plan-title">
        <div className="pz-super-modal-head">
          <div className="pz-super-modal-title-row">
            <div className="pz-super-modal-icon danger">
              <Trash2 size={20} aria-hidden="true" />
            </div>
            <div>
              <h2 className="pz-super-modal-title" id="delete-plan-title">
                Delete Package
              </h2>
              <div className="pz-super-modal-subtitle">
                Remove this package from the current super admin package list.
              </div>
            </div>
          </div>
          <button type="button" onClick={onClose} className="pz-super-modal-close" aria-label="Close">
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <div className="pz-super-modal-body">
          <div className="pz-super-form">
            <div>
              <div className="pz-super-section-title">Confirm package removal</div>
              <div className="pz-super-subtitle" style={{ marginTop: 0 }}>
                You are about to delete the <strong>{plan.name}</strong> package. This action cannot be undone.
              </div>
            </div>
            <div className="pz-super-note">Any subscriptions using this package may become invalid.</div>
          </div>
        </div>

        <div className="pz-super-modal-footer">
          <button type="button" onClick={onClose} className="pz-super-button">
            Cancel
          </button>
          <button type="button" onClick={onDelete} className="pz-super-button danger">
            <Trash2 size={15} aria-hidden="true" />
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
