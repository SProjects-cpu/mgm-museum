-- Migration: Payment Orders Table
-- Description: Create payment_orders table for Razorpay integration

-- 1. Create payment_orders table
CREATE TABLE IF NOT EXISTS payment_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  razorpay_order_id TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'INR',
  status TEXT DEFAULT 'created',
  cart_snapshot JSONB NOT NULL,
  payment_id TEXT,
  payment_signature TEXT,
  payment_method TEXT,
  payment_email TEXT,
  payment_contact TEXT,
  error_code TEXT,
  error_description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT payment_orders_check_amount CHECK (amount >= 0),
  CONSTRAINT payment_orders_check_status CHECK (status IN ('created', 'attempted', 'paid', 'failed', 'cancelled'))
);

-- 2. Add indexes for payment_orders
CREATE INDEX IF NOT EXISTS idx_payment_orders_razorpay_order ON payment_orders(razorpay_order_id);
CREATE INDEX IF NOT EXISTS idx_payment_orders_user ON payment_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_orders_status ON payment_orders(status);
CREATE INDEX IF NOT EXISTS idx_payment_orders_created ON payment_orders(created_at);

-- 3. Enable RLS on payment_orders
ALTER TABLE payment_orders ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view own payment orders
CREATE POLICY "Users can view own payment orders"
  ON payment_orders FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: System can manage all payment orders (service role)
CREATE POLICY "System can manage payment orders"
  ON payment_orders FOR ALL
  TO service_role
  USING (true);

-- 4. Create updated_at trigger for payment_orders
CREATE TRIGGER payment_orders_updated_at
  BEFORE UPDATE ON payment_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_schedule_overrides_updated_at();

-- 5. Add comments
COMMENT ON TABLE payment_orders IS 'Payment orders created via Razorpay for booking transactions';
COMMENT ON COLUMN payment_orders.razorpay_order_id IS 'Unique order ID from Razorpay';
COMMENT ON COLUMN payment_orders.cart_snapshot IS 'Snapshot of cart items at time of order creation';
COMMENT ON COLUMN payment_orders.status IS 'Payment status: created, attempted, paid, failed, cancelled';
