
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { Clock, MessageSquare, MoreHorizontal, AlertCircle, Database } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ServiceReminder, PromotionsSettings } from '@/types/promotions';

const ServiceReminders = () => {
  const [reminders, setReminders] = useState<ServiceReminder[]>([]);
  const [settings, setSettings] = useState<PromotionsSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [tablesExist] = useState(false); // Always false until tables are created
  const { toast } = useToast();

  useEffect(() => {
    const createMockData = async () => {
      try {
        setIsLoading(true);
        
        // Mock settings
        setSettings({
          reminder_interval_months: 3,
          enable_service_reminder: true,
          reminder_message_template: "Hi {{customerName}}, your vehicle {{vehicle.make}} {{vehicle.model}} service is due. Please contact us to schedule a service appointment.",
          enable_promotional_offers: true,
          promotional_offers: [],
          membership_point_value: 10
        });
        
        // Create mock reminders from completed job cards
        const { data: jobCards, error: jobError } = await supabase
          .from('job_cards')
          .select('id, customer_name, customer_phone, car_make, car_model, car_number, job_date')
          .eq('status', 'Completed')
          .order('job_date', { ascending: false })
          .limit(5);
        
        if (jobError) {
          console.error('Error fetching job cards:', jobError);
          setReminders([]);
          return;
        }
        
        const mockReminders = jobCards?.map((job, index) => ({
          id: `mock-${index}`,
          customer_id: job.customer_phone || job.customer_name || 'Unknown',
          job_card_id: job.id,
          due_date: new Date(Date.now() + (index + 1) * 7 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'pending',
          job_cards: {
            id: job.id,
            customer_name: job.customer_name,
            customer_phone: job.customer_phone,
            car_make: job.car_make,
            car_model: job.car_model,
            car_number: job.car_number
          }
        })) || [];
        
        setReminders(mockReminders);
        
      } catch (error: any) {
        console.error('Error creating mock data:', error);
        setReminders([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    createMockData();
  }, []);
  
  const handleSendWhatsApp = (reminder: ServiceReminder) => {
    try {
      if (!reminder.job_cards) {
        throw new Error("Job card data not available");
      }
      
      const customerPhone = reminder.job_cards.customer_phone;
      if (!customerPhone) {
        throw new Error("Customer phone number not available");
      }
      
      // Format the customer's phone for WhatsApp
      const formattedPhone = customerPhone.startsWith('+') 
        ? customerPhone.substring(1) 
        : customerPhone;
      
      // Parse the template and replace placeholders with actual values
      let messageText = settings?.reminder_message_template || 
        "Hi {{customerName}}, your vehicle {{vehicle.make}} {{vehicle.model}} service is due.";
      
      messageText = messageText
        .replace(/\{\{customerName\}\}/g, reminder.job_cards.customer_name || 'valued customer')
        .replace(/\{\{vehicle\.make\}\}/g, reminder.job_cards.car_make || '')
        .replace(/\{\{vehicle\.model\}\}/g, reminder.job_cards.car_model || '')
        .replace(/\{\{vehicle\.number\}\}/g, reminder.job_cards.car_number || '');
      
      // Create the WhatsApp URL with the message
      const encodedMessage = encodeURIComponent(messageText);
      const whatsappURL = `https://wa.me/${formattedPhone}?text=${encodedMessage}`;
      
      // Open WhatsApp
      window.open(whatsappURL, '_blank');
      
      toast({
        title: "Message opened",
        description: `WhatsApp message opened for ${reminder.job_cards.customer_name}`,
      });
    } catch (error: any) {
      console.error('Error sending WhatsApp message:', error);
      toast({
        title: "Error sending WhatsApp message",
        description: error.message || "Failed to send WhatsApp message",
        variant: "destructive",
      });
    }
  };
  
  const handleSnoozeReminder = async (id: string, days: number) => {
    // Since tables don't exist yet, just show demo message
    toast({
      title: "Demo mode",
      description: `Reminder would be snoozed for ${days} days (tables not created yet)`,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="text-muted-foreground">Loading service reminders...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Promotions tables not created</AlertTitle>
        <AlertDescription>
          You're seeing demo data. To enable full functionality, copy and run the SQL from 
          <code className="mx-1 px-1 py-0.5 bg-muted rounded text-xs">src/db/create_promotions_tables_complete.sql</code> 
          in your Supabase SQL editor.
        </AlertDescription>
      </Alert>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Service Reminders
            <Badge variant="outline">Demo Mode</Badge>
          </CardTitle>
          <CardDescription>
            Send service reminders to customers via WhatsApp
          </CardDescription>
        </CardHeader>
        <CardContent>
          {reminders.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <Clock className="h-12 w-12 text-muted-foreground mb-2" />
              <h3 className="text-lg font-medium">No pending reminders</h3>
              <p className="text-muted-foreground mt-2">
                When customers are due for service, their reminders will appear here.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reminders.map((reminder) => (
                  <TableRow key={reminder.id}>
                    <TableCell>{reminder.job_cards?.customer_name}</TableCell>
                    <TableCell>
                      <div>
                        <div>{reminder.job_cards?.car_make} {reminder.job_cards?.car_model}</div>
                        <div className="text-xs text-muted-foreground">{reminder.job_cards?.car_number}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {reminder.due_date && (
                        <div>
                          <div className="font-medium">
                            {new Date(reminder.due_date).toLocaleDateString()}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(reminder.due_date), { addSuffix: true })}
                          </div>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
                        {reminder.status || 'Pending'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          className="flex items-center gap-1"
                          onClick={() => handleSendWhatsApp(reminder)}
                        >
                          <MessageSquare className="h-3.5 w-3.5" />
                          <span className="hidden sm:inline">WhatsApp</span>
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="icon" variant="ghost">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">More actions</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleSnoozeReminder(reminder.id, 7)}>
                              <Clock className="mr-2 h-4 w-4" />
                              Snooze for 7 days
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleSnoozeReminder(reminder.id, 14)}>
                              <Clock className="mr-2 h-4 w-4" />
                              Snooze for 14 days
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleSnoozeReminder(reminder.id, 30)}>
                              <Clock className="mr-2 h-4 w-4" />
                              Snooze for 30 days
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ServiceReminders;
