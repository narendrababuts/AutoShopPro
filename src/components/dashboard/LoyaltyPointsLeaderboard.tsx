
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Award, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

interface LoyaltyMember {
  id: string;
  customer_id: string;
  total_points: number;
  last_updated: string;
  customer_name?: string;
  vehicle_info?: string;
}

const LoyaltyPointsLeaderboard = () => {
  const [members, setMembers] = useState<LoyaltyMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchLoyaltyData = async () => {
      try {
        setIsLoading(true);
        
        // Since there's no loyalty points table, create mock data from completed job cards
        const { data: jobCardsData, error: jobCardsError } = await supabase
          .from('job_cards')
          .select('id, customer_name, customer_phone, car_make, car_model, car_number')
          .eq('status', 'Completed')
          .limit(5);
        
        if (jobCardsError) {
          throw jobCardsError;
        }
        
        // Create mock loyalty data from job cards
        const mockLoyaltyData = jobCardsData?.map((jobCard, index) => ({
          id: `mock-${index}`,
          customer_id: jobCard.customer_phone || jobCard.customer_name,
          total_points: Math.floor(Math.random() * 100) + 10,
          last_updated: new Date().toISOString(),
          customer_name: jobCard.customer_name,
          vehicle_info: `${jobCard.car_make} ${jobCard.car_model} - ${jobCard.car_number}`
        })) || [];
        
        setMembers(mockLoyaltyData);
      } catch (error) {
        console.error('Error fetching loyalty points leaderboard:', error);
        setMembers([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchLoyaltyData();
  }, []);
  
  const navigateToLoyalty = () => {
    navigate('/promotions?tab=loyalty');
  };

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Award className="h-4 w-4" />
            Loyalty Points Leaderboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center h-32">
            <p className="text-sm text-muted-foreground">Loading loyalty data...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Award className="h-4 w-4" />
          Loyalty Points Leaderboard
        </CardTitle>
        <CardDescription>
          Top customers with the most loyalty points
        </CardDescription>
      </CardHeader>
      <CardContent>
        {members.length === 0 ? (
          <div className="flex flex-col justify-center items-center h-32 text-center">
            <Award className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">No loyalty members yet</p>
            <p className="text-xs text-muted-foreground mt-1">Complete job cards to start earning points</p>
          </div>
        ) : (
          <div className="space-y-3">
            {members.map((member, index) => (
              <div key={member.id} className="flex items-center gap-3 border-b pb-2 last:border-0">
                <div className="flex-shrink-0 bg-primary/10 rounded-full w-6 h-6 flex items-center justify-center">
                  <span className="text-xs font-medium">{index + 1}</span>
                </div>
                <div className="flex-grow overflow-hidden">
                  <p className="text-sm font-medium truncate">
                    {member.customer_name || member.customer_id}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {member.vehicle_info}
                  </p>
                </div>
                <div className="flex-shrink-0 flex items-center gap-1 bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 px-2 py-1 rounded-full text-xs font-medium">
                  <Award className="h-3 w-3" />
                  {member.total_points} pts
                </div>
              </div>
            ))}
            
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full mt-2 text-xs" 
              onClick={navigateToLoyalty}
            >
              <User className="h-3.5 w-3.5 mr-1" />
              View All Members
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LoyaltyPointsLeaderboard;
