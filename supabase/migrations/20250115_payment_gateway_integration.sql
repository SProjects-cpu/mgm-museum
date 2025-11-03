-- Payment Gateway Integration Migration
-- This migration adds tables and functions for payment gateway integration

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create enum types for payment system
CREATE TYPE payment_method AS ENUM ('upi', 'bank_transfer');
CREATE TYPE payment_status AS ENUM ('initiated', 'processing', 'completed', 'failed', 'expired', 'refunded');
CREATE TYPE ticket_status AS ENUM ('generated', 'sent', 'validated', 'expired', 'cancelled');

-- Bank accounts table for managing multiple payment accounts
CREATE TABLE bank_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_name VARCHAR(255) NOT NULL,
  account_number VARCHAR(100) NOT NULL,
  bank_name VARCHAR(255) NOT NULL,
  ifsc_code VARCHAR(20) NOT NULL,
  upi_id VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  encrypted_account_data TEXT, -- For sensitive data encryption
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payment transactions table
CREATE TABLE payment_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  payment_gateway_id VARCHAR(100) NOT NULL, -- Links to external payment gateway
  payment_method payment_method NOT NULL,
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  currency VARCHAR(3) DEFAULT 'INR',
  status payment_status DEFAULT 'initiated',
  gateway_response JSONB,
  failure_reason TEXT,
  upi_id VARCHAR(100), -- For UPI payments
  bank_reference VARCHAR(100), -- For bank transfers
  reference_number VARCHAR(100) UNIQUE, -- Unique reference for this payment
  metadata JSONB DEFAULT '{}',
  expires_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Pricing tiers table for dynamic pricing management
CREATE TABLE pricing_tiers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exhibition_id UUID NOT NULL REFERENCES exhibitions(id) ON DELETE CASCADE,
  tier_name VARCHAR(100) NOT NULL, -- 'adult', 'child', 'student', etc.
  price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  valid_from DATE DEFAULT CURRENT_DATE,
  valid_until DATE,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(exhibition_id, tier_name, valid_from)
);

-- Tickets table for generated tickets
CREATE TABLE tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  ticket_number VARCHAR(50) UNIQUE NOT NULL,
  ticket_data JSONB NOT NULL, -- Complete ticket information
  qr_code_data TEXT NOT NULL, -- QR code content for validation
  pdf_url TEXT, -- URL to generated PDF
  status ticket_status DEFAULT 'generated',
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  sent_at TIMESTAMP WITH TIME ZONE,
  validated_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Webhook events table for audit trail
CREATE TABLE webhook_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type VARCHAR(100) NOT NULL,
  provider VARCHAR(50) NOT NULL, -- 'payment_gateway', 'bank_api', etc.
  payload JSONB NOT NULL,
  signature VARCHAR(255), -- For webhook verification
  processed BOOLEAN DEFAULT false,
  processed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payment configurations table for flexible configuration management
CREATE TABLE payment_configurations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  config_key VARCHAR(100) UNIQUE NOT NULL,
  config_value JSONB NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_payment_transactions_booking_id ON payment_transactions(booking_id);
CREATE INDEX idx_payment_transactions_status ON payment_transactions(status);
CREATE INDEX idx_payment_transactions_created_at ON payment_transactions(created_at);
CREATE INDEX idx_payment_transactions_reference_number ON payment_transactions(reference_number);

CREATE INDEX idx_tickets_booking_id ON tickets(booking_id);
CREATE INDEX idx_tickets_ticket_number ON tickets(ticket_number);
CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_tickets_qr_code_data ON tickets(qr_code_data);

CREATE INDEX idx_pricing_tiers_exhibition_id ON pricing_tiers(exhibition_id);
CREATE INDEX idx_pricing_tiers_active ON pricing_tiers(exhibition_id, is_active, valid_from);

CREATE INDEX idx_bank_accounts_active ON bank_accounts(is_active, display_order);

CREATE INDEX idx_webhook_events_event_type ON webhook_events(event_type);
CREATE INDEX idx_webhook_events_processed ON webhook_events(processed);

-- Create function to generate unique payment reference
CREATE OR REPLACE FUNCTION generate_payment_reference()
RETURNS VARCHAR AS $$
DECLARE
  ref VARCHAR;
  counter INTEGER := 0;
BEGIN
  LOOP
    -- Generate reference like PAY20250115XXXXXX
    ref := 'PAY' || TO_CHAR(NOW(), 'YYYYMMDD') || LPAD((RANDOM() * 999999)::INTEGER::TEXT, 6, '0');

    EXIT WHEN NOT EXISTS(SELECT 1 FROM payment_transactions WHERE reference_number = ref);

    counter := counter + 1;
    EXIT WHEN counter > 10; -- Prevent infinite loop
  END LOOP;

  RETURN ref;
END;
$$ LANGUAGE plpgsql;

-- Create function to generate unique ticket number
CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS VARCHAR AS $$
DECLARE
  ticket_num VARCHAR;
  counter INTEGER := 0;
BEGIN
  LOOP
    -- Generate ticket number like TKT20250115XXXXXX
    ticket_num := 'TKT' || TO_CHAR(NOW(), 'YYYYMMDD') || LPAD((RANDOM() * 999999)::INTEGER::TEXT, 6, '0');

    EXIT WHEN NOT EXISTS(SELECT 1 FROM tickets WHERE ticket_number = ticket_num);

    counter := counter + 1;
    EXIT WHEN counter > 10; -- Prevent infinite loop
  END LOOP;

  RETURN ticket_num;
END;
$$ LANGUAGE plpgsql;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_bank_accounts_updated_at
  BEFORE UPDATE ON bank_accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_transactions_updated_at
  BEFORE UPDATE ON payment_transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pricing_tiers_updated_at
  BEFORE UPDATE ON pricing_tiers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tickets_updated_at
  BEFORE UPDATE ON tickets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_configurations_updated_at
  BEFORE UPDATE ON payment_configurations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies

-- Enable RLS on all tables
ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_configurations ENABLE ROW LEVEL SECURITY;

-- Bank accounts: Only admins can manage
CREATE POLICY "Admins can manage bank accounts" ON bank_accounts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

-- Payment transactions: Users see their own, admins see all
CREATE POLICY "Users can view own payment transactions" ON payment_transactions
  FOR SELECT USING (
    booking_id IN (
      SELECT id FROM bookings
      WHERE user_id = auth.uid() OR guest_email = (SELECT email FROM users WHERE id = auth.uid())
    )
  );

CREATE POLICY "Admins can manage all payment transactions" ON payment_transactions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

-- Pricing tiers: Admins can manage, public can read active ones
CREATE POLICY "Anyone can view active pricing tiers" ON pricing_tiers
  FOR SELECT USING (is_active = true AND valid_from <= CURRENT_DATE AND (valid_until IS NULL OR valid_until >= CURRENT_DATE));

CREATE POLICY "Admins can manage pricing tiers" ON pricing_tiers
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

-- Tickets: Users see their own, admins see all
CREATE POLICY "Users can view own tickets" ON tickets
  FOR SELECT USING (
    booking_id IN (
      SELECT id FROM bookings
      WHERE user_id = auth.uid() OR guest_email = (SELECT email FROM users WHERE id = auth.uid())
    )
  );

CREATE POLICY "Admins can manage all tickets" ON tickets
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

-- Webhook events: Only admins can view
CREATE POLICY "Admins can view webhook events" ON webhook_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

-- Payment configurations: Admins can manage, system can read
CREATE POLICY "Admins can manage payment configurations" ON payment_configurations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

-- Insert default bank account (to be updated by admin)
INSERT INTO bank_accounts (account_name, account_number, bank_name, ifsc_code, upi_id, display_order) VALUES
('MGM Museum Main Account', '1234567890', 'State Bank of India', 'SBIN0001234', 'museum@oksbi', 1);

-- Insert default pricing tiers for existing exhibitions
INSERT INTO pricing_tiers (exhibition_id, tier_name, price, description, created_by)
SELECT
  e.id,
  'adult',
  100.00,
  'Adult visitor (18+ years)',
  (SELECT id FROM users WHERE role = 'admin' LIMIT 1)
FROM exhibitions e
WHERE e.status = 'active';

INSERT INTO pricing_tiers (exhibition_id, tier_name, price, description, created_by)
SELECT
  e.id,
  'child',
  50.00,
  'Child visitor (5-17 years)',
  (SELECT id FROM users WHERE role = 'admin' LIMIT 1)
FROM exhibitions e
WHERE e.status = 'active';

INSERT INTO pricing_tiers (exhibition_id, tier_name, price, description, created_by)
SELECT
  e.id,
  'student',
  75.00,
  'Student visitor (with valid ID)',
  (SELECT id FROM users WHERE role = 'admin' LIMIT 1)
FROM exhibitions e
WHERE e.status = 'active';

-- Insert default payment configurations
INSERT INTO payment_configurations (config_key, config_value, description) VALUES
('payment_timeout_minutes', '15', 'Payment timeout in minutes'),
('max_payment_amount', '50000', 'Maximum payment amount in rupees'),
('min_payment_amount', '1', 'Minimum payment amount in rupees'),
('upi_enabled', 'true', 'Enable UPI payments'),
('bank_transfer_enabled', 'true', 'Enable bank transfer payments'),
('auto_ticket_generation', 'true', 'Automatically generate tickets after payment'),
('email_notifications', 'true', 'Send email notifications for payments');

-- Create view for payment analytics
CREATE VIEW payment_analytics AS
SELECT
  pt.payment_method,
  pt.status,
  COUNT(*) as count,
  SUM(pt.amount) as total_amount,
  AVG(pt.amount) as avg_amount,
  DATE_TRUNC('day', pt.created_at) as date
FROM payment_transactions pt
GROUP BY pt.payment_method, pt.status, DATE_TRUNC('day', pt.created_at);

-- Grant necessary permissions
GRANT SELECT ON payment_analytics TO authenticated;
GRANT SELECT ON payment_analytics TO service_role;