export interface School {
  id: string;
  name: string;
  address: string;
  contact: string;
  email: string;
  status: 'active' | 'inactive';
  createdAt: string;
}

export interface SchoolFormData {
  name: string;
  address: string;
  contact: string;
  email: string;
}