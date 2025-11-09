-- Create time slots for current date onwards (November 2025 - December 2025)
-- This script creates time slots for all active exhibitions

-- First, delete any old time slots (optional - comment out if you want to keep them)
-- DELETE FROM time_slots WHERE slot_date < CURRENT_DATE;

-- Create time slots for the next 60 days for all active exhibitions
WITH date_series AS (
  SELECT generate_series(
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '60 days',
    INTERVAL '1 day'
  )::date AS slot_date
),
time_series AS (
  SELECT unnest(ARRAY['10:00:00', '13:00:00', '16:00:00', '19:00:00'])::time AS start_time,
         unnest(ARRAY['11:00:00', '14:00:00', '17:00:00', '20:00:00'])::time AS end_time
),
exhibitions AS (
  SELECT id, name FROM exhibitions WHERE status = 'active'
)
INSERT INTO time_slots (
  exhibition_id,
  slot_date,
  start_time,
  end_time,
  capacity,
  active
)
SELECT 
  e.id,
  d.slot_date,
  t.start_time,
  t.end_time,
  50 as capacity,
  true as active
FROM date_series d
CROSS JOIN time_series t
CROSS JOIN exhibitions e
ON CONFLICT (exhibition_id, slot_date, start_time, end_time) DO NOTHING;

-- Verify the time slots were created
SELECT 
  slot_date,
  COUNT(*) as total_slots,
  COUNT(DISTINCT exhibition_id) as exhibitions_count,
  MIN(start_time) as first_slot,
  MAX(end_time) as last_slot
FROM time_slots
WHERE slot_date >= CURRENT_DATE
GROUP BY slot_date
ORDER BY slot_date
LIMIT 10;
