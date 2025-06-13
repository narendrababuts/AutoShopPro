
import React from 'react';
import InvoiceSettingsComponent from '@/components/settings/InvoiceSettings';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const InvoiceSettings = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Invoice Settings</h1>
          <p className="text-muted-foreground">
            Configure how your invoices look and what information they include
          </p>
        </div>
        <Link to="/settings">
          <Button variant="outline" size="sm">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Settings
          </Button>
        </Link>
      </div>
      
      <InvoiceSettingsComponent />
    </div>
  );
};

export default InvoiceSettings;
