-- ============================================
-- CRITICAL: Apply Cart System Migration
-- ============================================
-- Run this in Supabase SQL Editor to fix cart errors
-- This will create the missing cart_items table and add missing columns to time_slots

-- 1. Add missing columns to time_slots table
ALTER TABLE time_slots
ADD COLUMN IF NOT EXISTS slot_date DATE,
ADD COLUMN IF NOT EXISTS current_bookings INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS buffer_capacity INTEGER DEFAULT 5;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_time_slots_slot_date ON time_slots(slot_date);
CREATE INDEX IF NOT EXISTS idx_time_slots_exhibition_date ON time_slots(exhibition_id, slot_date);
CREATE INDEX IF NOT EXISTS idx_time_slots_show_date ON time_slots(show_id, slot_date);

-- 2. Create cart_items table
CREATE TABLE IF NOT EXISTS cart_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  time_slot_id UUID REFERENCES time_slots(id) ON DELETE CASCADE,
  exhibition_id UUID REFERENCES exhibitions(id) ON DELETE SET NULL,
  show_id UUID REFERENCES shows(id) ON DELETE SET NULL,
  exhibition_name TEXT,
  show_name TEXT,
  booking_date DATE NOT NULL,
  adult_tickets INTEGER DEFAULT 0,
  child_tickets INTEGER DEFAULT 0,
  student_tickets INTEGER DEFAULT 0,
  senior_tickets INTEGER DEFAULT 0,
  total_tickets INTEGER NOT NULL,
  subtotal DECIMAL(10, 2) DEFAULT 0,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT cart_items_check_entity CHECK (exhibition_id IS NOT NULL OR show_id IS NOT NULL),
  CONSTRAINT cart_items_check_tickets CHECK (total_tickets > 0)
);

-- Add indexes for cart_items
CREATE INDEX IF NOT EXISTS idx_cart_items_user ON cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_expires ON cart_items(expires_at);
CREATE INDEX IF NOT EXISTS idx_cart_items_time_slot ON cart_items(time_slot_id);

-- 3. Enable RLS on cart_items
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view own cart items" ON cart_items;
DROP POLICY IF EXISTS "Users can insert own cart items" ON cart_items;
DROP POLICY IF EXISTS "Users can update own cart items" ON cart_items;
DROP POLICY IF EXISTS "Users can delete own cart items" ON cart_items;
DROP POLICY IF EXISTS "System can manage expired cart items" ON cart_items;

-- Create RLS policies for authenticated users
CREATE POLICY "Users can view own cart items"
  ON cart_items FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own cart items"
  ON cart_items FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own cart items"
  ON cart_items FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own cart items"
  ON cart_items FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create policy for service role
CREATE POLICY "System can manage expired cart items"
  ON cart_items FOR ALL
  TO service_role
  USING (true);

-- 4. Create function to cleanup expired cart items
CREATE OR REPLACE FUNCTION cleanup_expired_cart_items()
RETURNS TABLE(cleaned_count INTEGER) AS $$
DECLARE
  expired_item RECORD;
  total_cleaned INTEGER := 0;
BEGIN
  FOR expired_item IN
    SELECT id, time_slot_id, total_tickets
    FROM cart_items
    WHERE expires_at < NOW()
  LOOP
    UPDATE time_slots
    SET current_bookings = GREATEST(0, current_bookings - expired_item.total_tickets)
    WHERE id = expired_item.time_slot_id;
    
    DELETE FROM cart_items WHERE id = expired_item.id;
    
    total_cleaned := total_cleaned + 1;
  END LOOP;
  
  RETURN QUERY SELECT total_cleaned;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Create trigger to release seats when cart items are deleted
CREATE OR REPLACE FUNCTION release_seats_on_cart_delete()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE time_slots
  SET current_bookings = GREATEST(0, current_bookings - OLD.total_tickets)
  WHERE id = OLD.time_slot_id;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS cart_items_release_seats ON cart_items;
CREATE TRIGGER cart_items_release_seats
  BEFORE DELETE ON cart_items
  FOR EACH ROW
  EXECUTE FUNCTION release_seats_on_cart_delete();

-- 6. Add payment columns to bookings table
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS payment_order_id TEXT,
ADD COLUMN IF NOT EXISTS payment_id TEXT,
ADD COLUMN IF NOT EXISTS payment_signature TEXT,
ADD COLUMN IF NOT EXISTS payment_method TEXT,
ADD COLUMN IF NOT EXISTS payment_details JSONB DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_bookings_payment_order ON bookings(payment_order_id);

-- 7. Verify the migration
SELECT 
  'cart_items table' as check_name,
  CASE WHEN EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'cart_items'
  ) THEN '✅ EXISTS' ELSE '❌ MISSING' END as status
UNION ALL
SELECT 
  'time_slots.current_bookings column' as check_name,
  CASE WHEN EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'time_slots' 
    AND column_name = 'current_bookings'
  ) THEN '✅ EXISTS' ELSE '❌ MISSING' END as status
UNION ALL
SELECT 
  'time_slots.buffer_capacity column' as check_name,
  CASE WHEN EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'time_slots' 
    AND column_name = 'buffer_capacity'
  ) THEN '✅ EXISTS' ELSE '❌ MISSING' END as status
UNION ALL
SELECT 
  'RLS policies on cart_items' as check_name,
  CASE WHEN EXISTS (
    SELECT FROM pg_policies 
    WHERE tablename = 'cart_items'
  ) THEN '✅ EXISTS (' || COUNT(*)::text || ' policies)' ELSE '❌ MISSING' END as status
FROM pg_policies 
WHERE tablename = 'cart_items';

-- Success message
SELECT '🎉 Migration applied successfully! Cart system is now ready.' as message;
