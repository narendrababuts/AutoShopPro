
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useGarageServices } from '@/hooks/useGarageServices';
import { Loader2 } from 'lucide-react';

interface GarageServiceSelectProps {
  value?: string;
  onValueChange: (serviceId: string, serviceName: string, price: number) => void;
}

const GarageServiceSelect = ({ value, onValueChange }: GarageServiceSelectProps) => {
  const { services, isLoading, refetch } = useGarageServices();

  const handleServiceSelect = (serviceId: string) => {
    const selectedService = services.find(service => service.id === serviceId);
    if (selectedService) {
      onValueChange(serviceId, selectedService.service_name, selectedService.price);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (open) {
      // Refetch services when dropdown opens to ensure fresh data
      refetch();
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="garage-service">Select Service (Optional)</Label>
      <Select value={value} onValueChange={handleServiceSelect} onOpenChange={handleOpenChange}>
        <SelectTrigger>
          <SelectValue placeholder={isLoading ? "Loading services..." : "Select a garage service"} />
          {isLoading && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
        </SelectTrigger>
        <SelectContent className="bg-white z-50">
          {isLoading ? (
            <SelectItem value="loading" disabled>Loading services...</SelectItem>
          ) : services.length === 0 ? (
            <SelectItem value="no-services" disabled>No services available for this garage</SelectItem>
          ) : (
            services.map((service) => (
              <SelectItem key={service.id} value={service.id}>
                <div className="flex justify-between items-center w-full">
                  <span>{service.service_name}</span>
                  <span className="text-muted-foreground ml-4">₹{service.price}</span>
                </div>
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
    </div>
  );
};

export default GarageServiceSelect;
