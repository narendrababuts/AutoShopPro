
import React from 'react';
import GarageServicesManager from '@/components/garageServices/GarageServicesManager';

const GarageServices = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Garage Services</h1>
        <p className="text-muted-foreground">
          Manage your garage services and their pricing.
        </p>
      </div>
      
      <GarageServicesManager />
    </div>
  );
};

export default GarageServices;
