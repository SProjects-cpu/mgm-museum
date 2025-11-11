-- Check what data is related to exhibitions
-- Run this to understand foreign key dependencies

-- 1. Check pricing
SELECT 
  'pricing' as table_name,
  COUNT(*) as count,
  exhibition_id
FROM pricing
WHERE exhibition_id = 'YOUR_EXHIBITION_ID'
GROUP BY exhibition_id;

-- 2. Check time_slots
SELECT 
  'time_slots' as table_name,
  COUNT(*) as count,
  exhibition_id
FROM time_slots
WHERE exhibition_id = 'YOUR_EXHIBITION_ID'
GROUP BY exhibition_id;

-- 3. Check bookings
SELECT 
  'bookings' as table_name,
  COUNT(*) as count,
  exhibition_id
FROM bookings
WHERE exhibition_id = 'YOUR_EXHIBITION_ID'
GROUP BY exhibition_id;

-- 4. Check exhibition_content_sections
SELECT 
  'exhibition_content_sections' as table_name,
  COUNT(*) as count,
  exhibition_id
FROM exhibition_content_sections
WHERE exhibition_id = 'YOUR_EXHIBITION_ID'
GROUP BY exhibition_id;

-- 5. Check cart_items
SELECT 
  'cart_items' as table_name,
  COUNT(*) as count,
  exhibition_id
FROM cart_items
WHERE exhibition_id = 'YOUR_EXHIBITION_ID'
GROUP BY exhibition_id;

-- 6. Check exhibition_schedules
SELECT 
  'exhibition_schedules' as table_name,
  COUNT(*) as count,
  exhibition_id
FROM exhibition_schedules
WHERE exhibition_id = 'YOUR_EXHIBITION_ID'
GROUP BY exhibition_id;
