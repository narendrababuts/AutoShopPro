
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import MetricCard from './MetricCard';
import { formatIndianCurrency, formatIndianNumber } from '@/lib/utils';
import { SkeletonMetricCard } from '@/components/ui/skeleton-card';

interface RevenueTabsProps {
  metrics: {
    todayRevenue: number;
    monthlyRevenue: number;
    todayCompletedJobs: number;
    completedJobs: number;
    activeJobs: number;
    avgRepairTime: string;
  };
  isMetricsLoading: boolean;
}

const RevenueTabs = ({ metrics, isMetricsLoading }: RevenueTabsProps) => {
  return (
    <Tabs defaultValue="today" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="today">Today's Revenue</TabsTrigger>
        <TabsTrigger value="monthly">Monthly Revenue</TabsTrigger>
      </TabsList>
      
      <TabsContent value="today" className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {isMetricsLoading ? (
            <>
              <SkeletonMetricCard />
              <SkeletonMetricCard />
              <SkeletonMetricCard />
              <SkeletonMetricCard />
            </>
          ) : (
            <>
              <MetricCard 
                title="Today's Revenue" 
                value={formatIndianCurrency(metrics.todayRevenue)} 
                trend={{ value: 0, isPositive: true }}
                description="from completed jobs today" 
              />
              <MetricCard 
                title="Today's Completed Jobs" 
                value={formatIndianNumber(metrics.todayCompletedJobs, 0)} 
                trend={{ value: 0, isPositive: true }}
                description="jobs completed today" 
              />
              <MetricCard 
                title="Active Jobs" 
                value={formatIndianNumber(metrics.activeJobs, 0)} 
                trend={{ value: 0, isPositive: true }}
                description="current" 
              />
              <MetricCard 
                title="Avg. Repair Time" 
                value={metrics.avgRepairTime} 
                trend={{ value: 0, isPositive: true }}
                description="recent average" 
              />
            </>
          )}
        </div>
      </TabsContent>

      <TabsContent value="monthly" className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {isMetricsLoading ? (
            <>
              <SkeletonMetricCard />
              <SkeletonMetricCard />
              <SkeletonMetricCard />
              <SkeletonMetricCard />
            </>
          ) : (
            <>
              <MetricCard 
                title="Monthly Revenue" 
                value={formatIndianCurrency(metrics.monthlyRevenue)} 
                trend={{ value: 0, isPositive: true }}
                description="this month" 
              />
              <MetricCard 
                title="Total Jobs Completed" 
                value={formatIndianNumber(metrics.completedJobs, 0)} 
                trend={{ value: 0, isPositive: true }}
                description="this month" 
              />
              <MetricCard 
                title="Active Jobs" 
                value={formatIndianNumber(metrics.activeJobs, 0)} 
                trend={{ value: 0, isPositive: true }}
                description="current" 
              />
              <MetricCard 
                title="Avg. Repair Time" 
                value={metrics.avgRepairTime} 
                trend={{ value: 0, isPositive: true }}
                description="recent average" 
              />
            </>
          )}
        </div>
      </TabsContent>
    </Tabs>
  );
};

export default RevenueTabs;
