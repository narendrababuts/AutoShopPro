
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { formatIndianCurrency } from '@/lib/utils';
import { JobCard } from '@/types/jobCard';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface JobCardDetailProps {
  selectedJobCard: JobCard | null;
  selectedJobCardId: string;
  setSelectedJobCardId: (id: string) => void;
  jobCards: JobCard[];
  advisorName: string;
  setAdvisorName: (name: string) => void;
  mileage: string;
  setMileage: (mileage: string) => void;
  warrantyInfo: string;
  setWarrantyInfo: (info: string) => void;
  isSaving: boolean;
  handleSaveJobCard: (e: React.FormEvent) => void;
}

const JobCardDetail: React.FC<JobCardDetailProps> = ({
  selectedJobCard,
  selectedJobCardId,
  setSelectedJobCardId,
  jobCards,
  advisorName,
  setAdvisorName,
  mileage,
  setMileage,
  warrantyInfo,
  setWarrantyInfo,
  isSaving,
  handleSaveJobCard
}) => {
  return (
    <>
      <div className="space-y-4">
        <div>
          <Label htmlFor="jobCard">Select Job Card</Label>
          <Select value={selectedJobCardId} onValueChange={setSelectedJobCardId}>
            <SelectTrigger id="jobCard">
              <SelectValue placeholder="Select a completed job card" />
            </SelectTrigger>
            <SelectContent>
              {jobCards.map(card => (
                <SelectItem key={card.id} value={card.id}>
                  {card.customer.name} - {card.car.make} {card.car.model} ({card.date})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {selectedJobCard && (
          <>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex justify-between">
                  <span>Job Card Details</span>
                  <Badge variant="outline">{selectedJobCard.status}</Badge>
                </CardTitle>
                <CardDescription>
                  Job Card #{selectedJobCard.id.substr(0, 8).toUpperCase()}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground mb-1">Customer</p>
                    <p className="font-medium">{selectedJobCard.customer.name}</p>
                    <p>{selectedJobCard.customer.phone}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1">Vehicle</p>
                    <p className="font-medium">{selectedJobCard.car.make} {selectedJobCard.car.model}</p>
                    <p>Plate: {selectedJobCard.car.plate}</p>
                  </div>
                </div>
                
                <div>
                  <p className="text-muted-foreground mb-1">Description</p>
                  <p>{selectedJobCard.description}</p>
                </div>
                
                {selectedJobCard.parts.length > 0 && (
                  <div>
                    <p className="text-muted-foreground mb-1">Parts Used ({selectedJobCard.parts.length})</p>
                    <ul className="list-disc list-inside pl-2 text-sm">
                      {selectedJobCard.parts.slice(0, 3).map((part, idx) => (
                        <li key={idx}>
                          {part.name} × {part.quantity} ({formatIndianCurrency(part.unitPrice)} each)
                        </li>
                      ))}
                      {selectedJobCard.parts.length > 3 && (
                        <li className="list-none italic">
                          +{selectedJobCard.parts.length - 3} more parts...
                        </li>
                      )}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="advisor">Service Advisor</Label>
                <Input
                  id="advisor"
                  value={advisorName}
                  onChange={(e) => setAdvisorName(e.target.value)}
                  placeholder="Service Advisor Name"
                />
              </div>
              <div>
                <Label htmlFor="mileage">Vehicle Mileage (km)</Label>
                <Input
                  id="mileage"
                  type="number"
                  value={mileage}
                  onChange={(e) => setMileage(e.target.value)}
                  placeholder="e.g., 12500"
                />
              </div>
              <div>
                <Label htmlFor="warranty">Warranty Information</Label>
                <Input
                  id="warranty"
                  value={warrantyInfo}
                  onChange={(e) => setWarrantyInfo(e.target.value)}
                  placeholder="e.g., 6 months or 10,000 km"
                />
              </div>
            </div>
          </>
        )}
      </div>
    
      <div className="flex justify-end gap-2 mt-4">
        <Button variant="outline" onClick={() => window.close()}>
          Cancel
        </Button>
        <Button 
          disabled={!selectedJobCard || isSaving} 
          onClick={handleSaveJobCard}
          className="bg-garage-primary hover:bg-garage-secondary"
        >
          {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Job Card
        </Button>
      </div>
    </>
  );
};

export default JobCardDetail;
