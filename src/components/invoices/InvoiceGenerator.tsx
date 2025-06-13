import React, { useState, useEffect } from 'react';
import { 
  DialogContent, 
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { JobCard } from '@/types/jobCard';
import { Loader2, Info, AlertCircle } from 'lucide-react';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import NumberInput from '@/components/ui/number-input';
import { formatIndianCurrency } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { useGarage } from '@/contexts/GarageContext';

interface GarageSettings {
  garage_name: string;
  address: string;
  gstin: string;
  logo_url: string;
  default_advisor: string;
}

const InvoiceGenerator = ({ 
  onClose, 
  onSuccess 
} : { 
  onClose: () => void,
  onSuccess: () => void 
}) => {
  const [jobCards, setJobCards] = useState<JobCard[]>([]);
  const [selectedJobCardId, setSelectedJobCardId] = useState<string>('');
  const [selectedJobCard, setSelectedJobCard] = useState<JobCard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [taxRate, setTaxRate] = useState(18); // Default Indian GST rate
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [defaultGstRate, setDefaultGstRate] = useState(18);
  const [mileage, setMileage] = useState('');
  const [advisorName, setAdvisorName] = useState('');
  const [warrantyInfo, setWarrantyInfo] = useState('');
  const [garageSettings, setGarageSettings] = useState<GarageSettings | null>(null);
  
  // New discount state
  const [discountAmount, setDiscountAmount] = useState(0);
  const [discountInput, setDiscountInput] = useState('');
  const [isApplyingDiscount, setIsApplyingDiscount] = useState(false);
  const [discountError, setDiscountError] = useState('');
  
  const { toast } = useToast();
  const { currentGarage } = useGarage();

  // Fetch completed job cards, default tax rate, and garage settings on component mount
  useEffect(() => {
    fetchCompletedJobCards();
    fetchDefaultTaxRate();
    fetchGarageSettings();
  }, []);

  // Update selected job card when ID changes
  useEffect(() => {
    if (selectedJobCardId) {
      const jobCard = jobCards.find(jc => jc.id === selectedJobCardId);
      setSelectedJobCard(jobCard || null);
    } else {
      setSelectedJobCard(null);
    }
  }, [selectedJobCardId, jobCards]);

  const fetchGarageSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('setting_value')
        .eq('setting_key', 'garage_settings')
        .single();

      if (error) {
        console.error('Error fetching garage settings:', error);
        return;
      }

      if (data && data.setting_value) {
        const settings = JSON.parse(data.setting_value);
        setGarageSettings(settings);
        if (settings.default_advisor) {
          setAdvisorName(settings.default_advisor);
        }
      }
    } catch (error) {
      console.error('Error parsing garage settings:', error);
    }
  };

  // Fetch default tax rate from settings
  const fetchDefaultTaxRate = async () => {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('setting_value')
        .eq('setting_key', 'garage_settings')
        .single();

      if (error) {
        console.error('Error fetching default tax rate:', error);
        return;
      }

      if (data && data.setting_value) {
        const settings = JSON.parse(data.setting_value);
        if (settings.default_tax_rate) {
          const rate = parseFloat(settings.default_tax_rate);
          setDefaultGstRate(rate);
          setTaxRate(rate);
        }
      }
    } catch (error) {
      console.error('Error parsing default tax rate:', error);
    }
  };

  // Convert jobCards to proper format with fixed type safety and strict garage filtering
  const fetchCompletedJobCards = async () => {
    setIsLoading(true);
    try {
      if (!currentGarage?.id) {
        console.log('No garage selected, returning empty job cards');
        setJobCards([]);
        return;
      }

      console.log('Fetching completed job cards for garage:', currentGarage.id);

      const { data, error } = await supabase
        .from('job_cards')
        .select('*')
        .eq('garage_id', currentGarage.id) // STRICT: Only current garage's job cards
        .in('status', ['Completed', 'Ready for Pickup'])
        .order('created_at', { ascending: false });

      if (error) throw error;

      // TRIPLE CHECK: Verify all returned job cards belong to current garage
      const strictlyFilteredData = (data || []).filter(card => 
        card.garage_id === currentGarage.id && card.garage_id !== null
      );
      
      if (strictlyFilteredData.length !== (data || []).length) {
        console.warn('SECURITY ALERT: Data leak detected in job cards query! Some cards did not belong to current garage');
        console.warn('Raw data length:', (data || []).length, 'Filtered length:', strictlyFilteredData.length);
      }

      // Map the Supabase job cards to our application JobCard model
      const convertedJobCards = strictlyFilteredData.map(card => {
        // Handle assigned staff properly with string conversion
        let staffName = '';
        if (card.assigned_staff) {
          if (typeof card.assigned_staff === 'string') {
            staffName = card.assigned_staff;
          } else {
            // Handle complex types by stringifying or safe conversion
            staffName = String(card.assigned_staff);
          }
        }
        
        // Handle parts with proper parsing
        let parts = [];
        try {
          if (card.parts) {
            if (typeof card.parts === 'string') {
              parts = JSON.parse(card.parts);
            } else if (Array.isArray(card.parts)) {
              parts = card.parts;
            }
          }
        } catch (e) {
          console.error('Error parsing parts:', e);
          parts = [];
        }

        // Handle selected services with proper parsing - safely access the property
        let selectedServices = [];
        try {
          // Use bracket notation to safely access the property
          const servicesData = (card as any).selected_services;
          if (servicesData) {
            if (typeof servicesData === 'string') {
              selectedServices = JSON.parse(servicesData);
            } else if (Array.isArray(servicesData)) {
              selectedServices = servicesData;
            }
          }
        } catch (e) {
          console.error('Error parsing selected services:', e);
          selectedServices = [];
        }
        
        return {
          id: card.id,
          customer: {
            name: String(card.customer_name || ''),
            phone: String(card.customer_phone || '')
          },
          car: {
            make: String(card.car_make || ''),
            model: String(card.car_model || ''),
            plate: String(card.car_number || '')
          },
          description: String(card.work_description || ''),
          assignedStaff: staffName,
          status: card.status,
          date: new Date(card.created_at).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          }),
          parts: parts,
          laborHours: card.labor_hours || 0,
          hourlyRate: card.hourly_rate || 0,
          estimatedCompletionDate: card.estimated_completion_date,
          actualCompletionDate: card.actual_completion_date,
          notes: String(card.notes || ''),
          jobDate: card.job_date,
          manualLaborCost: card.manual_labor_cost || 0,
          photos: [],
          gstSlabId: String(card.gst_slab_id || ''),
          selectedServices: selectedServices,
        };
      });

      console.log('Fetched', convertedJobCards.length, 'completed job cards for garage', currentGarage.id);
      setJobCards(convertedJobCards);
    } catch (error) {
      console.error('Error fetching completed job cards:', error);
      toast({
        title: "Error",
        description: "Failed to load completed job cards",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const calculateTotals = () => {
    if (!selectedJobCard) return { partsCost: 0, laborCost: 0, servicesCost: 0, subtotal: 0, taxableBase: 0, tax: 0, total: 0 };
    
    // Calculate parts cost with validation
    const partsCost = selectedJobCard.parts.reduce(
      (total, part) => {
        const quantity = Number(part.quantity) || 0;
        const unitPrice = Number(part.unitPrice) || 0;
        return total + (quantity * unitPrice);
      }, 
      0
    );
    
    // Calculate labor cost with validation
    const laborCost = selectedJobCard.manualLaborCost > 0 
      ? Number(selectedJobCard.manualLaborCost) 
      : (Number(selectedJobCard.laborHours) * Number(selectedJobCard.hourlyRate));
    
    // Calculate services cost
    const servicesCost = selectedJobCard.selectedServices.reduce(
      (total, service) => total + (Number(service.price) || 0), 
      0
    );
    
    // Calculate subtotal
    const subtotal = partsCost + laborCost + servicesCost;
    
    // Apply discount to get taxable base
    const taxableBase = Math.max(0, subtotal - discountAmount);
    
    // Calculate tax with proper validation
    const taxRateValue = Number(taxRate) || 0;
    const tax = taxableBase * (taxRateValue / 100);
    
    // Calculate total
    const total = taxableBase + tax;
    
    console.log("calculateTotals result:", { partsCost, laborCost, servicesCost, subtotal, discountAmount, taxableBase, tax, total });
    
    return { partsCost, laborCost, servicesCost, subtotal, taxableBase, tax, total };
  };

  const handleApplyDiscount = async () => {
    setIsApplyingDiscount(true);
    setDiscountError('');
    
    try {
      const discountValue = Number(discountInput) || 0;
      
      // Validation
      if (discountValue < 0) {
        setDiscountError('Discount cannot be negative.');
        setDiscountInput('');
        setIsApplyingDiscount(false);
        return;
      }
      
      const { subtotal } = calculateTotals();
      if (discountValue > subtotal) {
        setDiscountError('Discount cannot exceed Subtotal.');
        setDiscountInput('');
        setIsApplyingDiscount(false);
        return;
      }
      
      // Apply discount
      setDiscountAmount(discountValue);
      
      // Clear input and show success
      setDiscountInput('');
      
      if (discountValue > 0) {
        toast({
          title: "Discount Applied",
          description: `Discount of ${formatIndianCurrency(discountValue)} has been applied.`,
        });
      } else {
        toast({
          title: "Discount Removed",
          description: "Discount has been reset to zero.",
        });
      }
      
    } catch (error) {
      setDiscountError('Invalid discount amount.');
      setDiscountInput('');
    } finally {
      setIsApplyingDiscount(false);
    }
  };

  const handleGenerateInvoice = async () => {
    if (!selectedJobCard) return;
    
    setIsGenerating(true);
    try {
      const { partsCost, laborCost, servicesCost, subtotal, taxableBase, tax, total } = calculateTotals();
      console.log("Calculated totals:", { partsCost, laborCost, servicesCost, subtotal, discountAmount, taxableBase, tax, total });
      
      // Get selected GST slab if available
      let cgstRate = taxRate / 2; // Default to half of total rate
      let sgstRate = taxRate / 2;
      let igstRate = 0;
      
      if (selectedJobCard.gstSlabId) {
        try {
          const { data: gstData, error: gstError } = await supabase
            .from('gst_slabs')
            .select('*')
            .eq('id', selectedJobCard.gstSlabId)
            .single();
            
          if (!gstError && gstData) {
            cgstRate = gstData.cgst_percent;
            sgstRate = gstData.sgst_percent;
            igstRate = gstData.igst_percent;
          }
        } catch (error) {
          console.error('Error fetching GST data:', error);
        }
      }
      
      // Calculate tax amounts on taxable base (after discount)
      const cgstAmount = taxableBase * (cgstRate / 100);
      const sgstAmount = taxableBase * (sgstRate / 100);
      const igstAmount = taxableBase * (igstRate / 100);
      
      console.log("Tax calculations:", { cgstRate, sgstRate, igstRate, cgstAmount, sgstAmount, igstAmount });
      
      // Create the base invoice data with type safety for all fields - REMOVED notes field
      const invoiceInsertData: {
        job_card_id: string;
        total_amount: number;
        tax: number;
        final_amount: number;
        status: string;
        gst_slab_id: string | null;
        cgst_amount: number;
        sgst_amount: number;
        igst_amount: number;
      } = {
        job_card_id: selectedJobCard.id,
        total_amount: taxableBase, // Use taxable base (subtotal minus discount)
        tax: tax,
        final_amount: total,
        status: 'Draft',
        gst_slab_id: selectedJobCard.gstSlabId || null,
        cgst_amount: cgstAmount,
        sgst_amount: sgstAmount,
        igst_amount: igstAmount
      };

      console.log("Invoice data to be inserted:", invoiceInsertData);
      
      // Insert invoice record
      const { data: invoiceData, error: invoiceError } = await supabase
        .from('invoices')
        .insert(invoiceInsertData)
        .select();

      if (invoiceError) {
        console.error('Invoice insertion error:', invoiceError);
        throw new Error(`Failed to create invoice: ${invoiceError.message}`);
      }
      
      if (!invoiceData || invoiceData.length === 0) {
        throw new Error('Failed to create invoice record - no data returned');
      }
      
      const invoiceId = invoiceData[0].id;
      console.log("Created invoice with ID:", invoiceId);
      
      // Insert invoice items for parts with safer handling
      if (selectedJobCard.parts && selectedJobCard.parts.length > 0) {
        const partItems = selectedJobCard.parts
          .filter(part => part.name && part.quantity && part.unitPrice) // Only include valid parts
          .map(part => {
            const partTaxableAmount = part.quantity * part.unitPrice;
            
            return {
              invoice_id: invoiceId,
              description: part.name,
              quantity: part.quantity,
              unit_price: part.unitPrice,
              total_price: partTaxableAmount,
              item_type: 'part'
            };
          });
        
        if (partItems.length > 0) {
          console.log("Inserting part items:", partItems);
          const { error: partsError } = await supabase
            .from('invoice_items')
            .insert(partItems);
            
          if (partsError) {
            console.error('Parts insertion error:', partsError);
            // Continue execution - we created the invoice already
          }
        }
      }
      
      // Insert invoice items for services
      if (selectedJobCard.selectedServices && selectedJobCard.selectedServices.length > 0) {
        const serviceItems = selectedJobCard.selectedServices
          .filter(service => service.serviceName && service.price) // Only include valid services
          .map(service => ({
            invoice_id: invoiceId,
            description: service.serviceName,
            quantity: 1,
            unit_price: service.price,
            total_price: service.price,
            item_type: 'service'
          }));
        
        if (serviceItems.length > 0) {
          console.log("Inserting service items:", serviceItems);
          const { error: servicesError } = await supabase
            .from('invoice_items')
            .insert(serviceItems);
            
          if (servicesError) {
            console.error('Services insertion error:', servicesError);
            // Continue execution - we created the invoice already
          }
        }
      }
      
      // Insert invoice item for labor with safer handling
      if ((selectedJobCard.laborHours > 0 || selectedJobCard.manualLaborCost > 0) && laborCost > 0) {
        const laborQuantity = selectedJobCard.manualLaborCost > 0 ? 1 : selectedJobCard.laborHours;
        const laborUnitPrice = selectedJobCard.manualLaborCost > 0 
          ? selectedJobCard.manualLaborCost 
          : selectedJobCard.hourlyRate;
          
        const laborTaxableAmount = laborCost;
        
        const laborItem = {
          invoice_id: invoiceId,
          description: `Labor: ${selectedJobCard.manualLaborCost > 0 ? 'Service charge' : `${selectedJobCard.laborHours} hours`}`,
          quantity: laborQuantity,
          unit_price: laborUnitPrice,
          total_price: laborCost,
          item_type: 'labor'
        };
        
        console.log("Inserting labor item:", laborItem);
        const { error: laborError } = await supabase
          .from('invoice_items')
          .insert(laborItem);
          
        if (laborError) {
          console.error('Labor insertion error:', laborError);
          // Continue execution - we created the invoice already
        }
      }
      
      toast({
        title: "Success",
        description: `Invoice generated successfully${discountAmount > 0 ? ` with discount of ${formatIndianCurrency(discountAmount)}` : ''}`,
      });
      
      onSuccess();
    } catch (error) {
      console.error('Error generating invoice:', error);
      toast({
        title: "Error",
        description: "Failed to generate invoice. Please check the console for details.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleConfirmGenerate = () => {
    setConfirmDialogOpen(true);
  };

  const handleTaxRateChange = (value: number) => {
    setTaxRate(value);
  };

  const { partsCost, laborCost, servicesCost, subtotal, taxableBase, tax, total } = calculateTotals();

  return (
    <>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Generate Invoice</DialogTitle>
          <DialogDescription>
            Create an invoice from a completed job card
          </DialogDescription>
        </DialogHeader>
        
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <span className="ml-2">Loading job cards...</span>
          </div>
        ) : jobCards.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No eligible job cards found</h3>
            <p className="text-muted-foreground mt-2 max-w-md">
              To generate an invoice, you need at least one job card with a "Completed" or "Ready for Pickup" status.
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              <div>
                <Label htmlFor="jobCard">Select Job Card</Label>
                <Select value={selectedJobCardId} onValueChange={setSelectedJobCardId}>
                  <SelectTrigger id="jobCard">
                    <SelectValue placeholder="Select a completed job card" />
                  </SelectTrigger>
                  <SelectContent>
                    {jobCards.map(jobCard => (
                      <SelectItem key={jobCard.id} value={jobCard.id}>
                        {jobCard.customer.name} - {jobCard.car.make} {jobCard.car.model} ({jobCard.date})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {selectedJobCard && (
                <>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex justify-between">
                        <span>Job Card Details</span>
                        <Badge variant="outline">{selectedJobCard.status}</Badge>
                      </CardTitle>
                      <CardDescription>
                        Job Card #{selectedJobCard.id.substr(0, 8).toUpperCase()}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground mb-1">Customer</p>
                          <p className="font-medium">{selectedJobCard.customer.name}</p>
                          <p>{selectedJobCard.customer.phone}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground mb-1">Vehicle</p>
                          <p className="font-medium">{selectedJobCard.car.make} {selectedJobCard.car.model}</p>
                          <p>Plate: {selectedJobCard.car.plate}</p>
                        </div>
                      </div>
                      
                      <div>
                        <p className="text-muted-foreground mb-1">Description</p>
                        <p>{selectedJobCard.description}</p>
                      </div>
                      
                      {selectedJobCard.parts.length > 0 && (
                        <div>
                          <p className="text-muted-foreground mb-1">Parts Used ({selectedJobCard.parts.length})</p>
                          <ul className="list-disc list-inside pl-2 text-sm">
                            {selectedJobCard.parts.slice(0, 3).map((part, idx) => (
                              <li key={idx}>
                                {part.name} × {part.quantity} ({formatIndianCurrency(part.unitPrice)} each)
                              </li>
                            ))}
                            {selectedJobCard.parts.length > 3 && (
                              <li className="list-none italic">
                                +{selectedJobCard.parts.length - 3} more parts...
                              </li>
                            )}
                          </ul>
                        </div>
                      )}

                      {selectedJobCard.selectedServices.length > 0 && (
                        <div>
                          <p className="text-muted-foreground mb-1">Services ({selectedJobCard.selectedServices.length})</p>
                          <ul className="list-disc list-inside pl-2 text-sm">
                            {selectedJobCard.selectedServices.slice(0, 3).map((service, idx) => (
                              <li key={idx}>
                                {service.serviceName} ({formatIndianCurrency(service.price)})
                              </li>
                            ))}
                            {selectedJobCard.selectedServices.length > 3 && (
                              <li className="list-none italic">
                                +{selectedJobCard.selectedServices.length - 3} more services...
                              </li>
                            )}
                          </ul>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="advisor">Service Advisor</Label>
                      <Input
                        id="advisor"
                        value={advisorName}
                        onChange={(e) => setAdvisorName(e.target.value)}
                        placeholder="Service Advisor Name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="mileage">Vehicle Mileage (km)</Label>
                      <Input
                        id="mileage"
                        type="number"
                        value={mileage}
                        onChange={(e) => setMileage(e.target.value)}
                        placeholder="e.g., 12500"
                      />
                    </div>
                    <div>
                      <Label htmlFor="warranty">Warranty Information</Label>
                      <Input
                        id="warranty"
                        value={warrantyInfo}
                        onChange={(e) => setWarrantyInfo(e.target.value)}
                        placeholder="e.g., 6 months or 10,000 km"
                      />
                    </div>
                  </div>
                  
                  <div className="border rounded p-4 space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="font-semibold">Invoice Summary</h3>
                      <div className="flex items-center space-x-2">
                        <Label htmlFor="taxRate">GST Rate (%)</Label>
                        <NumberInput 
                          id="taxRate" 
                          className="w-20"
                          value={taxRate} 
                          onValueChange={(value) => setTaxRate(value)}
                          min={0}
                          max={100}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Parts & Materials</span>
                        <span>{formatIndianCurrency(partsCost)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>
                          Labor {selectedJobCard.manualLaborCost > 0 
                            ? '(Manual override)' 
                            : `(${selectedJobCard.laborHours} hrs @ ${formatIndianCurrency(selectedJobCard.hourlyRate)}/hr)`}
                        </span>
                        <span>{formatIndianCurrency(laborCost)}</span>
                      </div>
                      {servicesCost > 0 && (
                        <div className="flex justify-between text-sm">
                          <span>Services</span>
                          <span>{formatIndianCurrency(servicesCost)}</span>
                        </div>
                      )}
                      <div className="flex justify-between font-medium">
                        <span>Subtotal</span>
                        <span>{formatIndianCurrency(subtotal)}</span>
                      </div>
                      
                      {/* Discount Section */}
                      <div className="flex justify-between items-center py-2 border-t border-b">
                        <span className="font-medium">
                          {discountAmount > 0 ? `Discount (${formatIndianCurrency(discountAmount)})` : 'Discount'}
                        </span>
                        <div className="flex items-center space-x-2">
                          {discountAmount === 0 ? (
                            <>
                              <Input
                                type="number"
                                placeholder="₹ 0.00"
                                value={discountInput}
                                onChange={(e) => setDiscountInput(e.target.value)}
                                className="w-24 h-8 text-right"
                                min="0"
                                max={subtotal}
                              />
                              <Button
                                size="sm"
                                onClick={handleApplyDiscount}
                                disabled={isApplyingDiscount || !discountInput.trim()}
                                className="h-8 px-3"
                              >
                                {isApplyingDiscount ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  'Apply'
                                )}
                              </Button>
                            </>
                          ) : (
                            <div className="flex items-center space-x-2">
                              <span className="text-red-600 font-medium">−{formatIndianCurrency(discountAmount)}</span>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setDiscountAmount(0);
                                  setDiscountInput('');
                                  toast({
                                    title: "Discount Removed",
                                    description: "Discount has been reset to zero.",
                                  });
                                }}
                                className="h-8 px-3"
                              >
                                Remove
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {discountError && (
                        <p className="text-sm text-red-600">{discountError}</p>
                      )}
                      
                      <div className="flex justify-between text-sm">
                        <span>GST ({taxRate}%) on {formatIndianCurrency(taxableBase)}</span>
                        <span>{formatIndianCurrency(tax)}</span>
                      </div>
                      <div className="flex justify-between text-lg font-bold pt-2 border-t">
                        <span>Total</span>
                        <span>{formatIndianCurrency(total)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-amber-50 dark:bg-amber-950/30 rounded p-3 flex items-start">
                    <Info className="h-5 w-5 text-amber-500 mt-0.5 mr-2 shrink-0" />
                    <p className="text-sm text-amber-800 dark:text-amber-300">
                      Generating an invoice will create a draft that you can review before sending to the customer.
                      You will be able to edit line items, prices, and tax calculations after generation.
                      {discountAmount > 0 && ` A discount of ${formatIndianCurrency(discountAmount)} will be applied.`}
                    </p>
                  </div>
                </>
              )}
            </div>
          
            <DialogFooter>
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                disabled={!selectedJobCard || isGenerating} 
                onClick={() => setConfirmDialogOpen(true)}
                className="bg-garage-primary hover:bg-garage-secondary"
              >
                {isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Generate Invoice
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
      
      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Generate Invoice</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to generate an invoice for this job card?
              This will create a draft invoice that you can review before finalizing.
              {discountAmount > 0 && ` A discount of ${formatIndianCurrency(discountAmount)} will be applied.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleGenerateInvoice}
              className="bg-garage-primary hover:bg-garage-secondary"
            >
              Generate Invoice
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

// Helper function to convert Supabase job card data to our application JobCard model
const toAppJobCard = (data: any): JobCard => {
  // Extract customer details
  const customerName = String(data.customer_name || '');
  const customerPhone = String(data.customer_phone || '');
  
  // Extract car details
  const carMake = String(data.car_make || '');
  const carModel = String(data.car_model || '');
  const carNumber = String(data.car_number || '');
  
  // Parse parts if needed
  let parts = [];
  if (data.parts) {
    if (typeof data.parts === 'string') {
      try {
        parts = JSON.parse(data.parts);
      } catch (e) {
        console.error('Error parsing parts:', e);
      }
    } else if (Array.isArray(data.parts)) {
      parts = data.parts;
    }
  }

  // Parse selected services if needed - safely access the property
  let selectedServices = [];
  try {
    // Use bracket notation to safely access the property that might not exist in types yet
    const servicesData = (data as any).selected_services;
    if (servicesData) {
      if (typeof servicesData === 'string') {
        selectedServices = JSON.parse(servicesData);
      } else if (Array.isArray(servicesData)) {
        selectedServices = servicesData;
      }
    }
  } catch (e) {
    console.error('Error parsing selected services:', e);
    selectedServices = [];
  }
  
  return {
    id: data.id,
    customer: {
      name: customerName,
      phone: customerPhone
    },
    car: {
      make: carMake,
      model: carModel,
      plate: carNumber
    },
    description: String(data.work_description || ''),
    assignedStaff: String(data.assigned_staff || ''),
    status: data.status,
    date: new Date(data.created_at).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }),
    parts: parts,
    laborHours: data.labor_hours || 0,
    hourlyRate: data.hourly_rate || 0,
    estimatedCompletionDate: data.estimated_completion_date,
    actualCompletionDate: data.actual_completion_date,
    notes: String(data.notes || ''),
    jobDate: data.job_date,
    manualLaborCost: data.manual_labor_cost || 0,
    photos: [],
    gstSlabId: String(data.gst_slab_id || ''),
    selectedServices: selectedServices,
  };
};

export default InvoiceGenerator;
