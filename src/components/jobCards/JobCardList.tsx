
import React from 'react';
import { JobCard } from '@/types/jobCard';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Pencil, Eye, Trash2, Wrench, ShoppingCart } from 'lucide-react';
import { format } from 'date-fns';

interface JobCardListProps {
  jobCards: JobCard[];
  onEdit: (jobCard: JobCard) => void;
  onView: (jobCard: JobCard) => void;
  onDelete: (id: string) => void;
}

const JobCardList = ({ jobCards, onEdit, onView, onDelete }: JobCardListProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-800 dark:bg-green-800/20 dark:text-green-300';
      case 'In Progress':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-800/20 dark:text-blue-300';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800/20 dark:text-yellow-300';
      case 'Parts Ordered':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-800/20 dark:text-purple-300';
      case 'Ready for Pickup':
        return 'bg-cyan-100 text-cyan-800 dark:bg-cyan-800/20 dark:text-cyan-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800/20 dark:text-gray-300';
    }
  };
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'In Progress':
        return <Wrench className="h-3 w-3 mr-1" />;
      case 'Parts Ordered':
        return <ShoppingCart className="h-3 w-3 mr-1" />;
      default:
        return null;
    }
  };

  const calculateJobTotal = (jobCard: JobCard) => {
    const partsCost = jobCard.parts?.reduce((total, part) => total + (part.quantity * part.unitPrice), 0) || 0;
    const laborCost = jobCard.manualLaborCost || (jobCard.laborHours * jobCard.hourlyRate);
    return (partsCost + laborCost).toFixed(2);
  };
  
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'dd/MM/yyyy');
    } catch (e) {
      return 'Invalid date';
    }
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Car</TableHead>
            <TableHead>Assigned To</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Est. Value</TableHead>
            <TableHead>Date</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {jobCards.map((jobCard) => (
            <TableRow key={jobCard.id}>
              <TableCell className="font-medium">{jobCard.id}</TableCell>
              <TableCell>{jobCard.customer.name}</TableCell>
              <TableCell>
                {jobCard.car.make} {jobCard.car.model} ({jobCard.car.plate})
              </TableCell>
              <TableCell>{jobCard.assignedStaff}</TableCell>
              <TableCell>
                <Badge variant="outline" className={getStatusColor(jobCard.status)}>
                  {getStatusIcon(jobCard.status)}
                  {jobCard.status}
                </Badge>
              </TableCell>
              <TableCell>${calculateJobTotal(jobCard)}</TableCell>
              <TableCell>{formatDate(jobCard.jobDate)}</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => onEdit(jobCard)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => onView(jobCard)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => onDelete(jobCard.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default JobCardList;
