
import React from 'react';
import DashboardHeader from './DashboardHeader';
import RevenueTabs from './RevenueTabs';
import DashboardGrid from './DashboardGrid';
import { useDashboardMetrics } from '@/hooks/useDashboardMetrics';
import { useRevenueSync } from '@/hooks/useRevenueSync';

const Dashboard = () => {
  // Sync revenue for completed jobs on dashboard load
  useRevenueSync();

  const { metrics, isMetricsLoading } = useDashboardMetrics();

  return (
    <div className="space-y-6">
      <DashboardHeader />
      
      <RevenueTabs metrics={metrics} isMetricsLoading={isMetricsLoading} />
      
      <DashboardGrid />
    </div>
  );
};

export default Dashboard;
