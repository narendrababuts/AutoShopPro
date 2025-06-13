
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ShoppingCart, AlertCircle, RefreshCw, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { formatIndianNumber } from '@/lib/utils';

interface PartToOrder {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  job_card_id: string;
  job_card?: {
    customer_name: string;
    car_make: string;
    car_model: string;
  };
  status?: string;
}

const PartsToOrder = () => {
  const [parts, setParts] = useState<PartToOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  
  useEffect(() => {
    fetchPartsToOrder();

    // Set up real-time subscription for job_cards table
    const channel = supabase
      .channel('job_cards-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'job_cards' },
        () => fetchPartsToOrder()
      )
      .subscribe();

    // Cleanup subscription
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchPartsToOrder = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Fetch all job cards with parts
      const { data: jobCards, error: jobCardsError } = await supabase
        .from('job_cards')
        .select(`
          id,
          customer_name,
          car_make,
          car_model,
          parts,
          status
        `)
        .or('status.eq.Pending,status.eq.In Progress,status.eq.Parts Ordered')
        .not('parts', 'is', null);

      if (jobCardsError) throw jobCardsError;

      // Extract parts that need to be ordered
      const partsToOrder: PartToOrder[] = [];
      
      jobCards?.forEach(jobCard => {
        if (jobCard.parts && Array.isArray(jobCard.parts)) {
          jobCard.parts.forEach((part: any) => {
            if (part.addedToPurchaseList && (!part.inStock || !part.inventoryId)) {
              partsToOrder.push({
                id: `${jobCard.id}-${part.name}`,
                name: part.name,
                quantity: part.quantity,
                unitPrice: part.unitPrice,
                job_card_id: jobCard.id,
                job_card: {
                  customer_name: jobCard.customer_name,
                  car_make: jobCard.car_make,
                  car_model: jobCard.car_model
                },
                status: part.orderStatus || 'Pending'
              });
            }
          });
        }
      });
      
      // Sort parts by name
      partsToOrder.sort((a, b) => a.name.localeCompare(b.name));
      
      setParts(partsToOrder);
    } catch (err) {
      console.error('Error fetching parts to order:', err);
      setError('Failed to load parts data');
      toast({
        title: "Error",
        description: "Could not load parts to order",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const goToInventory = () => {
    navigate('/inventory?filter=to-order');
  };

  const viewJobCard = (jobCardId: string) => {
    navigate(`/job-cards/edit?id=${jobCardId}`);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-md flex items-center">
            <ShoppingCart className="mr-2 h-4 w-4" />
            Parts to Order
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-2">
          <div className="flex justify-center py-6">
            <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-md flex items-center">
            <ShoppingCart className="mr-2 h-4 w-4" />
            Parts to Order
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-2 text-center">
          <AlertCircle className="h-8 w-8 mx-auto mb-2 text-red-500" />
          <p className="text-muted-foreground">Error loading data</p>
          <Button 
            variant="outline"
            size="sm"
            className="mt-2"
            onClick={fetchPartsToOrder}
          >
            <RefreshCw className="mr-2 h-3 w-3" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-md flex items-center">
          <ShoppingCart className="mr-2 h-4 w-4" />
          Parts to Order
        </CardTitle>
        <CardDescription>
          Custom parts needed that are not in inventory
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-0">
        {parts.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-muted-foreground">No parts to order</p>
          </div>
        ) : (
          <ul className="space-y-2 max-h-[240px] overflow-auto">
            {parts.map((part) => (
              <li 
                key={part.id} 
                className="flex items-center justify-between p-2 rounded hover:bg-muted/50 cursor-pointer"
                onClick={() => viewJobCard(part.job_card_id)}
              >
                <div>
                  <div className="font-medium flex items-center">
                    {part.name}
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-5 w-5 ml-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        viewJobCard(part.job_card_id);
                      }}
                    >
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {part.job_card?.customer_name} • {part.job_card?.car_make} {part.job_card?.car_model}
                  </div>
                  <div className="text-xs mt-1">
                    <span className="text-muted-foreground">Price:</span> ₹{formatIndianNumber(part.unitPrice, 2)} × {formatIndianNumber(part.quantity, 0)}
                  </div>
                </div>
                <Badge>{formatIndianNumber(part.quantity, 0)} pcs</Badge>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
      {parts.length > 0 && (
        <CardFooter className="pt-4 pb-2">
          <Button 
            variant="secondary" 
            className="w-full text-xs"
            size="sm"
            onClick={goToInventory}
          >
            View in Inventory
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};

export default PartsToOrder;
