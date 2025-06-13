
import React, { useEffect, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';
import {
  Bell,
  Calendar,
  CheckCircle,
  Clock,
  Gift,
  MessageSquare,
  Settings,
  ShieldCheck,
  Star,
  Tag,
  Users,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useGarage } from '@/contexts/GarageContext';
import PromotionsSettings from '@/components/promotions/PromotionsSettings';
import ServiceReminders from '@/components/promotions/ServiceReminders';
import PromotionalOffers from '@/components/promotions/PromotionalOffers';
import LoyaltyPoints from '@/components/promotions/LoyaltyPoints';

const Promotions = () => {
  const { currentGarage } = useGarage();
  const [isLoading, setIsLoading] = useState(true);
  const [remindersCount, setRemindersCount] = useState(0);
  const [offersCount, setOffersCount] = useState(0);
  const [loyaltyCount, setLoyaltyCount] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    const fetchCounts = async () => {
      if (!currentGarage?.id) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        
        // FIXED: Apply strict garage_id filtering for promotions data
        const [jobCardsResult, promotionsResult] = await Promise.all([
          // Get job cards ONLY for current garage
          supabase
            .from('job_cards')
            .select('status, customer_name')
            .eq('garage_id', currentGarage.id)
            .eq('status', 'Completed'),
          
          // Get promotions ONLY for current garage  
          supabase
            .from('promotions')
            .select('id, is_active')
            .eq('garage_id', currentGarage.id)
            .eq('is_active', true)
        ]);
        
        if (jobCardsResult.error) {
          console.error('Error fetching job cards:', jobCardsResult.error);
        }
        
        if (promotionsResult.error) {
          console.error('Error fetching promotions:', promotionsResult.error);
        }
        
        // Calculate counts from LIVE garage-specific data
        const jobCards = jobCardsResult.data || [];
        const promotions = promotionsResult.data || [];
        
        const uniqueCustomers = new Set(jobCards.map(job => job.customer_name));
        setRemindersCount(Math.min(jobCards.length, 5)); // Mock pending reminders based on completed jobs
        setOffersCount(promotions.length); // LIVE active promotions count
        setLoyaltyCount(uniqueCustomers.size); // LIVE unique customers count
        
      } catch (error: any) {
        console.error('Error fetching promotions data:', error);
        // Set default values if there's an error
        setRemindersCount(0);
        setOffersCount(0);
        setLoyaltyCount(0);
        
        if (error.code !== 'PGRST116') {
          toast({
            title: "Error loading promotions data",
            description: "Unable to fetch promotions information for your garage",
            variant: "destructive",
          });
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchCounts();
  }, [currentGarage?.id, toast]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Promotions</h1>
        <p className="text-muted-foreground">
          Manage customer promotions, service reminders, and loyalty program.
        </p>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Service Reminders
            </CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? "..." : remindersCount}</div>
            <p className="text-xs text-muted-foreground">
              Customers due for service
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Promotional Offers
            </CardTitle>
            <Tag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? "..." : offersCount}</div>
            <p className="text-xs text-muted-foreground">
              Current special offers
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Loyalty Members
            </CardTitle>
            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? "..." : loyaltyCount}</div>
            <p className="text-xs text-muted-foreground">
              Customers with loyalty points
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Configuration
            </CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm mt-2">
              <Button variant="outline" className="w-full" asChild>
                <a href="#settings">Manage Settings</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="reminders" className="space-y-4">
        <TabsList>
          <TabsTrigger value="reminders" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Service Reminders
          </TabsTrigger>
          <TabsTrigger value="offers" className="flex items-center gap-2">
            <Gift className="h-4 w-4" />
            Promotional Offers
          </TabsTrigger>
          <TabsTrigger value="loyalty" className="flex items-center gap-2">
            <Star className="h-4 w-4" />
            Loyalty Program
          </TabsTrigger>
          <TabsTrigger value="settings" id="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="reminders" className="space-y-4">
          <ServiceReminders />
        </TabsContent>
        
        <TabsContent value="offers" className="space-y-4">
          <PromotionalOffers />
        </TabsContent>
        
        <TabsContent value="loyalty" className="space-y-4">
          <LoyaltyPoints />
        </TabsContent>
        
        <TabsContent value="settings" className="space-y-4">
          <PromotionsSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Promotions;
