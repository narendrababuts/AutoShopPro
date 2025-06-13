
import React from 'react';

interface FooterSectionProps {
  paymentInstructions: string;
}

const FooterSection: React.FC<FooterSectionProps> = ({ paymentInstructions }) => {
  return (
    <div className="mt-8 pt-2 border-t text-xs text-center text-gray-600 page-break-avoid">
      <p className="whitespace-pre-line">{paymentInstructions}</p>
      <p className="mt-1">Thank you for your business!</p>
    </div>
  );
};

export default FooterSection;
