
import React, { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { z } from 'zod';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { CalendarIcon, Plus, Trash2 } from 'lucide-react';
import { PromotionsSettings as PromotionsSettingsType } from '@/types/promotions';

// Define the schema for the promotions settings form
const promotionsSettingsSchema = z.object({
  reminder_interval_months: z.coerce.number().int().min(1).max(24),
  enable_service_reminder: z.boolean().default(true),
  reminder_message_template: z.string().min(10, "Message template must be at least 10 characters"),
  enable_promotional_offers: z.boolean().default(true),
  promotional_offers: z.array(z.object({
    title: z.string().min(3, "Title must be at least 3 characters"),
    description: z.string().min(10, "Description must be at least 10 characters"),
    valid_until: z.date({
      required_error: "Valid until date is required",
    }).refine(date => date > new Date(), {
      message: "Date must be in the future",
    }),
  })),
  membership_point_value: z.coerce.number().int().min(1).max(1000),
});

type FormValues = z.infer<typeof promotionsSettingsSchema>;

const PromotionsSettings = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  
  // Initialize the form
  const form = useForm<FormValues>({
    resolver: zodResolver(promotionsSettingsSchema),
    defaultValues: {
      reminder_interval_months: 3,
      enable_service_reminder: true,
      reminder_message_template: "Hi {{customerName}}, your vehicle {{vehicle.make}} {{vehicle.model}} service is due. Please contact us to schedule a service appointment.",
      enable_promotional_offers: true,
      promotional_offers: [],
      membership_point_value: 10,
    },
  });
  
  // Set up field array for promotional offers
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "promotional_offers",
  });
  
  // Fetch existing settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setIsLoading(true);
        
        // Since the promotions_settings table doesn't exist yet, use default values
        console.log('Promotions settings table not available, using defaults');
        
        // Set default values with some sample promotional offers
        form.reset({
          reminder_interval_months: 3,
          enable_service_reminder: true,
          reminder_message_template: "Hi {{customerName}}, your vehicle {{vehicle.make}} {{vehicle.model}} service is due. Please contact us to schedule a service appointment.",
          enable_promotional_offers: true,
          promotional_offers: [
            {
              title: "20% Off Oil Change",
              description: "Get 20% off your next oil change service. Valid for all vehicle types.",
              valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            }
          ],
          membership_point_value: 10,
        });
        
      } catch (error: any) {
        console.error('Error fetching promotions settings:', error);
        toast({
          title: "Error loading settings",
          description: "Using default settings. Set up the promotions database tables to save custom settings.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSettings();
  }, [form, toast]);
  
  // Handle form submission
  const onSubmit = async (data: FormValues) => {
    try {
      setIsSaving(true);
      
      // Since the promotions_settings table doesn't exist yet, just show a toast
      toast({
        title: "Settings would be saved",
        description: "Set up the promotions database tables to enable saving settings",
      });
      
    } catch (error: any) {
      console.error('Error saving promotions settings:', error);
      toast({
        title: "Error saving settings",
        description: error.message || "Failed to save promotion settings",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  const addNewOffer = () => {
    append({
      title: "",
      description: "",
      valid_until: new Date(new Date().setMonth(new Date().getMonth() + 1)),
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Promotions Settings</CardTitle>
        <CardDescription>
          Configure service reminders, promotional offers, and loyalty program settings
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="text-muted-foreground">Loading settings...</div>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              {/* Service Reminders Section */}
              <div>
                <h3 className="text-lg font-medium">Service Reminders</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Configure how and when service reminders are sent to customers
                </p>
                
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="enable_service_reminder"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Enable Service Reminders</FormLabel>
                          <FormDescription>
                            Automatically create reminders for services based on past job cards
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="reminder_interval_months"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Reminder Interval (Months)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            {...field}
                            disabled={!form.watch('enable_service_reminder')}
                            min={1}
                            max={24}
                          />
                        </FormControl>
                        <FormDescription>
                          Number of months after service completion to send a reminder
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="reminder_message_template"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Reminder Message Template</FormLabel>
                        <FormControl>
                          <Textarea 
                            {...field}
                            disabled={!form.watch('enable_service_reminder')}
                            rows={4}
                          />
                        </FormControl>
                        <FormDescription>
                          Available placeholders: customerName, vehicle.make, vehicle.model, vehicle.number
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              
              <Separator />
              
              {/* Promotional Offers Section */}
              <div>
                <h3 className="text-lg font-medium">Promotional Offers</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Create special offers to send to customers
                </p>
                
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="enable_promotional_offers"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Enable Promotional Offers</FormLabel>
                          <FormDescription>
                            Create and manage special offers to send to customers
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  {form.watch('enable_promotional_offers') && (
                    <div className="space-y-4">
                      {fields.map((offerField, index) => (
                        <Card key={offerField.id} className="border border-muted">
                          <CardHeader className="py-4 px-5">
                            <div className="flex justify-between items-center">
                              <CardTitle className="text-base">Offer #{index + 1}</CardTitle>
                              <Button
                                variant="ghost"
                                size="icon"
                                type="button"
                                onClick={() => remove(index)}
                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-4 py-0 px-5">
                            <FormField
                              control={form.control}
                              name={`promotional_offers.${index}.title`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Title</FormLabel>
                                  <FormControl>
                                    <Input {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name={`promotional_offers.${index}.description`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Description</FormLabel>
                                  <FormControl>
                                    <Textarea {...field} rows={3} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name={`promotional_offers.${index}.valid_until`}
                              render={({ field }) => (
                                <FormItem className="flex flex-col">
                                  <FormLabel>Valid Until</FormLabel>
                                  <Popover>
                                    <PopoverTrigger asChild>
                                      <FormControl>
                                        <Button
                                          variant={"outline"}
                                          className={cn(
                                            "w-full pl-3 text-left font-normal",
                                            !field.value && "text-muted-foreground"
                                          )}
                                        >
                                          {field.value ? (
                                            format(field.value, "PPP")
                                          ) : (
                                            <span>Pick a date</span>
                                          )}
                                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                        </Button>
                                      </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                      <Calendar
                                        mode="single"
                                        selected={field.value}
                                        onSelect={field.onChange}
                                        disabled={(date) => date < new Date()}
                                        initialFocus
                                      />
                                    </PopoverContent>
                                  </Popover>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </CardContent>
                        </Card>
                      ))}
                      
                      <Button
                        type="button"
                        variant="outline"
                        onClick={addNewOffer}
                        className="w-full"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add New Offer
                      </Button>
                    </div>
                  )}
                </div>
              </div>
              
              <Separator />
              
              {/* Loyalty Program Section */}
              <div>
                <h3 className="text-lg font-medium">Loyalty Program</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Configure the loyalty points program for customers
                </p>
                
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="membership_point_value"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Points Per Completed Job</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            {...field}
                            min={1}
                            max={1000}
                          />
                        </FormControl>
                        <FormDescription>
                          Number of loyalty points awarded when a job card is completed
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              
              <div className="pt-4">
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? "Saving..." : "Save Settings"}
                </Button>
              </div>
            </form>
          </Form>
        )}
      </CardContent>
    </Card>
  );
};

export default PromotionsSettings;
