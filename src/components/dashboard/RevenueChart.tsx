import React, { useState, useEffect, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useGarage } from '@/contexts/GarageContext';
import { useQueryClient } from '@tanstack/react-query';

interface AccountEntry {
  id: string;
  amount: number;
  date: string;
  type: 'income' | 'expense';
}

interface ChartData {
  name: string;
  revenue: number;
  expenses: number;
  profit: number;
}

const TimeRangeOptions = ['week', 'month', 'year'] as const;
type TimeRange = typeof TimeRangeOptions[number];

const RevenueChart = () => {
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [timeRange, setTimeRange] = useState<TimeRange>('month');
  const [loading, setLoading] = useState(true);
  const { currentGarage } = useGarage();
  const queryClient = useQueryClient();
  const accountsChannelRef = useRef<any>(null);
  const jobCardsChannelRef = useRef<any>(null);
  const [comparisonStats, setComparisonStats] = useState({
    revenue: { value: 0, isPositive: true },
    expenses: { value: 0, isPositive: false },
    profit: { value: 0, isPositive: true }
  });

  const fetchData = async () => {
    if (!currentGarage?.id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const currentDate = new Date();
      let startDate: Date;

      // Set date range based on selected time range
      switch (timeRange) {
        case 'week':
          startDate = new Date(currentDate);
          startDate.setDate(currentDate.getDate() - 7);
          break;
        case 'year':
          startDate = new Date(currentDate);
          startDate.setFullYear(currentDate.getFullYear() - 1);
          break;
        case 'month':
        default:
          startDate = new Date(currentDate);
          startDate.setMonth(currentDate.getMonth() - 1);
      }

      console.log('Fetching accounts data for garage:', currentGarage.id);

      // Fetch accounts data for the selected time range, filtered by garage_id
      const { data: accountsData, error } = await supabase
        .from('accounts')
        .select('*')
        .eq('garage_id', currentGarage.id)
        .gte('date', startDate.toISOString())
        .order('date', { ascending: true });

      if (error) {
        console.error('Error fetching accounts data:', error);
        throw error;
      }

      console.log('Fetched accounts data:', accountsData);

      // Process the data to get chart data
      const dataMap = new Map<string, { revenue: number, expenses: number }>();

      if (accountsData) {
        accountsData.forEach((entry: AccountEntry) => {
          const date = new Date(entry.date);
          let key: string;

          if (timeRange === 'year') {
            key = `${date.getMonth() + 1}-${date.getFullYear()}`;
          } else {
            key = date.toLocaleDateString();
          }

          if (!dataMap.has(key)) {
            dataMap.set(key, { revenue: 0, expenses: 0 });
          }

          const existingData = dataMap.get(key)!;
          if (entry.type === 'income') {
            existingData.revenue += Number(entry.amount);
          } else {
            existingData.expenses += Number(entry.amount);
          }
        });
      }

      // Convert map to array and calculate profit
      const processedData: ChartData[] = Array.from(dataMap.entries()).map(([key, value]) => ({
        name: key,
        revenue: value.revenue,
        expenses: value.expenses,
        profit: value.revenue - value.expenses
      }));

      // Sort data chronologically
      processedData.sort((a, b) => new Date(a.name).getTime() - new Date(b.name).getTime());

      // Calculate comparison stats
      if (processedData.length > 1) {
        const currentPeriod = processedData.slice(-Math.ceil(processedData.length / 2));
        const previousPeriod = processedData.slice(0, Math.floor(processedData.length / 2));

        const currentRevenue = currentPeriod.reduce((sum, item) => sum + item.revenue, 0);
        const previousRevenue = previousPeriod.reduce((sum, item) => sum + item.revenue, 0);
        const currentExpenses = currentPeriod.reduce((sum, item) => sum + item.expenses, 0);
        const previousExpenses = previousPeriod.reduce((sum, item) => sum + item.expenses, 0);
        const currentProfit = currentPeriod.reduce((sum, item) => sum + item.profit, 0);
        const previousProfit = previousPeriod.reduce((sum, item) => sum + item.profit, 0);

        const revenueChange = previousRevenue !== 0 
          ? Math.round(((currentRevenue - previousRevenue) / previousRevenue) * 100) 
          : 0;
        
        const expensesChange = previousExpenses !== 0 
          ? Math.round(((currentExpenses - previousExpenses) / previousExpenses) * 100) 
          : 0;
        
        const profitChange = previousProfit !== 0 
          ? Math.round(((currentProfit - previousProfit) / previousProfit) * 100) 
          : 0;

        setComparisonStats({
          revenue: { value: revenueChange, isPositive: revenueChange >= 0 },
          expenses: { value: expensesChange, isPositive: expensesChange <= 0 },
          profit: { value: profitChange, isPositive: profitChange >= 0 }
        });
      }

      setChartData(processedData);
    } catch (error) {
      console.error('Error fetching revenue data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    if (!currentGarage?.id) return;

    // Clean up existing channels
    if (accountsChannelRef.current) {
      supabase.removeChannel(accountsChannelRef.current);
      accountsChannelRef.current = null;
    }
    if (jobCardsChannelRef.current) {
      supabase.removeChannel(jobCardsChannelRef.current);
      jobCardsChannelRef.current = null;
    }

    // Create truly unique channel names
    const uniqueId1 = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const uniqueId2 = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const accountsChannelName = `revenue-chart-accounts-${currentGarage.id}-${uniqueId1}`;
    const jobCardsChannelName = `revenue-chart-jobs-${currentGarage.id}-${uniqueId2}`;

    // Set up real-time subscription for accounts table
    const accountsChannel = supabase
      .channel(accountsChannelName)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'accounts',
          filter: `garage_id=eq.${currentGarage.id}`
        },
        async (payload) => {
          console.log('Accounts data changed, refetching revenue chart...', payload);
          await fetchData();
          // Also invalidate related queries
          await queryClient.invalidateQueries({ queryKey: ['dashboard_accounts', currentGarage.id] });
        }
      )
      .subscribe();

    // Set up subscription for job cards completion
    const jobCardsChannel = supabase
      .channel(jobCardsChannelName)
      .on('postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'job_cards',
          filter: `garage_id=eq.${currentGarage.id}`
        },
        async (payload) => {
          console.log('Job card updated:', payload);
          // Refetch when job status changes to completed
          if (payload.new?.status === 'Completed') {
            console.log('Job completed, refetching revenue chart');
            await fetchData();
            // Also invalidate dashboard queries
            await queryClient.invalidateQueries({ queryKey: ['dashboard_accounts', currentGarage.id] });
          }
        }
      )
      .subscribe();

    accountsChannelRef.current = accountsChannel;
    jobCardsChannelRef.current = jobCardsChannel;

    return () => {
      console.log('Cleaning up revenue chart subscriptions');
      if (accountsChannelRef.current) {
        supabase.removeChannel(accountsChannelRef.current);
        accountsChannelRef.current = null;
      }
      if (jobCardsChannelRef.current) {
        supabase.removeChannel(jobCardsChannelRef.current);
        jobCardsChannelRef.current = null;
      }
    };
  }, [timeRange, currentGarage?.id, queryClient]);

  const formatCurrency = (value: number) => {
    return `₹${value.toFixed(2)}`;
  };

  if (!currentGarage?.id) {
    return (
      <div className="flex justify-center items-center h-[250px] text-muted-foreground">
        Please select a garage to view revenue data
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col space-y-2 sm:space-y-0 sm:flex-row sm:justify-between sm:items-center">
        <div className="flex gap-2">
          {TimeRangeOptions.map((option) => (
            <Button 
              key={option}
              variant={timeRange === option ? "default" : "outline"}
              size="sm"
              onClick={() => setTimeRange(option)}
              className="capitalize"
            >
              {option}
            </Button>
          ))}
        </div>
        <div className="flex gap-2 text-sm">
          <div className={cn(
            "flex items-center gap-1 px-2 py-1 rounded-md",
            comparisonStats.revenue.isPositive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
          )}>
            {comparisonStats.revenue.isPositive ? 
              <TrendingUp className="h-3 w-3" /> : 
              <TrendingDown className="h-3 w-3" />
            }
            <span>Revenue: {comparisonStats.revenue.value}%</span>
          </div>
          <div className={cn(
            "flex items-center gap-1 px-2 py-1 rounded-md",
            comparisonStats.profit.isPositive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
          )}>
            {comparisonStats.profit.isPositive ? 
              <TrendingUp className="h-3 w-3" /> : 
              <TrendingDown className="h-3 w-3" />
            }
            <span>Profit: {comparisonStats.profit.value}%</span>
          </div>
        </div>
      </div>

      <div className="h-[250px]">
        {loading ? (
          <div className="flex justify-center items-center h-full">Loading chart data...</div>
        ) : chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => {
                  const date = new Date(value);
                  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                }}
              />
              <YAxis 
                tickFormatter={formatCurrency}
                tick={{ fontSize: 12 }}
              />
              <Tooltip 
                formatter={(value: number) => formatCurrency(value)}
                labelFormatter={(label) => {
                  const date = new Date(label);
                  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
                }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="revenue" 
                name="Revenue"
                stroke="#4f46e5" 
                strokeWidth={2} 
                activeDot={{ r: 6 }} 
              />
              <Line 
                type="monotone" 
                dataKey="expenses" 
                name="Expenses"
                stroke="#ef4444" 
                strokeWidth={2} 
              />
              <Line 
                type="monotone" 
                dataKey="profit" 
                name="Net Profit"
                stroke="#10b981" 
                strokeWidth={2} 
                activeDot={{ r: 6 }} 
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex flex-col justify-center items-center h-full text-muted-foreground">
            <p>No financial data available for the selected period</p>
            <p className="text-sm mt-2">Complete job cards will automatically generate revenue entries</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RevenueChart;
