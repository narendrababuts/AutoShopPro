
import React, { useState, useEffect } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { useDroppable } from '@dnd-kit/core';
import { DndContext, DragEndEvent } from '@dnd-kit/core';
import { supabase } from '@/integrations/supabase/client';
import { ClipboardList } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import CompletedJobsColumn from './CompletedJobsColumn';
import { useGarage } from '@/contexts/GarageContext';

interface JobCardItem {
  id: string;
  customer_name: string;
  vehicle_info: string;
  service_type: string;
  status: 'Pending' | 'In Progress' | 'Completed' | 'Parts Ordered' | 'Ready for Pickup';
}

interface ColumnProps {
  title: string;
  status: JobCardItem['status'];
  jobCards: JobCardItem[];
}

const JobCard = ({ id, customer_name, vehicle_info, service_type, status }: JobCardItem) => {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id,
    data: { status }
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    zIndex: 10
  } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="bg-white p-3 mb-2 rounded-md border border-gray-200 shadow-sm cursor-move hover:shadow-md transition-shadow"
    >
      <h4 className="font-medium text-sm text-gray-900">{customer_name}</h4>
      <p className="text-xs text-gray-600">{vehicle_info}</p>
      <p className="text-xs text-gray-500">{service_type}</p>
    </div>
  );
};

const Column = ({ title, status, jobCards }: ColumnProps) => {
  const { isOver, setNodeRef } = useDroppable({
    id: status,
  });

  return (
    <div className="flex-1 min-w-[200px]">
      <div className="mb-3 font-medium flex items-center text-gray-900">
        <div className={cn(
          "w-6 h-6 rounded-full flex items-center justify-center text-xs mr-2 font-semibold",
          status === 'Pending' && "bg-blue-100 text-blue-700",
          status === 'In Progress' && "bg-yellow-100 text-yellow-700",
          status === 'Parts Ordered' && "bg-orange-100 text-orange-700",
          status === 'Ready for Pickup' && "bg-purple-100 text-purple-700",
        )}>
          {jobCards.length}
        </div>
        {title}
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          "bg-gray-50 rounded-md p-3 min-h-[200px] border border-gray-200",
          isOver && "bg-blue-50 ring-2 ring-blue-300"
        )}
      >
        {jobCards.map(job => (
          <JobCard key={job.id} {...job} />
        ))}
        {jobCards.length === 0 && (
          <div className="h-full w-full flex items-center justify-center text-gray-500">
            <p className="text-xs">No job cards</p>
          </div>
        )}
      </div>
    </div>
  );
};

const JobPipeline = () => {
  const [jobs, setJobs] = useState<JobCardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { currentGarage } = useGarage();

  useEffect(() => {
    const fetchJobs = async () => {
      if (!currentGarage?.id) {
        setJobs([]);
        setLoading(false);
        return;
      }

      try {
        // Only fetch non-completed jobs for regular columns, with strict garage isolation
        const { data, error } = await supabase
          .from('job_cards')
          .select('id, customer_name, customer_phone, car_make, car_model, car_number, work_description, status')
          .eq('garage_id', currentGarage.id) // Enforce garage isolation
          .neq('status', 'Completed') // Exclude completed jobs from main query
          .order('created_at', { ascending: false });

        if (error) throw error;
        
        const formattedJobs = data?.map(jobCard => ({
          id: jobCard.id,
          customer_name: jobCard.customer_name,
          vehicle_info: `${jobCard.car_make} ${jobCard.car_model} - ${jobCard.car_number}`,
          service_type: jobCard.work_description,
          status: jobCard.status as JobCardItem['status']
        })) || [];
        
        setJobs(formattedJobs);
      } catch (error) {
        console.error('Error fetching job cards:', error);
        toast({
          title: "Error",
          description: "Failed to load job pipeline",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();

    if (!currentGarage?.id) return;

    // Set up real-time subscription for non-completed jobs with garage isolation
    const channel = supabase
      .channel('job-cards-pipeline')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'job_cards', filter: `garage_id=eq.${currentGarage.id}` },
        (payload) => {
          // Refetch data when job cards change
          fetchJobs();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [toast, currentGarage?.id]);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || !currentGarage?.id) return;
    
    const jobId = active.id as string;
    const newStatus = over.id as JobCardItem['status'];
    const oldStatus = (active.data.current as any)?.status;
    
    if (oldStatus === newStatus) return;
    
    try {
      // Optimistic UI update
      setJobs(prevJobs => prevJobs.map(job => 
        job.id === jobId ? { ...job, status: newStatus } : job
      ));
      
      // Update in database with garage isolation
      const { error } = await supabase
        .from('job_cards')
        .update({ 
          status: newStatus,
          // Set completion date if moving to completed
          ...(newStatus === 'Completed' ? { actual_completion_date: new Date().toISOString() } : {})
        })
        .eq('id', jobId)
        .eq('garage_id', currentGarage.id); // Ensure garage isolation
        
      if (error) throw error;
      
      toast({
        title: "Status Updated",
        description: `Job card moved to ${newStatus}`,
      });
      
      // If moved to completed, remove from current jobs list
      if (newStatus === 'Completed') {
        setJobs(prevJobs => prevJobs.filter(job => job.id !== jobId));
      }
    } catch (error) {
      console.error('Error updating job card status:', error);
      
      // Revert on error
      setJobs(prevJobs => prevJobs.map(job => 
        job.id === jobId ? { ...job, status: oldStatus } : job
      ));
      
      toast({
        title: "Error",
        description: "Failed to update job card status",
        variant: "destructive",
      });
    }
  };

  const pendingJobs = jobs.filter(job => job.status === 'Pending');
  const inProgressJobs = jobs.filter(job => job.status === 'In Progress');
  const partsOrderedJobs = jobs.filter(job => job.status === 'Parts Ordered');
  const readyForPickupJobs = jobs.filter(job => job.status === 'Ready for Pickup');

  if (loading) {
    return <div className="flex justify-center items-center h-[200px] text-gray-600">Loading pipeline...</div>;
  }

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto p-4 bg-white rounded-lg border border-gray-200">
        <Column title="Pending" status="Pending" jobCards={pendingJobs} />
        <Column title="In Progress" status="In Progress" jobCards={inProgressJobs} />
        <Column title="Parts Ordered" status="Parts Ordered" jobCards={partsOrderedJobs} />
        <Column title="Ready for Pickup" status="Ready for Pickup" jobCards={readyForPickupJobs} />
        <CompletedJobsColumn />
      </div>
    </DndContext>
  );
};

export default JobPipeline;
