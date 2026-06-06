import { AlertTriangle, Trash2, X } from "lucide-react";

type User = {
  id: number | string;
  name: string;
  role: string;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onDelete: () => void;
};

export default function DeleteUserModal({ isOpen, onClose, user, onDelete }: Props) {
  if (!isOpen) return null;

  return (
    <div className="pz-user-modal-overlay">
      <div className="pz-user-modal" role="dialog" aria-modal="true" aria-labelledby="delete-user-title">
        <div className="pz-user-modal-head">
          <div className="pz-user-modal-title-row">
            <div className="pz-user-modal-icon danger">
              <Trash2 size={20} aria-hidden="true" />
            </div>
            <div>
              <h2 className="pz-user-modal-title" id="delete-user-title">
                Delete User
              </h2>
              <div className="pz-user-modal-subtitle">This action permanently removes account access.</div>
            </div>
          </div>
          <button type="button" onClick={onClose} className="pz-user-modal-close" aria-label="Close">
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <div className="pz-user-modal-body">
          <p className="pz-users-subtitle" style={{ marginTop: 0 }}>
            You are about to permanently remove <strong style={{ color: "#0A1628" }}>{user.name}</strong> (
            {user.role}). This cannot be undone.
          </p>
          <div className="pz-user-modal-note" style={{ marginTop: 14 }}>
            <AlertTriangle size={16} aria-hidden="true" /> This will revoke access and delete data associated with
            this user.
          </div>
        </div>

        <div className="pz-user-modal-footer">
          <button type="button" className="pz-users-button" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="pz-users-button" style={{ background: "#E24B4A", borderColor: "#E24B4A", color: "#fff" }} onClick={onDelete}>
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
