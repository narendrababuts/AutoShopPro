
import React from 'react';
import { InvoiceData } from '@/types/invoice';
import { JobCard } from '@/types/jobCard';
import InvoiceHeader from './InvoiceHeader';
import CustomerVehicleInfo from './CustomerVehicleInfo';
import InvoiceInfo from './InvoiceInfo';
import ItemsTable from './ItemsTable';
import TotalsSection from './TotalsSection';
import NotesSection from './NotesSection';
import RecommendationsSection from './RecommendationsSection';
import SignaturesSection from './SignaturesSection';
import FooterSection from './FooterSection';
import { calculateInvoiceTotals } from './InvoiceCalculation';

interface GarageSettings {
  garage_name: string;
  address: string;
  gstin: string;
  logo_url: string;
  phone: string;
  email: string;
  default_advisor: string;
  payment_instructions: string;
  invoice_notes: string;
  signature_url: string;
}

interface InvoicePDFDocumentProps {
  invoice: InvoiceData;
  jobCard: JobCard;
  garageSettings: GarageSettings;
  forwardedRef: React.RefObject<HTMLDivElement>;
}

const InvoicePDFDocument: React.FC<InvoicePDFDocumentProps> = ({
  invoice,
  jobCard,
  garageSettings,
  forwardedRef
}) => {
  // Make sure invoice items exist before passing to calculation
  const items = Array.isArray(invoice.items) ? invoice.items : [];
  console.log('InvoicePDFDocument rendering with items length:', items.length);
  
  if (items.length > 0) {
    console.log('First item sample:', items[0]);
  } else {
    console.warn('No invoice items found for totals calculation');
  }
  
  const totals = calculateInvoiceTotals(items);
  console.log('Calculated totals:', totals);
  
  // Check if we should use pre-calculated values from invoice or the calculated ones
  const displayTotals = {
    totalBeforeTax: invoice.total_amount || totals.totalBeforeTax,
    totalCgst: invoice.cgst_amount || totals.totalCgst,
    totalSgst: invoice.sgst_amount || totals.totalSgst,
    totalIgst: invoice.igst_amount || totals.totalIgst,
    grandTotal: invoice.final_amount || totals.grandTotal
  };
  
  console.log('Display totals:', displayTotals);

  return (
    <div 
      ref={forwardedRef}
      id="invoice-pdf" 
      className="bg-white p-6 border rounded-md shadow-sm font-sans" 
      style={{ 
        width: '210mm', 
        maxWidth: '100%', 
        margin: '0 auto', 
        boxSizing: 'border-box',
        fontSize: '10pt',
      }}
    >
      <InvoiceHeader garageSettings={garageSettings} />
      
      <CustomerVehicleInfo jobCard={jobCard} invoice={invoice} />
      
      <InvoiceInfo 
        invoice={invoice} 
        advisorName={invoice.advisor_name || ''} 
        defaultAdvisor={garageSettings.default_advisor}
      />
      
      <ItemsTable items={items} />
      
      <TotalsSection 
        totalBeforeTax={displayTotals.totalBeforeTax}
        totalCgst={displayTotals.totalCgst}
        totalSgst={displayTotals.totalSgst}
        totalIgst={displayTotals.totalIgst}
        grandTotal={displayTotals.grandTotal}
      />
      
      <NotesSection 
        notes={invoice.notes || ''} 
        defaultNotes={garageSettings.invoice_notes}
      />
      
      <RecommendationsSection />
      
      <SignaturesSection signatureUrl={garageSettings.signature_url} />
      
      <FooterSection paymentInstructions={garageSettings.payment_instructions} />
    </div>
  );
};

export default InvoicePDFDocument;
