
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FileText, Download, Printer, Mail, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatIndianCurrency } from '@/lib/utils';
import { Invoice } from '@/types/invoice';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

interface InvoiceDetailsProps {
  invoice: Invoice;
  onClose: () => void;
  open?: boolean;
}

const InvoiceDetails: React.FC<InvoiceDetailsProps> = ({ invoice, onClose, open = true }) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"Draft" | "Sent" | "Paid" | "Cancelled">(invoice.status);

  const handleUpdateStatus = async (newStatus: "Draft" | "Sent" | "Paid" | "Cancelled") => {
    try {
      const { error } = await supabase
        .from('invoices')
        .update({ status: newStatus })
        .eq('id', invoice.id);

      if (error) throw error;

      setStatus(newStatus);
      toast({
        title: "Status updated",
        description: `Invoice status changed to ${newStatus}`,
      });
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: "Error",
        description: "Failed to update invoice status",
        variant: "destructive",
      });
    }
  };

  const handleSendInvoice = () => {
    toast({
      title: "Invoice sent",
      description: "The invoice has been sent to the customer",
    });
    
    handleUpdateStatus("Sent");
  };

  const handleMarkAsPaid = () => {
    handleUpdateStatus("Paid");
  };

  // Navigate to invoice detail view with PDF preview
  const handleViewPdf = () => {
    // Close the current dialog to prevent nesting issues
    onClose();
    // Navigate to the detail view route
    navigate(`/invoices/view/${invoice.id}`);
  };

  const getStatusColor = () => {
    switch (status) {
      case "Draft": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-800/20 dark:text-yellow-300";
      case "Sent": return "bg-blue-100 text-blue-800 dark:bg-blue-800/20 dark:text-blue-300";
      case "Paid": return "bg-green-100 text-green-800 dark:bg-green-800/20 dark:text-green-300";
      case "Cancelled": return "bg-red-100 text-red-800 dark:bg-red-800/20 dark:text-red-300";
      default: return "";
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) onClose();
    }}>
      <DialogContent className="max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex justify-between items-center">
            <span>Invoice #{invoice.invoiceNumber}</span>
            <Badge className={getStatusColor()}>
              {status}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Created on {invoice.date} for {invoice.customerName}
          </DialogDescription>
        </DialogHeader>
        
        {/* Customer and Invoice Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Customer</p>
            <h3 className="text-lg font-medium">{invoice.customerName}</h3>
            <p className="text-sm">{invoice.customerPhone}</p>
          </div>
          
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Vehicle</p>
            <h3 className="text-lg font-medium">{invoice.carDetails}</h3>
            <p className="text-sm">Job Card: {invoice.jobCardId.substring(0, 8).toUpperCase()}</p>
          </div>
        </div>
        
        <Separator />
        
        {/* Invoice Items */}
        <div className="space-y-2">
          <h3 className="font-medium">Items</h3>
          
          <div className="border rounded-md">
            <div className="grid grid-cols-12 text-sm font-medium bg-muted p-2">
              <div className="col-span-5">Description</div>
              <div className="col-span-2 text-center">Qty</div>
              <div className="col-span-2 text-right">Unit Price</div>
              <div className="col-span-3 text-right">Total</div>
            </div>
            
            <div className="divide-y">
              {invoice.items.map((item, index) => (
                <div key={index} className="grid grid-cols-12 text-sm p-2">
                  <div className="col-span-5">
                    <p>{item.description}</p>
                    <p className="text-xs text-muted-foreground">{item.itemType}</p>
                  </div>
                  <div className="col-span-2 text-center">{item.quantity}</div>
                  <div className="col-span-2 text-right">{formatIndianCurrency(item.unitPrice)}</div>
                  <div className="col-span-3 text-right">{formatIndianCurrency(item.totalPrice)}</div>
                </div>
              ))}
            </div>
            
            <div className="bg-muted/50 p-2 text-right text-sm">
              <div className="flex justify-end">
                <div className="w-48 space-y-1">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>{formatIndianCurrency(invoice.subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax:</span>
                    <span>{formatIndianCurrency(invoice.tax)}</span>
                  </div>
                  <div className="flex justify-between font-medium border-t border-border pt-1 mt-1">
                    <span>Total:</span>
                    <span>{formatIndianCurrency(invoice.finalAmount)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {invoice.notes && (
            <div className="text-sm mt-2">
              <span className="font-medium">Notes: </span>
              <span>{invoice.notes}</span>
            </div>
          )}
        </div>
        
        <Separator />
        
        {/* Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <Button 
            variant="outline" 
            onClick={handleViewPdf}
            className="flex flex-col items-center py-4 h-auto"
          >
            <FileText className="h-4 w-4 mb-1" />
            <span className="text-xs">View PDF</span>
          </Button>
          
          <Button 
            variant="outline" 
            onClick={handleViewPdf}
            className="flex flex-col items-center py-4 h-auto"
          >
            <Download className="h-4 w-4 mb-1" />
            <span className="text-xs">Download</span>
          </Button>
          
          <Button 
            variant="outline" 
            onClick={handleViewPdf}
            className="flex flex-col items-center py-4 h-auto"
          >
            <Printer className="h-4 w-4 mb-1" />
            <span className="text-xs">Print</span>
          </Button>
          
          <Button 
            variant="outline" 
            onClick={handleSendInvoice}
            disabled={status === "Sent" || status === "Paid" || status === "Cancelled"}
            className="flex flex-col items-center py-4 h-auto"
          >
            <Mail className="h-4 w-4 mb-1" />
            <span className="text-xs">Send Email</span>
          </Button>
        </div>
        
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <p className="text-sm mr-2">Status:</p>
            <Select value={status} onValueChange={(val: "Draft" | "Sent" | "Paid" | "Cancelled") => handleUpdateStatus(val)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Draft">Draft</SelectItem>
                <SelectItem value="Sent">Sent</SelectItem>
                <SelectItem value="Paid">Paid</SelectItem>
                <SelectItem value="Cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-x-2">
            <Button
              variant="ghost"
              onClick={onClose}
            >
              Close
            </Button>
            
            {status !== "Paid" && status !== "Cancelled" && (
              <Button 
                variant="default" 
                onClick={handleMarkAsPaid}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Mark as Paid
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InvoiceDetails;
