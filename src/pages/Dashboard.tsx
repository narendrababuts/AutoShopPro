
import React from 'react';
import Dashboard from '@/components/dashboard/Dashboard';
import { useGarage } from '@/contexts/GarageContext';
import { useRevenueSync } from '@/hooks/useRevenueSync';

const DashboardPage = () => {
  const { loading } = useGarage();
  
  // Sync revenue for completed jobs on dashboard load
  useRevenueSync();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return <Dashboard />;
};

export default DashboardPage;
