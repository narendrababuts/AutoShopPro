
import React from 'react';
import { InvoiceItem } from '@/types/invoice';

interface ItemsTableProps {
  items: InvoiceItem[];
}

const ItemsTable: React.FC<ItemsTableProps> = ({ items = [] }) => {
  console.log('ItemsTable rendering with items:', items);
  
  if (!items || !Array.isArray(items)) {
    console.warn('Invalid items data provided to ItemsTable:', items);
    return <div>No invoice items available</div>;
  }
  
  return (
    <div className="page-break-avoid">
      <table className="min-w-full border text-xs mb-4" style={{ tableLayout: 'fixed' }}>
        <thead className="bg-gray-100">
          <tr>
            <th className="border px-1 py-1 text-left w-[5%]">S.No</th>
            <th className="border px-1 py-1 text-left w-[30%]">Description</th>
            <th className="border px-1 py-1 text-center w-[10%]">HSN/SAC</th>
            <th className="border px-1 py-1 text-center w-[5%]">Qty</th>
            <th className="border px-1 py-1 text-right w-[10%]">Job Value</th>
            <th className="border px-1 py-1 text-center w-[7%]">CGST %</th>
            <th className="border px-1 py-1 text-right w-[8%]">CGST ₹</th>
            <th className="border px-1 py-1 text-center w-[7%]">SGST %</th>
            <th className="border px-1 py-1 text-right w-[8%]">SGST ₹</th>
            <th className="border px-1 py-1 text-right w-[10%]">Amount ₹</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => {
            // Convert values to numbers for calculations
            const quantity = Number(item.quantity) || 0;
            const unitPrice = Number(item.unit_price) || 0;
            const itemTotal = quantity * unitPrice;
            
            const cgstRate = Number(item.cgst_rate) || 0;
            const sgstRate = Number(item.sgst_rate) || 0;
            
            // Calculate tax amounts
            const cgstAmount = (item.cgst_amount !== undefined && item.cgst_amount !== null) 
              ? Number(item.cgst_amount) 
              : (itemTotal * cgstRate / 100);
              
            const sgstAmount = (item.sgst_amount !== undefined && item.sgst_amount !== null)
              ? Number(item.sgst_amount) 
              : (itemTotal * sgstRate / 100);
            
            // Total is base amount plus taxes
            const totalWithTax = itemTotal + cgstAmount + sgstAmount;
            
            console.log(`PDF Item ${index} calculations:`, {
              description: item.description,
              quantity, unitPrice, itemTotal,
              cgstRate, sgstRate, cgstAmount, sgstAmount,
              totalWithTax
            });
            
            return (
              <tr key={index} className="item-row">
                <td className="border px-1 py-1 text-center">{index + 1}</td>
                <td className="border px-1 py-1">{item.description}</td>
                <td className="border px-1 py-1 text-center">{item.hsn_sac || '-'}</td>
                <td className="border px-1 py-1 text-center">{quantity}</td>
                <td className="border px-1 py-1 text-right">₹{itemTotal.toFixed(2)}</td>
                <td className="border px-1 py-1 text-center">{cgstRate.toFixed(1)}%</td>
                <td className="border px-1 py-1 text-right">₹{cgstAmount.toFixed(2)}</td>
                <td className="border px-1 py-1 text-center">{sgstRate.toFixed(1)}%</td>
                <td className="border px-1 py-1 text-right">₹{sgstAmount.toFixed(2)}</td>
                <td className="border px-1 py-1 text-right">₹{totalWithTax.toFixed(2)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default ItemsTable;
