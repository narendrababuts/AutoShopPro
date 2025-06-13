
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import NumberInput from '@/components/ui/number-input';
import { formatIndianCurrency } from '@/lib/utils';

interface JobCardLaborProps {
  laborHours: number;
  hourlyRate: number;
  manualLaborCost: number;
  onLaborChange: (hours: number) => void;
  onRateChange: (rate: number) => void;
  onManualLaborCostChange: (cost: number) => void;
}

const JobCardLabor = ({
  laborHours,
  hourlyRate,
  manualLaborCost,
  onLaborChange,
  onRateChange,
  onManualLaborCostChange
}: JobCardLaborProps) => {
  const calculatedCost = laborHours * hourlyRate;

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="grid gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="laborHours">Labor Hours</Label>
              <NumberInput
                id="laborHours"
                value={laborHours}
                onValueChange={onLaborChange}
                placeholder="0"
                min={0}
                allowDecimals={true}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hourlyRate">Hourly Rate (₹)</Label>
              <NumberInput
                id="hourlyRate"
                value={hourlyRate}
                onValueChange={onRateChange}
                placeholder="0"
                min={0}
                allowDecimals={true}
              />
            </div>
          </div>

          <div className="pt-4 border-t mt-2">
            <div className="mb-2 flex justify-between items-center">
              <Label htmlFor="manualLaborCost">Manual Labor Cost (Optional)</Label>
              <span className="text-sm text-muted-foreground">
                Calculated: {formatIndianCurrency(calculatedCost)}
              </span>
            </div>
            <NumberInput
              id="manualLaborCost"
              value={manualLaborCost}
              onValueChange={onManualLaborCostChange}
              placeholder="Enter manual labor cost to override calculation"
              min={0}
              allowDecimals={true}
            />
            <p className="text-xs text-muted-foreground mt-2">
              Enter a value to manually set labor cost instead of using the calculated amount.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default JobCardLabor;
