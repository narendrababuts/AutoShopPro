
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { InvoiceData } from '@/types/invoice';
import { JobCard, JobCardPart, toAppJobCard } from '@/types/jobCard';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Edit, FileText, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import InvoicePdfGenerator from './InvoicePdfGenerator';

interface InvoiceDetailViewProps {
  open?: boolean;
  onClose?: () => void;
  id?: string;
}

const InvoiceDetailView: React.FC<InvoiceDetailViewProps> = ({ open, onClose, id: propId }) => {
  const { id: urlId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [invoice, setInvoice] = useState<InvoiceData | null>(null);
  const [jobCard, setJobCard] = useState<JobCard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Use either the prop ID or the URL param ID
  const invoiceId = propId || urlId;

  useEffect(() => {
    if (invoiceId) {
      fetchInvoiceData(invoiceId);
    }
  }, [invoiceId]);

  const fetchInvoiceData = async (invoiceId: string) => {
    setIsLoading(true);
    try {
      console.log("Fetching invoice data for ID:", invoiceId);
      const { data: invoiceData, error: invoiceError } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', invoiceId)
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
        if (onClose) {
          onClose();
        } else {
          navigate('/invoices');
        }
        return;
      }

      console.log("Invoice data retrieved:", invoiceData);
      setInvoice(invoiceData as InvoiceData);

      // Fetch associated job card
      console.log("Fetching job card with ID:", invoiceData.job_card_id);
      const { data: jobCardData, error: jobCardError } = await supabase
        .from('job_cards')
        .select('*')
        .eq('id', invoiceData.job_card_id)
        .single();

      if (jobCardError) {
        console.error("Error fetching job card:", jobCardError);
        throw jobCardError;
      }

      if (!jobCardData) {
        toast({
          title: "Job Card Not Found",
          description: "Could not find associated job card.",
          variant: "destructive",
        });
        return;
      }

      console.log("Job card data retrieved:", jobCardData);
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

  const goBack = () => {
    if (onClose) {
      onClose();
    } else {
      navigate('/invoices');
    }
  };

  const editInvoice = () => {
    if (invoiceId) {
      navigate(`/invoices/edit/${invoiceId}`);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return format(date, 'dd/MM/yyyy');
  };

  const formatTime = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return format(date, 'HH:mm');
  };

  const mapInvoiceItemsToParts = (items): JobCardPart[] => {
    if (!items || !Array.isArray(items)) return [];
    return items.map(item => ({
      inventoryId: item.inventory_id || item.id || '',
      name: item.description || '',
      quantity: item.quantity || 1,
      unitPrice: item.unit_price || 0,
      inStock: true, // Default to true as these are already used parts
      addedToPurchaseList: false // Default to false as these were already used
    }));
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-between mb-4">
          <Button variant="ghost" onClick={goBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Invoices
          </Button>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Loading Invoice...</CardTitle>
            <CardDescription>Fetching invoice details.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center py-8">
              <Loader2 className="mr-2 h-12 w-12 animate-spin text-garage-primary" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!invoice || !jobCard) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-between mb-4">
          <Button variant="ghost" onClick={goBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Invoices
          </Button>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Invoice Not Available</CardTitle>
            <CardDescription>Could not load invoice data.</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Please check the invoice ID or try again later.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-4">
        <Button variant="ghost" onClick={goBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Invoices
        </Button>
        <div className="space-x-2">
          <Button variant="outline" onClick={editInvoice}>
            <Edit className="mr-2 h-4 w-4" />
            Edit Invoice
          </Button>
          <InvoicePdfGenerator invoice={invoice} jobCard={jobCard} />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Invoice Details</CardTitle>
          <CardDescription>
            View detailed information about this invoice.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Invoice Information</h3>
              <div className="space-y-1">
                <p>
                  <strong>Invoice ID:</strong> {invoice.id.substring(0, 8).toUpperCase()}
                </p>
                <p>
                  <strong>Job Card ID:</strong> {invoice.job_card_id.substring(0, 8).toUpperCase()}
                </p>
                <p>
                  <strong>Created At:</strong> {formatDate(invoice.created_at)} {formatTime(invoice.created_at)}
                </p>
                <p>
                  <strong>Mileage:</strong> {invoice.mileage || 'N/A'}
                </p>
                <p>
                  <strong>Advisor Name:</strong> {invoice.advisor_name || 'N/A'}
                </p>
                <p>
                  <strong>Warranty Info:</strong> {invoice.warranty_info || 'N/A'}
                </p>
                <p>
                  <strong>GST Slab ID:</strong> {invoice.gst_slab_id || 'N/A'}
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">Customer Information</h3>
              <div className="space-y-1">
                <p>
                  <strong>Name:</strong> {jobCard.customer.name}
                </p>
                <p>
                  <strong>Phone:</strong> {jobCard.customer.phone}
                </p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Vehicle Information</h3>
            <div className="space-y-1">
              <p>
                <strong>Make:</strong> {jobCard.car.make}
              </p>
              <p>
                <strong>Model:</strong> {jobCard.car.model}
              </p>
              <p>
                <strong>Plate:</strong> {jobCard.car.plate}
              </p>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Items</h3>
            {invoice.items && invoice.items.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Quantity
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Unit Price
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Price
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {invoice.items.map((item) => (
                      <tr key={item.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.description}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.quantity}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.unit_price}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                          {item.total_price}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p>No items found for this invoice.</p>
            )}
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Notes</h3>
            <p>{invoice.notes || 'No notes available.'}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InvoiceDetailView;
