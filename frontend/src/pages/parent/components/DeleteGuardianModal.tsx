import { Trash2, X } from "lucide-react";
import ParentModalPortal from "./ParentModalPortal";

interface Guardian {
  id: number;
  full_name: string;
  relation: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  guardian: Guardian;
  onDelete: () => void;
}

export default function DeleteGuardianModal({ isOpen, onClose, guardian, onDelete }: Props) {
  if (!isOpen) return null;

  return (
    <ParentModalPortal>
      <div className="pz-parent-modal-overlay">
      <div className="pz-parent-modal small" role="dialog" aria-modal="true" aria-labelledby="delete-guardian-title">
        <div className="pz-parent-modal-head">
          <div className="pz-parent-modal-title-row">
            <div className="pz-parent-modal-icon danger">
              <Trash2 size={20} aria-hidden="true" />
            </div>
            <div>
              <h2 className="pz-parent-modal-title" id="delete-guardian-title">
                Delete Guardian
              </h2>
              <div className="pz-parent-modal-subtitle">
                Remove this authorized pickup contact.
              </div>
            </div>
          </div>
          <button type="button" onClick={onClose} className="pz-parent-modal-close" aria-label="Close">
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <div className="pz-parent-modal-body">
          <div className="pz-parent-form">
            <div>
              <h3 className="pz-parent-section-title" style={{ marginBottom: 6 }}>
                Confirm guardian removal
              </h3>
              <div className="pz-parent-help">
                You are about to permanently remove <strong>{guardian.full_name}</strong> ({guardian.relation}).
              </div>
            </div>
            <div className="pz-parent-note danger">
              All pickup and vehicle data associated with this guardian will be deleted.
            </div>
          </div>
        </div>

        <div className="pz-parent-modal-footer">
          <button type="button" onClick={onClose} className="pz-parent-modal-button">
            Cancel
          </button>
          <button type="button" onClick={onDelete} className="pz-parent-modal-button danger">
            <Trash2 size={15} aria-hidden="true" />
            Delete
          </button>
        </div>
      </div>
      </div>
    </ParentModalPortal>
  );
}
