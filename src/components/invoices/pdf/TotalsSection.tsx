
import React from 'react';

interface TotalsSectionProps {
  totalBeforeTax: number;
  totalCgst: number;
  totalSgst: number;
  totalIgst: number;
  grandTotal: number;
}

const TotalsSection: React.FC<TotalsSectionProps> = ({ 
  totalBeforeTax,
  totalCgst,
  totalSgst,
  totalIgst,
  grandTotal
}) => {
  // Ensure all values are treated as numbers
  const subtotal = typeof totalBeforeTax === 'number' ? totalBeforeTax : Number(totalBeforeTax) || 0;
  const cgst = typeof totalCgst === 'number' ? totalCgst : Number(totalCgst) || 0;
  const sgst = typeof totalSgst === 'number' ? totalSgst : Number(totalSgst) || 0; 
  const igst = typeof totalIgst === 'number' ? totalIgst : Number(totalIgst) || 0;
  const total = typeof grandTotal === 'number' ? grandTotal : Number(grandTotal) || 0;
  
  console.log('TotalsSection rendering with values:', {
    subtotal, cgst, sgst, igst, total
  });
  
  return (
    <div className="flex justify-end mb-4 page-break-avoid">
      <div className="w-1/3 border">
        <table className="w-full text-xs">
          <tbody>
            <tr>
              <td className="border px-2 py-1 font-medium">Subtotal:</td>
              <td className="border px-2 py-1 text-right">₹{subtotal.toFixed(2)}</td>
            </tr>
            {cgst > 0 && (
              <tr>
                <td className="border px-2 py-1 font-medium">CGST:</td>
                <td className="border px-2 py-1 text-right">₹{cgst.toFixed(2)}</td>
              </tr>
            )}
            {sgst > 0 && (
              <tr>
                <td className="border px-2 py-1 font-medium">SGST:</td>
                <td className="border px-2 py-1 text-right">₹{sgst.toFixed(2)}</td>
              </tr>
            )}
            {igst > 0 && (
              <tr>
                <td className="border px-2 py-1 font-medium">IGST:</td>
                <td className="border px-2 py-1 text-right">₹{igst.toFixed(2)}</td>
              </tr>
            )}
            <tr className="bg-gray-100">
              <td className="border px-2 py-1 font-bold">Total:</td>
              <td className="border px-2 py-1 text-right font-bold">₹{total.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TotalsSection;
