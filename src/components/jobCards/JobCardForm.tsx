import React, { useState, useEffect } from 'react';
import { JobCard, JobCardPhoto } from '@/types/jobCard';
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import NumberInput from '@/components/ui/number-input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar as CalendarIcon, Loader2, X } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import JobCardLabor from './JobCardLabor';
import JobCardSummary from './JobCardSummary';
import JobCardNotes from './JobCardNotes';
import JobCardPhotos from './JobCardPhotos';
import JobCardPartsEnhanced from './JobCardPartsEnhanced';
import JobCardServices from './JobCardServices';
import JobCardReview from './JobCardReview';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

interface JobCardFormProps {
  currentJobCard: JobCard;
  staffOptions: string[];
  isEditing: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onSelectChange: (value: string, name: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isGeneratingInvoice?: boolean;
  isSaving?: boolean;
  validateJobCard: () => { isValid: boolean; errors: string[] };
}

const JobCardForm = ({
  currentJobCard,
  staffOptions,
  isEditing,
  onChange,
  onSelectChange,
  onSubmit,
  isGeneratingInvoice = false,
  isSaving = false,
  validateJobCard,
}: JobCardFormProps) => {
  const [activeTab, setActiveTab] = useState('details');
  const [staffRates, setStaffRates] = useState<Record<string, number>>({});
  const [photos, setPhotos] = useState<JobCardPhoto[]>([]);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const navigate = useNavigate();

  // Fetch staff hourly rates
  useEffect(() => {
    const fetchStaffRates = async () => {
      try {
        const { data, error } = await supabase
          .from('staff')
          .select('name, hourly_rate');
        
        if (error) throw error;
        
        const rates: Record<string, number> = {};
        data.forEach(staff => {
          rates[staff.name] = staff.hourly_rate;
        });
        
        setStaffRates(rates);
      } catch (error) {
        console.error('Error fetching staff rates:', error);
      }
    };

    fetchStaffRates();
  }, []);

  // Fetch job photos if editing
  useEffect(() => {
    if (isEditing && currentJobCard.id) {
      const fetchPhotos = async () => {
        try {
          const { data, error } = await supabase
            .from('job_photos')
            .select('*')
            .eq('job_card_id', currentJobCard.id);
            
          if (error) throw error;
          
          if (data && data.length > 0) {
            const formattedPhotos: JobCardPhoto[] = data.map(photo => ({
              id: photo.id,
              type: photo.photo_type as 'before' | 'after',
              url: photo.url
            }));
            
            setPhotos(formattedPhotos);
            
            // Create a synthetic event to update the photos in the currentJobCard
            const syntheticEvent = {
              target: {
                name: 'photos',
                value: formattedPhotos,
              },
            };
            onChange(syntheticEvent as any);
          }
        } catch (error) {
          console.error('Error fetching job photos:', error);
        }
      };

      fetchPhotos();
    }
  }, [isEditing, currentJobCard.id]);

  // Update hourly rate when staff changes
  useEffect(() => {
    if (currentJobCard.assignedStaff && staffRates[currentJobCard.assignedStaff] && !currentJobCard.hourlyRate) {
      handleRateChange(staffRates[currentJobCard.assignedStaff]);
    }
  }, [currentJobCard.assignedStaff, staffRates]);

  // Reset submitted state when saving state changes
  useEffect(() => {
    if (!isSaving) {
      setHasSubmitted(false);
    }
  }, [isSaving]);

  const handlePartsChange = (newParts) => {
    // Create a synthetic event-like object to match the onChange interface
    const syntheticEvent = {
      target: {
        name: 'parts',
        value: newParts,
      },
    };
    onChange(syntheticEvent as any);
  };

  const handleLaborChange = (hours) => {
    const syntheticEvent = {
      target: {
        name: 'laborHours',
        value: hours,
      },
    };
    onChange(syntheticEvent as any);
  };

  const handleRateChange = (rate) => {
    const syntheticEvent = {
      target: {
        name: 'hourlyRate',
        value: rate,
      },
    };
    onChange(syntheticEvent as any);
  };

  const handleManualLaborCostChange = (cost) => {
    const syntheticEvent = {
      target: {
        name: 'manualLaborCost',
        value: cost,
      },
    };
    onChange(syntheticEvent as any);
  };

  const handleNotesChange = (notes) => {
    const syntheticEvent = {
      target: {
        name: 'notes',
        value: notes,
      },
    };
    onChange(syntheticEvent as any);
  };

  const handlePhotosChange = (newPhotos) => {
    setPhotos(newPhotos);
    const syntheticEvent = {
      target: {
        name: 'photos',
        value: newPhotos,
      },
    };
    onChange(syntheticEvent as any);
  };

  const handleDateChange = (date: Date | undefined, fieldName: string) => {
    if (!date) return;
    
    const syntheticEvent = {
      target: {
        name: fieldName,
        value: date.toISOString(),
      },
    };
    onChange(syntheticEvent as any);
  };

  const handleJobDateChange = (date: Date | undefined) => {
    if (!date) return;
    
    const syntheticEvent = {
      target: {
        name: 'jobDate',
        value: date.toISOString().split('T')[0],
      },
    };
    onChange(syntheticEvent as any);
  };

  const handleServicesChange = (services) => {
    const syntheticEvent = {
      target: {
        name: 'selectedServices',
        value: services,
      },
    };
    onChange(syntheticEvent as any);
  };

  // CRITICAL FIX: This function should ONLY be called from the review tab's submit button
  const handleActualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('ACTUAL SUBMIT TRIGGERED - Active tab:', activeTab);
    
    // ONLY allow submission from the review tab
    if (activeTab !== 'review') {
      console.log('Preventing submission - not on review tab');
      return;
    }
    
    // Prevent multiple submissions with additional safety checks
    if (isSaving || hasSubmitted) {
      console.log('Form submission prevented - already saving or submitted:', { isSaving, hasSubmitted });
      return;
    }
    
    console.log('Form submission starting - user explicitly clicked submit on review tab');
    setHasSubmitted(true);
    
    try {
      await onSubmit(e);
    } catch (error) {
      console.error('Form submission error:', error);
      setHasSubmitted(false); // Reset on error so user can retry
    }
  };

