
import React from 'react';
import { JobCard } from '@/types/jobCard';
import { InvoiceData } from '@/types/invoice';
import { formatDate } from './PDFUtils';

interface CustomerVehicleInfoProps {
  jobCard: JobCard;
  invoice: InvoiceData;
}

const CustomerVehicleInfo: React.FC<CustomerVehicleInfoProps> = ({ jobCard, invoice }) => {
  return (
    <div className="grid grid-cols-2 gap-4 mb-4 page-break-avoid">
      {/* Left side - Bill To Info */}
      <div className="border p-3">
        <table className="w-full text-xs border-collapse">
          <tbody>
            <tr className="border-b">
              <th className="py-1 text-left font-semibold" colSpan={2}>BILL TO INFO</th>
            </tr>
            <tr>
              <td className="py-1 pr-2 font-medium">Name</td>
              <td className="py-1">{jobCard.customer.name}</td>
            </tr>
            <tr>
              <td className="py-1 pr-2 font-medium">Address</td>
              <td className="py-1">Customer Address</td>
            </tr>
            <tr>
              <td className="py-1 pr-2 font-medium">GSTIN</td>
              <td className="py-1">-</td>
            </tr>
            <tr>
              <td className="py-1 pr-2 font-medium">Phone No.</td>
              <td className="py-1">{jobCard.customer.phone}</td>
            </tr>
          </tbody>
        </table>
      </div>
      
      {/* Right side - Vehicle Info */}
      <div className="border p-3">
        <table className="w-full text-xs border-collapse">
          <tbody>
            <tr className="border-b">
              <th className="py-1 text-left font-semibold" colSpan={2}>VEHICLE INFO</th>
            </tr>
            <tr>
              <td className="py-1 pr-2 font-medium">Veh. Reg. No.</td>
              <td className="py-1">{jobCard.car.plate}</td>
            </tr>
            <tr>
              <td className="py-1 pr-2 font-medium">Model</td>
              <td className="py-1">{jobCard.car.make} {jobCard.car.model}</td>
            </tr>
            <tr>
              <td className="py-1 pr-2 font-medium">Mileage</td>
              <td className="py-1">{invoice.mileage || '-'} km</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CustomerVehicleInfo;
