import { Trash2, X } from "lucide-react";
import ParentModalPortal from "./ParentModalPortal";

interface Child {
  id: number;
  full_name: string;
  grade: number;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  child: Child;
  onDelete: () => void;
}

export default function DeleteChildModal({ isOpen, onClose, child, onDelete }: Props) {
  if (!isOpen) return null;

  return (
    <ParentModalPortal>
      <div className="pz-parent-modal-overlay">
      <div className="pz-parent-modal small" role="dialog" aria-modal="true" aria-labelledby="delete-child-title">
        <div className="pz-parent-modal-head">
          <div className="pz-parent-modal-title-row">
            <div className="pz-parent-modal-icon danger">
              <Trash2 size={20} aria-hidden="true" />
            </div>
            <div>
              <h2 className="pz-parent-modal-title" id="delete-child-title">
                Delete Child
              </h2>
              <div className="pz-parent-modal-subtitle">
                Remove this child from your family profile.
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
                Confirm child removal
              </h3>
              <div className="pz-parent-help">
                You are about to permanently delete <strong>{child.full_name}</strong>, Grade {child.grade}.
              </div>
            </div>
            <div className="pz-parent-note danger">
              This will also delete pickup records and data related to this child.
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
