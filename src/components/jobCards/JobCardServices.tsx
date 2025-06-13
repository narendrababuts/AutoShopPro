
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SelectedGarageService } from '@/types/jobCard';
import { formatIndianCurrency } from '@/lib/utils';
import GarageServiceSelect from '@/components/garageServices/GarageServiceSelect';
import { X } from 'lucide-react';

interface JobCardServicesProps {
  selectedServices: SelectedGarageService[];
  onChange: (services: SelectedGarageService[]) => void;
}

const JobCardServices = ({ selectedServices, onChange }: JobCardServicesProps) => {
  const handleAddService = (serviceId: string, serviceName: string, price: number) => {
    // Check if service is already selected
    if (selectedServices.find(service => service.id === serviceId)) {
      return;
    }

    const newService: SelectedGarageService = {
      id: serviceId,
      serviceName,
      price,
    };

    onChange([...selectedServices, newService]);
  };

  const handleRemoveService = (serviceId: string) => {
    onChange(selectedServices.filter(service => service.id !== serviceId));
  };

  const totalServicesCost = selectedServices.reduce((total, service) => total + service.price, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Garage Services</CardTitle>
        <CardDescription>
          Select additional services for this job card
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <GarageServiceSelect
          onValueChange={handleAddService}
        />
        
        {selectedServices.length > 0 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium">Selected Services:</h4>
              <div className="space-y-2">
                {selectedServices.map((service) => (
                  <div
                    key={service.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="font-medium">{service.serviceName}</div>
                      {service.description && (
                        <div className="text-sm text-muted-foreground">
                          {service.description}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">
                        {formatIndianCurrency(service.price)}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveService(service.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex justify-between items-center pt-2 border-t">
              <span className="font-medium">Total Services Cost:</span>
              <Badge variant="default" className="text-base">
                {formatIndianCurrency(totalServicesCost)}
              </Badge>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default JobCardServices;
