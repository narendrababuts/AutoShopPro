
import React from 'react';
import { StaffMember } from '@/types/staff';
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface StaffFormProps {
  currentStaff: StaffMember;
  isEditing: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
}

const StaffForm = ({ currentStaff, isEditing, onChange, onSubmit }: StaffFormProps) => {
  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{isEditing ? 'Edit Staff' : 'Add New Staff'}</DialogTitle>
        <DialogDescription>
          {isEditing
            ? 'Update the staff member\'s information.'
            : 'Fill in the details to add a new staff member.'}
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={onSubmit}>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Name
            </Label>
            <Input
              id="name"
              name="name"
              value={currentStaff.name}
              onChange={onChange}
              className="col-span-3"
              required
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="phone" className="text-right">
              Phone
            </Label>
            <Input
              id="phone"
              name="phone"
              value={currentStaff.phone}
              onChange={onChange}
              className="col-span-3"
              required
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="designation" className="text-right">
              Designation
            </Label>
            <Input
              id="designation"
              name="designation"
              value={currentStaff.designation}
              onChange={onChange}
              className="col-span-3"
              required
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="hourlyRate" className="text-right">
              Hourly Rate ($)
            </Label>
            <Input
              id="hourlyRate"
              name="hourlyRate"
              type="number"
              min="0"
              step="0.01"
              value={currentStaff.hourlyRate}
              onChange={onChange}
              className="col-span-3"
              required
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="submit" className="bg-garage-primary hover:bg-garage-secondary">
            {isEditing ? 'Update' : 'Add'}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
};

export default StaffForm;
