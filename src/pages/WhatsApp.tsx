import React, { useState, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Phone, Send, MessageSquare, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useOptimizedInvoices } from '@/hooks/useOptimizedInvoices';
import { useOptimizedJobCards } from '@/hooks/useOptimizedJobCards';
import { SkeletonTable, SkeletonCard } from '@/components/ui/skeleton-card';

interface RecentCustomer {
  name: string;
  phone: string;
}

const WhatsAppIntegration = () => {
  const [message, setMessage] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const { toast } = useToast();
  
  // Use optimized hooks for better performance
  const { data: invoiceData, isLoading: invoicesLoading, error: invoicesError, refetch: refetchInvoices } = useOptimizedInvoices({
    limit: 20,
  });

  const { data: jobCardsData, isLoading: jobCardsLoading } = useOptimizedJobCards({
    limit: 5,
  });

  const invoices = invoiceData?.data || [];
  const jobCards = jobCardsData?.data || [];

  // Memoize recent customers to avoid recalculation
  const recentCustomers = useMemo((): RecentCustomer[] => {
    if (!jobCards.length) return [];
    
    const uniqueCustomers = new Map();
    jobCards.forEach(jobCard => {
      const key = `${jobCard.customer.name}-${jobCard.customer.phone}`;
      if (!uniqueCustomers.has(key)) {
        uniqueCustomers.set(key, {
          name: jobCard.customer.name,
          phone: jobCard.customer.phone
        });
      }
    });
    
    return Array.from(uniqueCustomers.values()).slice(0, 5);
  }, [jobCards]);

  // Optimized event handlers
  const formatPhoneNumber = useCallback((phone: string) => {
    const digits = phone.replace(/\D/g, '');
    return digits.startsWith('+') ? digits : `+${digits}`;
  }, []);

  const handleSendDirectMessage = useCallback(() => {
    if (!phoneNumber) {
      toast({
        title: "Error",
        description: "Please enter a phone number",
        variant: "destructive",
      });
      return;
    }

    const formattedPhone = formatPhoneNumber(phoneNumber);
    const encodedMessage = encodeURIComponent(message);
    const whatsappLink = `https://wa.me/${formattedPhone}?text=${encodedMessage}`;
    
    window.open(whatsappLink, '_blank');
    toast({
      title: "WhatsApp Opening",
      description: "WhatsApp is opening in a new tab with your message",
    });
  }, [phoneNumber, message, formatPhoneNumber, toast]);

  const handleSendInvoice = useCallback((invoice: any) => {
    if (!invoice.customerPhone) {
      toast({
        title: "Error",
        description: "Customer doesn't have a phone number",
        variant: "destructive",
      });
      return;
    }

    const invoiceUrl = `https://example.com/invoices/${invoice.invoiceNumber}.pdf`;
    const formattedPhone = formatPhoneNumber(invoice.customerPhone);
    const messageText = `Hello ${invoice.customerName}, thank you for your business! Your invoice (${invoice.invoiceNumber}) for ${invoice.totalAmount.toFixed(2)} is ready. You can view it here: ${invoiceUrl}`;
    const encodedMessage = encodeURIComponent(messageText);
    const whatsappLink = `https://wa.me/${formattedPhone}?text=${encodedMessage}`;
    
    window.open(whatsappLink, '_blank');
    toast({
      title: "WhatsApp Opening",
      description: "WhatsApp is opening with the invoice message",
    });
  }, [formatPhoneNumber, toast]);

  const handleSelectCustomer = useCallback((customer: RecentCustomer) => {
    setPhoneNumber(customer.phone);
  }, []);

  const getStatusBadge = useCallback((status: string) => {
    const badgeClasses = {
      'Paid': 'bg-green-100 text-green-800 dark:bg-green-800/20 dark:text-green-300',
      'Sent': 'bg-blue-100 text-blue-800 dark:bg-blue-800/20 dark:text-blue-300',
      'Pending': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800/20 dark:text-yellow-300',
    };
    
    return (
      <Badge className={badgeClasses[status as keyof typeof badgeClasses] || ''}>
        {status}
      </Badge>
    );
  }, []);

  const handleRetryInvoices = useCallback(() => {
    refetchInvoices();
  }, [refetchInvoices]);

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">WhatsApp Integration</h1>
          <p className="text-muted-foreground">
            Connect with customers via WhatsApp to share invoices and messages.
          </p>
        </div>
        
        <Tabs defaultValue="invoices" className="space-y-4">
          <TabsList>
            <TabsTrigger value="invoices">Send Invoices</TabsTrigger>
            <TabsTrigger value="direct">Direct Message</TabsTrigger>
          </TabsList>
          
          <TabsContent value="invoices" className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>Recent Invoices</CardTitle>
                <CardDescription>
                  Send invoice information to customers via WhatsApp
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {invoicesLoading ? (
                  <SkeletonTable rows={5} />
                ) : invoicesError ? (
                  <div className="text-center py-8">
                    <AlertCircle className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="mb-2">Failed to fetch invoices</p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleRetryInvoices}
                      className="flex items-center gap-1"
                    >
                      <RefreshCw className="h-4 w-4 mr-1" />
                      Retry
                    </Button>
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <div className="relative w-full overflow-auto">
                      <table className="w-full caption-bottom text-sm">
                        <thead>
                          <tr className="border-b bg-muted/50">
                            <th className="h-12 px-4 text-left font-medium">Invoice #</th>
                            <th className="h-12 px-4 text-left font-medium">Customer</th>
                            <th className="h-12 px-4 text-left font-medium">Date</th>
                            <th className="h-12 px-4 text-left font-medium">Amount</th>
                            <th className="h-12 px-4 text-left font-medium">Status</th>
                            <th className="h-12 px-4 text-right font-medium">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {invoices.map((invoice) => (
                            <tr key={invoice.id} className="border-b">
                              <td className="p-4 font-medium">{invoice.invoiceNumber}</td>
                              <td className="p-4">
                                <div>
                                  <div className="font-medium">{invoice.customerName}</div>
                                  <div className="text-sm text-muted-foreground">{invoice.customerPhone || 'No phone'}</div>
                                </div>
                              </td>
                              <td className="p-4">{invoice.date}</td>
                              <td className="p-4">${invoice.totalAmount.toFixed(2)}</td>
                              <td className="p-4">{getStatusBadge(invoice.status)}</td>
                              <td className="p-4 text-right">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="flex items-center gap-1 text-green-600"
                                      onClick={() => handleSendInvoice(invoice)}
                                      disabled={!invoice.customerPhone}
                                    >
                                      <MessageSquare className="h-4 w-4" />
                                      <span className="hidden sm:inline">Send</span>
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    Send invoice via WhatsApp
                                  </TooltipContent>
                                </Tooltip>
                              </td>
                            </tr>
                          ))}
                          
                          {invoices.length === 0 && (
                            <tr>
                              <td colSpan={6} className="h-24 text-center">
                                <div className="flex flex-col items-center justify-center text-muted-foreground">
                                  <AlertCircle className="h-8 w-8 mb-2" />
                                  <p>No invoices found</p>
                                </div>
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="direct" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Send Direct Message</CardTitle>
                    <CardDescription>
                      Send a custom message to any customer via WhatsApp
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="phoneNumber">Phone Number</Label>
                      <div className="flex gap-2">
                        <Input 
                          id="phoneNumber" 
                          placeholder="+1234567890" 
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                        />
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="icon"
                              type="button"
                              onClick={handleSendDirectMessage}
                              disabled={!phoneNumber}
                            >
                              <Phone className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            Call this number
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Enter phone number with country code (e.g., +1 for US)
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="message">Message</Label>
                      <div className="border rounded-md p-4 bg-muted/20">
                        <textarea
                          id="message"
                          rows={5}
                          className="w-full bg-transparent resize-none focus:outline-none"
                          placeholder="Type your message here..."
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                        ></textarea>
                      </div>
                    </div>
                    
                    <Button 
                      className="w-full bg-green-600 hover:bg-green-700" 
                      onClick={handleSendDirectMessage}
                      disabled={!phoneNumber}
                    >
                      <MessageSquare className="mr-2 h-4 w-4" />
                      Open in WhatsApp
                    </Button>
                  </CardContent>
                </Card>
              </div>
              
              <div>
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Customers</CardTitle>
                    <CardDescription>
                      Quickly message your recent customers
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {jobCardsLoading ? (
                      <div className="space-y-3">
                        {Array.from({ length: 3 }).map((_, i) => (
                          <SkeletonCard key={i} />
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {recentCustomers.map((customer, index) => (
                          <div 
                            key={index} 
                            className="flex items-center gap-3 p-2 hover:bg-muted rounded-md cursor-pointer"
                            onClick={() => handleSelectCustomer(customer)}
                          >
                            <Avatar>
                              <AvatarImage src={`https://ui-avatars.com/api/?name=${encodeURIComponent(customer.name)}&background=random`} />
                              <AvatarFallback>{customer.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-grow">
                              <p className="font-medium">{customer.name}</p>
                              <p className="text-sm text-muted-foreground">{customer.phone}</p>
                            </div>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost" 
                                  size="icon"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setPhoneNumber(customer.phone);
                                    handleSendDirectMessage();
                                  }}
                                >
                                  <Send className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                Start WhatsApp chat
                              </TooltipContent>
                            </Tooltip>
                          </div>
                        ))}
                        
                        {recentCustomers.length === 0 && (
                          <div className="text-center py-6 text-muted-foreground">
                            <p>No recent customers found</p>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </TooltipProvider>
  );
};

export default WhatsAppIntegration;
