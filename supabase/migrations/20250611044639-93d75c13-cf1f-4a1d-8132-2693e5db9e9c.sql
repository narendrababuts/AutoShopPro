
-- Drop the existing unique constraint on setting_key
ALTER TABLE settings DROP CONSTRAINT IF EXISTS settings_setting_key_key;

-- Create a new unique constraint on the combination of setting_key and garage_id
ALTER TABLE settings ADD CONSTRAINT settings_setting_key_garage_id_unique 
UNIQUE (setting_key, garage_id);
