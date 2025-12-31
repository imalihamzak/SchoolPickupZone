export interface Parent {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  photo?: string;
}

export interface Child {
  id: string;
  name: string;
  grade: string;
  age: number;
  photo?: string;
}

export interface Guardian {
  id: string;
  name: string;
  relation: string;
  phone: string;
  email: string;
  photo?: string;
}

export interface Family {
  id: string;
  familyName: string;
  children: Child[];
  guardians: Parent[];
  status: 'active' | 'pending' | 'inactive';
}
