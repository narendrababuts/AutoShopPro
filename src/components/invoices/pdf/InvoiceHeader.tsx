
import React from 'react';

interface GarageSettings {
  garage_name: string;
  address: string;
  gstin: string;
  logo_url: string;
  phone: string;
  email: string;
}

interface InvoiceHeaderProps {
  garageSettings: GarageSettings;
}

const InvoiceHeader: React.FC<InvoiceHeaderProps> = ({ garageSettings }) => {
  return (
    <>
      {/* Header with logo and garage details */}
      <div className="flex justify-between items-start mb-4 border-b pb-4 page-break-avoid">
        <div className="flex-shrink-0">
          {garageSettings.logo_url && (
            <img 
              src={garageSettings.logo_url} 
              alt="Garage Logo" 
              className="h-16 object-contain"
              crossOrigin="anonymous"
              style={{ maxHeight: '60px' }}
            />
          )}
          <h1 className="text-lg font-bold mt-1">{garageSettings.garage_name}</h1>
          <p className="text-xs">GSTIN: {garageSettings.gstin}</p>
        </div>
        
        <div className="text-right text-xs">
          <p>{garageSettings.address}</p>
          {garageSettings.phone && <p>Phone: {garageSettings.phone}</p>}
          {garageSettings.email && <p>Email: {garageSettings.email}</p>}
        </div>
      </div>
      
      {/* Tax Invoice Heading */}
      <div className="bg-gray-200 text-center py-2 mb-4 page-break-avoid">
        <h2 className="font-bold text-lg">TAX INVOICE</h2>
      </div>
    </>
  );
};

export default InvoiceHeader;
