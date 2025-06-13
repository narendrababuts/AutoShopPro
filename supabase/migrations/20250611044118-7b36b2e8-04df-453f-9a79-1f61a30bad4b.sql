
-- Ensure garage_id column exists in settings table (if not already present)
ALTER TABLE settings ADD COLUMN IF NOT EXISTS garage_id UUID REFERENCES garages(id);

-- Create a trigger to automatically set garage_id for new settings records
CREATE OR REPLACE FUNCTION set_settings_garage_id()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto-assign garage_id if not provided
  IF NEW.garage_id IS NULL THEN
    NEW.garage_id := get_current_garage_id();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for settings table
DROP TRIGGER IF EXISTS trigger_set_settings_garage_id ON settings;
CREATE TRIGGER trigger_set_settings_garage_id
  BEFORE INSERT ON settings
  FOR EACH ROW
  EXECUTE FUNCTION set_settings_garage_id();

-- Update existing settings records to have the correct garage_id
UPDATE settings 
SET garage_id = (
  SELECT id FROM garages 
  WHERE owner_user_id = auth.uid() 
  LIMIT 1
)
WHERE garage_id IS NULL;

-- Enable Row Level Security on settings table
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for settings table to ensure garage isolation
DROP POLICY IF EXISTS "Users can only access their garage settings" ON settings;
CREATE POLICY "Users can only access their garage settings" 
ON settings 
FOR ALL 
USING (garage_id = get_current_garage_id()) 
WITH CHECK (garage_id = get_current_garage_id());
