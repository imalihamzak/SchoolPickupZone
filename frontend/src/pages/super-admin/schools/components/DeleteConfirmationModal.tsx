import { Trash2, X } from "lucide-react";
import "../../super-admin-theme.css";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  entityName: string;
  entityRole?: string;
  warningMessage?: string;
  onDelete: () => void;
};

export default function DeleteConfirmationModal({
  isOpen,
  onClose,
  title = "Delete Confirmation",
  entityName,
  entityRole,
  warningMessage = "This action cannot be undone.",
  onDelete,
}: Props) {
  if (!isOpen) return null;

  return (
    <div className="pz-super-modal-overlay">
      <div className="pz-super-modal sm" role="dialog" aria-modal="true" aria-labelledby="delete-school-title">
        <div className="pz-super-modal-head">
          <div className="pz-super-modal-title-row">
            <div className="pz-super-modal-icon danger">
              <Trash2 size={20} aria-hidden="true" />
            </div>
            <div>
              <h2 className="pz-super-modal-title" id="delete-school-title">
                {title}
              </h2>
              <div className="pz-super-modal-subtitle">Review the impact before removing this record.</div>
            </div>
          </div>
          <button type="button" onClick={onClose} className="pz-super-modal-close" aria-label="Close">
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <div className="pz-super-modal-body">
          <div className="pz-super-form">
            <div>
              <div className="pz-super-section-title">Are you sure you want to delete?</div>
              <p className="pz-super-subtitle" style={{ marginTop: 0 }}>
                You're about to permanently remove{" "}
                <strong style={{ color: "var(--text-1)" }}>{entityName}</strong>
                {entityRole && ` (${entityRole})`}. {warningMessage}
              </p>
            </div>
            <div className="pz-super-note">
              This will revoke access and delete related platform data.
            </div>
          </div>
        </div>

        <div className="pz-super-modal-footer">
          <button type="button" onClick={onClose} className="pz-super-button">
            Cancel
          </button>
          <button type="button" onClick={onDelete} className="pz-super-button danger">
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
