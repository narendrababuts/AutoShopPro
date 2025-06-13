
import React, { useState, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { 
  FileText, 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Printer, 
  Mail,
  Settings,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import InvoiceGenerator from '@/components/invoices/InvoiceGenerator';
import InvoiceDetails from '@/components/invoices/InvoiceDetails';
import InvoiceViewDrawer from '@/components/invoices/InvoiceViewDrawer';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import { Invoice } from '@/types/invoice';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { formatIndianCurrency } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { useOptimizedInvoices } from '@/hooks/useOptimizedInvoices';
import { SkeletonTable } from '@/components/ui/skeleton-card';

const ITEMS_PER_PAGE = 20;

const Invoices = () => {
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [openInvoiceDialog, setOpenInvoiceDialog] = useState(false);
  const [openGenerateDialog, setOpenGenerateDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [activeTab, setActiveTab] = useState("all");
  const { toast } = useToast();
  const [openInvoiceDrawer, setOpenInvoiceDrawer] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);

  // Use optimized invoice fetching with pagination
  const { data: invoiceData, isLoading, error, refetch } = useOptimizedInvoices({
    limit: ITEMS_PER_PAGE,
    offset: currentPage * ITEMS_PER_PAGE,
    status: activeTab === "all" ? undefined : activeTab,
  });

  const invoices = invoiceData?.data || [];
  const totalCount = invoiceData?.count || 0;
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  // Memoized filtered invoices to avoid unnecessary recalculations
  const filteredInvoices = useMemo(() => {
    if (!searchQuery) return invoices;
    
    return invoices.filter(invoice => 
      invoice.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.carDetails.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [invoices, searchQuery]);

  // Optimized event handlers with useCallback
  const handleViewInvoice = useCallback((invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setOpenInvoiceDialog(true);
  }, []);

  const handleViewInvoiceInDrawer = useCallback((invoice: Invoice) => {
    setSelectedInvoiceId(invoice.id);
    setOpenInvoiceDrawer(true);
  }, []);

  const handlePageChange = useCallback((newPage: number) => {
    setCurrentPage(newPage);
  }, []);

  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab);
    setCurrentPage(0); // Reset to first page when changing tabs
  }, []);

  const getStatusBadge = useCallback((status: string) => {
    switch (status) {
      case 'Paid':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-800/20 dark:text-green-300">Paid</Badge>;
      case 'Sent':
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-800/20 dark:text-blue-300">Sent</Badge>;
      case 'Draft':
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-800/20 dark:text-yellow-300">Draft</Badge>;
      case 'Cancelled':
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-800/20 dark:text-red-300">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  }, []);

  const refreshInvoices = useCallback(() => {
    refetch();
  }, [refetch]);

  const handleGenerateInvoiceSuccess = useCallback(() => {
    refreshInvoices();
    setOpenGenerateDialog(false);
    toast({
      title: "Success",
      description: "Invoice generated successfully",
    });
  }, [refreshInvoices, toast]);

  if (error) {
    toast({
      title: "Error",
      description: "Failed to load invoices",
      variant: "destructive",
    });
  }

  return (
    <div className="space-y-6">
      {/* Header Section - Always visible */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Invoices</h1>
          <p className="text-muted-foreground">
            Generate and manage invoices for completed job cards.
          </p>
        </div>
        <div className="flex space-x-2">
          <Link to="/settings/invoice">
            <Button variant="outline">
              <Settings className="mr-2 h-4 w-4" />
              Invoice Settings
            </Button>
          </Link>
          <Button 
            className="bg-garage-primary hover:bg-garage-secondary"
            onClick={() => setOpenGenerateDialog(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Generate Invoice
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4">
          <TabsList className="mb-2 sm:mb-0">
            <TabsTrigger value="all">All Invoices</TabsTrigger>
            <TabsTrigger value="Draft">Draft</TabsTrigger>
            <TabsTrigger value="Sent">Sent</TabsTrigger>
            <TabsTrigger value="Paid">Paid</TabsTrigger>
          </TabsList>
          
          <div className="flex w-full sm:w-auto space-x-2">
            <div className="relative flex-1 sm:flex-initial">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search invoices..."
                className="pl-8 w-full sm:w-[250px]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
            <DatePickerWithRange 
              className="hidden md:flex" 
              onChange={(date) => console.log(date)}
            />
          </div>
        </div>

        <TabsContent value={activeTab} className="mt-0">
          {isLoading ? (
            <SkeletonTable rows={8} />
          ) : (
            <>
              {renderInvoiceTable(filteredInvoices)}
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Showing {currentPage * ITEMS_PER_PAGE + 1} to {Math.min((currentPage + 1) * ITEMS_PER_PAGE, totalCount)} of {totalCount} invoices
                  </p>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 0}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage >= totalPages - 1}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Invoice Generator Dialog */}
      <Dialog open={openGenerateDialog} onOpenChange={setOpenGenerateDialog}>
        <InvoiceGenerator 
          onClose={() => setOpenGenerateDialog(false)} 
          onSuccess={handleGenerateInvoiceSuccess}
        />
      </Dialog>

      {/* Invoice Drawer for previewing */}
      {selectedInvoiceId && (
        <InvoiceViewDrawer 
          open={openInvoiceDrawer} 
          onClose={() => {
            setOpenInvoiceDrawer(false);
            setSelectedInvoiceId(null);
          }}
          invoiceId={selectedInvoiceId}
        />
      )}
      
      {/* Invoice Details Dialog (keeping this for backward compatibility) */}
      {selectedInvoice && (
        <Dialog open={openInvoiceDialog} onOpenChange={setOpenInvoiceDialog}>
          <InvoiceDetails 
            invoice={selectedInvoice} 
            onClose={() => setOpenInvoiceDialog(false)}
          />
        </Dialog>
      )}
    </div>
  );

  function renderInvoiceTable(displayedInvoices: Invoice[]) {
    if (displayedInvoices.length === 0) {
      return (
        <div className="text-center py-8 border rounded-md">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
          <h3 className="text-lg font-medium mb-1">No invoices found</h3>
          <p className="text-muted-foreground mb-4">
            {searchQuery ? "Try adjusting your search query" : "Get started by generating an invoice from a completed job card"}
          </p>
          {!searchQuery && (
            <Button 
              onClick={() => setOpenGenerateDialog(true)}
              className="bg-garage-primary hover:bg-garage-secondary"
            >
              <Plus className="mr-2 h-4 w-4" />
              Generate Invoice
            </Button>
          )}
        </div>
      );
    }

    return (
      <div className="rounded-md border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice #</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Vehicle</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayedInvoices.map((invoice) => (
              <TableRow key={invoice.id} className="cursor-pointer hover:bg-muted/50" onClick={() => handleViewInvoiceInDrawer(invoice)}>
                <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                <TableCell>{invoice.date}</TableCell>
                <TableCell>{invoice.customerName}</TableCell>
                <TableCell>{invoice.carDetails}</TableCell>
                <TableCell>{formatIndianCurrency(invoice.totalAmount)}</TableCell>
                <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                <TableCell>
                  <div className="flex justify-end space-x-2">
                    <Button variant="ghost" size="icon" onClick={(e) => {
                      e.stopPropagation();
                      handleViewInvoiceInDrawer(invoice);
                    }}>
                      <FileText className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={(e) => {
                      e.stopPropagation();
                      handleViewInvoiceInDrawer(invoice);
                    }}>
                      <Printer className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={(e) => {
                      e.stopPropagation();
                      handleViewInvoiceInDrawer(invoice);
                    }}>
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-blue-600" onClick={(e) => {
                      e.stopPropagation();
                      console.log("Send invoice:", invoice.id);
                    }}>
                      <Mail className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }
};

export default Invoices;
