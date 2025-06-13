import { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { JobCard, JobCardPart, toAppJobCard } from '@/types/jobCard';
import { useToast } from './use-toast';
import { useQuery } from '@tanstack/react-query';
import { useGarage } from '@/contexts/GarageContext';

// Define a type for tracking inventory updates
interface InventoryUpdate {
  inventory_id: string;
  quantity_deducted: number;
  part_name: string;
}

export const useJobCard = () => {
  const [jobCards, setJobCards] = useState<JobCard[]>([]);
  const [selectedJobCardId, setSelectedJobCardId] = useState<string>('');
  const [selectedJobCard, setSelectedJobCard] = useState<JobCard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [originalStatus, setOriginalStatus] = useState<string | null>(null);
  const [photoFiles, setPhotoFiles] = useState<{file: File, type: 'before' | 'after'}[]>([]);
  const [mileage, setMileage] = useState('');
  const [advisorName, setAdvisorName] = useState('');
  const [warrantyInfo, setWarrantyInfo] = useState('');
  
  const { currentGarage } = useGarage();
  
  const [currentJobCard, setCurrentJobCard] = useState<JobCard>({
    id: '',
    customer: { name: '', phone: '' },
    car: { make: '', model: '', plate: '' },
    description: '',
    status: 'Pending',
    assignedStaff: '',
    laborHours: 0,
    hourlyRate: 0,
    parts: [],
    notes: '',
    jobDate: new Date().toISOString().split('T')[0],
    date: '',
    estimatedCompletionDate: null,
    actualCompletionDate: null,
    manualLaborCost: 0,
    photos: [],
    selectedServices: []
  });

  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  // Use React Query for staff options with garage isolation
  const { data: staffOptions = [] } = useQuery({
    queryKey: ['staff', currentGarage?.id],
    queryFn: async () => {
      if (!currentGarage?.id) return [];
      
      const { data, error } = await supabase
        .from('staff')
        .select('name')
        .eq('garage_id', currentGarage.id)
        .order('name');
      
      if (error) throw error;
      return data.map(staff => staff.name);
    },
    enabled: !!currentGarage?.id,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // Memoize the initial job card to prevent unnecessary re-renders
  const initialJobCard = useMemo(() => ({
    id: '',
    customer: { name: '', phone: '' },
    car: { make: '', model: '', plate: '' },
    description: '',
    status: 'Pending' as const,
    assignedStaff: '',
    laborHours: 0,
    hourlyRate: 0,
    parts: [],
    notes: '',
    jobDate: new Date().toISOString().split('T')[0],
    date: '',
    estimatedCompletionDate: null,
    actualCompletionDate: null,
    manualLaborCost: 0,
    photos: [],
    selectedServices: []
  }), []);

  useEffect(() => {
    // Determine if we're creating, editing, or viewing based on URL
    const path = location.pathname;
    const searchParams = new URLSearchParams(location.search);
    const id = searchParams.get('id');
    
    console.log('Path:', path, 'ID:', id);
    
    if (path.includes('/create')) {
      console.log('Setting create mode');
      setIsCreating(true);
      setIsEditing(false);
      setCurrentJobCard({ ...initialJobCard });
    } else if (path.includes('/edit') && id) {
      console.log('Setting edit mode for ID:', id);
      setIsEditing(true);
      setIsCreating(false);
      fetchJobCard(id);
    } else if (path.includes('/view') && id) {
      console.log('Setting view mode for ID:', id);
      setIsEditing(false);
      setIsCreating(false);
      fetchJobCard(id);
    } else {
      // Default to completed job cards list for invoice generation
      setIsEditing(false);
      setIsCreating(false);
      fetchCompletedJobCards();
    }
  }, [location.pathname, location.search, initialJobCard]);

  useEffect(() => {
    if (selectedJobCardId) {
      const selected = jobCards.find(card => card.id === selectedJobCardId);
      setSelectedJobCard(selected || null);
    } else {
      setSelectedJobCard(null);
    }
  }, [selectedJobCardId, jobCards]);

  const fetchJobCard = useCallback(async (id: string) => {
    if (!currentGarage?.id) return;
    
    setIsLoading(true);
    try {
      console.log('Fetching job card with ID:', id);
      const { data, error } = await supabase
        .from('job_cards')
        .select('*')
        .eq('id', id)
        .eq('garage_id', currentGarage.id) // Enforce garage isolation
        .single();

      if (error) {
        console.error('Error fetching job card:', error);
        throw error;
      }
      
      if (data) {
        console.log('Job card data fetched:', data);
        const jobCard = toAppJobCard(data);
        setCurrentJobCard(jobCard);
        setOriginalStatus(jobCard.status);
      }
    } catch (error) {
      console.error('Error fetching job card:', error);
      toast({
        title: "Error",
        description: "Failed to load job card details",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast, currentGarage?.id]);

  const fetchCompletedJobCards = useCallback(async () => {
    if (!currentGarage?.id) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('job_cards')
        .select('*')
        .eq('garage_id', currentGarage.id) // Enforce garage isolation
        .in('status', ['Completed', 'Ready for Pickup'])
        .order('created_at', { ascending: false })
        .limit(50); // Limit for performance

      if (error) throw error;

      // Convert to JobCard objects
      const formattedJobCards = data.map(card => toAppJobCard(card));
      setJobCards(formattedJobCards);
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
  }, [toast, currentGarage?.id]);

  // Improved inventory update function with proper quantity deduction
  const updateInventoryQuantities = async (parts: JobCardPart[], jobCardId: string) => {
    try {
      // Filter parts that have inventoryId (meaning they came from inventory)
      const inventoryParts = parts.filter(part => 
        part.inventoryId && 
        part.inStock && 
        part.inventoryId !== 'custom' && 
        part.inventoryId !== ''
      );
      
      if (inventoryParts.length === 0) {
        console.log('No inventory parts to update quantities for');
        return;
      }
      
      console.log('Updating inventory quantities for parts:', inventoryParts);
      
      // Update each inventory item with proper quantity deduction
      for (const part of inventoryParts) {
        // First get the current inventory item to calculate new quantity
        const { data: inventoryItem, error: fetchError } = await supabase
          .from('inventory')
          .select('quantity, item_name, garage_id')
          .eq('id', part.inventoryId)
          .eq('garage_id', currentGarage?.id) // Ensure garage isolation
          .single();
          
        if (fetchError) {
          console.error('Error fetching inventory item for quantity update:', fetchError);
          continue;
        }
        
        if (!inventoryItem) {
          console.error('Inventory item not found for quantity update:', part.inventoryId);
          continue;
        }

        // Security check: Ensure inventory item belongs to current garage
        if (inventoryItem.garage_id !== currentGarage?.id) {
          console.error('SECURITY VIOLATION: Attempted to update inventory from different garage');
          console.error('Item garage_id:', inventoryItem.garage_id, 'Current garage:', currentGarage?.id);
          continue;
        }
        
        // Calculate new quantity after deduction
        const quantityToDeduct = Number(part.quantity) || 0;
        const newQuantity = Math.max(0, inventoryItem.quantity - quantityToDeduct);
        
        console.log(`Deducting ${quantityToDeduct} from inventory item ${inventoryItem.item_name}`);
        console.log(`Updating inventory item ${inventoryItem.item_name} from ${inventoryItem.quantity} to ${newQuantity}`);
        
        // Update the inventory item with new quantity
        const { error: updateError } = await supabase
          .from('inventory')
          .update({ quantity: newQuantity })
          .eq('id', part.inventoryId)
          .eq('garage_id', currentGarage?.id); // Ensure garage isolation
          
        if (updateError) {
          console.error('Error updating inventory item quantity:', updateError);
          // Show user-friendly error
          toast({
            title: "Inventory Update Error",
            description: `Failed to update stock for ${inventoryItem.item_name}`,
            variant: "destructive",
          });
        } else {
          console.log(`Successfully deducted ${quantityToDeduct} units from ${inventoryItem.item_name}, new stock: ${newQuantity}`);
        }
      }
    } catch (error) {
      console.error('Error updating inventory quantities:', error);
      toast({
        title: "Error",
        description: "Failed to update inventory quantities",
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Handle nested properties
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setCurrentJobCard(prev => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof typeof prev] as Record<string, unknown>),
          [child]: value
        }
      }));
    } else {
      setCurrentJobCard(prev => ({
        ...prev,
        [name]: value
      }));
    }
  }, []);

  const handleSelectChange = useCallback((value: string, name: string) => {
    setCurrentJobCard(prev => ({
      ...prev,
      [name]: value
    }));
  }, []);

  // Validation function to check if all required fields are filled
  const validateJobCard = useCallback(() => {
    const errors: string[] = [];
    
    if (!currentJobCard.customer.name) errors.push('Customer name is required');
    if (!currentJobCard.customer.phone) errors.push('Customer phone is required');
    if (!currentJobCard.car.make) errors.push('Car make is required');
    if (!currentJobCard.car.model) errors.push('Car model is required');
    if (!currentJobCard.car.plate) errors.push('License plate is required');
    if (!currentJobCard.description) errors.push('Work description is required');
    if (!currentJobCard.assignedStaff) errors.push('Assigned staff is required');
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }, [currentJobCard]);

  const handleSaveJobCard = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentGarage?.id) {
      toast({
        title: "Error",
        description: "No garage selected",
        variant: "destructive",
      });
      return;
    }
    
    // Prevent multiple submissions with detailed logging
    if (isSaving) {
      console.log('Save already in progress, preventing duplicate submission');
      return;
    }
    
    console.log('Starting job card save operation. Mode:', isEditing ? 'Edit' : 'Create');
    console.log('Current job card:', currentJobCard);
    
    // Validate the job card
    const validation = validateJobCard();
    if (!validation.isValid) {
      toast({
        title: "Validation Error",
        description: validation.errors.join(', '),
        variant: "destructive",
      });
      return;
    }
    
    setIsSaving(true);
    try {
      // Convert the JobCardPart[] to a Json compatible object
      const partsJson = currentJobCard.parts ? JSON.parse(JSON.stringify(currentJobCard.parts)) : [];
      const selectedServicesJson = currentJobCard.selectedServices ? JSON.parse(JSON.stringify(currentJobCard.selectedServices)) : [];

      // Convert the job card data to a format compatible with Supabase
      const jobCardData = {
        customer_name: currentJobCard.customer.name,
        customer_phone: currentJobCard.customer.phone,
        car_make: currentJobCard.car.make,
        car_model: currentJobCard.car.model,
        car_number: currentJobCard.car.plate,
        work_description: currentJobCard.description,
        status: currentJobCard.status,
        assigned_staff: currentJobCard.assignedStaff || null,
        labor_hours: currentJobCard.laborHours || 0,
        hourly_rate: currentJobCard.hourlyRate || 0,
        manual_labor_cost: currentJobCard.manualLaborCost || 0,
        estimated_completion_date: currentJobCard.estimatedCompletionDate,
        actual_completion_date: currentJobCard.actualCompletionDate,
        notes: currentJobCard.notes,
        parts: partsJson,
        job_date: currentJobCard.jobDate,
        gst_slab_id: currentJobCard.gstSlabId || null,
        selected_services: selectedServicesJson,
        garage_id: currentGarage.id // Ensure garage ID is set
      };

      let result;
      
      // Determine if we're updating or creating based on currentJobCard.id and isEditing flag
      if (isEditing && currentJobCard.id) {
        console.log('UPDATING existing job card with ID:', currentJobCard.id);
        const { data, error } = await supabase
          .from('job_cards')
          .update(jobCardData)
          .eq('id', currentJobCard.id)
          .eq('garage_id', currentGarage.id) // Enforce garage isolation
          .select('id')
          .single();
        
        if (error) {
          console.error('Update error:', error);
          throw error;
        }
        result = data;
        console.log('Job card updated successfully:', result);
      } else {
        console.log('CREATING new job card');
        const { data, error } = await supabase
          .from('job_cards')
          .insert([jobCardData])
          .select('id')
          .single();
        
        if (error) {
          console.error('Insert error:', error);
          throw error;
        }
        result = data;
        console.log('Job card created successfully:', result);
      }

      // CRITICAL: Update inventory quantities for parts when job card is saved (deduct stock)
      if (currentJobCard.parts && currentJobCard.parts.length > 0) {
        try {
          await updateInventoryQuantities(currentJobCard.parts, result.id);
          console.log('Inventory quantities updated successfully after job card save');
        } catch (error) {
          console.error('Failed to update inventory quantities:', error);
          // Don't throw here as the job card was saved successfully
          // But inform the user about the inventory update issue
          toast({
            title: "Warning",
            description: "Job card saved but inventory quantities could not be updated",
            variant: "destructive",
          });
        }
      }

      // Handle photo uploads
      if (photoFiles.length > 0 && result.id) {
        for (const photo of photoFiles) {
          const file = photo.file;
          if (file) {
            const fileExt = file.name.split('.').pop();
            const fileName = `${result.id}/${Date.now()}.${fileExt}`;
            const filePath = `job-cards/${fileName}`;
            
            try {
              await supabase.storage.from('job-cards').upload(filePath, file, {
                cacheControl: '3600',
                upsert: false
              });

              const { error: photoError } = await supabase
                .from('job_photos')
                .insert({
                  job_card_id: result.id,
                  url: filePath,
                  photo_type: photo.type,
                  file_name: file.name,
                  content_type: file.type,
                  size: file.size
                });

              if (photoError) {
                console.error("Error saving photo metadata:", photoError);
              }
            } catch (photoUploadError) {
              console.error("Error uploading photo:", photoUploadError);
            }
          }
        }
      }

      toast({
        title: isEditing ? "Job Card Updated" : "Job Card Created",
        description: isEditing 
          ? "Job card has been successfully updated and inventory quantities deducted." 
          : "Job card has been successfully created and inventory quantities deducted.",
      });

      // Clear photo files after successful save
      setPhotoFiles([]);
      
      // Navigate back to job cards list after successful save
      navigate('/job-cards');
      
    } catch (error) {
      console.error('Error saving job card:', error);
      toast({
        title: "Error",
        description: "Failed to save job card. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  }, [currentJobCard, isEditing, photoFiles, toast, updateInventoryQuantities, isSaving, navigate, validateJobCard, currentGarage?.id]);

  return {
    jobCards,
    selectedJobCardId,
    setSelectedJobCardId,
    selectedJobCard,
    isLoading,
    isSaving,
    isEditing,
    isCreating,
    photoFiles,
    setPhotoFiles,
    mileage,
    setMileage,
    advisorName,
    setAdvisorName,
    warrantyInfo,
    setWarrantyInfo,
    staffOptions,
    currentJobCard,
    setCurrentJobCard,
    handleInputChange,
    handleSelectChange,
    handleSaveJobCard,
    validateJobCard,
  };
};
