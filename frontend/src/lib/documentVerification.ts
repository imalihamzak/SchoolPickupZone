export const REQUIRED_DOCUMENT_TYPES = ["Parent/Guardian ID", "Vehicle Photo", "Child Photo"];

export const OPTIONAL_DOCUMENT_TYPES = [
  "Insurance Card",
  "School ID",
  "Medical Form",
  "Custody / Legal Document",
  "Other",
];

export type DocumentRequirementStatus = "verified" | "pending" | "rejected" | "missing";

export interface DocumentRequirementItem {
  key: string;
  label: string;
  scope: "family" | "child";
  childId?: number | string | null;
  childName?: string | null;
  uploaded: boolean;
  approved: boolean;
  status: DocumentRequirementStatus;
  documentId?: number | string | null;
  rejectionReason?: string | null;
}

export interface DocumentVerificationSummary {
  total: number;
  approved: number;
  pending: number;
  rejected: number;
  missing: number;
  complete: boolean;
}

export interface DocumentVerificationStatus {
  parentId?: number | string;
  schoolId?: number | string;
  required: DocumentRequirementItem[];
  summary: DocumentVerificationSummary;
  requiredTypes?: string[];
}

interface BasicDocument {
  type?: string;
  name?: string;
  documentType?: string;
  childId?: number | string | null;
  status?: string;
}

const aliases: Record<string, string[]> = {
  "Parent/Guardian ID": ["Parent/Guardian ID", "Parent License", "Parent ID", "Guardian ID", "Driver License", "Driving License"],
  "Vehicle Photo": ["Vehicle Photo", "Vehicle Photos", "Car Photo"],
  "Child Photo": ["Child Photo", "Student Photo"],
};

export function normalizeDocumentStatus(value?: string): DocumentRequirementStatus {
  const status = String(value || "").toLowerCase();
  if (status === "approved" || status === "verified") return "verified";
  if (status === "rejected" || status === "denied") return "rejected";
  if (status === "missing") return "missing";
  return "pending";
}

export function isApprovedDocument(value?: string) {
  return normalizeDocumentStatus(value) === "verified";
}

export function documentTypeText(doc: BasicDocument) {
  return String(doc.documentType || doc.name || doc.type || "");
}

export function matchesRequiredDocumentType(docType: string, requiredType: string) {
  const normalized = docType.trim().toLowerCase();
  return (aliases[requiredType] || [requiredType]).some((alias) => {
    const normalizedAlias = alias.trim().toLowerCase();
    return (
      normalized === normalizedAlias ||
      normalized.startsWith(`${normalizedAlias} `) ||
      normalized.startsWith(`${normalizedAlias}(`)
    );
  });
}

export function hasActiveDocumentForType(documents: BasicDocument[], requiredType: string) {
  return documents.some(
    (doc) =>
      normalizeDocumentStatus(doc.status) !== "rejected" &&
      matchesRequiredDocumentType(documentTypeText(doc), requiredType)
  );
}

export function hasActiveChildPhoto(documents: BasicDocument[], childId: number | string) {
  return documents.some(
    (doc) =>
      normalizeDocumentStatus(doc.status) !== "rejected" &&
      String(doc.childId ?? "") === String(childId) &&
      matchesRequiredDocumentType(documentTypeText(doc), "Child Photo")
  );
}
