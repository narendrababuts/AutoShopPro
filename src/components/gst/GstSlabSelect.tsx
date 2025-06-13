
import React, { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { GstSlab } from '@/types/gstSlab';

interface GstSlabSelectProps {
  value: string | undefined;
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

const GstSlabSelect: React.FC<GstSlabSelectProps> = ({
  value,
  onValueChange,
  placeholder = "Select GST slab",
  disabled = false,
}) => {
  const [gstSlabs, setGstSlabs] = useState<GstSlab[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchGstSlabs = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('gst_slabs')
          .select('*')
          .order('name');

        if (error) throw error;
        setGstSlabs(data || []);
      } catch (error) {
        console.error('Error fetching GST slabs:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchGstSlabs();
  }, []);

  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled || isLoading}>
      <SelectTrigger>
        <SelectValue placeholder={isLoading ? "Loading..." : placeholder} />
      </SelectTrigger>
      <SelectContent>
        {gstSlabs.map((slab) => (
          <SelectItem key={slab.id} value={slab.id}>
            {slab.name} ({slab.cgst_percent + slab.sgst_percent}%)
          </SelectItem>
        ))}
        {gstSlabs.length === 0 && !isLoading && (
          <SelectItem value="no-slabs-found" disabled>
            No GST slabs found
          </SelectItem>
        )}
      </SelectContent>
    </Select>
  );
};

// Add named export alongside default export
export { GstSlabSelect };
export default GstSlabSelect;
