
import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Loader2, ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

// Define the Appointment interface to match the database schema
interface Appointment {
  id: string;
  customer_name: string;
  customer_phone: string;
  car_make: string;
  car_model: string;
  appointment_time: string;
  status: 'Pending' | 'In Progress' | 'Completed' | 'Parts Ordered' | 'Ready for Pickup';
}

const UpcomingAppointments = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('job_cards')
        .select('id, customer_name, customer_phone, car_make, car_model, job_date, status')
        .gte('job_date', today)
        .order('job_date')
        .limit(5);

      if (error) {
        console.error('Error fetching appointments:', error);
        return;
      }

      // Convert the data to the Appointment interface
      const formattedAppointments: Appointment[] = (data || []).map(item => ({
        id: item.id,
        customer_name: item.customer_name,
        customer_phone: item.customer_phone,
        car_make: item.car_make,
        car_model: item.car_model,
        appointment_time: item.job_date,
        status: item.status as 'Pending' | 'In Progress' | 'Completed' | 'Parts Ordered' | 'Ready for Pickup'
      }));
      
      setAppointments(formattedAppointments);
    } catch (error) {
      console.error('Error in fetchAppointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Pending':
        return <Badge variant="outline">Pending</Badge>;
      case 'In Progress':
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-800/20 dark:text-blue-300">In Progress</Badge>;
      case 'Completed':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-800/20 dark:text-green-300">Completed</Badge>;
      case 'Parts Ordered':
        return <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-800/20 dark:text-amber-300">Parts Ordered</Badge>;
      case 'Ready for Pickup':
        return <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-800/20 dark:text-purple-300">Ready for Pickup</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle>Upcoming Appointments</CardTitle>
        <CardDescription>
          Next 5 scheduled service appointments.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : appointments.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground text-sm">
            No upcoming appointments scheduled
          </div>
        ) : (
          <div className="space-y-4">
            {appointments.map((appointment) => (
              <div key={appointment.id} className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{appointment.customer_name}</div>
                  <div className="text-sm text-muted-foreground flex flex-col sm:flex-row sm:gap-2">
                    <span>{appointment.car_make} {appointment.car_model}</span>
                    <span className="hidden sm:inline">•</span>
                    <span>{formatDate(appointment.appointment_time)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(appointment.status)}
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UpcomingAppointments;
