
import React from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface JobCardNotesProps {
  notes: string;
  onChange: (notes: string) => void;
}

const JobCardNotes = ({ notes, onChange }: JobCardNotesProps) => {
  return (
    <div className="space-y-2">
      <Label htmlFor="notes">Technician Notes</Label>
      <Textarea
        id="notes"
        placeholder="Add technical details, observations, or recommendations..."
        rows={6}
        value={notes}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
};

export default JobCardNotes;
