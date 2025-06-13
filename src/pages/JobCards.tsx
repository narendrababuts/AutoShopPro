
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useNavigate, useLocation } from 'react-router-dom';
import { useJobCard } from '@/hooks/useJobCard';
import { useOptimizedJobCards } from '@/hooks/useOptimizedJobCards';
import JobCardForm from '@/components/jobCards/JobCardForm';
import JobCardList from '@/components/jobCards/JobCardList';
import { Button } from '@/components/ui/button';
import { Plus, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useGarage } from '@/contexts/GarageContext';

const JobCards = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentGarage } = useGarage();
  
  // Check if we're in a modal mode (create/edit/view)
  const isModalMode = location.pathname.includes('/create') || 
                     location.pathname.includes('/edit') || 
                     location.pathname.includes('/view');

  const {
    isLoading: hookLoading,
    isSaving,
    isEditing,
    isCreating,
    staffOptions,
    currentJobCard,
    handleInputChange,
    handleSelectChange,
    handleSaveJobCard,
    validateJobCard,
  } = useJobCard();

  // Fetch job cards for the main list view
  const { data: jobCardsData, isLoading: listLoading } = useOptimizedJobCards({
    enabled: !isModalMode && !!currentGarage?.id,
    limit: 50
  });

  const handleClose = () => {
    console.log('Closing job cards dialog/modal');
    navigate('/job-cards'); // Go back to main job cards list
  };
  
  const handleDialogOpenChange = (open: boolean) => {
    console.log('Dialog open change:', open);
    if (!open) {
      handleClose();
    }
  };

  const handleCreateJobCard = () => {
    navigate('/job-cards/create');
  };

  const handleEditJobCard = (jobCard: any) => {
    navigate(`/job-cards/edit?id=${jobCard.id}`);
  };

  const handleViewJobCard = (jobCard: any) => {
    navigate(`/job-cards/view?id=${jobCard.id}`);
  };

  const handleDeleteJobCard = async (id: string) => {
    // TODO: Implement delete functionality
    console.log('Delete job card:', id);
  };
  
  // Show dialog when creating or editing
  if (isCreating || isEditing) {
    return (
      <Dialog open={true} onOpenChange={handleDialogOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white">
          <DialogHeader>
            <DialogTitle>
              {isCreating ? 'Create Job Card' : 'Edit Job Card'}
            </DialogTitle>
          </DialogHeader>
          <JobCardForm
            currentJobCard={currentJobCard}
            staffOptions={staffOptions}
            isEditing={isEditing}
            onChange={handleInputChange}
            onSelectChange={handleSelectChange}
            onSubmit={handleSaveJobCard}
            isSaving={isSaving}
            validateJobCard={validateJobCard}
          />
        </DialogContent>
      </Dialog>
    );
  }

  // Default: Show main job cards list view
  if (!currentGarage) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">No Garage Found</h2>
          <p className="text-muted-foreground">Please contact support if this issue persists.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Job Cards</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Manage job cards for {currentGarage.name}
            </p>
          </div>
          <Button onClick={handleCreateJobCard} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="mr-2 h-4 w-4" />
            Create Job Card
          </Button>
        </CardHeader>
        <CardContent>
          {listLoading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <span className="ml-2 text-gray-600">Loading job cards...</span>
            </div>
          ) : !jobCardsData?.data || jobCardsData.data.length === 0 ? (
            <div className="text-center py-8">
              <h3 className="text-lg font-medium text-gray-900 mb-2">No job cards found</h3>
              <p className="text-gray-600 mb-4">Create your first job card to get started.</p>
              <Button onClick={handleCreateJobCard} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="mr-2 h-4 w-4" />
                Create Job Card
              </Button>
            </div>
          ) : (
            <JobCardList
              jobCards={jobCardsData.data}
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

export default JobCards;
