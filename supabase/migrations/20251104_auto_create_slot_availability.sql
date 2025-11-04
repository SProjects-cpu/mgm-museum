-- Create a trigger to automatically populate slot_availability when a new time_slot is created
-- This ensures that admin-created time slots immediately have availability data

CREATE OR REPLACE FUNCTION create_slot_availability_for_new_timeslot()
RETURNS TRIGGER AS $$
DECLARE
  date_offset INT;
  target_date DATE;
BEGIN
  -- Create availability records for the next 90 days
  FOR date_offset IN 0..89 LOOP
    target_date := CURRENT_DATE + date_offset;
    
    INSERT INTO slot_availability (
      time_slot_id,
      date,
      available_capacity,
      booked_count
    ) VALUES (
      NEW.id,
      target_date,
      NEW.capacity,
      0
    )
    ON CONFLICT (time_slot_id, date) DO NOTHING;
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS auto_create_slot_availability ON time_slots;

CREATE TRIGGER auto_create_slot_availability
AFTER INSERT ON time_slots
FOR EACH ROW
WHEN (NEW.active = true)
EXECUTE FUNCTION create_slot_availability_for_new_timeslot();

-- Also create a trigger for exhibition_schedules when a new exhibition is created
CREATE OR REPLACE FUNCTION create_schedules_for_new_exhibition()
RETURNS TRIGGER AS $$
DECLARE
  date_offset INT;
  target_date DATE;
BEGIN
  -- Create schedule records for the next 90 days
  FOR date_offset IN 0..89 LOOP
    target_date := CURRENT_DATE + date_offset;
    
    INSERT INTO exhibition_schedules (
      exhibition_id,
      date,
      is_available,
      capacity_override
    ) VALUES (
      NEW.id,
      target_date,
      true,
      NEW.capacity
    )
    ON CONFLICT (exhibition_id, date) DO NOTHING;
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS auto_create_exhibition_schedules ON exhibitions;

CREATE TRIGGER auto_create_exhibition_schedules
AFTER INSERT ON exhibitions
FOR EACH ROW
WHEN (NEW.status = 'active')
EXECUTE FUNCTION create_schedules_for_new_exhibition();
