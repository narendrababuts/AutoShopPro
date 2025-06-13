
import React from 'react';
import { InvoiceData } from '@/types/invoice';
import { formatDate } from './PDFUtils';

interface InvoiceInfoProps {
  invoice: InvoiceData;
  advisorName: string;
  defaultAdvisor: string;
}

const InvoiceInfo: React.FC<InvoiceInfoProps> = ({ invoice, advisorName, defaultAdvisor }) => {
  return (
    <div className="grid grid-cols-2 gap-4 mb-4 page-break-avoid">
      {/* Left side - Job Info */}
      <div className="border p-3">
        <table className="w-full text-xs border-collapse">
          <tbody>
            <tr>
              <td className="py-1 pr-2 font-medium">Invoice No.</td>
              <td className="py-1">INV-{invoice.id.substring(0, 8).toUpperCase()}</td>
            </tr>
            <tr>
              <td className="py-1 pr-2 font-medium">Invoice Date</td>
              <td className="py-1">{formatDate(invoice.created_at)}</td>
            </tr>
            <tr>
              <td className="py-1 pr-2 font-medium">Job Card No.</td>
              <td className="py-1">JC-{invoice.job_card_id.substring(0, 8).toUpperCase()}</td>
            </tr>
          </tbody>
        </table>
      </div>
      
      {/* Right side - Service Info */}
      <div className="border p-3">
        <table className="w-full text-xs border-collapse">
          <tbody>
            <tr>
              <td className="py-1 pr-2 font-medium">Service Advisor</td>
              <td className="py-1">{advisorName || defaultAdvisor || 'N/A'}</td>
            </tr>
            <tr>
              <td className="py-1 pr-2 font-medium">Warranty Info</td>
              <td className="py-1">{invoice.warranty_info || 'N/A'}</td>
            </tr>
            <tr>
              <td className="py-1 pr-2 font-medium">Visit Date</td>
              <td className="py-1">{formatDate(invoice.created_at)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default InvoiceInfo;
