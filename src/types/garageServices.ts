
export interface GarageService {
  id: string;
  service_name: string;
  price: number;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  tenant_id?: string;
}

export interface GarageServiceFormData {
  service_name: string;
  price: number;
  description?: string;
  is_active: boolean;
}
