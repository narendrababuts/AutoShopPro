
import React from 'react';
import { JobCardPart } from '@/types/jobCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash } from 'lucide-react';

export interface JobCardPartsProps {
  parts: JobCardPart[];
  onChange: (parts: JobCardPart[]) => void;
}

const JobCardParts = ({ parts, onChange }: JobCardPartsProps) => {
  const addPart = () => {
    const newPart: JobCardPart = {
      inventoryId: '',
      name: '',
      quantity: 1,
      unitPrice: 0,
      inStock: false,
      addedToPurchaseList: true
    };
    onChange([...parts, newPart]);
  };

  const updatePart = (index: number, field: keyof JobCardPart, value: any) => {
    const updatedParts = [...parts];
    updatedParts[index] = { ...updatedParts[index], [field]: value };
    onChange(updatedParts);
  };

  const removePart = (index: number) => {
    const updatedParts = parts.filter((_, i) => i !== index);
    onChange(updatedParts);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Parts & Materials</h3>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addPart}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Part
        </Button>
      </div>
      
      {parts.length === 0 ? (
        <div className="text-center py-6 text-muted-foreground">
          No parts added yet. Click 'Add Part' to begin.
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Part Name</TableHead>
              <TableHead className="w-24 text-right">Quantity</TableHead>
              <TableHead className="w-32 text-right">Unit Price</TableHead>
              <TableHead className="w-32 text-right">Total</TableHead>
              <TableHead className="w-16 text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {parts.map((part, index) => (
              <TableRow key={index}>
                <TableCell>
                  <Input
                    value={part.name}
                    onChange={(e) => updatePart(index, 'name', e.target.value)}
                    placeholder="Part name"
                  />
                </TableCell>
                <TableCell className="text-right">
                  <Input
                    type="number"
                    value={part.quantity}
                    onChange={(e) => updatePart(index, 'quantity', parseFloat(e.target.value) || 0)}
                    className="w-24 text-right"
                    min="1"
                  />
                </TableCell>
                <TableCell className="text-right">
                  <Input
                    type="number"
                    value={part.unitPrice}
                    onChange={(e) => updatePart(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                    className="w-32 text-right"
                    min="0"
                    step="0.01"
                  />
                </TableCell>
                <TableCell className="text-right font-medium">
                  ₹{(part.quantity * part.unitPrice).toFixed(2)}
                </TableCell>
                <TableCell className="text-center">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removePart(index)}
                  >
                    <Trash className="h-4 w-4 text-red-500" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
};

export default JobCardParts;
