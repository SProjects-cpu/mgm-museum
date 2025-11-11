-- Check time slots structure and data
-- Run this to understand what's in the database

-- 1. Check template slots (day_of_week based)
SELECT 
  'TEMPLATE SLOTS' as type,
  id,
  day_of_week,
  start_time,
  end_time,
  capacity,
  active,
  created_at
FROM time_slots
WHERE exhibition_id = '44d3a98d-faff-4dcf-a255-436cefdd97ef'
  AND day_of_week IS NOT NULL
ORDER BY day_of_week, start_time;

-- 2. Check date-specific slots (slot_date based)
SELECT 
  'DATE-SPECIFIC SLOTS' as type,
  id,
  slot_date,
  start_time,
  end_time,
  capacity,
  current_bookings,
  active,
  created_at
FROM time_slots
WHERE exhibition_id = '44d3a98d-faff-4dcf-a255-436cefdd97ef'
  AND slot_date IS NOT NULL
ORDER BY slot_date, start_time
LIMIT 20;

-- 3. Check slots with BOTH day_of_week AND slot_date
SELECT 
  'HYBRID SLOTS' as type,
  id,
  day_of_week,
  slot_date,
  start_time,
  end_time
FROM time_slots
WHERE exhibition_id = '44d3a98d-faff-4dcf-a255-436cefdd97ef'
  AND day_of_week IS NOT NULL
  AND slot_date IS NOT NULL
LIMIT 10;

-- 4. Count by type
SELECT 
  CASE 
    WHEN day_of_week IS NOT NULL AND slot_date IS NULL THEN 'Template Only'
    WHEN day_of_week IS NULL AND slot_date IS NOT NULL THEN 'Date-Specific Only'
    WHEN day_of_week IS NOT NULL AND slot_date IS NOT NULL THEN 'Hybrid'
    ELSE 'Neither (Invalid)'
  END as slot_type,
  COUNT(*) as count
FROM time_slots
WHERE exhibition_id = '44d3a98d-faff-4dcf-a255-436cefdd97ef'
GROUP BY slot_type;
