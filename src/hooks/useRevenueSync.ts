
import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useGarage } from '@/contexts/GarageContext';

// Helper function to calculate total job amount
const calculateJobTotal = (job: any): number => {
  let totalAmount = 0;
  
  // Add manual labor cost
  if (job.manual_labor_cost) {
    totalAmount += Number(job.manual_labor_cost);
  }
  
  // Add parts cost
  if (job.parts && Array.isArray(job.parts)) {
    job.parts.forEach((part: any) => {
      const partTotal = Number(part.quantity || 0) * Number(part.unitPrice || part.unit_price || 0);
      totalAmount += partTotal;
    });
  }
  
  // Add labor cost (hours * rate)
  if (job.labor_hours && job.hourly_rate) {
    totalAmount += Number(job.labor_hours) * Number(job.hourly_rate);
  }
  
  // Add services cost
  if (job.selected_services && Array.isArray(job.selected_services)) {
    job.selected_services.forEach((service: any) => {
      totalAmount += Number(service.price || 0);
    });
  }
  
  return totalAmount;
};

export const useRevenueSync = () => {
  const { currentGarage } = useGarage();
  const queryClient = useQueryClient();

  const { data: syncResult } = useQuery({
    queryKey: ['revenue_sync', currentGarage?.id],
    queryFn: async () => {
      if (!currentGarage?.id) return { synced: 0 };

      console.log('Syncing revenue for completed jobs...');

      // Get all completed jobs
      const { data: completedJobs, error: jobsError } = await supabase
        .from('job_cards')
        .select('*')
        .eq('garage_id', currentGarage.id)
        .eq('status', 'Completed');

      if (jobsError) {
        console.error('Error fetching completed jobs:', jobsError);
        throw jobsError;
      }

      if (!completedJobs || completedJobs.length === 0) {
        console.log('No completed jobs found');
        return { synced: 0 };
      }

      let syncedCount = 0;

      // Check each completed job for revenue entry
      for (const job of completedJobs) {
        const totalAmount = calculateJobTotal(job);
        
        if (totalAmount <= 0) continue;

        // Check if revenue entry already exists
        const { data: existingRevenue } = await supabase
          .from('accounts')
          .select('id')
          .eq('garage_id', currentGarage.id)
          .ilike('description', `%job card ${job.id}%`)
          .eq('type', 'income');

        if (!existingRevenue || existingRevenue.length === 0) {
          // Create missing revenue entry
          const { error: createError } = await supabase
            .from('accounts')
            .insert({
              garage_id: currentGarage.id,
              type: 'income',
              amount: totalAmount,
              date: job.actual_completion_date || job.created_at,
              description: `Revenue from job card ${job.id} - ${job.customer_name}`
            });

          if (!createError) {
            console.log('Created missing revenue entry for job:', job.id, 'amount:', totalAmount);
            syncedCount++;
          } else {
            console.error('Error creating revenue entry for job:', job.id, createError);
          }
        }
      }

      console.log('Revenue sync completed, created', syncedCount, 'revenue entries');
      
      // Invalidate dashboard queries to refresh data
      if (syncedCount > 0) {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['dashboard_accounts', currentGarage.id] }),
          queryClient.invalidateQueries({ queryKey: ['accounts', currentGarage.id] }),
          queryClient.invalidateQueries({ queryKey: ['dashboard_stats', currentGarage.id] })
        ]);
      }

      return { synced: syncedCount };
    },
    enabled: !!currentGarage?.id,
    staleTime: 5 * 60 * 1000, // Run sync every 5 minutes max
  });

  return syncResult;
};
