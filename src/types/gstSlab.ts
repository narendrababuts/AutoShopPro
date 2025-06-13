
export interface GstSlab {
  id: string;
  name: string;
  cgst_percent: number;
  sgst_percent: number;
  igst_percent: number;
  effective_from: string;
  effective_to: string | null;
  tenant_id?: string;
}
