
-- Function to check if inventory updates exist for a job card
CREATE OR REPLACE FUNCTION check_inventory_updates_exist(job_card_id_param UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*) 
    FROM inventory_updates 
    WHERE job_card_id = job_card_id_param
  );
END;
$$ LANGUAGE plpgsql;

-- Function to record an inventory update
CREATE OR REPLACE FUNCTION record_inventory_update(
  job_card_id_param UUID,
  updated_items_param JSONB
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO inventory_updates (
    job_card_id, 
    updated_items
  ) VALUES (
    job_card_id_param, 
    updated_items_param
  );
END;
$$ LANGUAGE plpgsql;
