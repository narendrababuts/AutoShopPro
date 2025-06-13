
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useGarage } from '@/contexts/GarageContext';
import { useOptimizedJobCards } from '@/hooks/useOptimizedJobCards';

// Helper function to calculate total job amount from job card data
const calculateJobTotal = (job: any): number => {
  let totalAmount = 0;
  
  console.log('Calculating job total for job:', job.id, job);
  
  // First, check if there's already a calculated total in the job
  if (job.total_price && Number(job.total_price) > 0) {
    console.log('Using existing total_price:', job.total_price);
    return Number(job.total_price);
  }
  
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
      console.log('Service cost:', service.service_name || service.serviceName, serviceCost);
    });
  }
  
  console.log('Total calculated amount:', totalAmount);
  return totalAmount;
};

export const useDashboardMetrics = () => {
  const { currentGarage } = useGarage();
  
  // Use optimized hook to get recent job cards
  const { data: recentJobCards, isLoading: jobCardsLoading } = useOptimizedJobCards({
    limit: 100,
  });

  // Fetch TODAY'S completed jobs with revenue calculation
  const { data: todayJobsData, isLoading: todayJobsLoading } = useQuery({
    queryKey: ['today_completed_jobs', currentGarage?.id],
    queryFn: async () => {
      if (!currentGarage?.id) return { todayCompleted: 0, todayRevenue: 0 };
      
      const today = new Date();
      const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
      
      console.log('Fetching today\'s completed jobs for garage:', currentGarage.id);
      console.log('Date range:', startOfToday.toISOString(), 'to', endOfToday.toISOString());
      
      // Get today's completed jobs - use both actual_completion_date and created_at for filtering
      const { data, error } = await supabase
        .from('job_cards')
        .select('*')
        .eq('garage_id', currentGarage.id)
        .eq('status', 'Completed')
        .or(`actual_completion_date.gte.${startOfToday.toISOString()},and(actual_completion_date.is.null,created_at.gte.${startOfToday.toISOString()})`)
        .or(`actual_completion_date.lt.${endOfToday.toISOString()},and(actual_completion_date.is.null,created_at.lt.${endOfToday.toISOString()})`);
      
      if (error) {
        console.error('Error fetching today\'s completed jobs:', error);
        throw error;
      }
      
      console.log('Today\'s completed jobs raw data:', data);
      
      // Calculate today's revenue from completed jobs
      const todayRevenue = (data || []).reduce((sum, job) => {
        const jobTotal = calculateJobTotal(job);
        console.log('Job', job.id, 'contributes:', jobTotal);
        return sum + jobTotal;
      }, 0);
      
      console.log('Today completed jobs count:', (data || []).length);
      console.log('Today revenue calculated:', todayRevenue);
      
      return { 
        todayCompleted: (data || []).length,
        todayRevenue: todayRevenue
      };
    },
    enabled: !!currentGarage?.id,
    staleTime: 0,
    refetchInterval: 5 * 1000,
  });

  // Fetch MONTHLY data
  const { data: monthlyData, isLoading: monthlyLoading } = useQuery({
    queryKey: ['monthly_stats', currentGarage?.id],
    queryFn: async () => {
      if (!currentGarage?.id) return { monthlyRevenue: 0, monthlyCompleted: 0 };
      
      const today = new Date();
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      
      console.log('Fetching monthly data for garage:', currentGarage.id);
      console.log('Month start:', startOfMonth.toISOString());
      
      // Get monthly completed jobs
      const { data, error } = await supabase
        .from('job_cards')
        .select('*')
        .eq('garage_id', currentGarage.id)
        .eq('status', 'Completed')
        .or(`actual_completion_date.gte.${startOfMonth.toISOString()},and(actual_completion_date.is.null,created_at.gte.${startOfMonth.toISOString()})`);
      
      if (error) {
        console.error('Error fetching monthly data:', error);
        throw error;
      }
      
      console.log('Monthly completed jobs raw data:', data);
      
      // Calculate monthly revenue
      const monthlyRevenue = (data || []).reduce((sum, job) => {
        const jobTotal = calculateJobTotal(job);
        return sum + jobTotal;
      }, 0);
      
      console.log('Monthly completed jobs count:', (data || []).length);
      console.log('Monthly revenue calculated:', monthlyRevenue);
      
      return { 
        monthlyRevenue: monthlyRevenue,
        monthlyCompleted: (data || []).length
      };
    },
    enabled: !!currentGarage?.id,
    staleTime: 0,
    refetchInterval: 30 * 1000,
  });

  // Get average repair time calculation
  const { data: avgRepairData, isLoading: avgRepairLoading } = useQuery({
    queryKey: ['avg_repair_time', currentGarage?.id],
    queryFn: async () => {
      if (!currentGarage?.id) return { avgDays: 0 };
      
      const { data, error } = await supabase
        .from('job_cards')
        .select('created_at, actual_completion_date')
        .eq('garage_id', currentGarage.id)
        .eq('status', 'Completed')
        .not('actual_completion_date', 'is', null)
        .limit(20)
        .order('actual_completion_date', { ascending: false });
      
      if (error) {
        console.error('Error fetching avg repair time:', error);
        throw error;
      }
      
      if (!data || data.length === 0) return { avgDays: 0 };
      
      const totalDays = data.reduce((sum, job) => {
        const start = new Date(job.created_at);
        const end = new Date(job.actual_completion_date);
        const diffDays = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
        return sum + Math.max(0, diffDays);
      }, 0);
      
      const avgDays = totalDays / data.length;
      return { avgDays: Math.round(avgDays * 10) / 10 };
    },
    enabled: !!currentGarage?.id,
    staleTime: 5 * 60 * 1000,
  });

  // Calculate metrics using LIVE data
  const metrics = useMemo(() => {
    if (!currentGarage?.id) {
      return {
        todayRevenue: 0,
        monthlyRevenue: 0,
        todayCompletedJobs: 0,
        completedJobs: 0,
        activeJobs: 0,
        avgRepairTime: "0 days"
      };
    }

    // Count active jobs from recent job cards
    const activeJobs = recentJobCards?.data ? recentJobCards.data.filter(job => 
      ['In Progress', 'Pending', 'Parts Ordered'].includes(job.status)
    ).length : 0;

    const result = {
      todayRevenue: todayJobsData?.todayRevenue || 0,
      monthlyRevenue: monthlyData?.monthlyRevenue || 0,
      todayCompletedJobs: todayJobsData?.todayCompleted || 0,
      completedJobs: monthlyData?.monthlyCompleted || 0,
      activeJobs,
      avgRepairTime: avgRepairData ? `${avgRepairData.avgDays} days` : "0 days"
    };

    console.log('Final dashboard metrics:', result);
    return result;
  }, [recentJobCards?.data, todayJobsData, monthlyData, avgRepairData, currentGarage?.id]);

  const isMetricsLoading = jobCardsLoading || todayJobsLoading || monthlyLoading || avgRepairLoading;

  return {
    metrics,
    isMetricsLoading
  };
};
