
import React, { useState } from 'react';
import { Camera, X, Upload, ImagePlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { supabase } from '@/integrations/supabase/client';
import { JobCardPhoto } from '@/types/jobCard';
import { useToast } from '@/hooks/use-toast';

interface JobCardPhotosProps {
  photos: JobCardPhoto[];
  jobCardId: string;
  onChange: (photos: JobCardPhoto[]) => void;
}

const JobCardPhotos = ({ photos, jobCardId, onChange }: JobCardPhotosProps) => {
  const [activeTab, setActiveTab] = useState('before');
  const [photoType, setPhotoType] = useState<'before' | 'after'>('before');
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const beforePhotos = photos.filter(photo => photo.type === 'before');
  const afterPhotos = photos.filter(photo => photo.type === 'after');

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    if (!jobCardId) {
      toast({
        title: "Save Required",
        description: "Please save the job card first before adding photos.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsUploading(true);
      const file = files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
      const filePath = `${jobCardId}/${fileName}`;

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase
        .storage
        .from('job-photos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: publicUrlData } = supabase
        .storage
        .from('job-photos')
        .getPublicUrl(filePath);

      const publicUrl = publicUrlData.publicUrl;

      // Store reference in job_photos table
      const { data: photoData, error: photoError } = await supabase
        .from('job_photos')
        .insert({
          job_card_id: jobCardId,
          photo_type: photoType,
          url: publicUrl,
        })
        .select('*')
        .single();

      if (photoError) throw photoError;

      // Update the photos state
      const newPhoto: JobCardPhoto = {
        id: photoData.id,
        type: photoData.photo_type as 'before' | 'after',
        url: photoData.url,
      };

      const updatedPhotos = [...photos, newPhoto];
      onChange(updatedPhotos);

      toast({
        title: "Success",
        description: "Photo uploaded successfully",
      });
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload photo. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      // Clear the input
      event.target.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };
  
  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!jobCardId) {
      toast({
        title: "Save Required",
        description: "Please save the job card first before adding photos.",
        variant: "destructive",
      });
      return;
    }
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      try {
        setIsUploading(true);
        
        // Process the first file (can be extended to handle multiple)
        const file = files[0];
        
        // Check if it's an image
        if (!file.type.startsWith('image/')) {
          toast({
            title: "Invalid File",
            description: "Please upload an image file.",
            variant: "destructive",
          });
          return;
        }
        
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
        const filePath = `${jobCardId}/${fileName}`;

        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase
          .storage
          .from('job-photos')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: publicUrlData } = supabase
          .storage
          .from('job-photos')
          .getPublicUrl(filePath);

        const publicUrl = publicUrlData.publicUrl;

        // Store reference in job_photos table
        const { data: photoData, error: photoError } = await supabase
          .from('job_photos')
          .insert({
            job_card_id: jobCardId,
            photo_type: photoType,
            url: publicUrl,
          })
          .select('*')
          .single();

        if (photoError) throw photoError;

        // Update the photos state
        const newPhoto: JobCardPhoto = {
          id: photoData.id,
          type: photoData.photo_type as 'before' | 'after',
          url: photoData.url,
        };

        const updatedPhotos = [...photos, newPhoto];
        onChange(updatedPhotos);

        toast({
          title: "Success",
          description: "Photo uploaded successfully",
        });
      } catch (error) {
        console.error('Error uploading photo:', error);
        toast({
          title: "Upload Failed",
          description: "Failed to upload photo. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleRemovePhoto = async (photoToRemove: JobCardPhoto) => {
    try {
      if (photoToRemove.id) {
        // Remove from database
        const { error } = await supabase
          .from('job_photos')
          .delete()
          .eq('id', photoToRemove.id);

        if (error) throw error;

        // Extract file path from URL
        const urlParts = photoToRemove.url.split('/');
        const filePath = urlParts.slice(-2).join('/'); // Get the last two segments (jobCardId/fileName)

        // Remove from storage
        const { error: storageError } = await supabase
          .storage
          .from('job-photos')
          .remove([filePath]);

        if (storageError) {
          console.error('Error removing file from storage:', storageError);
          // Continue anyway since the database record is gone
        }
      }

      // Update state
      const updatedPhotos = photos.filter(photo => photo !== photoToRemove);
      onChange(updatedPhotos);

      toast({
        title: "Success",
        description: "Photo removed successfully",
      });
    } catch (error) {
      console.error('Error removing photo:', error);
      toast({
        title: "Remove Failed",
        description: "Failed to remove photo. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">Job Photos</h3>
      
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList>
              <TabsTrigger value="before" className="flex-1">Before Photos</TabsTrigger>
              <TabsTrigger value="after" className="flex-1">After Photos</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        
        <TabsContent value="before" className="space-y-4">
          <div>
            <RadioGroup 
              defaultValue="before" 
              value={photoType} 
              onValueChange={(value) => setPhotoType(value as 'before' | 'after')}
              className="flex flex-row space-x-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="before" id="before" checked={photoType === 'before'} />
                <Label htmlFor="before">Before Photo</Label>
              </div>
            </RadioGroup>
          </div>
          
          <div 
            className="border-2 border-dashed rounded-md p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => document.getElementById('photo-upload-before')?.click()}
          >
            <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-2" />
            <p className="text-muted-foreground mb-1">Drag and drop image here or click to browse</p>
            <p className="text-xs text-muted-foreground">Supported formats: JPG, PNG, GIF</p>
            <input 
              id="photo-upload-before" 
              type="file" 
              accept="image/*" 
              onChange={handleFileChange}
              disabled={isUploading || !jobCardId} 
              className="hidden"
            />
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
            {beforePhotos.length > 0 ? (
              beforePhotos.map((photo, index) => (
                <div key={index} className="relative border rounded-md overflow-hidden">
                  <img 
                    src={photo.url} 
                    alt={`Before ${index + 1}`} 
                    className="w-full h-40 object-cover"
                  />
                  <Button 
                    type="button"
                    variant="destructive" 
                    size="icon" 
                    className="absolute top-2 right-2 h-8 w-8 rounded-full opacity-80"
                    onClick={() => handleRemovePhoto(photo)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-8 border rounded-md bg-muted/10">
                <Camera className="mx-auto h-8 w-8 text-muted-foreground" />
                <p className="text-muted-foreground mt-2">No before photos added yet</p>
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="after" className="space-y-4">
          <div>
            <RadioGroup 
              defaultValue="after" 
              value={photoType} 
              onValueChange={(value) => setPhotoType(value as 'before' | 'after')}
              className="flex flex-row space-x-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="after" id="after" checked={photoType === 'after'} />
                <Label htmlFor="after">After Photo</Label>
              </div>
            </RadioGroup>
          </div>
          
          <div 
            className="border-2 border-dashed rounded-md p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => document.getElementById('photo-upload-after')?.click()}
          >
            <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-2" />
            <p className="text-muted-foreground mb-1">Drag and drop image here or click to browse</p>
            <p className="text-xs text-muted-foreground">Supported formats: JPG, PNG, GIF</p>
            <input 
              id="photo-upload-after" 
              type="file" 
              accept="image/*" 
              onChange={handleFileChange}
              disabled={isUploading || !jobCardId} 
              className="hidden"
            />
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
            {afterPhotos.length > 0 ? (
              afterPhotos.map((photo, index) => (
                <div key={index} className="relative border rounded-md overflow-hidden">
                  <img 
                    src={photo.url} 
                    alt={`After ${index + 1}`} 
                    className="w-full h-40 object-cover"
                  />
                  <Button 
                    type="button"
                    variant="destructive" 
                    size="icon" 
                    className="absolute top-2 right-2 h-8 w-8 rounded-full opacity-80"
                    onClick={() => handleRemovePhoto(photo)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-8 border rounded-md bg-muted/10">
                <Camera className="mx-auto h-8 w-8 text-muted-foreground" />
                <p className="text-muted-foreground mt-2">No after photos added yet</p>
              </div>
            )}
          </div>
        </TabsContent>
      </div>
    </div>
  );
};

// Helper component for file input
const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => {
    return (
      <input
        className={className}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export default JobCardPhotos;
