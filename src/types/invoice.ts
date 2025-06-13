
export interface InvoiceItem {
  id: string;
  invoice_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  item_type: 'part' | 'labor';
  tenant_id?: string;
  hsn_sac?: string;
  cgst_rate?: number;
  sgst_rate?: number;
  igst_rate?: number;
  cgst_amount?: number;
  sgst_amount?: number;
  igst_amount?: number;
}

export type InvoiceStatus = 'Draft' | 'Sent' | 'Paid' | 'Cancelled';

export interface InvoiceData {
  id: string;
  job_card_id: string;
  total_amount: number;
  tax: number;
  final_amount: number;
  status: InvoiceStatus;
  created_at: string;
  tenant_id?: string;
  items?: InvoiceItem[];
  cgst_amount?: number;
  sgst_amount?: number;
  igst_amount?: number;
  gst_slab_id?: string;
  advisor_name?: string;
  mileage?: number;
  warranty_info?: string;
  notes?: string;
}

export interface InvoiceSummary {
  id: string;
  job_card_id: string;
  customer_name: string;
  vehicle_info: string;
  amount: number;
  status: 'Draft' | 'Sent' | 'Paid' | 'Cancelled';
  created_at: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  date: string;
  customerName: string;
  customerPhone: string;
  carDetails: string;
  jobCardId: string;
  status: 'Draft' | 'Sent' | 'Paid' | 'Cancelled';
  totalAmount: number;
  tax: number;
  finalAmount: number;
  subtotal: number;
  totalPartsCost: number;
  laborCost: number;
  advisorName?: string;
  mileage?: number;
  warrantyInfo?: string;
  notes?: string;
  cgstAmount?: number;
  sgstAmount?: number;
  igstAmount?: number;
  items: {
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    itemType: 'part' | 'labor';
    hsnSac?: string;
    cgstRate?: number;
    sgstRate?: number;
    igstRate?: number;
    cgstAmount?: number;
    sgstAmount?: number;
    igstAmount?: number;
  }[];
}

export const toAppInvoice = (
  invoiceData: any, 
  jobCardData: any, 
  lineItems: any[]
): Invoice => {
  // Format the invoice number
  const invoiceNumber = `INV-${invoiceData.id.substring(0, 6).toUpperCase()}`;
  
  // Format the date
  const date = new Date(invoiceData.created_at).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  
  // Calculate totals for parts and labor
  let totalPartsCost = 0;
  let laborCost = 0;
  let totalCgst = 0;
  let totalSgst = 0;
  let totalIgst = 0;
  
  console.log("Converting invoice data with items:", lineItems);
  
  const items = lineItems.map(item => {
    // Ensure we're working with valid numbers
    const quantity = Number(item.quantity) || 0;
    const unitPrice = Number(item.unit_price) || 0;
    const totalPrice = quantity * unitPrice;
    const cgstRate = Number(item.cgst_rate) || 0;
    const sgstRate = Number(item.sgst_rate) || 0;
    const igstRate = Number(item.igst_rate) || 0;
    
    // Calculate tax amounts if they're not already provided
    const cgstAmount = Number(item.cgst_amount) || (totalPrice * (cgstRate / 100));
    const sgstAmount = Number(item.sgst_amount) || (totalPrice * (sgstRate / 100));
    const igstAmount = Number(item.igst_amount) || (totalPrice * (igstRate / 100));
    
    if (item.item_type === 'part') {
      totalPartsCost += totalPrice;
    } else if (item.item_type === 'labor') {
      laborCost += totalPrice;
    }
    
    // Add to tax totals
    totalCgst += cgstAmount;
    totalSgst += sgstAmount;
    totalIgst += igstAmount;
    
    console.log(`Converting item: ${item.description}, UnitPrice: ${unitPrice}, Quantity: ${quantity}, Total: ${totalPrice}`);
    
    return {
      id: item.id || '',
      description: item.description || '',
      quantity: quantity,
      unitPrice: unitPrice,
      totalPrice: totalPrice,
      itemType: item.item_type as 'part' | 'labor',
      hsnSac: item.hsn_sac || '',
      cgstRate: cgstRate,
      sgstRate: sgstRate,
      igstRate: igstRate,
      cgstAmount: cgstAmount,
      sgstAmount: sgstAmount,
      igstAmount: igstAmount
    };
  });
  
  // Calculate subtotal from actual items
  const subtotal = totalPartsCost + laborCost;
  
  // Calculate total tax
  const totalTax = totalCgst + totalSgst + totalIgst;
  
  // Calculate final amount
  const finalAmount = subtotal + totalTax;
  
  console.log("Converted invoice calculated values:", {
    subtotal,
    totalTax,
    finalAmount,
    totalCgst,
    totalSgst,
    totalIgst
  });
  
  // Ensure status is one of the allowed values
  const status = (invoiceData.status === 'Canceled') 
    ? 'Cancelled' 
    : (invoiceData.status as 'Draft' | 'Sent' | 'Paid' | 'Cancelled');
  
  return {
    id: invoiceData.id,
    invoiceNumber,
    date,
    customerName: jobCardData.customer_name || '',
    customerPhone: jobCardData.customer_phone || '',
    carDetails: `${jobCardData.car_make || ''} ${jobCardData.car_model || ''} (${jobCardData.car_number || ''})`,
    jobCardId: invoiceData.job_card_id,
    status: status,
    totalAmount: subtotal,  // Use calculated value
    tax: totalTax,          // Use calculated value
    finalAmount: finalAmount, // Use calculated value
    subtotal,
    totalPartsCost,
    laborCost,
    items,
    advisorName: invoiceData.advisor_name || '',
    mileage: Number(invoiceData.mileage) || 0,
    warrantyInfo: invoiceData.warranty_info || '',
    notes: invoiceData.notes || '',
    cgstAmount: totalCgst,  // Use calculated value
    sgstAmount: totalSgst,  // Use calculated value
    igstAmount: totalIgst   // Use calculated value
  };
};
