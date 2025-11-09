-- Create system_settings table for storing admin configuration
CREATE TABLE IF NOT EXISTS system_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL,
  category TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID REFERENCES users(id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_system_settings_category ON system_settings(category);
CREATE INDEX IF NOT EXISTS idx_system_settings_key ON system_settings(key);

-- Enable Row Level Security
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Only admins can manage settings
CREATE POLICY "Admins can manage settings"
ON system_settings FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role IN ('admin', 'super_admin')
  )
);

-- Insert default settings
INSERT INTO system_settings (key, value, category) VALUES
  ('museum_name', '"MGM Science Centre"', 'general'),
  ('contact_email', '"info@mgmapjscicentre.org"', 'general'),
  ('contact_phone', '"+91-22-24926000"', 'general'),
  ('address', '"Marol Maroshi Road, Andheri (East), Mumbai - 400 059"', 'general'),
  ('opening_time', '"10:00"', 'hours'),
  ('closing_time', '"18:00"', 'hours'),
  ('closed_day', '"Monday"', 'hours'),
  ('advance_booking_days', '30', 'booking'),
  ('cancellation_window_hours', '24', 'booking'),
  ('service_fee_percent', '2.5', 'booking'),
  ('enable_online_booking', 'true', 'booking'),
  ('auto_confirm_bookings', 'true', 'booking'),
  ('enable_notifications', 'true', 'booking'),
  ('maintenance_mode', 'false', 'system')
ON CONFLICT (key) DO NOTHING;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_system_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER system_settings_updated_at
BEFORE UPDATE ON system_settings
FOR EACH ROW
EXECUTE FUNCTION update_system_settings_updated_at();
