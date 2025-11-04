-- Populate exhibition_schedules for the next 90 days
-- This makes dates available for booking

DO $$
DECLARE
  exhibition_record RECORD;
  date_offset INT;
  current_date DATE;
BEGIN
  -- For each active exhibition
  FOR exhibition_record IN 
    SELECT id, capacity FROM exhibitions WHERE status = 'active'
  LOOP
    -- Create schedules for next 90 days
    FOR date_offset IN 0..89 LOOP
      current_date := CURRENT_DATE + date_offset;
      
      INSERT INTO exhibition_schedules (
        exhibition_id,
        date,
        is_available,
        capacity_override
      ) VALUES (
        exhibition_record.id,
        current_date,
        true,
        exhibition_record.capacity
      )
      ON CONFLICT (exhibition_id, date) DO NOTHING;
    END LOOP;
  END LOOP;
END $$;

-- Populate slot_availability for time slots
-- This tracks available capacity per time slot per date

DO $$
DECLARE
  slot_record RECORD;
  date_offset INT;
  current_date DATE;
BEGIN
  -- For each time slot
  FOR slot_record IN 
    SELECT id, exhibition_id, capacity FROM time_slots WHERE active = true
  LOOP
    -- Create availability for next 90 days
    FOR date_offset IN 0..89 LOOP
      current_date := CURRENT_DATE + date_offset;
      
      INSERT INTO slot_availability (
        time_slot_id,
        date,
        available_capacity,
        booked_count
      ) VALUES (
        slot_record.id,
        current_date,
        slot_record.capacity,
        0
      )
      ON CONFLICT (time_slot_id, date) DO NOTHING;
    END LOOP;
  END LOOP;
END $$;
