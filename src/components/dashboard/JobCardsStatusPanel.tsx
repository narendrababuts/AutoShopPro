import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { 
  Play, 
  CheckCircle, 
  Pause, 
  Clock, 
  User, 
  Car,
  Calendar
} from 'lucide-react';
import { useOptimizedJobCards } from '@/hooks/useOptimizedJobCards';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useGarage } from '@/contexts/GarageContext';
import { useQueryClient } from '@tanstack/react-query';
import { formatIndianCurrency } from '@/lib/utils';

type JobStatus = 'Pending' | 'In Progress' | 'Parts Ordered' | 'Ready for Pickup' | 'Completed';

interface JobCardStatusItem {
  id: string;
  customer: {
    name: string;
    phone: string;
  };
  car: {
    make: string;
    model: string;
    plate: string;
  };
  description: string;
  assignedStaff: string;
  status: JobStatus;
  date: string;
  estimatedCompletionDate: string | null;
}

// Helper function to calculate total job amount
const calculateJobTotal = (job: any): number => {
  let totalAmount = 0;
  
  console.log('Calculating job total for completion:', job);
  
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
  
  console.log('Total calculated for job completion:', totalAmount);
  return totalAmount;
};

const JobCardsStatusPanel = () => {
  const [activeTab, setActiveTab] = useState('all');
  const { toast } = useToast();
  const { currentGarage } = useGarage();
  const queryClient = useQueryClient();

  // Fetch job cards with optimized hook
  const { data: allJobCards, isLoading, refetch } = useOptimizedJobCards({
    limit: 100,
    enabled: !!currentGarage?.id,
  });

  const jobCards = allJobCards?.data || [];

  // Filter job cards by status
  const pendingJobs = jobCards.filter(job => job.status === 'Pending');
  const processingJobs = jobCards.filter(job => job.status === 'In Progress');
  const partsOrderedJobs = jobCards.filter(job => job.status === 'Parts Ordered');
  const readyJobs = jobCards.filter(job => job.status === 'Ready for Pickup');
  const completedJobs = jobCards.filter(job => job.status === 'Completed');

  // Handle status transitions
  const handleStatusTransition = useCallback(async (jobId: string, newStatus: JobStatus) => {
    if (!currentGarage?.id) return;

    try {
      console.log('Updating job status:', jobId, 'to', newStatus);

      // First get the current job data
      const { data: currentJob, error: fetchError } = await supabase
        .from('job_cards')
        .select('*')
        .eq('id', jobId)
        .eq('garage_id', currentGarage.id)
        .single();

      if (fetchError) {
        console.error('Error fetching current job:', fetchError);
        throw fetchError;
      }

      const updateData: any = { 
        status: newStatus,
      };

      // Set completion date if moving to completed
      if (newStatus === 'Completed') {
        updateData.actual_completion_date = new Date().toISOString();
      }

      const { error } = await supabase
        .from('job_cards')
        .update(updateData)
        .eq('id', jobId)
        .eq('garage_id', currentGarage.id); // Ensure garage isolation

      if (error) throw error;

      console.log('Job status updated successfully');

      // If job completed, create revenue entry immediately
      if (newStatus === 'Completed') {
        const totalAmount = calculateJobTotal(currentJob);
        
        if (totalAmount > 0) {
          console.log('Creating revenue entry for completed job:', jobId, 'amount:', totalAmount);
          
          // Check if revenue entry already exists
          const { data: existingRevenue } = await supabase
            .from('accounts')
            .select('id')
            .eq('garage_id', currentGarage.id)
            .ilike('description', `%job card ${jobId}%`)
            .eq('type', 'income');
          
          if (!existingRevenue || existingRevenue.length === 0) {
            const { error: accountError } = await supabase
              .from('accounts')
              .insert({
                garage_id: currentGarage.id,
                type: 'income',
                amount: totalAmount,
                date: new Date().toISOString(),
                description: `Revenue from job card ${jobId} - ${currentJob.customer_name}`
              });
            
            if (accountError) {
              console.error('Error creating revenue entry:', accountError);
            } else {
              console.log('Revenue entry created successfully for amount:', totalAmount);
              
              // Show success message with amount
              toast({
                title: "Job Completed & Revenue Recorded",
                description: `Job completed successfully. Revenue of ${formatIndianCurrency(totalAmount)} has been recorded.`,
              });
            }
          }
        } else {
          console.log('Job completed but no revenue to record (amount is 0)');
          toast({
            title: "Job Completed",
            description: "Job completed successfully (no revenue amount calculated).",
          });
        }
      } else {
        toast({
          title: "Status Updated",
          description: `Job card moved to ${newStatus}`,
        });
      }

      // Force immediate query invalidation for instant UI updates
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['job_cards', currentGarage.id] }),
        queryClient.invalidateQueries({ queryKey: ['dashboard_stats', currentGarage.id] }),
        queryClient.invalidateQueries({ queryKey: ['dashboard_accounts', currentGarage.id] }),
        queryClient.invalidateQueries({ queryKey: ['accounts', currentGarage.id] })
      ]);
      
      // If job completed, also invalidate revenue-related queries
      if (newStatus === 'Completed') {
        await queryClient.invalidateQueries({ queryKey: ['invoices', currentGarage.id] });
        console.log('Job completed, invalidated all revenue queries');
      }

    } catch (error) {
      console.error('Error updating job status:', error);
      toast({
        title: "Error",
        description: "Failed to update job status",
        variant: "destructive",
      });
    }
  }, [currentGarage?.id, queryClient, toast]);

  const JobCardItem = ({ job }: { job: JobCardStatusItem }) => (
    <div className="bg-white p-3 mb-2 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1">
          <h4 className="font-medium text-sm text-gray-900 truncate">
            {job.customer.name}
          </h4>
          <div className="flex items-center text-xs text-gray-600 mt-1">
            <Car className="h-3 w-3 mr-1" />
            <span className="truncate">{job.car.make} {job.car.model} - {job.car.plate}</span>
          </div>
          <div className="flex items-center text-xs text-gray-500 mt-1">
            <Calendar className="h-3 w-3 mr-1" />
            <span>{job.date}</span>
          </div>
        </div>
        <Badge 
          variant={
            job.status === 'Completed' ? 'default' :
            job.status === 'In Progress' ? 'secondary' :
            'outline'
          }
          className="text-xs"
        >
          {job.status}
        </Badge>
      </div>
      
      <p className="text-xs text-gray-600 mb-2 line-clamp-2">{job.description}</p>
      
      {job.assignedStaff && (
        <div className="flex items-center text-xs text-gray-500 mb-2">
          <User className="h-3 w-3 mr-1" />
          <span>{job.assignedStaff}</span>
        </div>
      )}

      {/* Action buttons based on status */}
      <div className="flex gap-1 mt-2">
        {job.status === 'Pending' && (
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs"
            onClick={() => handleStatusTransition(job.id, 'In Progress')}
          >
            <Play className="h-3 w-3 mr-1" />
            Start
          </Button>
        )}
        
        {job.status === 'In Progress' && (
          <>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs"
              onClick={() => handleStatusTransition(job.id, 'Parts Ordered')}
            >
              <Pause className="h-3 w-3 mr-1" />
              Parts Needed
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs"
              onClick={() => handleStatusTransition(job.id, 'Ready for Pickup')}
            >
              <CheckCircle className="h-3 w-3 mr-1" />
              Ready
            </Button>
          </>
        )}

        {job.status === 'Parts Ordered' && (
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs"
            onClick={() => handleStatusTransition(job.id, 'In Progress')}
          >
            <Play className="h-3 w-3 mr-1" />
            Resume
          </Button>
        )}

        {job.status === 'Ready for Pickup' && (
          <Button
            size="sm"
            variant="default"
            className="h-7 text-xs"
            onClick={() => handleStatusTransition(job.id, 'Completed')}
          >
            <CheckCircle className="h-3 w-3 mr-1" />
            Complete
          </Button>
        )}
      </div>
    </div>
  );

  const StatusColumn = ({ title, jobs, icon }: { title: string; jobs: JobCardStatusItem[]; icon: React.ReactNode }) => (
    <div className="flex-1 min-w-[280px]">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          {icon}
          <h3 className="font-medium text-gray-900 ml-2">{title}</h3>
        </div>
        <Badge variant="outline" className="text-xs">
          {jobs.length}
        </Badge>
      </div>
      <div className="max-h-[400px] overflow-y-auto space-y-2">
        {jobs.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No {title.toLowerCase()} jobs</p>
          </div>
        ) : (
          jobs.map(job => <JobCardItem key={job.id} job={job} />)
        )}
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Job Cards Status</CardTitle>
          <CardDescription>Track job progress across different stages</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Job Cards Status</CardTitle>
        <CardDescription>
          Track and manage job progress across different stages
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="all">All ({jobCards.length})</TabsTrigger>
            <TabsTrigger value="pending">Pending ({pendingJobs.length})</TabsTrigger>
            <TabsTrigger value="processing">Processing ({processingJobs.length})</TabsTrigger>
            <TabsTrigger value="completed">Completed ({completedJobs.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-0">
            <div className="flex gap-4 overflow-x-auto pb-4">
              <StatusColumn
                title="Pending"
                jobs={pendingJobs}
                icon={<Clock className="h-4 w-4 text-blue-500" />}
              />
              <StatusColumn
                title="In Progress"
                jobs={processingJobs}
                icon={<Play className="h-4 w-4 text-yellow-500" />}
              />
              <StatusColumn
                title="Parts Ordered"
                jobs={partsOrderedJobs}
                icon={<Pause className="h-4 w-4 text-orange-500" />}
              />
              <StatusColumn
                title="Ready for Pickup"
                jobs={readyJobs}
                icon={<CheckCircle className="h-4 w-4 text-purple-500" />}
              />
              <StatusColumn
                title="Completed"
                jobs={completedJobs}
                icon={<CheckCircle className="h-4 w-4 text-green-500" />}
              />
            </div>
          </TabsContent>

          <TabsContent value="pending" className="mt-0">
            <StatusColumn
              title="Pending Jobs"
              jobs={pendingJobs}
              icon={<Clock className="h-4 w-4 text-blue-500" />}
            />
          </TabsContent>

          <TabsContent value="processing" className="mt-0">
            <div className="flex gap-4 overflow-x-auto pb-4">
              <StatusColumn
                title="In Progress"
                jobs={processingJobs}
                icon={<Play className="h-4 w-4 text-yellow-500" />}
              />
              <StatusColumn
                title="Parts Ordered"
                jobs={partsOrderedJobs}
                icon={<Pause className="h-4 w-4 text-orange-500" />}
              />
              <StatusColumn
                title="Ready for Pickup"
                jobs={readyJobs}
                icon={<CheckCircle className="h-4 w-4 text-purple-500" />}
              />
            </div>
          </TabsContent>

          <TabsContent value="completed" className="mt-0">
            <StatusColumn
              title="Completed Jobs"
              jobs={completedJobs}
              icon={<CheckCircle className="h-4 w-4 text-green-500" />}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default JobCardsStatusPanel;
