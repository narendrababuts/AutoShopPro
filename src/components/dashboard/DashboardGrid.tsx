
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import RevenueChart from './RevenueChart';
import RecentJobCards from './RecentJobCards';
import UpcomingAppointments from './UpcomingAppointments';
import InventoryAlerts from './InventoryAlerts';
import StaffPerformance from './StaffPerformance';
import PartsToOrder from './PartsToOrder';
import JobCardsStatusPanel from './JobCardsStatusPanel';

const DashboardGrid = () => {
  return (
    <>
      {/* Job Cards Status Panel */}
      <JobCardsStatusPanel />

      <div className="grid gap-6 md:grid-cols-6">
        <Card className="md:col-span-4">
          <CardHeader>
            <CardTitle>Monthly Revenue</CardTitle>
            <CardDescription>
              View your revenue trends over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RevenueChart />
          </CardContent>
        </Card>
        <div className="md:col-span-2 space-y-6">
          <InventoryAlerts />
          <PartsToOrder />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <RecentJobCards />
        <UpcomingAppointments />
      </div>

      <StaffPerformance />
    </>
  );
};

export default DashboardGrid;
