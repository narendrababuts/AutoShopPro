
import React from 'react';

interface SignaturesSectionProps {
  signatureUrl?: string;
}

const SignaturesSection: React.FC<SignaturesSectionProps> = ({ signatureUrl }) => {
  return (
    <div className="grid grid-cols-2 mt-8 text-xs page-break-avoid">
      <div>
        <p className="mb-10">Customer's Signature</p>
        <p>_______________________</p>
      </div>
      <div className="text-right">
        <div className="flex justify-end mb-10">
          {signatureUrl && (
            <img 
              src={signatureUrl} 
              alt="Authorized Signature" 
              className="h-16 object-contain"
              crossOrigin="anonymous"
              style={{ maxHeight: '60px' }}
            />
          )}
        </div>
        <p>Authorized Signature</p>
      </div>
    </div>
  );
};

export default SignaturesSection;
