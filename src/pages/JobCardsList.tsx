
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useOptimizedJobCards } from '@/hooks/useOptimizedJobCards';
import JobCardList from '@/components/jobCards/JobCardList';
import { JobCard } from '@/types/jobCard';
import { useGarage } from '@/contexts/GarageContext';
import { supabase } from '@/integrations/supabase/client';

const JobCardsList = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { currentGarage, loading: garageLoading } = useGarage();

  // Use the optimized hook for better performance
  const { data: jobCardsData, isLoading, error } = useOptimizedJobCards({
    enabled: !!currentGarage?.id
  });

  const jobCards = jobCardsData?.data || [];

  useEffect(() => {
    if (error) {
      console.error('Error fetching job cards:', error);
      toast({
        title: 'Error',
        description: 'Failed to load job cards.',
        variant: 'destructive',
      });
    }
  }, [error, toast]);

  const handleCreateJobCard = () => {
    navigate('/job-cards/create');
    console.log('Navigating to /job-cards/create');
  };

  const handleEditJobCard = (jobCard: JobCard) => {
    navigate(`/job-cards/edit?id=${jobCard.id}`);
  };

  const handleViewJobCard = (jobCard: JobCard) => {
    navigate(`/job-cards/view?id=${jobCard.id}`);
  };

  const handleDeleteJobCard = async (id: string) => {
    if (!currentGarage?.id) {
      toast({
        title: 'Error',
        description: 'No garage selected.',
        variant: 'destructive',
      });
      return;
    }

    if (window.confirm('Are you sure you want to delete this job card?')) {
      try {
        // Ensure we only delete job cards belonging to current garage
        const { error } = await supabase
          .from('job_cards')
          .delete()
          .eq('id', id)
          .eq('garage_id', currentGarage.id); // Double-check garage ownership

        if (error) {
          throw error;
        }

        toast({
          title: 'Success',
          description: 'Job card deleted successfully.',
        });
        
        // The optimized hook will automatically refetch
      } catch (error: any) {
        console.error('Error deleting job card:', error);
        toast({
          title: 'Error',
          description: 'Failed to delete job card.',
          variant: 'destructive',
        });
      }
    }
  };

  if (garageLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!currentGarage) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">No Garage Found</h2>
          <p className="text-gray-600">Please contact support if this issue persists.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <Card className="bg-white border border-gray-200">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-gray-900">Job Cards</CardTitle>
            <CardDescription className="text-gray-600">
              View and manage all your job cards
            </CardDescription>
          </div>
          <Button onClick={handleCreateJobCard} className="bg-blue-600 hover:bg-blue-700 text-white">
            <Plus className="mr-2 h-4 w-4" />
            Create Job Card
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <span className="ml-2 text-gray-600">Loading job cards...</span>
            </div>
          ) : jobCards.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-gray-600">No job cards found.</p>
              <Button 
                variant="outline" 
                onClick={handleCreateJobCard}
                className="mt-4 border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Create your first job card
              </Button>
            </div>
          ) : (
            <JobCardList 
              jobCards={jobCards}
              onEdit={handleEditJobCard}
              onView={handleViewJobCard}
              onDelete={handleDeleteJobCard}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default JobCardsList;
