import { Trash2, X } from "lucide-react";
import ParentModalPortal from "./ParentModalPortal";

type Document = {
  id: string;
  type: string;
  fileName: string;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  document: Document;
  onDelete: () => void;
};

export default function DeleteDocumentModal({ isOpen, onClose, document, onDelete }: Props) {
  if (!isOpen) return null;

  return (
    <ParentModalPortal>
      <div className="pz-parent-modal-overlay">
      <div className="pz-parent-modal small" role="dialog" aria-modal="true" aria-labelledby="delete-document-title">
        <div className="pz-parent-modal-head">
          <div className="pz-parent-modal-title-row">
            <div className="pz-parent-modal-icon danger">
              <Trash2 size={20} aria-hidden="true" />
            </div>
            <div>
              <h2 className="pz-parent-modal-title" id="delete-document-title">
                Delete Document
              </h2>
              <div className="pz-parent-modal-subtitle">
                Remove this uploaded document from your profile.
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
                Confirm document removal
              </h3>
              <div className="pz-parent-help">
                <strong>{document.type}</strong> - {document.fileName}
              </div>
            </div>
            <div className="pz-parent-note danger">This document will be permanently deleted.</div>
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
