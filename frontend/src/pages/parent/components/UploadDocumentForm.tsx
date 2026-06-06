import { useMemo, useRef, useState } from "react";
import { FileUp, Info, UploadCloud, X } from "lucide-react";
import axios from "axios";
import { toast } from "@/components/ui/toast";
import { AdminSelect } from "@/components/ui/admin-controls";
import { API_BASE_URL } from "@/lib/api/link";
import {
  OPTIONAL_DOCUMENT_TYPES,
  hasActiveChildPhoto,
  hasActiveDocumentForType,
} from "@/lib/documentVerification";
import ParentModalPortal from "./ParentModalPortal";

interface Child {
  id: string | number;
  full_name: string;
}

interface Document {
  id: string;
  type: string;
  childId?: string | number | null;
  fileName?: string;
  status?: string;
  required?: boolean;
}

interface UploadDocumentFormProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: () => void;
  requiredTypes: string[];
  existingDocuments: Document[];
  children: Child[];
}

export default function UploadDocumentForm({
  isOpen,
  onClose,
  onUploadSuccess,
  requiredTypes,
  existingDocuments,
  children,
}: UploadDocumentFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    type: "",
    customType: "",
    childId: "",
    required: false,
    file: null as File | null,
  });
  const [errors, setErrors] = useState({
    type: "",
    file: "",
    childId: "",
    customType: "",
  });
  const [fileName, setFileName] = useState("");

  const requiredDocumentsStatus = requiredTypes.map((type) => {
    if (type === "Child Photo") {
      const childrenWithPhotos = children.filter((child) =>
        hasActiveChildPhoto(existingDocuments, child.id)
      );

      return {
        type,
        uploaded: childrenWithPhotos.length === children.length,
        options: children.map((child) => ({
          id: String(child.id),
          label: `Child Photo (${child.full_name})`,
          uploaded: hasActiveChildPhoto(existingDocuments, child.id),
        })),
      };
    }

    const hasDocument = hasActiveDocumentForType(existingDocuments, type);
    return { type, uploaded: hasDocument };
  });

  const childPhotoStatus = requiredDocumentsStatus.find((doc) => doc.type === "Child Photo");

  const documentTypeOptions = useMemo(() => {
    const requiredOptions = requiredDocumentsStatus
      .filter((doc) => doc.type !== "Child Photo")
      .map((doc) => ({
        value: doc.type,
        label: `${doc.type}${doc.uploaded ? " (Already uploaded)" : ""}`,
        disabled: doc.uploaded,
      }));

    const childPhotoOption = {
      value: "Child Photo",
      label: `Child Photo${childPhotoStatus?.uploaded ? " (Already uploaded)" : ""}`,
      disabled: Boolean(childPhotoStatus?.uploaded),
    };

    const additionalOptions = OPTIONAL_DOCUMENT_TYPES.map((type) => {
      const uploaded = type !== "Other" && existingDocuments.some((doc) => doc.type === type && doc.status !== "rejected");
      return {
        value: type,
        label: `${type}${uploaded ? " (Already uploaded)" : ""}`,
        disabled: uploaded,
      };
    });

    return [
      { value: "", label: "Select Document Type" },
      { value: "__required", label: "Required Documents", disabled: true },
      ...requiredOptions,
      childPhotoOption,
      { value: "__additional", label: "Additional Documents", disabled: true },
      ...additionalOptions,
    ];
  }, [childPhotoStatus?.uploaded, existingDocuments, requiredDocumentsStatus]);

  const childOptions = useMemo(
    () => [
      { value: "", label: "Select Child" },
      ...(childPhotoStatus?.options?.map((option) => ({
        value: String(option.id),
        label: `${option.label}${option.uploaded ? " (Photo already uploaded)" : ""}`,
        disabled: option.uploaded,
      })) || []),
    ],
    [childPhotoStatus?.options]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    const file = e.target.files[0];
    setFormData({ ...formData, file });
    setFileName(file.name);
    setErrors((current) => ({ ...current, file: "" }));
  };

  const handleDocumentTypeChange = (type: string) => {
    setFormData({
      ...formData,
      type,
      childId: "",
      customType: "",
      file: null,
    });
    setFileName("");
    setErrors((current) => ({
      ...current,
      type: type ? "" : current.type,
      childId: "",
      customType: "",
      file: "",
    }));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const canSelectFile = Boolean(
    formData.type &&
    (formData.type !== "Child Photo" || formData.childId) &&
    (formData.type !== "Other" || formData.customType.trim())
  );

  const openFilePicker = () => {
    if (!formData.type) {
      setErrors((current) => ({ ...current, type: "Select which document you are uploading first" }));
      toast.warning("Select a document type first");
      return;
    }

    if (formData.type === "Child Photo" && !formData.childId) {
      setErrors((current) => ({ ...current, childId: "Select the child this photo belongs to" }));
      toast.warning("Select the child before uploading the photo");
      return;
    }

    if (formData.type === "Other" && !formData.customType.trim()) {
      setErrors((current) => ({ ...current, customType: "Enter a document type before uploading" }));
      toast.warning("Enter the document type before uploading the file");
      return;
    }

    fileInputRef.current?.click();
  };

  const validateForm = () => {
    const newErrors = {
      type: formData.type ? "" : "Document type is required",
      file: formData.file ? "" : "Please select a file to upload",
      childId: formData.type === "Child Photo" && !formData.childId ? "Select the child this photo belongs to" : "",
      customType: formData.type === "Other" && !formData.customType.trim() ? "Enter a document type" : "",
    };

    setErrors(newErrors);
    return !Object.values(newErrors).some((error) => error);
  };

  const getActualDocumentType = () => {
    if (formData.type === "Child Photo") {
      const child = children.find((c) => String(c.id) === String(formData.childId));
      return child ? `Child Photo (${child.full_name})` : formData.type;
    }

    if (formData.type === "Other") {
      return formData.customType;
    }

    return formData.type;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const token = localStorage.getItem("token");
    const actualType = getActualDocumentType();
    const form = new FormData();
    form.append("type", actualType);
    form.append("required", String(requiredTypes.includes(formData.type) || formData.type === "Child Photo"));
    if (formData.type === "Child Photo") {
      form.append("child_id", formData.childId);
    }
    if (formData.file) {
      form.append("file", formData.file);
    }

    try {
      await axios.post(`${API_BASE_URL}/documents`, form, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      toast.success("Document uploaded successfully");
      setFormData({ type: "", customType: "", childId: "", required: false, file: null });
      setFileName("");
      onUploadSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Upload failed");
    }
  };

  if (!isOpen) return null;

  return (
    <ParentModalPortal>
      <div className="pz-parent-modal-overlay">
      <div className="pz-parent-modal wide" role="dialog" aria-modal="true" aria-labelledby="upload-document-title">
        <div className="pz-parent-modal-head">
          <div className="pz-parent-modal-title-row">
            <div className="pz-parent-modal-icon">
              <FileUp size={20} aria-hidden="true" />
            </div>
            <div>
              <h2 className="pz-parent-modal-title" id="upload-document-title">
                Upload Document
              </h2>
              <div className="pz-parent-modal-subtitle">
                Add required or optional verification documents to the family profile.
              </div>
            </div>
          </div>
          <button type="button" onClick={onClose} className="pz-parent-modal-close" aria-label="Close">
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="pz-parent-form">
          <div className="pz-parent-modal-body">
            <div className="pz-parent-form">
              <div className="pz-parent-field">
                <label htmlFor="document-type">Document Type</label>
                <AdminSelect
                  id="document-type"
                  value={formData.type}
                  onChange={handleDocumentTypeChange}
                  options={documentTypeOptions}
                  className="full"
                  ariaLabel="Document type"
                  invalid={Boolean(errors.type)}
                />
                {errors.type && <p className="pz-parent-error">{errors.type}</p>}
              </div>

              {formData.type === "Child Photo" && (
                <div className="pz-parent-field">
                  <label htmlFor="document-child">Select Child</label>
                  <div className="pz-parent-help">
                    Child Photos Uploaded: {childPhotoStatus?.options?.filter((c) => c.uploaded).length || 0} of{" "}
                    {children.length}
                  </div>
                  <AdminSelect
                    id="document-child"
                    value={formData.childId}
                    onChange={(value) => {
                      setFormData({ ...formData, childId: value, file: null });
                      setFileName("");
                      setErrors((current) => ({ ...current, childId: value ? "" : current.childId, file: "" }));
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                    options={childOptions}
                    className="full"
                    ariaLabel="Select child"
                    invalid={Boolean(errors.childId)}
                  />
                  {errors.childId && <p className="pz-parent-error">{errors.childId}</p>}
                </div>
              )}

              {formData.type === "Other" && (
                <div className="pz-parent-field">
                  <label htmlFor="custom-document-type">Specify Document Type</label>
                  <input
                    id="custom-document-type"
                    type="text"
                    value={formData.customType}
                    onChange={(e) => {
                      setFormData({ ...formData, customType: e.target.value, file: null });
                      setFileName("");
                      setErrors((current) => ({ ...current, customType: e.target.value.trim() ? "" : current.customType, file: "" }));
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                    placeholder="Enter document type"
                    aria-invalid={Boolean(errors.customType)}
                  />
                  {errors.customType && <p className="pz-parent-error">{errors.customType}</p>}
                </div>
              )}

              <div className="pz-parent-section">
                <h3 className="pz-parent-section-title">
                  <UploadCloud size={16} aria-hidden="true" />
                  Upload File
                </h3>
                <div
                  className={`pz-parent-upload-zone ${errors.file ? "error" : ""} ${!canSelectFile ? "disabled" : ""}`}
                  onClick={openFilePicker}
                  role="button"
                  tabIndex={0}
                  aria-disabled={!canSelectFile}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") openFilePicker();
                  }}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept="image/jpeg,image/png,image/jpg,application/pdf"
                    disabled={!canSelectFile}
                  />
                  <div className="pz-parent-upload-content">
                    <div className="pz-parent-upload-icon">
                      <UploadCloud size={21} aria-hidden="true" />
                    </div>
                    <div>
                      <div className="pz-parent-upload-title">
                        {fileName || (canSelectFile ? "Click to upload" : "Select document type first")}
                      </div>
                      <div className="pz-parent-upload-meta">
                        {fileName
                          ? "Click to change file"
                          : canSelectFile
                            ? "JPG, PNG or PDF, up to 5MB"
                            : "Choose the document type above before selecting a file"}
                      </div>
                    </div>
                  </div>
                </div>
                {errors.file && <p className="pz-parent-error" style={{ marginTop: 8 }}>{errors.file}</p>}
              </div>

              <div className="pz-parent-note">
                <Info size={16} aria-hidden="true" />
                <span>Parent/guardian ID, vehicle photo, and one child photo per student must be approved before QR pickup access is available.</span>
              </div>
            </div>
          </div>

          <div className="pz-parent-modal-footer">
            <button type="button" onClick={onClose} className="pz-parent-modal-button">
              Cancel
            </button>
            <button type="submit" className="pz-parent-modal-button primary">
              <UploadCloud size={15} aria-hidden="true" />
              Upload Document
            </button>
          </div>
        </form>
      </div>
      </div>
    </ParentModalPortal>
  );
}
