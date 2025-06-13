
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useGarage } from '@/contexts/GarageContext';

interface InventoryItem {
  id: string;
  item_name: string;
  quantity: number;
  unit_price: number;
  min_stock_level: number;
  supplier?: string;
  garage_id: string;
}

interface UseInventoryOptions {
  limit?: number;
  offset?: number;
  lowStockOnly?: boolean;
  enabled?: boolean;
  availableOnly?: boolean; // New option to show only items with stock > 0
}

export const useOptimizedInventory = (options: UseInventoryOptions = {}) => {
  const { limit = 50, offset = 0, lowStockOnly = false, enabled = true, availableOnly = true } = options;
  const { currentGarage } = useGarage();

  return useQuery({
    queryKey: ['inventory', currentGarage?.id, lowStockOnly, availableOnly, limit, offset],
    queryFn: async (): Promise<{ data: InventoryItem[]; count: number }> => {
      if (!currentGarage?.id) {
        console.log('No garage selected, returning empty inventory');
        return { data: [], count: 0 };
      }

      console.log('Fetching LIVE inventory for garage ONLY:', currentGarage.id);

      let query = supabase
        .from('inventory')
        .select('*', { count: 'exact' })
        .eq('garage_id', currentGarage.id); // STRICT: Only current garage's inventory

      // Show only items with stock > 0 if availableOnly is true
      if (availableOnly) {
        query = query.gt('quantity', 0);
      }

      query = query
        .order('item_name')
        .range(offset, offset + limit - 1);

      if (lowStockOnly) {
        // Filter items where quantity is less than or equal to min_stock_level
        query = query.filter('quantity', 'lte', 'min_stock_level');
      }

      const { data, error, count } = await query;

      if (error) {
        console.error('Error fetching live inventory:', error);
        throw error;
      }

      // TRIPLE CHECK: Verify all returned items belong to current garage (DATA LEAK PREVENTION)
      const strictlyFilteredData = (data || []).filter(item => 
        item.garage_id === currentGarage.id && item.garage_id !== null
      );
      
      if (strictlyFilteredData.length !== (data || []).length) {
        console.warn('SECURITY ALERT: Data leak detected in inventory query! Some items did not belong to current garage');
        console.warn('Raw data length:', (data || []).length, 'Filtered length:', strictlyFilteredData.length);
      }

      console.log('Fetched', strictlyFilteredData.length, 'LIVE inventory items for garage', currentGarage.id);

      return {
        data: strictlyFilteredData,
        count: count || 0
      };
    },
    enabled: enabled && !!currentGarage?.id,
    staleTime: 0, // Always fetch fresh data - no stale time for live inventory updates
    gcTime: 1000, // Keep in cache for 1 second only to ensure fresh data
  });
};

export const useLowStockItems = () => {
  return useOptimizedInventory({
    lowStockOnly: true,
    limit: 10,
    availableOnly: true,
  });
};
