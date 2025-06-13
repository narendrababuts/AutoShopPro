
import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { useGarage } from '@/contexts/GarageContext';

interface StaffMember {
  id: string;
  name: string;
  jobCount: number;
}

const StaffPerformance = () => {
  const [staffData, setStaffData] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentGarage, loading: garageLoading } = useGarage();

  useEffect(() => {
    if (!garageLoading && currentGarage) {
      fetchStaffPerformance();
    }
  }, [currentGarage, garageLoading]);

  const fetchStaffPerformance = async () => {
    if (!currentGarage?.id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Get all staff members for current garage
      const { data: staffMembers, error: staffError } = await supabase
        .from('staff')
        .select('id, name')
        .eq('garage_id', currentGarage.id)
        .order('name');

      if (staffError) throw staffError;

      // Get all job cards for current garage
      const { data: jobCards, error: jobsError } = await supabase
        .from('job_cards')
        .select('*')
        .eq('garage_id', currentGarage.id);

      if (jobsError) throw jobsError;

      // Count jobs per staff member
      const staffCounts = staffMembers.map(staff => {
        const jobsAssigned = jobCards.filter(job => {
          if (!job.assigned_staff) return false;
          const assignedStaff = job.assigned_staff;
          return assignedStaff === staff.id || assignedStaff === staff.name;
        });

        return {
          id: staff.id,
          name: staff.name,
          jobCount: jobsAssigned.length
        };
      });

      // Sort by job count, highest first
      staffCounts.sort((a, b) => b.jobCount - a.jobCount);
      setStaffData(staffCounts);
    } catch (error) {
      console.error('Error fetching staff performance:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!currentGarage?.id) return;

    // Setup real-time subscription for job cards changes
    const channel = supabase
      .channel('staff-performance')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'job_cards',
          filter: `garage_id=eq.${currentGarage.id}`
        },
        () => fetchStaffPerformance()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentGarage?.id]);

  if (garageLoading || loading) {
    return <div className="flex justify-center items-center h-[250px]">Loading staff data...</div>;
  }

  if (staffData.length === 0) {
    return <div className="flex justify-center items-center h-[250px] text-muted-foreground">No staff performance data available</div>;
  }

  return (
    <div className="h-[250px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={staffData}
          margin={{ top: 5, right: 20, left: 20, bottom: 50 }}
        >
          <XAxis 
            dataKey="name" 
            tick={{ fontSize: 12 }}
            angle={-45}
            textAnchor="end"
            height={70}
          />
          <YAxis 
            allowDecimals={false}
            tick={{ fontSize: 12 }}
          />
          <Tooltip 
            formatter={(value: number) => [`${value} jobs`, 'Jobs Handled']}
            cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }}
          />
          <Bar 
            dataKey="jobCount" 
            name="Jobs Handled" 
            fill="#8884d8" 
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default StaffPerformance;
