export interface Document {
  id?: string;
  name: string;
  type: string;
  size?: number;
  url?: string;
  file_path?: string; // ✅ Add this line
  status?: 'verified' | 'rejected' | 'pending';
  file?: File;
}

export interface Family {
  id?: string;
  familyName: string;
  status: 'Active' | 'Pending' | 'Inactive';
  submittedAt: string;
  parent: Parent;
  guardians: Guardian[];
  children: Child[];
  documents?: Document[];
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