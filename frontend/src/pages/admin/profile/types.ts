import type { DocumentVerificationStatus } from "@/lib/documentVerification";

export interface Document {
  id?: string;
  name: string;
  documentType?: string;
  type: string;
  size?: number;
  url?: string;
  file_path?: string;
  status?: "verified" | "rejected" | "pending";
  childId?: string | number | null;
  required?: boolean;
  rejectionReason?: string | null;
  file?: File;
}

export interface Family {
  id?: string;
  familyName: string;
  status: "Active" | "Pending" | "Inactive";
  submittedAt: string;
  parent: Parent;
  guardians: Guardian[];
  children: Child[];
  documents?: Document[];
  documentVerification?: DocumentVerificationStatus;
}

export interface Parent {
  name: string;
  email: string;
  phone: string;
  address: string;
  photo?: string;
}

export interface Guardian {
  name: string;
  relation: string;
  phone: string;
  vehicleName?: string;
  make?: string;
  model?: string;
  color?: string;
  plateNumber?: string;
  year?: string;
}

export interface Child {
  name: string;
  age: string;
  grade: string;
  medical: string;
}

export interface FilterValues {
  status: string;
  grade: string;
  membersCount: string;
}
