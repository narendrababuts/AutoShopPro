
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell, Calendar, MessageSquare } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface ServiceReminder {
  id: string;
  customer_id: string;
  job_card_id: string;
  due_date: string;
  status: string;
  customer_name?: string;
  vehicle_info?: string;
}

const UpcomingServiceReminders = () => {
  const [reminders, setReminders] = useState<ServiceReminder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchServiceReminders = async () => {
      try {
        setIsLoading(true);
        
        // Since service_reminders table doesn't exist, create mock data from past job cards
        const { data: jobCardsData, error: jobCardsError } = await supabase
          .from('job_cards')
          .select('id, customer_name, customer_phone, car_make, car_model, car_number, job_date, status')
          .eq('status', 'Completed')
          .order('job_date', { ascending: false })
          .limit(3);
        
        if (jobCardsError) {
          throw jobCardsError;
        }
        
        // Create mock reminders from old job cards
        const mockReminders = jobCardsData?.map((jobCard, index) => ({
          id: `mock-${index}`,
          customer_id: jobCard.customer_phone || jobCard.customer_name,
          job_card_id: jobCard.id,
          due_date: new Date(Date.now() + (index + 1) * 7 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'pending',
          customer_name: jobCard.customer_name,
          vehicle_info: `${jobCard.car_make} ${jobCard.car_model} - ${jobCard.car_number}`
        })) || [];
        
        setReminders(mockReminders);
      } catch (error) {
        console.error('Error fetching service reminders:', error);
        setReminders([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchServiceReminders();
  }, []);
  
  const navigateToReminders = () => {
    navigate('/promotions?tab=reminders');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
    });
  };

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Upcoming Service Reminders
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center h-32">
            <p className="text-sm text-muted-foreground">Loading reminders...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Bell className="h-4 w-4" />
          Upcoming Service Reminders
        </CardTitle>
        <CardDescription>
          Customers due for service reminders
        </CardDescription>
      </CardHeader>
      <CardContent>
        {reminders.length === 0 ? (
          <div className="flex flex-col justify-center items-center h-32 text-center">
            <Calendar className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">No upcoming reminders</p>
            <p className="text-xs text-muted-foreground mt-1">Service reminders will appear here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {reminders.map((reminder) => (
              <div key={reminder.id} className="flex items-center gap-3 border-b pb-2 last:border-0">
                <div className="flex-grow overflow-hidden">
                  <p className="text-sm font-medium truncate">
                    {reminder.customer_name || reminder.customer_id}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {reminder.vehicle_info}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Due: {formatDate(reminder.due_date)}
                  </p>
                </div>
                <div className="flex-shrink-0 flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {reminder.status}
                  </Badge>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    <MessageSquare className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
            
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full mt-2 text-xs" 
              onClick={navigateToReminders}
            >
              <Bell className="h-3.5 w-3.5 mr-1" />
              View All Reminders
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UpcomingServiceReminders;
