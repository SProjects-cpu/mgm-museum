-- Migration: Cart System with Payment Support
-- Description: Add cart_items table and update time_slots for seat reservation

-- 1. Alter time_slots table to add missing columns
ALTER TABLE time_slots
ADD COLUMN IF NOT EXISTS slot_date DATE,
ADD COLUMN IF NOT EXISTS current_bookings INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS buffer_capacity INTEGER DEFAULT 5;

-- Add index on slot_date for performance
CREATE INDEX IF NOT EXISTS idx_time_slots_slot_date ON time_slots(slot_date);
CREATE INDEX IF NOT EXISTS idx_time_slots_exhibition_date ON time_slots(exhibition_id, slot_date);
CREATE INDEX IF NOT EXISTS idx_time_slots_show_date ON time_slots(show_id, slot_date);

-- 2. Create cart_items table for authenticated user cart persistence
CREATE TABLE IF NOT EXISTS cart_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
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

-- Policy: Users can view/manage own cart items
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

-- Policy: System can clean up expired items (service role)
CREATE POLICY "System can manage expired cart items"
  ON cart_items FOR ALL
  TO service_role
  USING (true);

-- 4. Create function to cleanup expired cart items and release seats
CREATE OR REPLACE FUNCTION cleanup_expired_cart_items()
RETURNS TABLE(cleaned_count INTEGER) AS $$
DECLARE
  expired_item RECORD;
  total_cleaned INTEGER := 0;
BEGIN
  -- Find and process expired cart items
  FOR expired_item IN
    SELECT id, time_slot_id, total_tickets
    FROM cart_items
    WHERE expires_at < NOW()
  LOOP
    -- Release seats by decrementing current_bookings
    UPDATE time_slots
    SET current_bookings = GREATEST(0, current_bookings - expired_item.total_tickets)
    WHERE id = expired_item.time_slot_id;
    
    -- Delete expired cart item
    DELETE FROM cart_items WHERE id = expired_item.id;
    
    total_cleaned := total_cleaned + 1;
  END LOOP;
  
  RETURN QUERY SELECT total_cleaned;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Create trigger to decrement current_bookings when cart items are deleted
CREATE OR REPLACE FUNCTION release_seats_on_cart_delete()
RETURNS TRIGGER AS $$
BEGIN
  -- Decrement current_bookings when cart item is deleted
  UPDATE time_slots
  SET current_bookings = GREATEST(0, current_bookings - OLD.total_tickets)
  WHERE id = OLD.time_slot_id;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER cart_items_release_seats
  BEFORE DELETE ON cart_items
  FOR EACH ROW
  EXECUTE FUNCTION release_seats_on_cart_delete();

-- 6. Create updated_at trigger for cart_items
CREATE TRIGGER cart_items_updated_at
  BEFORE UPDATE ON cart_items
  FOR EACH ROW
  EXECUTE FUNCTION update_schedule_overrides_updated_at();

-- 7. Add payment_order_id to bookings table for Razorpay integration
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS payment_order_id TEXT,
ADD COLUMN IF NOT EXISTS payment_id TEXT,
ADD COLUMN IF NOT EXISTS payment_signature TEXT,
ADD COLUMN IF NOT EXISTS payment_method TEXT,
ADD COLUMN IF NOT EXISTS payment_details JSONB DEFAULT '{}'::jsonb;

-- Add index on payment_order_id
CREATE INDEX IF NOT EXISTS idx_bookings_payment_order ON bookings(payment_order_id);

-- Add comments
COMMENT ON TABLE cart_items IS 'Temporary cart storage for authenticated users with 15-minute expiration';
COMMENT ON COLUMN cart_items.expires_at IS 'Cart item expires 15 minutes after creation';
COMMENT ON COLUMN time_slots.current_bookings IS 'Current number of reserved seats (includes cart + confirmed bookings)';
COMMENT ON COLUMN time_slots.buffer_capacity IS 'Buffer to prevent overbooking (default 5)';
COMMENT ON FUNCTION cleanup_expired_cart_items() IS 'Cleanup expired cart items and release reserved seats';
