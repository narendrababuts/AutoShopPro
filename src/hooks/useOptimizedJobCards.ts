import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { JobCard, toAppJobCard } from '@/types/jobCard';
import { useGarage } from '@/contexts/GarageContext';
import { useEffect, useRef } from 'react';

type JobStatus = 'Pending' | 'In Progress' | 'Parts Ordered' | 'Ready for Pickup' | 'Completed';

interface UseJobCardsOptions {
  limit?: number;
  offset?: number;
  status?: JobStatus;
  enabled?: boolean;
}

// Helper function to calculate total job amount
const calculateJobTotal = (job: any): number => {
  let totalAmount = 0;
  
  console.log('Calculating job total for job:', job.id, job);
  
  // Add manual labor cost
  if (job.manual_labor_cost) {
    const manualCost = Number(job.manual_labor_cost);
    totalAmount += manualCost;
    console.log('Manual labor cost:', manualCost);
  }
  
  // Add parts cost
  if (job.parts && Array.isArray(job.parts)) {
    job.parts.forEach((part: any) => {
      const partTotal = Number(part.quantity || 0) * Number(part.unitPrice || part.unit_price || 0);
      totalAmount += partTotal;
      console.log('Part cost:', part.name, partTotal);
    });
  }
  
  // Add labor cost (hours * rate)
  if (job.labor_hours && job.hourly_rate) {
    const laborCost = Number(job.labor_hours) * Number(job.hourly_rate);
    totalAmount += laborCost;
    console.log('Labor cost (hours * rate):', laborCost);
  }
  
  // Add services cost
  if (job.selected_services && Array.isArray(job.selected_services)) {
    job.selected_services.forEach((service: any) => {
      const serviceCost = Number(service.price || 0);
      totalAmount += serviceCost;
      console.log('Service cost:', service.service_name, serviceCost);
    });
  }
  
  console.log('Total calculated amount:', totalAmount);
  return totalAmount;
};

// Function to create revenue entry for completed job
const createRevenueEntry = async (job: any, garageId: string) => {
  console.log('Creating revenue entry for job:', job.id);
  
  const totalAmount = calculateJobTotal(job);
  
  if (totalAmount <= 0) {
    console.log('No revenue to record - total amount is 0 or negative:', totalAmount);
    return;
  }
  
  // Check if revenue entry already exists for this job
  const { data: existingRevenue, error: checkError } = await supabase
    .from('accounts')
    .select('id')
    .eq('garage_id', garageId)
    .ilike('description', `%job card ${job.id}%`)
    .eq('type', 'income');
  
  if (checkError) {
    console.error('Error checking existing revenue:', checkError);
    return;
  }
  
  if (existingRevenue && existingRevenue.length > 0) {
    console.log('Revenue entry already exists for this job');
    return;
  }
  
  // Create revenue entry
  const { error: accountError } = await supabase
    .from('accounts')
    .insert({
      garage_id: garageId,
      type: 'income',
      amount: totalAmount,
      date: new Date().toISOString(),
      description: `Revenue from job card ${job.id} - ${job.customer_name}`
    });
  
  if (accountError) {
    console.error('Error creating revenue entry:', accountError);
  } else {
    console.log('Revenue entry created successfully for amount:', totalAmount);
  }
};

