export interface FamilyData {
    id: string;
    familyName: string;
    status: 'active' | 'inactive';
    parent: {
      id: string;
      name: string;
    };
    guardians: Array<{
      id: string;
      name: string;
      relation: string;
    }>;
    children: Array<{
      id: string;
      name: string;
      grade: string;
    }>;
  }
  
  export interface QRCodeData {
    id: string;
    childId: string;
    childName: string;
    pickupPersonId: string;
    pickupPersonName: string;
    pickupPersonType: 'parent' | 'guardian';
    qrCode: string;
  }