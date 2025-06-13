
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, Save, Trash } from 'lucide-react';
import NumberInput from '@/components/ui/number-input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface GstSlab {
  id?: string;
  name: string;
  cgst_percent: number;
  sgst_percent: number;
  igst_percent: number;
  effective_from: string;
  effective_to?: string;
}

const GstSettings = () => {
  const [gstSlabs, setGstSlabs] = useState<GstSlab[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newSlab, setNewSlab] = useState<GstSlab>({
    name: '',
    cgst_percent: 9,
    sgst_percent: 9,
    igst_percent: 18,
    effective_from: new Date().toISOString().split('T')[0],
  });
  const [slabToDelete, setSlabToDelete] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchGstSlabs();
  }, []);

  const fetchGstSlabs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('gst_slabs')
        .select('*')
        .order('name');

      if (error) {
        throw error;
      }

      setGstSlabs(data || []);
    } catch (error) {
      console.error('Error fetching GST slabs:', error);
      toast({
        title: "Error",
        description: "Failed to load GST slabs",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>, index?: number) => {
    const { name, value } = e.target;

    if (index !== undefined) {
      // Update existing slab
      const updatedSlabs = [...gstSlabs];
      updatedSlabs[index] = {
        ...updatedSlabs[index],
        [name]: value
      };
      setGstSlabs(updatedSlabs);
    } else {
      // Update new slab form
      setNewSlab({
        ...newSlab,
        [name]: value
      });
    }
  };

  const handleNumberChange = (name: string, value: number, index?: number) => {
    if (index !== undefined) {
      // Update existing slab
      const updatedSlabs = [...gstSlabs];
      updatedSlabs[index] = {
        ...updatedSlabs[index],
        [name]: value
      };
      setGstSlabs(updatedSlabs);
    } else {
      // Update new slab form
      setNewSlab({
        ...newSlab,
        [name]: value
      });
    }
  };

  const handleAddSlab = async () => {
    // Validate form
    if (!newSlab.name || newSlab.cgst_percent < 0 || newSlab.sgst_percent < 0 || newSlab.igst_percent < 0) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields with valid values",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const { data, error } = await supabase
        .from('gst_slabs')
        .insert({
          name: newSlab.name,
          cgst_percent: newSlab.cgst_percent,
          sgst_percent: newSlab.sgst_percent,
          igst_percent: newSlab.igst_percent,
          effective_from: newSlab.effective_from
        })
        .select();

      if (error) throw error;

      toast({
        title: "Success",
        description: "GST slab added successfully",
      });

      setNewSlab({
        name: '',
        cgst_percent: 9,
        sgst_percent: 9,
        igst_percent: 18,
        effective_from: new Date().toISOString().split('T')[0],
      });

      // Refresh the list
      fetchGstSlabs();
    } catch (error) {
      console.error('Error adding GST slab:', error);
      toast({
        title: "Error",
        description: "Failed to add GST slab",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateSlab = async (index: number) => {
    const slab = gstSlabs[index];
    
    // Validate form
    if (!slab.name || slab.cgst_percent < 0 || slab.sgst_percent < 0 || slab.igst_percent < 0) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields with valid values",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('gst_slabs')
        .update({
          name: slab.name,
          cgst_percent: slab.cgst_percent,
          sgst_percent: slab.sgst_percent,
          igst_percent: slab.igst_percent,
          effective_from: slab.effective_from,
          effective_to: slab.effective_to
        })
        .eq('id', slab.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "GST slab updated successfully",
      });

      // Refresh the list
      fetchGstSlabs();
    } catch (error) {
      console.error('Error updating GST slab:', error);
      toast({
        title: "Error",
        description: "Failed to update GST slab",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSlab = async () => {
    if (!slabToDelete) return;
    
    try {
      const { error } = await supabase
        .from('gst_slabs')
        .delete()
        .eq('id', slabToDelete);

      if (error) throw error;

      toast({
        title: "Success",
        description: "GST slab deleted successfully",
      });

      // Refresh the list
      fetchGstSlabs();
    } catch (error) {
      console.error('Error deleting GST slab:', error);
      toast({
        title: "Error",
        description: "Failed to delete GST slab",
        variant: "destructive",
      });
    } finally {
      setSlabToDelete(null);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>GST Slabs Configuration</CardTitle>
          <CardDescription>
            Add, edit, or remove GST slabs for invoice calculations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            {gstSlabs.map((slab, index) => (
              <div key={slab.id} className="border p-4 rounded-md">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium">{slab.name}</h3>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => setSlabToDelete(slab.id)}
                  >
                    <Trash className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="space-y-2">
                    <Label htmlFor={`name-${index}`}>Slab Name</Label>
                    <Input
                      id={`name-${index}`}
                      name="name"
                      value={slab.name}
                      onChange={(e) => handleInputChange(e, index)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor={`effective-from-${index}`}>Effective From</Label>
                    <Input
                      id={`effective-from-${index}`}
                      name="effective_from"
                      type="date"
                      value={slab.effective_from}
                      onChange={(e) => handleInputChange(e, index)}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="space-y-2">
                    <Label htmlFor={`cgst-${index}`}>CGST %</Label>
                    <NumberInput
                      id={`cgst-${index}`}
                      value={slab.cgst_percent}
                      onValueChange={(value) => handleNumberChange('cgst_percent', value, index)}
                      min={0}
                      max={100}
                      step={0.01}
                      allowDecimals
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor={`sgst-${index}`}>SGST %</Label>
                    <NumberInput
                      id={`sgst-${index}`}
                      value={slab.sgst_percent}
                      onValueChange={(value) => handleNumberChange('sgst_percent', value, index)}
                      min={0}
                      max={100}
                      step={0.01}
                      allowDecimals
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor={`igst-${index}`}>IGST %</Label>
                    <NumberInput
                      id={`igst-${index}`}
                      value={slab.igst_percent}
                      onValueChange={(value) => handleNumberChange('igst_percent', value, index)}
                      min={0}
                      max={100}
                      step={0.01}
                      allowDecimals
                    />
                  </div>
                </div>
                
                <Button 
                  onClick={() => handleUpdateSlab(index)} 
                  className="w-full"
                >
                  Update Slab
                </Button>
              </div>
            ))}
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Add New GST Slab</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="new-name">Slab Name</Label>
                  <Input
                    id="new-name"
                    name="name"
                    value={newSlab.name}
                    onChange={handleInputChange}
                    placeholder="e.g., GST 18%"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="new-effective-from">Effective From</Label>
                  <Input
                    id="new-effective-from"
                    name="effective_from"
                    type="date"
                    value={newSlab.effective_from}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="new-cgst">CGST %</Label>
                  <NumberInput
                    id="new-cgst"
                    value={newSlab.cgst_percent}
                    onValueChange={(value) => handleNumberChange('cgst_percent', value)}
                    min={0}
                    max={100}
                    step={0.01}
                    allowDecimals
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="new-sgst">SGST %</Label>
                  <NumberInput
                    id="new-sgst"
                    value={newSlab.sgst_percent}
                    onValueChange={(value) => handleNumberChange('sgst_percent', value)}
                    min={0}
                    max={100}
                    step={0.01}
                    allowDecimals
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="new-igst">IGST %</Label>
                  <NumberInput
                    id="new-igst"
                    value={newSlab.igst_percent}
                    onValueChange={(value) => handleNumberChange('igst_percent', value)}
                    min={0}
                    max={100}
                    step={0.01}
                    allowDecimals
                  />
                </div>
              </div>
              
              <Button 
                onClick={handleAddSlab} 
                disabled={saving} 
                className="w-full"
              >
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Plus className="mr-2 h-4 w-4" />
                Add GST Slab
              </Button>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
      
      <AlertDialog open={!!slabToDelete} onOpenChange={() => setSlabToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete GST Slab</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this GST slab? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteSlab} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default GstSettings;