  // CRITICAL FIX: Prevent any form submission when not on review tab
  const handleFormSubmission = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Only allow actual submission on review tab
    if (activeTab === 'review') {
      handleActualSubmit(e);
    } else {
      console.log('Form submission blocked - not on review tab, current tab:', activeTab);
    }
  };
  
  const handleCancel = () => {
    // Navigate back to job cards list
    navigate('/job-cards');
  };

  // Get validation state
  const validation = validateJobCard();

  // Disable the submit button when saving, has submitted, is generating invoice, or validation fails
  const isSubmitDisabled = isSaving || hasSubmitted || isGeneratingInvoice || !validation.isValid;

  return (
    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="flex justify-between items-center">
          {isEditing ? 'Edit Job Card' : 'Create New Job Card'}
          <Button variant="ghost" size="icon" onClick={handleCancel} className="h-6 w-6">
            <X className="h-4 w-4" />
          </Button>
        </DialogTitle>
        <DialogDescription>
          {isEditing
            ? 'Update the job card information below.'
            : 'Fill in the details to create a new job card.'}
        </DialogDescription>
      </DialogHeader>

      <div className="flex-1 overflow-y-auto">
        {/* CRITICAL FIX: Form should prevent submission unless on review tab */}
        <form onSubmit={handleFormSubmission}>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full">
              <TabsTrigger value="details" className="flex-1">Details</TabsTrigger>
              <TabsTrigger value="parts" className="flex-1">Parts & Materials</TabsTrigger>
              <TabsTrigger value="services" className="flex-1">Services</TabsTrigger>
              <TabsTrigger value="labor" className="flex-1">Labor & Cost</TabsTrigger>
              <TabsTrigger value="notes" className="flex-1">Notes & Photos</TabsTrigger>
              <TabsTrigger value="review" className="flex-1">Review & Create</TabsTrigger>
            </TabsList>

            {/* Details Tab */}
            <TabsContent value="details" className="pt-4">
              <div className="grid gap-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="customer.name">Customer Name</Label>
                    <Input
                      id="customer.name"
                      name="customer.name"
                      value={currentJobCard.customer.name}
                      onChange={onChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="customer.phone">Customer Phone</Label>
                    <Input
                      id="customer.phone"
                      name="customer.phone"
                      value={currentJobCard.customer.phone}
                      onChange={onChange}
                      required
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="car.make">Car Make</Label>
                    <Input
                      id="car.make"
                      name="car.make"
                      value={currentJobCard.car.make}
                      onChange={onChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="car.model">Car Model</Label>
                    <Input
                      id="car.model"
                      name="car.model"
                      value={currentJobCard.car.model}
                      onChange={onChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="car.plate">License Plate</Label>
                    <Input
                      id="car.plate"
                      name="car.plate"
                      value={currentJobCard.car.plate}
                      onChange={onChange}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Work Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={currentJobCard.description}
                    onChange={onChange}
                    rows={4}
                    required
                  />
                </div>
                <div className="grid grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="jobDate">Job Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {currentJobCard.jobDate ? (
                            format(new Date(currentJobCard.jobDate), "PPP")
                          ) : (
                            <span>Select job date</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={currentJobCard.jobDate ? new Date(currentJobCard.jobDate) : new Date()}
                          onSelect={handleJobDateChange}
                          initialFocus
                          className="p-3 pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="assignedStaff">Assigned Staff</Label>
                    <Select
                      onValueChange={(value) => onSelectChange(value, 'assignedStaff')}
                      value={currentJobCard.assignedStaff}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select staff member" />
                      </SelectTrigger>
                      <SelectContent>
                        {staffOptions.map((staff) => (
                          <SelectItem key={staff} value={staff}>
                            {staff}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select
                      onValueChange={(value) => onSelectChange(value, 'status')}
                      value={currentJobCard.status}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Pending">Pending</SelectItem>
                        <SelectItem value="In Progress">In Progress</SelectItem>
                        <SelectItem value="Parts Ordered">Parts Ordered</SelectItem>
                        <SelectItem value="Ready for Pickup">Ready for Pickup</SelectItem>
                        <SelectItem value="Completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Estimated Completion Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {currentJobCard.estimatedCompletionDate ? (
                            format(new Date(currentJobCard.estimatedCompletionDate), "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={currentJobCard.estimatedCompletionDate ? new Date(currentJobCard.estimatedCompletionDate) : undefined}
                          onSelect={(date) => handleDateChange(date, 'estimatedCompletionDate')}
                          initialFocus
                          className="p-3 pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Parts Tab */}
            <TabsContent value="parts" className="pt-4">
              <JobCardPartsEnhanced
                parts={currentJobCard.parts || []} 
                onChange={handlePartsChange} 
              />
            </TabsContent>

            {/* Services Tab */}
            <TabsContent value="services" className="pt-4">
              <JobCardServices
                selectedServices={currentJobCard.selectedServices || []}
                onChange={handleServicesChange}
              />
            </TabsContent>

            {/* Labor Tab */}
            <TabsContent value="labor" className="pt-4">
              <div className="space-y-6">
                <JobCardLabor
                  laborHours={currentJobCard.laborHours}
                  hourlyRate={currentJobCard.hourlyRate}
                  manualLaborCost={currentJobCard.manualLaborCost}
                  onLaborChange={handleLaborChange}
                  onRateChange={handleRateChange}
                  onManualLaborCostChange={handleManualLaborCostChange}
                />
                
                <div className="pt-4 border-t">
                  <h3 className="text-lg font-semibold mb-4">Cost Summary</h3>
                  <JobCardSummary 
                    parts={currentJobCard.parts || []}
                    laborHours={currentJobCard.laborHours}
                    hourlyRate={currentJobCard.hourlyRate}
                    manualLaborCost={currentJobCard.manualLaborCost}
                    selectedServices={currentJobCard.selectedServices || []}
                  />
                </div>
              </div>
            </TabsContent>

            {/* Notes & Photos Tab */}
            <TabsContent value="notes" className="pt-4">
              <div className="space-y-6">
                <JobCardNotes 
                  notes={currentJobCard.notes} 
                  onChange={handleNotesChange} 
                />
                <div className="pt-4 border-t">
                  <JobCardPhotos
                    photos={photos}
                    jobCardId={currentJobCard.id}
                    onChange={handlePhotosChange}
                  />
                </div>
              </div>
            </TabsContent>

            {/* Review & Create Tab */}
            <TabsContent value="review" className="pt-4 pb-4">
              <JobCardReview 
                jobCard={currentJobCard}
                validation={validation}
              />
            </TabsContent>
          </Tabs>
        </form>
      </div>

      <DialogFooter className="mt-6 border-t pt-4 flex justify-between sticky bottom-0 bg-background">
        <Button 
          type="button" 
          variant="outline"
          onClick={handleCancel}
          disabled={isSaving}
        >
          Cancel
        </Button>
        
        {activeTab === 'review' ? (
          <Button 
            type="submit" 
            className="bg-garage-primary hover:bg-garage-secondary"
            disabled={isSubmitDisabled}
            onClick={handleActualSubmit}
          >
            {isSaving || isGeneratingInvoice ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isGeneratingInvoice ? 'Generating Invoice...' : 'Saving...'}
              </>
            ) : (
              isEditing ? 'Update Job Card' : 'Create Job Card'
            )}
          </Button>
        ) : (
          <Button 
            type="button" 
            onClick={() => setActiveTab('review')}
            className="bg-garage-primary hover:bg-garage-secondary"
          >
            Continue to Review
          </Button>
        )}
      </DialogFooter>
    </DialogContent>
  );
};

export default JobCardForm;
