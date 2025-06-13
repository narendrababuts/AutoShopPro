
export interface JobCard {
  id: string;
  customer: {
    name: string;
    phone: string;
  };
  car: {
    make: string;
    model: string;
    plate: string;
  };
  description: string;
  assignedStaff: string;
  status: 'Pending' | 'In Progress' | 'Parts Ordered' | 'Ready for Pickup' | 'Completed';
  date: string;
  parts: JobCardPart[];
  laborHours: number;
  hourlyRate: number;
  estimatedCompletionDate: string | null;
  actualCompletionDate: string | null;
  notes: string;
  jobDate: string;
  manualLaborCost: number;
  photos: JobCardPhoto[];
  gstSlabId?: string;
  selectedServices: SelectedGarageService[];
}

export interface JobCardPart {
  id?: string;
  inventoryId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  total?: number;
  inStock: boolean;
  addedToPurchaseList: boolean;
  orderStatus?: 'Pending' | 'Ordered';
}

export interface JobCardPhoto {
  id?: string;
  type: 'before' | 'after';
  url: string;
}

export interface SelectedGarageService {
  id: string;
  serviceName: string;
  price: number;
  description?: string;
}

// This interface matches the Supabase schema
export interface SupabaseJobCard {
  id: string;
  car_make: string;
  car_model: string;
  car_number: string;
  customer_name: string;
  customer_phone: string;
  assigned_staff: string | null;
  work_description: string;
  status: 'Pending' | 'In Progress' | 'Parts Ordered' | 'Ready for Pickup' | 'Completed';
  created_at: string;
  parts: JobCardPart[] | null;
  labor_hours: number | null;
  hourly_rate: number | null;
  estimated_completion_date: string | null;
  actual_completion_date: string | null;
  notes: string | null;
  job_date: string;
  manual_labor_cost: number | null;
  gst_slab_id?: string;
  selected_services: SelectedGarageService[] | null;
}

// Converter functions between interfaces
export const toAppJobCard = (data: any): JobCard => {
  return {
    id: data.id,
    customer: {
      name: data.customer_name,
      phone: data.customer_phone,
    },
    car: {
      make: data.car_make,
      model: data.car_model,
      plate: data.car_number,
    },
    description: data.work_description,
    assignedStaff: data.assigned_staff || '',
    status: data.status,
    date: new Date(data.created_at).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }),
    laborHours: data.labor_hours || 0,
    hourlyRate: data.hourly_rate || 0,
    estimatedCompletionDate: data.estimated_completion_date,
    actualCompletionDate: data.actual_completion_date,
    notes: data.notes || '',
    parts: Array.isArray(data.parts) ? data.parts : [],
    jobDate: data.job_date || new Date().toISOString().split('T')[0],
    manualLaborCost: data.manual_labor_cost || 0,
    photos: [],
    gstSlabId: data.gst_slab_id || '',
    selectedServices: Array.isArray(data.selected_services) ? data.selected_services : [],
  };
};

export const toSupabaseJobCard = (jobCard: JobCard): Partial<SupabaseJobCard> => {
  return {
    customer_name: jobCard.customer.name,
    customer_phone: jobCard.customer.phone,
    car_make: jobCard.car.make,
    car_model: jobCard.car.model,
    car_number: jobCard.car.plate,
    work_description: jobCard.description,
    assigned_staff: jobCard.assignedStaff,
    status: jobCard.status,
    labor_hours: jobCard.laborHours,
    hourly_rate: jobCard.hourlyRate,
    estimated_completion_date: jobCard.estimatedCompletionDate,
    actual_completion_date: jobCard.actualCompletionDate,
    notes: jobCard.notes,
    parts: jobCard.parts,
    job_date: jobCard.jobDate,
    manual_labor_cost: jobCard.manualLaborCost,
    gst_slab_id: jobCard.gstSlabId,
    selected_services: jobCard.selectedServices,
  };
};
