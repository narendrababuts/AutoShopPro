
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { useDraggable } from '@dnd-kit/core';
import { cn } from '@/lib/utils';
import { usePaginatedCompletedJobs } from '@/hooks/useOptimizedJobCards';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface JobCardItem {
  id: string;
  customer_name: string;
  vehicle_info: string;
  service_type: string;
  status: 'Pending' | 'In Progress' | 'Completed' | 'Parts Ordered' | 'Ready for Pickup';
}

interface CompletedJobCardProps extends JobCardItem {}

const CompletedJobCard = ({ id, customer_name, vehicle_info, service_type, status }: CompletedJobCardProps) => {
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
      className="bg-white dark:bg-slate-800 p-3 mb-2 rounded border border-muted shadow-sm cursor-move"
    >
      <h4 className="font-medium text-sm">{customer_name}</h4>
      <p className="text-xs text-muted-foreground">{vehicle_info}</p>
      <p className="text-xs text-muted-foreground">{service_type}</p>
    </div>
  );
};

const CompletedJobsColumn = () => {
  const [page, setPage] = useState(1);
  const [allCompletedJobs, setAllCompletedJobs] = useState<JobCardItem[]>([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver>();
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const { data: completedData, isLoading, error } = usePaginatedCompletedJobs(page, 30);

  const { isOver, setNodeRef } = useDroppable({
    id: 'Completed',
  });

  // Update accumulated jobs when new data arrives
  useEffect(() => {
    if (completedData?.data) {
      if (page === 1) {
        // First page - replace all
        setAllCompletedJobs(completedData.data.map(job => ({
          id: job.id,
          customer_name: job.customer.name,
          vehicle_info: `${job.car.make} ${job.car.model} - ${job.car.plate}`,
          service_type: job.description,
          status: job.status as JobCardItem['status']
        })));
      } else {
        // Subsequent pages - append
        setAllCompletedJobs(prev => [
          ...prev,
          ...completedData.data.map(job => ({
            id: job.id,
            customer_name: job.customer.name,
            vehicle_info: `${job.car.make} ${job.car.model} - ${job.car.plate}`,
            service_type: job.description,
            status: job.status as JobCardItem['status']
          }))
        ]);
      }
      setIsLoadingMore(false);
    }
  }, [completedData, page]);

  // Setup intersection observer for infinite scroll
  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();

    if (!completedData?.hasMore) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoadingMore && completedData?.hasMore) {
          setIsLoadingMore(true);
          setPage(prev => prev + 1);
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) observerRef.current.disconnect();
    };
  }, [completedData?.hasMore, isLoadingMore]);

  const handleLoadMore = useCallback(() => {
    if (!isLoadingMore && completedData?.hasMore) {
      setIsLoadingMore(true);
      setPage(prev => prev + 1);
    }
  }, [isLoadingMore, completedData?.hasMore]);

  if (isLoading && page === 1) {
    return (
      <div className="flex-1 min-w-[200px]">
        <div className="mb-2 font-medium flex items-center">
          <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs mr-2 bg-green-100 text-green-600">
            <Loader2 className="h-3 w-3 animate-spin" />
          </div>
          Completed
        </div>
        <div className="bg-muted/50 rounded-md p-2 h-[75vh] flex items-center justify-center">
          <div className="text-muted-foreground text-sm">Loading completed jobs...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 min-w-[200px]">
        <div className="mb-2 font-medium flex items-center">
          <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs mr-2 bg-red-100 text-red-600">
            !
          </div>
          Completed
        </div>
        <div className="bg-muted/50 rounded-md p-2 h-[75vh] flex items-center justify-center">
          <div className="text-red-500 text-sm">Error loading completed jobs</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 min-w-[200px]">
      <div className="mb-2 font-medium flex items-center">
        <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs mr-2 bg-green-100 text-green-600">
          {allCompletedJobs.length}
        </div>
        Completed
      </div>
      
      <div
        ref={setNodeRef}
        className={cn(
          "bg-muted/50 rounded-md p-2 h-[75vh]",
          isOver && "bg-muted ring-2 ring-primary/20"
        )}
      >
        <ScrollArea ref={scrollAreaRef} className="h-full">
          <div className="space-y-2">
            {allCompletedJobs.map(job => (
              <CompletedJobCard key={job.id} {...job} />
            ))}
            
            {/* Infinite scroll trigger */}
            {completedData?.hasMore && (
              <div ref={loadMoreRef} className="py-4">
                {isLoadingMore ? (
                  <div className="flex items-center justify-center">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    <span className="text-sm text-muted-foreground">Loading more...</span>
                  </div>
                ) : (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={handleLoadMore}
                  >
                    Load More ({completedData.count - allCompletedJobs.length} remaining)
                  </Button>
                )}
              </div>
            )}
            
            {allCompletedJobs.length === 0 && (
              <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                <p className="text-xs">No completed jobs</p>
              </div>
            )}
            
            {!completedData?.hasMore && allCompletedJobs.length > 0 && (
              <div className="py-2 text-center">
                <span className="text-xs text-muted-foreground">All completed jobs loaded</span>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};

export default CompletedJobsColumn;
