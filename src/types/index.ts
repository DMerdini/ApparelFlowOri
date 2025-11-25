export type UserRole = 'admin' | 'verified' | 'pending' | 'SysAdmin';
export type UserStatus = 'active' | 'inactive' | 'suspended' | 'Active';

export type User = {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: UserRole;
  status: UserStatus;
  createdAt: any;
};

export type Good = {
  id: string;
  invoiceNumber: string;
  invoiceDate: any; 
  model: string;
  comp: string;
  origin: 'CEE' | 'EXTRA';
  gender: 'male' | 'female';
  type: string;
  quantity: number;
  area: number;
  value: number;
  accessoriesValue: number;
  weight: number;
  accessoriesWeight: number;
  createdAt: any;
  createdBy: string;
  totalValue: number;
  totalWeight: number;
  updatedAt: any;
};

export type ClothingType = {
    id: string;
    name: string;
}

export type CompositionType = {
    id: string;
    name: string;
}

    
    
