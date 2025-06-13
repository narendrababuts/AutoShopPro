
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { GarageService, GarageServiceFormData } from '@/types/garageServices';
import { useToast } from '@/hooks/use-toast';
import { useGarage } from '@/contexts/GarageContext';

export const useGarageServices = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { currentGarage } = useGarage();

  const {
    data: services = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['garage-services', currentGarage?.id],
    queryFn: async (): Promise<GarageService[]> => {
      if (!currentGarage?.id) {
        console.log('No garage selected, returning empty services');
        return [];
      }

      console.log('Fetching garage services for garage ONLY:', currentGarage.id);

      const { data, error } = await supabase
        .from('garage_services')
        .select('*')
        .eq('garage_id', currentGarage.id) // STRICT: Only current garage's services
        .eq('is_active', true)
        .order('service_name');

      if (error) {
        console.error('Error fetching garage services:', error);
        throw error;
      }

      // DOUBLE CHECK: Verify all returned services belong to current garage
      const filteredData = (data || []).filter(service => service.garage_id === currentGarage.id);
      
      if (filteredData.length !== (data || []).length) {
        console.warn('SECURITY ALERT: Data leak detected in garage services query! Some services did not belong to current garage');
        console.warn('Raw data length:', (data || []).length, 'Filtered length:', filteredData.length);
      }

      console.log('Fetched', filteredData.length, 'garage services for garage', currentGarage.id);
      return filteredData || [];
    },
    enabled: !!currentGarage?.id,
    staleTime: 0, // Always fetch fresh data for garage services
    gcTime: 1000, // Keep in cache for 1 second only to ensure fresh data
  });

  const createService = useMutation({
    mutationFn: async (serviceData: GarageServiceFormData) => {
      if (!currentGarage?.id) {
        throw new Error('No garage selected');
      }

      const serviceWithGarage = {
        ...serviceData,
        garage_id: currentGarage.id // Ensure garage ID is set
      };

      const { data, error } = await supabase
        .from('garage_services')
        .insert(serviceWithGarage)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['garage-services', currentGarage?.id] });
      toast({
        title: 'Success',
        description: 'Garage service created successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: 'Failed to create garage service.',
        variant: 'destructive',
      });
      console.error('Error creating garage service:', error);
    },
  });

  const updateService = useMutation({
    mutationFn: async ({ id, ...serviceData }: Partial<GarageService>) => {
      if (!currentGarage?.id) {
        throw new Error('No garage selected');
      }

      const { data, error } = await supabase
        .from('garage_services')
        .update(serviceData)
        .eq('id', id)
        .eq('garage_id', currentGarage.id) // Ensure only updating services from current garage
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['garage-services', currentGarage?.id] });
      toast({
        title: 'Success',
        description: 'Garage service updated successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: 'Failed to update garage service.',
        variant: 'destructive',
      });
      console.error('Error updating garage service:', error);
    },
  });

  const deleteService = useMutation({
    mutationFn: async (id: string) => {
      if (!currentGarage?.id) {
        throw new Error('No garage selected');
      }

      const { error } = await supabase
        .from('garage_services')
        .delete()
        .eq('id', id)
        .eq('garage_id', currentGarage.id); // Ensure only deleting services from current garage

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['garage-services', currentGarage?.id] });
      toast({
        title: 'Success',
        description: 'Garage service deleted successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: 'Failed to delete garage service.',
        variant: 'destructive',
      });
      console.error('Error deleting garage service:', error);
    },
  });

  return {
    services,
    isLoading,
    error,
    refetch,
    createService,
    updateService,
    deleteService,
  };
};
