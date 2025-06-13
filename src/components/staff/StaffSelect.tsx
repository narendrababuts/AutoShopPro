
import React, { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useGarage } from '@/contexts/GarageContext';

interface StaffMember {
  id: string;
  name: string;
  role: string;
  email?: string;
  phone?: string;
  hourlyRate: number;
  garage_id: string;
}

interface StaffSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

const StaffSelect: React.FC<StaffSelectProps> = ({
  value,
  onValueChange,
  placeholder = "Select staff member",
  disabled = false,
}) => {
  const [staffOptions, setStaffOptions] = useState<StaffMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { currentGarage, loading: garageLoading } = useGarage();

  useEffect(() => {
    if (!garageLoading && currentGarage) {
      fetchStaff();
    }
  }, [currentGarage, garageLoading]);

  const fetchStaff = async () => {
    if (!currentGarage?.id) {
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('staff')
        .select('*')
        .eq('garage_id', currentGarage.id)
        .order('name', { ascending: true });
      
      if (error) throw error;
      
      if (data) {
        // Map the Supabase staff data to StaffMember type, using designation field for role
        const staffMembers: StaffMember[] = data.map(staff => ({
          id: staff.id,
          name: staff.name || 'Unknown Staff',
          phone: staff.phone || '',
          role: staff.designation || 'Staff', // Use designation as role
          hourlyRate: staff.hourly_rate || 0,
          garage_id: staff.garage_id || ''
        }));
        
        setStaffOptions(staffMembers);
      }
    } catch (error) {
      console.error('Error fetching staff:', error);
      toast({
        title: 'Error',
        description: 'Failed to load staff members',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled || isLoading || garageLoading}>
      <SelectTrigger>
        <SelectValue placeholder={isLoading ? "Loading..." : placeholder} />
      </SelectTrigger>
      <SelectContent>
        {staffOptions.map((staff) => (
          <SelectItem key={staff.id} value={staff.id}>
            {staff.name} ({staff.role})
          </SelectItem>
        ))}
        {staffOptions.length === 0 && !isLoading && (
          <SelectItem value="none" disabled>
            No staff members found
          </SelectItem>
        )}
      </SelectContent>
    </Select>
  );
};

export default StaffSelect;
