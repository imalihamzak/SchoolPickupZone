import { Trash2, X } from "lucide-react";
import "../../super-admin-theme.css";

type Admin = {
  id: number;
  name: string;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  admin: Admin;
  onDelete: () => void;
};

export default function DeleteAdminModal({ isOpen, onClose, admin, onDelete }: Props) {
  if (!isOpen) return null;

  return (
    <div className="pz-super-modal-overlay">
      <div className="pz-super-modal sm" role="dialog" aria-modal="true" aria-labelledby="delete-admin-title">
        <div className="pz-super-modal-head">
          <div className="pz-super-modal-title-row">
            <div className="pz-super-modal-icon danger">
              <Trash2 size={20} aria-hidden="true" />
            </div>
            <div>
              <h2 className="pz-super-modal-title" id="delete-admin-title">
                Delete Admin
              </h2>
              <div className="pz-super-modal-subtitle">
                This removes the admin account from super admin management.
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
              <div className="pz-super-section-title">Confirm account removal</div>
              <div className="pz-super-subtitle" style={{ marginTop: 0 }}>
                You are about to delete <strong>{admin.name}</strong>. This action cannot be undone.
              </div>
            </div>
            <div className="pz-super-note">
              Any access tied to this administrator will be removed by the existing delete workflow.
            </div>
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
