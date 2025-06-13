
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0, // Always consider data stale for real-time updates
      gcTime: 1 * 60 * 1000, // 1 minute cache time
      retry: 2,
      refetchOnWindowFocus: true, // Enable refetch on window focus for fresh data
      refetchOnMount: true,
      refetchInterval: false, // Disable polling since we use real-time subscriptions
      refetchOnReconnect: true, // Refetch when reconnecting
    },
    mutations: {
      retry: 1,
      onSuccess: async () => {
        // Force invalidate all active queries on successful mutation for immediate updates
        console.log('Mutation successful, invalidating all active queries');
        await queryClient.invalidateQueries({ 
          refetchType: 'active'
        });
      },
    },
  },
});
