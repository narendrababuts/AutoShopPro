
import React from 'react';
import { JobCard } from '@/types/jobCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatIndianCurrency } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertCircle } from 'lucide-react';

interface JobCardReviewProps {
  jobCard: JobCard;
  validation: {
    isValid: boolean;
    errors: string[];
  };
}

const JobCardReview = ({ jobCard, validation }: JobCardReviewProps) => {
  const totalPartsAmount = jobCard.parts?.reduce((sum, part) => 
    sum + (Number(part.quantity) * Number(part.unitPrice)), 0) || 0;
  
  const totalServicesAmount = jobCard.selectedServices?.reduce((sum, service) => 
    sum + Number(service.price), 0) || 0;
  
  const laborCost = jobCard.manualLaborCost || (jobCard.laborHours * jobCard.hourlyRate);
  
  const grandTotal = totalPartsAmount + totalServicesAmount + laborCost;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        {validation.isValid ? (
          <CheckCircle className="h-5 w-5 text-green-500" />
        ) : (
          <AlertCircle className="h-5 w-5 text-red-500" />
        )}
        <h3 className="text-lg font-semibold">
          {validation.isValid ? 'Ready to Create Job Card' : 'Please Complete Required Fields'}
        </h3>
      </div>
      
      {!validation.isValid && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800">Missing Information</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside space-y-1 text-red-700">
              {validation.errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Customer & Vehicle Info */}
      <Card>
        <CardHeader>
          <CardTitle>Customer & Vehicle Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="font-medium">Customer:</span> {jobCard.customer.name || 'Not provided'}
            </div>
            <div>
              <span className="font-medium">Phone:</span> {jobCard.customer.phone || 'Not provided'}
            </div>
            <div>
              <span className="font-medium">Vehicle:</span> {jobCard.car.make} {jobCard.car.model}
            </div>
            <div>
              <span className="font-medium">Plate:</span> {jobCard.car.plate || 'Not provided'}
            </div>
          </div>
          <div>
            <span className="font-medium">Work Description:</span>
            <p className="mt-1 text-gray-700">{jobCard.description || 'Not provided'}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="font-medium">Assigned Staff:</span> {jobCard.assignedStaff || 'Not assigned'}
            </div>
            <div>
              <span className="font-medium">Status:</span> 
              <Badge variant="outline" className="ml-2">{jobCard.status}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Parts & Materials */}
      {jobCard.parts && jobCard.parts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Parts & Materials ({jobCard.parts.length} items)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {jobCard.parts.map((part, index) => (
                <div key={index} className="flex justify-between items-center py-2 border-b">
                  <div>
                    <span className="font-medium">{part.name}</span>
                    <span className="text-gray-500 ml-2">x{part.quantity}</span>
                    {part.inStock && <Badge variant="secondary" className="ml-2">From Inventory</Badge>}
                  </div>
                  <span className="font-medium">
                    {formatIndianCurrency(Number(part.quantity) * Number(part.unitPrice))}
                  </span>
                </div>
              ))}
              <div className="flex justify-between items-center pt-2 font-semibold">
                <span>Parts Total:</span>
                <span>{formatIndianCurrency(totalPartsAmount)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Services */}
      {jobCard.selectedServices && jobCard.selectedServices.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Services ({jobCard.selectedServices.length} services)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {jobCard.selectedServices.map((service, index) => (
                <div key={index} className="flex justify-between items-center py-2 border-b">
                  <div>
                    <span className="font-medium">{service.serviceName}</span>
                    {service.description && (
                      <p className="text-sm text-gray-600">{service.description}</p>
                    )}
                  </div>
                  <span className="font-medium">{formatIndianCurrency(Number(service.price))}</span>
                </div>
              ))}
              <div className="flex justify-between items-center pt-2 font-semibold">
                <span>Services Total:</span>
                <span>{formatIndianCurrency(totalServicesAmount)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Labor & Cost */}
      <Card>
        <CardHeader>
          <CardTitle>Labor & Cost</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {jobCard.manualLaborCost > 0 ? (
              <div className="flex justify-between">
                <span>Manual Labor Cost:</span>
                <span className="font-medium">{formatIndianCurrency(jobCard.manualLaborCost)}</span>
              </div>
            ) : (
              <>
                <div className="flex justify-between">
                  <span>Labor Hours:</span>
                  <span>{jobCard.laborHours || 0} hours</span>
                </div>
                <div className="flex justify-between">
                  <span>Hourly Rate:</span>
                  <span>{formatIndianCurrency(jobCard.hourlyRate || 0)}</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span>Labor Cost:</span>
                  <span>{formatIndianCurrency(laborCost)}</span>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      {jobCard.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700">{jobCard.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Total Summary */}
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="text-green-800">Total Cost Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Parts & Materials:</span>
              <span>{formatIndianCurrency(totalPartsAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span>Services:</span>
              <span>{formatIndianCurrency(totalServicesAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span>Labor:</span>
              <span>{formatIndianCurrency(laborCost)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold border-t pt-2">
              <span>Grand Total:</span>
              <span>{formatIndianCurrency(grandTotal)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default JobCardReview;
