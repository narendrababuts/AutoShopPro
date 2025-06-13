
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Package } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface LowStockItem {
  id: string;
  name: string;
  current_stock: number;
  minimum_stock: number;
}

const InventoryAlerts = () => {
  const [lowStockItems, setLowStockItems] = useState<LowStockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchLowStockItems();

    // Set up real-time subscription
    const channel = supabase
      .channel('inventory-alerts')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'inventory' },
        () => fetchLowStockItems()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchLowStockItems = async () => {
    try {
      // First get all inventory items, then filter in JavaScript to avoid SQL type issues
      const { data, error } = await supabase
        .from('inventory')
        .select('id, item_name, quantity, min_stock_level')
        .order('item_name');

      if (error) {
        console.error('Error fetching inventory items:', error);
        return;
      }

      // Filter items where quantity is less than or equal to min_stock_level
      const lowStockData = data?.filter(item => 
        item.quantity <= item.min_stock_level
      ) || [];

      const formattedItems = lowStockData.map(item => ({
        id: item.id,
        name: item.item_name,
        current_stock: item.quantity,
        minimum_stock: item.min_stock_level
      }));

      setLowStockItems(formattedItems);
    } catch (error) {
      console.error('Exception fetching low stock items:', error);
    } finally {
      setLoading(false);
    }
  };

  const navigateToInventory = () => {
    navigate('/inventory');
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Inventory Alerts</CardTitle>
        {lowStockItems.length > 0 && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={navigateToInventory} 
            className="text-garage-primary hover:bg-garage-primary/10"
          >
            View All
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="text-center py-4">
            <p className="text-muted-foreground">Loading inventory alerts...</p>
          </div>
        ) : lowStockItems.length > 0 ? (
          lowStockItems.slice(0, 3).map((item) => (
            <Alert key={item.id} variant="destructive" className="bg-red-50 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800/30">
              <Package className="h-4 w-4" />
              <AlertTitle className="font-medium">Low Stock: {item.name}</AlertTitle>
              <AlertDescription>
                Current stock: {item.current_stock} (Minimum required: {item.minimum_stock})
              </AlertDescription>
            </Alert>
          ))
        ) : (
          <div className="text-center py-6 text-muted-foreground">
            <p>No inventory alerts at this time.</p>
          </div>
        )}
        
        {lowStockItems.length > 3 && (
          <div className="text-sm text-muted-foreground text-center pt-2">
            +{lowStockItems.length - 3} more items low in stock
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default InventoryAlerts;
