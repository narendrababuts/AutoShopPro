import React, { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Printer } from 'lucide-react';
import { InvoiceData } from '@/types/invoice';
import { JobCard } from '@/types/jobCard';
import { useToast } from '@/hooks/use-toast';
import { generatePDF } from './pdf/PDFUtils';
import InvoicePDFDocument from './pdf/InvoicePDFDocument';
import { supabase } from '@/integrations/supabase/client';
import { useGarage } from '@/contexts/GarageContext';

interface InvoicePdfGeneratorProps {
  invoice: InvoiceData;
  jobCard: JobCard;
}

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

const InvoicePdfGenerator: React.FC<InvoicePdfGeneratorProps> = ({ invoice, jobCard }) => {
  const invoicePdfRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { currentGarage } = useGarage();
  const [garageSettings, setGarageSettings] = useState<GarageSettings>({
    garage_name: "Your Garage Name",
    address: "123 Service Street, Mechanic City",
    gstin: invoice.gst_slab_id || "N/A",
    logo_url: "",
    phone: "",
    email: "",
    default_advisor: "Service Advisor",
    payment_instructions: "Please pay within 7 days via bank transfer",
    invoice_notes: "Thank you for choosing our service. We appreciate your business.",
    signature_url: ""
  });
  
  // Load garage settings when component mounts
  useEffect(() => {
    if (currentGarage?.id) {
      loadGarageSettings();
    }
  }, [currentGarage?.id]);

  const loadGarageSettings = async () => {
    if (!currentGarage?.id) return;

    try {
      // Try to get settings from localStorage first (most up-to-date)
      const localStorageKey = `garage_settings_${currentGarage.id}`;
      const savedSettings = localStorage.getItem(localStorageKey);
      
      if (savedSettings) {
        const parsedSettings = JSON.parse(savedSettings);
        setGarageSettings(prevSettings => ({
          ...prevSettings,
          ...parsedSettings
        }));
        return;
      }

      // Fallback to database fetch
      console.log('Loading garage settings from database for garage:', currentGarage.id);
      const { data, error } = await supabase
        .from('settings')
        .select('setting_value')
        .eq('setting_key', 'garage_settings')
        .eq('garage_id', currentGarage.id)
        .maybeSingle();

      if (error) {
        console.error('Error loading garage settings:', error);
        return;
      }

      if (data && data.setting_value) {
        const parsedSettings = JSON.parse(data.setting_value);
        setGarageSettings(prevSettings => ({
          ...prevSettings,
          ...parsedSettings
        }));
        
        // Store in localStorage for next time
        localStorage.setItem(localStorageKey, data.setting_value);
      }
    } catch (e) {
      console.error('Error loading garage settings:', e);
    }
  };

  // Debug invoice data
  useEffect(() => {
    console.log('InvoicePdfGenerator - Invoice data received:', invoice);
    console.log('InvoicePdfGenerator - Invoice items:', invoice.items);
    if (invoice.items && invoice.items.length > 0) {
      console.log('InvoicePdfGenerator - Sample item:', invoice.items[0]);
    } else {
      console.warn('InvoicePdfGenerator - No invoice items available');
    }
  }, [invoice]);

  const handleDownloadPdf = () => {
    const element = invoicePdfRef.current;
    if (!element) {
      toast({
        title: "Error",
        description: "Could not generate PDF. Please try again.",
        variant: "destructive",
      });
      return;
    }
    
    toast({
      title: "Generating PDF",
      description: "Please wait while your invoice is being generated...",
    });
    
    // Debug items before PDF generation
    console.log('PDF Generation - Invoice items count:', invoice.items?.length);
    
    generatePDF(
      element,
      invoice.id,
      () => {
        toast({
          title: "Success",
          description: "Invoice PDF has been downloaded successfully!",
        });
      },
      (error) => {
        console.error('PDF generation error:', error);
        toast({
          title: "Error",
          description: "Failed to generate PDF. Please try again.",
          variant: "destructive",
        });
      }
    );
  };

  const handlePrint = () => {
    const element = invoicePdfRef.current;
    if (!element) {
      toast({
        title: "Error",
        description: "Could not print invoice. Please try again.",
        variant: "destructive",
      });
      return;
    }
    
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast({
        title: "Error",
        description: "Pop-up blocked. Please allow pop-ups to print.",
        variant: "destructive",
      });
      return;
    }
    
    // Write print-friendly content
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Print Invoice - ${invoice.id.substring(0, 8).toUpperCase()}</title>
          <style>
            @page { 
              size: A4; 
              margin: 15mm 15mm 20mm 15mm; 
            }
            body { 
              font-family: Arial, sans-serif; 
              margin: 0; 
              padding: 0;
              width: 210mm;
              box-sizing: border-box;
              overflow-y: auto;
            }
            .pdf-container {
              height: auto;
              overflow: visible;
              page-break-inside: avoid;
            }
            table { 
              width: 100%; 
              border-collapse: collapse; 
              margin-bottom: 10px;
              table-layout: fixed;
              page-break-inside: avoid;
            }
            th, td { 
              border: 1px solid #ddd; 
              padding: 6px; 
              font-size: 12px;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: normal;
              word-break: break-word;
            }
            th { 
              background-color: #f2f2f2;
              font-weight: bold;
              text-align: left;
            }
            .text-right { text-align: right; }
            .text-center { text-align: center; }
            .heading { font-size: 18px; font-weight: bold; margin-bottom: 10px; }
            .subheading { font-size: 14px; }
            .flex { display: flex; }
            .justify-between { justify-content: space-between; }
            .border-b { border-bottom: 1px solid #ddd; padding-bottom: 8px; margin-bottom: 8px; }
            .mb-4 { margin-bottom: 10px; }
            .grid-cols-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
            .p-3 { padding: 10px; }
            .border { border: 1px solid #ddd; }
            .invoice-header { text-align: center; background-color: #f2f2f2; padding: 8px; margin-bottom: 10px; }
            .invoice-totals { width: 40%; margin-left: auto; }
            .recommendations { font-size: 12px; margin-top: 10px; }
            .signature-area { display: flex; justify-content: space-between; margin-top: 30px; }
            .font-bold { font-weight: bold; }
            @media print {
              body { width: 100%; }
              table, img { page-break-inside: avoid; }
            }
          </style>
        </head>
        <body onload="window.print(); window.setTimeout(function(){ window.close(); }, 500);">
          <div class="pdf-container">${element.innerHTML}</div>
        </body>
      </html>
    `);
    
    printWindow.document.close();
    
    toast({
      title: "Print initiated",
      description: "The print dialog should open shortly.",
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end gap-4">
        <Button variant="outline" onClick={handlePrint}>
          <Printer className="mr-2 h-4 w-4" />
          Print
        </Button>
        <Button onClick={handleDownloadPdf}>
          <Download className="mr-2 h-4 w-4" />
          Download PDF
        </Button>
      </div>
      
      <div className="max-h-[800px] overflow-y-auto border rounded">
        <InvoicePDFDocument
          invoice={invoice}
          jobCard={jobCard}
          garageSettings={garageSettings}
          forwardedRef={invoicePdfRef}
        />
      </div>
    </div>
  );
}

export default InvoicePdfGenerator;
