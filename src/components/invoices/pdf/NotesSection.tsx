
import React from 'react';

interface NotesSectionProps {
  notes: string;
  defaultNotes: string;
}

const NotesSection: React.FC<NotesSectionProps> = ({ notes, defaultNotes }) => {
  const displayNotes = notes || defaultNotes;
  
  return (
    <div className="border p-3 mb-4 text-xs page-break-avoid">
      <p className="font-medium mb-1">Notes:</p>
      <p className="whitespace-pre-line">{displayNotes}</p>
    </div>
  );
};

export default NotesSection;
