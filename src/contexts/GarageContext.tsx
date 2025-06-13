
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Garage {
  id: string;
  name: string;
  owner_user_id: string;
  created_at: string;
}

interface GarageContextType {
  currentGarage: Garage | null;
  loading: boolean;
  refreshGarage: () => Promise<void>;
}

const GarageContext = createContext<GarageContextType | undefined>(undefined);

export const useGarage = () => {
  const context = useContext(GarageContext);
  if (context === undefined) {
    throw new Error('useGarage must be used within a GarageProvider');
  }
  return context;
};

export const GarageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentGarage, setCurrentGarage] = useState<Garage | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchCurrentGarage = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setCurrentGarage(null);
        setLoading(false);
        return;
      }

      // Fetch ONLY the current user's garage - enforce strict isolation
      const { data: garages, error } = await supabase
        .from('garages')
        .select('*')
        .eq('owner_user_id', user.id) // Only fetch user's own garage
        .limit(1);

      if (error) {
        console.error('Error fetching garage:', error);
        toast({
          title: "Error",
          description: "Failed to load garage information",
          variant: "destructive",
        });
        return;
      }

      if (garages && garages.length > 0) {
        setCurrentGarage(garages[0]);
        console.log('Current garage set:', garages[0].id);
      } else {
        // Create a garage for the user if none exists
        const { data: newGarage, error: createError } = await supabase
          .from('garages')
          .insert({
            owner_user_id: user.id,
            name: 'My Garage'
          })
          .select()
          .single();

        if (createError) {
          console.error('Error creating garage:', createError);
          toast({
            title: "Error",
            description: "Failed to create garage",
            variant: "destructive",
          });
        } else {
          setCurrentGarage(newGarage);
          console.log('New garage created:', newGarage.id);
        }
      }
    } catch (error) {
      console.error('Error in fetchCurrentGarage:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshGarage = async () => {
    setLoading(true);
    await fetchCurrentGarage();
  };

  useEffect(() => {
    fetchCurrentGarage();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        fetchCurrentGarage();
      } else if (event === 'SIGNED_OUT') {
        setCurrentGarage(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <GarageContext.Provider value={{ currentGarage, loading, refreshGarage }}>
      {children}
    </GarageContext.Provider>
  );
};
