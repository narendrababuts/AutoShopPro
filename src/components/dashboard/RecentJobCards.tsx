
import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useOptimizedJobCards } from '@/hooks/useOptimizedJobCards';
import { Skeleton } from '@/components/ui/skeleton';

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Completed':
      return 'bg-green-100 text-green-800 dark:bg-green-800/20 dark:text-green-300';
    case 'In Progress':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-800/20 dark:text-blue-300';
    case 'Pending':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800/20 dark:text-yellow-300';
    case 'Parts Ordered':
      return 'bg-orange-100 text-orange-800 dark:bg-orange-800/20 dark:text-orange-300';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-800/20 dark:text-gray-300';
  }
};

const RecentJobCards = () => {
  const { data: jobCardsData, isLoading } = useOptimizedJobCards({
    limit: 5,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Job Cards</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex space-x-4">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const recentJobCards = jobCardsData?.data || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Job Cards</CardTitle>
      </CardHeader>
      <CardContent>
        {recentJobCards.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No job cards found. Create your first job card to get started.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Car</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentJobCards.map((job) => (
                <TableRow key={job.id}>
                  <TableCell className="font-medium">
                    JC-{job.id.slice(-6).toUpperCase()}
                  </TableCell>
                  <TableCell>{job.customer.name}</TableCell>
                  <TableCell>{job.car.make} {job.car.model}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getStatusColor(job.status)}>
                      {job.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{job.date}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default RecentJobCards;
