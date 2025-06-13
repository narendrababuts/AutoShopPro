
import React from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { JobCard } from '@/types/jobCard';
import JobCardDetail from './JobCardDetail';

interface JobCardSelectionProps {
  jobCards: JobCard[];
  isLoading: boolean;
  selectedJobCard: JobCard | null;
  selectedJobCardId: string;
  setSelectedJobCardId: (id: string) => void;
  advisorName: string;
  setAdvisorName: (name: string) => void;
  mileage: string;
  setMileage: (mileage: string) => void;
  warrantyInfo: string;
  setWarrantyInfo: (info: string) => void;
  isSaving: boolean;
  handleSaveJobCard: (e: React.FormEvent) => void;
  onClose: () => void;
}

const JobCardSelection: React.FC<JobCardSelectionProps> = ({
  jobCards,
  isLoading,
  selectedJobCard,
  selectedJobCardId,
  setSelectedJobCardId,
  advisorName,
  setAdvisorName,
  mileage,
  setMileage,
  warrantyInfo,
  setWarrantyInfo,
  isSaving,
  handleSaveJobCard,
  onClose
}) => {
  return (
    <div className="space-y-4">
      {isLoading ? (
        <div className="flex justify-center items-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">Loading job cards...</span>
        </div>
      ) : jobCards.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <AlertCircle className="h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No eligible job cards found</h3>
          <p className="text-gray-600 mt-2 max-w-md">
            To generate an invoice, you need at least one job card with a "Completed" or "Ready for Pickup" status.
          </p>
        </div>
      ) : (
        <JobCardDetail
          selectedJobCard={selectedJobCard}
          selectedJobCardId={selectedJobCardId}
          setSelectedJobCardId={setSelectedJobCardId}
          jobCards={jobCards}
          advisorName={advisorName}
          setAdvisorName={setAdvisorName}
          mileage={mileage}
          setMileage={setMileage}
          warrantyInfo={warrantyInfo}
          setWarrantyInfo={setWarrantyInfo}
          isSaving={isSaving}
          handleSaveJobCard={handleSaveJobCard}
        />
      )}
      
      <div className="flex justify-end gap-2 pt-4 border-t border-gray-200">
        <Button 
          variant="outline" 
          onClick={onClose}
          className="border-gray-300 text-gray-700 hover:bg-gray-50"
        >
          Close
        </Button>
        {jobCards.length > 0 && (
          <Button 
            disabled={!selectedJobCard || isSaving} 
            onClick={handleSaveJobCard}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Job Card
          </Button>
        )}
      </div>
    </div>
  );
};

export default JobCardSelection;
