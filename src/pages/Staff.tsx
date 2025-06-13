
import React, { useState, useEffect } from 'react';
import type { StaffMember } from '@/types/staff';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { UserPlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useGarage } from '@/contexts/GarageContext';
import StaffList from '@/components/staff/StaffList';
import StaffForm from '@/components/staff/StaffForm';

interface SupabaseStaff {
  id: string;
  name: string;
  phone: string;
  designation: string;
  hourly_rate: number;
  garage_id: string;
}

const Staff = () => {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [open, setOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentStaff, setCurrentStaff] = useState<StaffMember>({
    id: '',
    name: '',
    phone: '',
    designation: '',
    hourlyRate: 0,
  });
  const { toast } = useToast();
  const { currentGarage, loading: garageLoading } = useGarage();

  useEffect(() => {
    if (!garageLoading && currentGarage) {
      fetchStaff();
    }
  }, [currentGarage, garageLoading]);

  const fetchStaff = async () => {
    if (!currentGarage?.id) {
      console.log('No current garage available');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      console.log('Fetching staff for garage:', currentGarage.id);
      
      const { data, error } = await supabase
        .from('staff')
        .select('*')
        .eq('garage_id', currentGarage.id)
        .order('name');

      if (error) {
        toast({
          title: "Error",
          description: "Failed to fetch staff members",
          variant: "destructive",
        });
        console.error("Supabase error:", error);
        return;
      }

      console.log('Fetched staff data:', data);

      // Convert Supabase data format to our app format
      const convertedStaff: StaffMember[] = (data as SupabaseStaff[]).map(
        (item) => ({
          id: item.id,
          name: item.name,
          phone: item.phone,
          designation: item.designation,
          hourlyRate: item.hourly_rate,
        })
      );

      setStaff(convertedStaff);
    } catch (err) {
      console.error("Exception in fetchStaff:", err);
      toast({
        title: "Error",
        description: "Failed to fetch staff data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenDialog = (staff?: StaffMember) => {
    if (staff) {
      setCurrentStaff(staff);
      setIsEditing(true);
    } else {
      setCurrentStaff({
        id: '',
        name: '',
        phone: '',
        designation: '',
        hourlyRate: 0,
      });
      setIsEditing(false);
    }
    setOpen(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCurrentStaff(prev => ({
      ...prev,
      [name]: name === 'hourlyRate' ? parseFloat(value) || 0 : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentGarage?.id) {
      toast({
        title: "Error",
        description: "No garage selected. Please try refreshing the page.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Convert our app format to Supabase format
      const supabaseData = {
        name: currentStaff.name,
        phone: currentStaff.phone,
        designation: currentStaff.designation,
        hourly_rate: currentStaff.hourlyRate,
        garage_id: currentGarage.id, // Ensure garage_id is set
      };

      console.log("Submitting staff data:", supabaseData); // Debug log
      
      if (isEditing) {
        const { error } = await supabase
          .from('staff')
          .update(supabaseData)
          .eq('id', currentStaff.id);

        if (error) {
          console.error("Error updating staff:", error);
          toast({
            title: "Error",
            description: `Failed to update staff: ${error.message}`,
            variant: "destructive",
          });
          return;
        }

        toast({
          title: "Staff Updated",
          description: `${currentStaff.name}'s information has been updated.`,
        });
      } else {
        const { data, error } = await supabase
          .from('staff')
          .insert(supabaseData)
          .select();

        if (error) {
          console.error("Error creating staff:", error);
          toast({
            title: "Error",
            description: `Failed to add staff: ${error.message}`,
            variant: "destructive",
          });
          return;
        }

        console.log("Create staff response:", data); // Debug log

        toast({
          title: "Staff Added",
          description: `${currentStaff.name} has been added to the staff list.`,
        });
      }

      setOpen(false);
      fetchStaff(); // Refresh the list after changes
    } catch (err) {
      console.error("Exception in handleSubmit:", err);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    const staffToDelete = staff.find(s => s.id === id);
    if (!staffToDelete) return;

    if (confirm(`Are you sure you want to delete ${staffToDelete.name}?`)) {
      try {
        const { error } = await supabase
          .from('staff')
          .delete()
          .eq('id', id);

        if (error) {
          console.error("Error deleting staff:", error);
          toast({
            title: "Error",
            description: `Failed to delete staff: ${error.message}`,
            variant: "destructive",
          });
          return;
        }

        toast({
          title: "Staff Removed",
          description: `${staffToDelete.name} has been removed from the staff list.`,
          variant: "destructive",
        });
        
        setStaff(staff.filter(s => s.id !== id));
      } catch (err) {
        console.error("Exception in handleDelete:", err);
        toast({
          title: "Error",
          description: "An unexpected error occurred while deleting",
          variant: "destructive",
        });
      }
    }
  };

  if (garageLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!currentGarage) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">No Garage Found</h2>
          <p className="text-muted-foreground">Please contact support if this issue persists.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Staff Management</h1>
          <p className="text-muted-foreground">
            Manage your auto shop's staff members and their information.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()} className="bg-garage-primary hover:bg-garage-secondary">
              <UserPlus className="mr-2 h-4 w-4" />
              Add Staff
            </Button>
          </DialogTrigger>
          <StaffForm
            currentStaff={currentStaff}
            isEditing={isEditing}
            onChange={handleChange}
            onSubmit={handleSubmit}
          />
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-center py-6">Loading staff data...</div>
      ) : (
        <StaffList
          staff={staff}
          onEdit={handleOpenDialog}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
};

export default Staff;
