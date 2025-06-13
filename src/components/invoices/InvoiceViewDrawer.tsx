
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import { InvoiceData, InvoiceItem, InvoiceStatus } from '@/types/invoice';
import { JobCard, toAppJobCard } from '@/types/jobCard';
import { Button } from '@/components/ui/button';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerClose } from '@/components/ui/drawer';
import { Edit, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import InvoicePdfGenerator from './InvoicePdfGenerator';

interface InvoiceViewDrawerProps {
  open: boolean;
  onClose: () => void;
  invoiceId: string;
}

const InvoiceViewDrawer: React.FC<InvoiceViewDrawerProps> = ({ open, onClose, invoiceId }) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [invoice, setInvoice] = useState<InvoiceData | null>(null);
  const [jobCard, setJobCard] = useState<JobCard | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (open && invoiceId) {
      fetchInvoiceData(invoiceId);
    }
  }, [open, invoiceId]);

  const fetchInvoiceData = async (id: string) => {
    setIsLoading(true);
    try {
      console.log("Drawer: Fetching invoice data for ID:", id);
      const { data: invoiceData, error: invoiceError } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', id)
        .single();

      if (invoiceError) {
        console.error("Error fetching invoice:", invoiceError);
        throw invoiceError;
      }

      if (!invoiceData) {
        toast({
          title: "Invoice Not Found",
          description: "Could not find invoice with the given ID.",
          variant: "destructive",
        });
        onClose();
        return;
      }

      console.log("Drawer: Invoice data retrieved:", invoiceData);
      
      // Fetch associated job card
      console.log("Drawer: Fetching job card with ID:", invoiceData.job_card_id);
      const { data: jobCardData, error: jobCardError } = await supabase
        .from('job_cards')
        .select('*')
        .eq('id', invoiceData.job_card_id)
        .single();

      if (jobCardError) {
        console.error("Error fetching job card:", jobCardError);
        throw jobCardError;
      }

      console.log("Drawer: Job card data retrieved:", jobCardData);
      
      // Fetch invoice items
      const { data: invoiceItems, error: itemsError } = await supabase
        .from('invoice_items')
        .select('*')
        .eq('invoice_id', id);
      
      if (itemsError) {
        console.error("Error fetching invoice items:", itemsError);
      } else {
        console.log("Drawer: Invoice items retrieved:", invoiceItems);
        
        // Convert the raw invoice items to properly typed InvoiceItem objects
        const typedItems: InvoiceItem[] = (invoiceItems || []).map((item: any) => ({
          id: item.id,
          invoice_id: item.invoice_id,
          description: item.description,
          quantity: Number(item.quantity) || 0,
          unit_price: Number(item.unit_price) || 0,
          total_price: Number(item.total_price) || 0,
          item_type: (item.item_type === 'part' || item.item_type === 'labor') ? item.item_type : 'part',
          tenant_id: item.tenant_id,
          hsn_sac: item.hsn_sac,
          cgst_rate: Number(item.cgst_rate) || 0,
          sgst_rate: Number(item.sgst_rate) || 0,
          igst_rate: Number(item.igst_rate) || 0,
          cgst_amount: Number(item.cgst_amount) || 0,
          sgst_amount: Number(item.sgst_amount) || 0,
          igst_amount: Number(item.igst_amount) || 0
        }));
        
        // Ensure invoice data has items and correct status type
        const rawStatus = invoiceData.status;
        // Convert the status to a valid enum value or default to 'Draft'
        const validStatus = (rawStatus === 'Draft' || rawStatus === 'Sent' || 
                           rawStatus === 'Paid' || rawStatus === 'Cancelled') 
                           ? rawStatus as InvoiceStatus 
                           : 'Draft' as InvoiceStatus;
        
        const invoiceWithItems: InvoiceData = {
          ...invoiceData,
          status: validStatus,
          items: typedItems
        };
        
        setInvoice(invoiceWithItems);
        console.log("Invoice with items:", invoiceWithItems);
      }

      // Convert the raw job card data to our app's JobCard type
      const convertedJobCard = toAppJobCard(jobCardData);
      setJobCard(convertedJobCard);
    } catch (error: any) {
      console.error("Error fetching invoice data:", error);
      toast({
        title: "Error",
        description: "Failed to load invoice details.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const editInvoice = () => {
    onClose(); // Close the drawer
    navigate(`/invoices/edit/${invoiceId}`);
  };

  return (
    <Drawer open={open} onOpenChange={(isOpen) => {
      if (!isOpen) onClose();
    }} modal={true}>
      <DrawerContent className="h-[95vh] max-h-[95vh]">
        <div className="mx-auto w-full max-w-4xl">
          <DrawerHeader className="border-b sticky top-0 z-10 bg-background">
            <div className="flex items-center justify-between">
              <DrawerTitle>Invoice Details</DrawerTitle>
              <DrawerClose asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <X className="h-4 w-4" />
                </Button>
              </DrawerClose>
            </div>
          </DrawerHeader>
          <div className="p-4 overflow-y-auto">
            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : invoice && jobCard ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <Button variant="outline" onClick={editInvoice}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Invoice
                  </Button>
                </div>
                <InvoicePdfGenerator invoice={invoice} jobCard={jobCard} />
              </div>
            ) : (
              <p className="text-center py-6">Could not load invoice data.</p>
            )}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default InvoiceViewDrawer;
