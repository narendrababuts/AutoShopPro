
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save } from 'lucide-react';
import { useGarage } from '@/contexts/GarageContext';

interface GarageSettingsData {
  garage_name: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  registration_number: string;
}

const GarageSettings = () => {
  const [settings, setSettings] = useState<GarageSettingsData>({
    garage_name: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    registration_number: '',
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const { currentGarage } = useGarage();

  useEffect(() => {
    if (currentGarage?.id) {
      fetchSettings();
    }
  }, [currentGarage?.id]);

  const fetchSettings = async () => {
    if (!currentGarage?.id) {
      console.log('No garage selected, skipping settings fetch');
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      console.log('Fetching garage settings for garage:', currentGarage.id);
      
      const { data, error } = await supabase
        .from('settings')
        .select('setting_value')
        .eq('setting_key', 'garage_settings')
        .eq('garage_id', currentGarage.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      if (data && data.setting_value) {
        const parsedSettings = JSON.parse(data.setting_value);
        setSettings(prevSettings => ({ ...prevSettings, ...parsedSettings }));
      }
    } catch (error) {
      console.error('Error fetching garage settings:', error);
      toast({
        title: "Error",
        description: "Failed to load garage settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setSettings(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const saveSettings = async () => {
    if (!currentGarage?.id) {
      toast({
        title: "Error",
        description: "No garage selected",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      // Check if record exists for this garage
      const { data: existingData, error: checkError } = await supabase
        .from('settings')
        .select('id')
        .eq('setting_key', 'garage_settings')
        .eq('garage_id', currentGarage.id)
        .maybeSingle();
      
      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }
      
      // Insert or update with garage_id
      if (existingData) {
        const { error } = await supabase
          .from('settings')
          .update({ 
            setting_value: JSON.stringify(settings),
            garage_id: currentGarage.id 
          })
          .eq('setting_key', 'garage_settings')
          .eq('garage_id', currentGarage.id);
          
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('settings')
          .insert({
            setting_key: 'garage_settings',
            setting_value: JSON.stringify(settings),
            garage_id: currentGarage.id
          });
          
        if (error) throw error;
      }
      
      toast({
        title: "Settings saved",
        description: "Garage settings updated successfully"
      });
      
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Error",
        description: "Failed to save garage settings",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
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

  if (!currentGarage?.id) {
    return (
      <Card>
        <CardContent className="pt-6 flex justify-center">
          <div className="text-center">
            <h3 className="text-lg font-medium">No Garage Selected</h3>
            <p className="text-muted-foreground mt-2">Please select a garage to configure settings.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>General Garage Settings</CardTitle>
        <CardDescription>
          Configure your garage details and basic settings
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="garage_name">Garage Name</Label>
            <Input
              id="garage_name"
              name="garage_name"
              value={settings.garage_name}
              onChange={handleInputChange}
              placeholder="Enter your garage name"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              name="phone"
              value={settings.phone}
              onChange={handleInputChange}
              placeholder="Enter contact phone number"
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="address">Address</Label>
          <Textarea
            id="address"
            name="address"
            value={settings.address}
            onChange={handleInputChange}
            placeholder="Enter your garage address"
            rows={3}
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={settings.email}
              onChange={handleInputChange}
              placeholder="Enter contact email"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              name="website"
              value={settings.website}
              onChange={handleInputChange}
              placeholder="Enter your website URL"
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="registration_number">Business Registration Number</Label>
          <Input
            id="registration_number"
            name="registration_number"
            value={settings.registration_number}
            onChange={handleInputChange}
            placeholder="Enter business registration number"
          />
        </div>
        
        <div className="flex justify-end">
          <Button 
            onClick={saveSettings} 
            disabled={saving}
            className="bg-garage-primary hover:bg-garage-secondary"
          >
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Save className="mr-2 h-4 w-4" />
            Save Settings
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default GarageSettings;
