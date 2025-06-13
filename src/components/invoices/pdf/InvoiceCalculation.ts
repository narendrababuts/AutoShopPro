
import { InvoiceItem } from "@/types/invoice";

/**
 * Calculate totals based on invoice items
 */
export const calculateInvoiceTotals = (items: InvoiceItem[] = []) => {
  let totalCgst = 0;
  let totalSgst = 0;
  let totalIgst = 0;
  let totalBeforeTax = 0;
  
  console.log('Calculating totals for PDF with items:', items);
  
  // Make sure we have items before trying to calculate
  if (!items || items.length === 0) {
    console.warn('No invoice items found for calculation');
    return {
      totalBeforeTax: 0,
      totalTax: 0,
      totalCgst: 0,
      totalSgst: 0,
      totalIgst: 0,
      grandTotal: 0
    };
  }
  
  // Process each item
  items.forEach(item => {
    // Make sure we're using numbers for calculations
    const quantity = Number(item.quantity) || 0;
    const unitPrice = Number(item.unit_price) || 0;
    
    // Calculate item total before tax
    const itemTotal = quantity * unitPrice;
    
    // Add to total before tax
    totalBeforeTax += itemTotal;
    
    // Get tax rates and ensure they are numbers
    const cgstRate = Number(item.cgst_rate || 0);
    const sgstRate = Number(item.sgst_rate || 0);
    const igstRate = Number(item.igst_rate || 0);
    
    // Calculate tax amounts based on the item total
    const itemCgst = itemTotal * (cgstRate / 100);
    const itemSgst = itemTotal * (sgstRate / 100);
    const itemIgst = itemTotal * (igstRate / 100);
    
    // Add tax amounts
    totalCgst += itemCgst;
    totalSgst += itemSgst;
    totalIgst += itemIgst;
    
    console.log(`PDF Item calculation: ${item.description}, Qty: ${quantity}, UnitPrice: ${unitPrice}, Total: ${itemTotal}, CGST(${cgstRate}%): ${itemCgst}, SGST(${sgstRate}%): ${itemSgst}`);
  });
  
  const totalTax = totalCgst + totalSgst + totalIgst;
  const grandTotal = totalBeforeTax + totalTax;
  
  console.log(`PDF Final calculations - Before Tax: ${totalBeforeTax}, CGST: ${totalCgst}, SGST: ${totalSgst}, Total Tax: ${totalTax}, Grand Total: ${grandTotal}`);
  
  return {
    totalBeforeTax,
    totalTax,
    totalCgst,
    totalSgst,
    totalIgst,
    grandTotal
  };
};
