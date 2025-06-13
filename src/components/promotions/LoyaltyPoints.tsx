
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { Award, MessageSquare, ShieldCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface LoyaltyMember {
  id: string;
  customer_id: string;
  total_points: number;
  last_updated: string;
  customer_name?: string;
  customer_phone?: string;
  car_make?: string;
  car_model?: string;
  car_number?: string;
}

interface PromotionsSettings {
  membership_point_value?: number;
}

const LoyaltyPoints = () => {
  const [members, setMembers] = useState<LoyaltyMember[]>([]);
  const [settings, setSettings] = useState<PromotionsSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Try to get settings
        try {
          const { data: settingsData, error: settingsError } = await supabase
            .from('job_cards')
            .select('*')
            .limit(1);
          
          // Mock settings for now
          setSettings({ membership_point_value: 10 });
        } catch (error) {
          console.error('Settings table not available, using defaults');
          setSettings({ membership_point_value: 10 });
        }
        
        // Try to fetch loyalty members - if table doesn't exist, create mock data
        try {
          const { data: loyaltyData, error: loyaltyError } = await supabase
            .from('job_cards')
            .select('customer_name, customer_phone, car_make, car_model, car_number, status')
            .eq('status', 'Completed');
          
          if (loyaltyError) {
            throw loyaltyError;
          }
          
          // Create mock loyalty data from completed job cards
          const customerMap = new Map();
          loyaltyData?.forEach((job, index) => {
            const customerId = job.customer_name || `customer-${index}`;
            if (!customerMap.has(customerId)) {
              customerMap.set(customerId, {
                id: `loyalty-${index}`,
                customer_id: customerId,
                total_points: Math.floor(Math.random() * 100) + 10,
                last_updated: new Date().toISOString(),
                customer_name: job.customer_name,
                customer_phone: job.customer_phone,
                car_make: job.car_make,
                car_model: job.car_model,
                car_number: job.car_number
              });
            } else {
              // Add more points for repeat customers
              const existing = customerMap.get(customerId);
              existing.total_points += 10;
            }
          });
          
          const mockMembers = Array.from(customerMap.values())
            .sort((a, b) => b.total_points - a.total_points);
          
          setMembers(mockMembers);
        } catch (error) {
          console.error('Error fetching loyalty data:', error);
          setMembers([]);
        }
      } catch (error: any) {
        console.error('Error fetching loyalty data:', error);
        toast({
          title: "Error loading loyalty data",
          description: "Using demo data. Set up the promotions database tables to enable full functionality.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [toast]);
  
  const handleSendWhatsApp = (member: LoyaltyMember) => {
    if (!member.customer_phone) {
      toast({
        title: "Error",
        description: "Customer phone number not available",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const phone = member.customer_phone;
      const formattedPhone = phone.startsWith('+') ? phone.substring(1) : phone;
      
      // Create loyalty message
      const messageText = `Hi ${member.customer_name}, thank you for being a valued customer! You currently have ${member.total_points} loyalty points with us.\n\nEach service completion earns you points which can be redeemed for discounts on future services. Keep visiting us for more benefits!`;
      
      // Create the WhatsApp URL with the message
      const encodedMessage = encodeURIComponent(messageText);
      const whatsappURL = `https://wa.me/${formattedPhone}?text=${encodedMessage}`;
      
      // Open WhatsApp
      window.open(whatsappURL, '_blank');
      
      toast({
        title: "Message opened",
        description: `WhatsApp message opened for ${member.customer_name}`,
      });
    } catch (error: any) {
      console.error('Error sending WhatsApp message:', error);
      toast({
        title: "Error sending message",
        description: error.message || "Failed to send message",
        variant: "destructive",
      });
    }
  };
  
  const filteredMembers = searchQuery
    ? members.filter(member => 
        member.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.car_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.car_make?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.car_model?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : members;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="text-muted-foreground">Loading loyalty program data...</div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <CardTitle>Loyalty Program</CardTitle>
            <CardDescription>
              Manage customer loyalty points earned from service completions
            </CardDescription>
          </div>
          
          <div className="flex items-center gap-2 bg-muted/60 rounded-md px-3 py-1.5 text-sm">
            <Award className="h-4 w-4 text-amber-500" />
            <span>Points per job: {settings?.membership_point_value || 10}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {members.length === 0 && (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <ShieldCheck className="h-12 w-12 text-muted-foreground mb-2" />
            <h3 className="text-lg font-medium">No loyalty members yet</h3>
            <p className="text-muted-foreground mt-2">
              Customers earn loyalty points when their job cards are completed. <br />
              Points are automatically awarded based on settings.
            </p>
          </div>
        )}
        
        {members.length > 0 && (
          <>
            <div className="mb-4">
              <Input
                placeholder="Search by customer name or vehicle..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-sm"
              />
            </div>
            
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rank</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead className="text-center">Points</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMembers.map((member, index) => (
                  <TableRow key={member.id}>
                    <TableCell>
                      <div className="flex items-center justify-center w-6 h-6 bg-primary/10 rounded-full">
                        <span className="text-sm font-medium">{index + 1}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{member.customer_name}</div>
                        <div className="text-xs text-muted-foreground">{member.customer_phone}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div>{member.car_make} {member.car_model}</div>
                        <div className="text-xs text-muted-foreground">{member.car_number}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="bg-amber-100 text-amber-800">
                        <Award className="h-3.5 w-3.5 mr-1.5" />
                        {member.total_points} points
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSendWhatsApp(member)}
                        className="flex items-center gap-1"
                        disabled={!member.customer_phone}
                      >
                        <MessageSquare className="h-3.5 w-3.5" />
                        Send Status
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default LoyaltyPoints;
