
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Invoice, toAppInvoice } from '@/types/invoice';
import { useGarage } from '@/contexts/GarageContext';
import { useEffect, useRef } from 'react';

interface UseInvoicesOptions {
  limit?: number;
  offset?: number;
  status?: string;
  enabled?: boolean;
}

export const useOptimizedInvoices = (options: UseInvoicesOptions = {}) => {
  const { limit = 20, offset = 0, status, enabled = true } = options;
  const { currentGarage } = useGarage();
  const queryClient = useQueryClient();
  const invoicesChannelRef = useRef<any>(null);
  const itemsChannelRef = useRef<any>(null);

  // Set up real-time subscription for invoices
  useEffect(() => {
    if (!currentGarage?.id) return;

    // Clean up any existing channels first
    if (invoicesChannelRef.current) {
      supabase.removeChannel(invoicesChannelRef.current);
      invoicesChannelRef.current = null;
    }
    if (itemsChannelRef.current) {
      supabase.removeChannel(itemsChannelRef.current);
      itemsChannelRef.current = null;
    }

    console.log('Setting up real-time subscription for invoices:', currentGarage.id);

    // Create truly unique channel names
    const uniqueId1 = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const uniqueId2 = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const invoicesChannelName = `invoices-changes-${currentGarage.id}-${uniqueId1}`;
    const itemsChannelName = `invoice-items-changes-${currentGarage.id}-${uniqueId2}`;

    const invoicesChannel = supabase
      .channel(invoicesChannelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'invoices',
          filter: `garage_id=eq.${currentGarage.id}`
        },
        (payload) => {
          console.log('Invoices real-time update:', payload);
          queryClient.invalidateQueries({ queryKey: ['invoices', currentGarage.id] });
        }
      )
      .subscribe();

    const itemsChannel = supabase
      .channel(itemsChannelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'invoice_items',
          filter: `garage_id=eq.${currentGarage.id}`
        },
        (payload) => {
          console.log('Invoice items real-time update:', payload);
          queryClient.invalidateQueries({ queryKey: ['invoices', currentGarage.id] });
        }
      )
      .subscribe();

    invoicesChannelRef.current = invoicesChannel;
    itemsChannelRef.current = itemsChannel;

    return () => {
      console.log('Cleaning up invoices subscriptions');
      if (invoicesChannelRef.current) {
        supabase.removeChannel(invoicesChannelRef.current);
        invoicesChannelRef.current = null;
      }
      if (itemsChannelRef.current) {
        supabase.removeChannel(itemsChannelRef.current);
        itemsChannelRef.current = null;
      }
    };
  }, [currentGarage?.id, queryClient]);

  return useQuery({
    queryKey: ['invoices', currentGarage?.id, status, limit, offset],
    queryFn: async (): Promise<{ data: Invoice[]; count: number }> => {
      if (!currentGarage?.id) {
        console.log('No garage selected, returning empty invoices');
        return { data: [], count: 0 };
      }

      console.log('Fetching invoices for garage ONLY:', currentGarage.id);

      // Batch the invoice and related data fetching
      const [invoicesResult, itemsResult] = await Promise.all([
        supabase
          .from('invoices')
          .select('*, job_cards(*)', { count: 'exact' })
          .eq('garage_id', currentGarage.id)
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1),
        
        // Pre-fetch invoice items for the current page
        supabase
          .from('invoice_items')
          .select('*')
          .eq('garage_id', currentGarage.id)
          .order('invoice_id')
      ]);

      if (invoicesResult.error) {
        console.error('Error fetching invoices:', invoicesResult.error);
        throw invoicesResult.error;
      }
      if (itemsResult.error) {
        console.error('Error fetching invoice items:', itemsResult.error);
        throw itemsResult.error;
      }

      // DOUBLE CHECK: Verify all returned items belong to current garage
      const filteredInvoices = (invoicesResult.data || []).filter(invoice => invoice.garage_id === currentGarage.id);
      const filteredItems = (itemsResult.data || []).filter(item => item.garage_id === currentGarage.id);
      
      if (filteredInvoices.length !== (invoicesResult.data || []).length) {
        console.warn('Data leak detected in invoices query! Some invoices did not belong to current garage');
      }
      if (filteredItems.length !== (itemsResult.data || []).length) {
        console.warn('Data leak detected in invoice items query! Some items did not belong to current garage');
      }

      // Group invoice items by invoice_id for efficient lookup
      const itemsByInvoiceId = filteredItems.reduce((acc, item) => {
        if (!acc[item.invoice_id]) acc[item.invoice_id] = [];
        acc[item.invoice_id].push(item);
        return acc;
      }, {} as Record<string, any[]>);

      const formattedInvoices: Invoice[] = [];
      
      for (const invoice of filteredInvoices) {
        const lineItems = itemsByInvoiceId[invoice.id] || [];
        if (invoice.job_cards) {
          formattedInvoices.push(toAppInvoice(invoice, invoice.job_cards, lineItems));
        }
      }

      console.log('Fetched', formattedInvoices.length, 'invoices for garage', currentGarage.id);

      return {
        data: formattedInvoices,
        count: invoicesResult.count || 0
      };
    },
    enabled: enabled && !!currentGarage?.id,
    staleTime: 3 * 60 * 1000, // 3 minutes for invoices
  });
};
