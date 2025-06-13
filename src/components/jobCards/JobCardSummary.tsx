
import React from 'react';
import { JobCardPart, SelectedGarageService } from '@/types/jobCard';
import { formatIndianCurrency } from '@/lib/utils';

interface JobCardSummaryProps {
  parts: JobCardPart[];
  laborHours: number;
  hourlyRate: number;
  manualLaborCost: number;
  selectedServices: SelectedGarageService[];
  selectedGstSlabId?: string;
  onGstSlabChange?: (slabId: string) => void;
}

const JobCardSummary = ({ 
  parts, 
  laborHours, 
  hourlyRate, 
  manualLaborCost,
  selectedServices = []
}: JobCardSummaryProps) => {
  const partsCost = parts.reduce((total, part) => total + (part.quantity * part.unitPrice), 0);
  const calculatedLaborCost = laborHours * hourlyRate;
  const actualLaborCost = manualLaborCost > 0 ? manualLaborCost : calculatedLaborCost;
  const servicesCost = selectedServices.reduce((total, service) => total + service.price, 0);
  const total = partsCost + actualLaborCost + servicesCost;
  
  return (
    <div className="space-y-4">
      <div className="rounded-md border overflow-hidden">
        <table className="min-w-full">
          <tbody className="divide-y divide-gray-200">
            <tr>
              <td className="px-4 py-2 font-medium">Parts Cost</td>
              <td className="px-4 py-2 text-right">{formatIndianCurrency(partsCost)}</td>
            </tr>
            <tr>
              <td className="px-4 py-2 font-medium">
                {manualLaborCost > 0 ? 'Manual Labor Cost' : 'Labor Cost'} 
                {manualLaborCost > 0 && calculatedLaborCost > 0 && (
                  <span className="text-xs text-muted-foreground ml-2">
                    (Overriding calculated: {formatIndianCurrency(calculatedLaborCost)})
                  </span>
                )}
              </td>
              <td className="px-4 py-2 text-right">{formatIndianCurrency(actualLaborCost)}</td>
            </tr>
            {servicesCost > 0 && (
              <tr>
                <td className="px-4 py-2 font-medium">Services Cost</td>
                <td className="px-4 py-2 text-right">{formatIndianCurrency(servicesCost)}</td>
              </tr>
            )}
            <tr className="bg-muted/20">
              <td className="px-4 py-2 font-bold">Total</td>
              <td className="px-4 py-2 text-right font-bold">{formatIndianCurrency(total)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default JobCardSummary;