export const useOptimizedJobCards = (options: UseJobCardsOptions = {}) => {
  const { limit = 20, offset = 0, status, enabled = true } = options;
  const { currentGarage } = useGarage();
  const queryClient = useQueryClient();
  const channelRef = useRef<any>(null);

  // Set up real-time subscription for job cards
  useEffect(() => {
    if (!currentGarage?.id || !enabled) return;

    // Clean up any existing channel first
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    console.log('Setting up real-time subscription for job cards:', currentGarage.id);

    // Create a truly unique channel name with random component
    const uniqueId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const channelName = `job-cards-optimized-${currentGarage.id}-${uniqueId}`;
    
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'job_cards',
          filter: `garage_id=eq.${currentGarage.id}`
        },
        async (payload) => {
          console.log('Job cards real-time update:', payload);
          
          // Handle job completion for revenue recording
          if (payload.eventType === 'UPDATE' && payload.new?.status === 'Completed') {
            console.log('Job completed, creating revenue entry:', payload.new.id);
            await createRevenueEntry(payload.new, currentGarage.id);
          }
          
          // Immediately invalidate and refetch job cards queries
          await queryClient.invalidateQueries({ 
            queryKey: ['job_cards', currentGarage.id],
            refetchType: 'active'
          });
          
          // Also invalidate any paginated queries
          await queryClient.invalidateQueries({ 
            queryKey: ['job_cards'],
            refetchType: 'active'
          });
          
          // Invalidate all related queries for immediate dashboard updates
          await Promise.all([
            queryClient.invalidateQueries({ queryKey: ['dashboard_accounts', currentGarage.id], refetchType: 'active' }),
            queryClient.invalidateQueries({ queryKey: ['invoices', currentGarage.id], refetchType: 'active' }),
            queryClient.invalidateQueries({ queryKey: ['accounts', currentGarage.id], refetchType: 'active' }),
            queryClient.invalidateQueries({ queryKey: ['dashboard_stats', currentGarage.id], refetchType: 'active' })
          ]);
        }
      )
      .subscribe();

    // Store channel reference for cleanup
    channelRef.current = channel;

    return () => {
      console.log('Cleaning up job cards subscription');
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [currentGarage?.id, queryClient, enabled]);

  return useQuery({
    queryKey: ['job_cards', currentGarage?.id, status, limit, offset],
    queryFn: async (): Promise<{ data: JobCard[]; count: number }> => {
      if (!currentGarage?.id) {
        console.log('No garage selected, returning empty job cards');
        return { data: [], count: 0 };
      }

      console.log('Fetching job cards for garage ONLY:', currentGarage.id);

      let query = supabase
        .from('job_cards')
        .select('*', { count: 'exact' })
        .eq('garage_id', currentGarage.id)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error, count } = await query;

      if (error) {
        console.error('Error fetching job cards:', error);
        throw error;
      }

      // DOUBLE CHECK: Verify all returned items belong to current garage
      const filteredData = (data || []).filter(card => card.garage_id === currentGarage.id);
      
      if (filteredData.length !== (data || []).length) {
        console.warn('Data leak detected in job cards query! Some cards did not belong to current garage');
      }

      const formattedJobCards = filteredData.map(jobCard => toAppJobCard(jobCard));

      console.log('Fetched', formattedJobCards.length, 'job cards for garage', currentGarage.id);

      return {
        data: formattedJobCards,
        count: count || 0
      };
    },
    enabled: enabled && !!currentGarage?.id,
    staleTime: 0, // Always consider data stale to ensure fresh fetches
    gcTime: 30 * 1000, // Keep in cache for 30 seconds
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });
};

export const usePaginatedCompletedJobs = (page: number, limit: number = 30) => {
  const { currentGarage } = useGarage();
  const queryClient = useQueryClient();
  const offset = (page - 1) * limit;
  const channelRef = useRef<any>(null);

  // Set up real-time subscription for completed jobs
  useEffect(() => {
    if (!currentGarage?.id) return;

    // Clean up any existing channel first
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    // Create a truly unique channel name
    const uniqueId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const channelName = `completed-jobs-${currentGarage.id}-${uniqueId}`;
    
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'job_cards',
          filter: `garage_id=eq.${currentGarage.id}`
        },
        async (payload) => {
          console.log('Completed jobs real-time update:', payload);
          await queryClient.invalidateQueries({ 
            queryKey: ['completed_jobs', currentGarage.id],
            refetchType: 'active'
          });
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [currentGarage?.id, queryClient]);

  return useQuery({
    queryKey: ['completed_jobs', currentGarage?.id, page, limit],
    queryFn: async () => {
      if (!currentGarage?.id) {
        console.log('No garage selected, returning empty completed jobs');
        return { data: [], count: 0, hasMore: false };
      }

      console.log('Fetching completed jobs for garage ONLY:', currentGarage.id);

      const { data, error, count } = await supabase
        .from('job_cards')
        .select('*', { count: 'exact' })
        .eq('garage_id', currentGarage.id)
        .eq('status', 'Completed' as JobStatus)
        .order('actual_completion_date', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Error fetching completed jobs:', error);
        throw error;
      }

      // DOUBLE CHECK: Verify all returned items belong to current garage
      const filteredData = (data || []).filter(card => card.garage_id === currentGarage.id);
      
      if (filteredData.length !== (data || []).length) {
        console.warn('Data leak detected in completed jobs query! Some jobs did not belong to current garage');
      }

      const formattedJobCards = filteredData.map(jobCard => toAppJobCard(jobCard));

      console.log('Fetched', formattedJobCards.length, 'completed jobs for garage', currentGarage.id);

      return {
        data: formattedJobCards,
        count: count || 0,
        hasMore: (count || 0) > offset + limit
      };
    },
    enabled: !!currentGarage?.id,
    staleTime: 0, // Always fresh data
    gcTime: 30 * 1000,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });
};
