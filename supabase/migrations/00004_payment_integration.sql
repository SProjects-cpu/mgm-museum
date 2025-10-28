-- Add Razorpay payment fields to bookings table
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS razorpay_order_id TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS razorpay_payment_id TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS razorpay_signature TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS payment_method TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS amount_paid INTEGER;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS payment_timestamp TIMESTAMPTZ;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS refund_id TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS refund_amount INTEGER;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS refund_status TEXT;

-- Create payment_logs table for audit trail
CREATE TABLE IF NOT EXISTS payment_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  razorpay_event_id TEXT,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_bookings_razorpay_order_id ON bookings(razorpay_order_id);
CREATE INDEX IF NOT EXISTS idx_bookings_razorpay_payment_id ON bookings(razorpay_payment_id);
CREATE INDEX IF NOT EXISTS idx_bookings_payment_status ON bookings(payment_status);
CREATE INDEX IF NOT EXISTS idx_payment_logs_booking_id ON payment_logs(booking_id);
CREATE INDEX IF NOT EXISTS idx_payment_logs_event_type ON payment_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_payment_logs_created_at ON payment_logs(created_at);

-- Add RLS policies for payment_logs
ALTER TABLE payment_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can view all payment logs"
  ON payment_logs FOR SELECT
  USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "System can insert payment logs"
  ON payment_logs FOR INSERT
  WITH CHECK (true);

-- Update payment_status enum if needed
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status_enum') THEN
    CREATE TYPE payment_status_enum AS ENUM ('pending', 'completed', 'failed', 'refunded', 'cancelled');
    ALTER TABLE bookings ALTER COLUMN payment_status TYPE payment_status_enum USING payment_status::payment_status_enum;
  END IF;
END $$;
