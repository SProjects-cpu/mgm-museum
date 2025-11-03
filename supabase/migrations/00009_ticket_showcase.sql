-- Migration: Ticket Showcase Configuration
-- Description: Admin-controllable ticket showcase widget

-- 1. Create ticket_showcase_config table
CREATE TABLE IF NOT EXISTS ticket_showcase_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  is_enabled BOOLEAN DEFAULT true,
  price_per_person DECIMAL(10, 2) DEFAULT 150.00,
  currency TEXT DEFAULT 'INR',
  currency_symbol TEXT DEFAULT '₹',
  button_text TEXT DEFAULT 'Find Available Tickets',
  button_link TEXT DEFAULT '/book-visit',
  opening_time TEXT DEFAULT '9:30 AM',
  closing_time TEXT DEFAULT '5:30 PM',
  closed_days TEXT[] DEFAULT ARRAY['Monday'],
  min_visitors INTEGER DEFAULT 1,
  max_visitors INTEGER DEFAULT 100,
  features JSONB DEFAULT '[]'::jsonb,
  experience_types JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Insert default configuration
INSERT INTO ticket_showcase_config (
  is_enabled,
  price_per_person,
  features,
  experience_types
) VALUES (
  true,
  150.00,
  '[
    "Interactive Exhibitions",
    "Planetarium Shows",
    "3D Theatre Experience",
    "Educational Programs",
    "Group Discounts",
    "Free Parking",
    "Accessibility Support",
    "Multilingual Guides",
    "Cafeteria Available"
  ]'::jsonb,
  '[
    {"value": "general", "label": "General Admission"},
    {"value": "planetarium", "label": "Planetarium Show"},
    {"value": "3d_theatre", "label": "3D Theatre"},
    {"value": "combo", "label": "Combo Package"}
  ]'::jsonb
) ON CONFLICT DO NOTHING;

-- 3. Enable RLS
ALTER TABLE ticket_showcase_config ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view
CREATE POLICY "Anyone can view ticket showcase config"
  ON ticket_showcase_config FOR SELECT
  USING (true);

-- Policy: Admins can manage
CREATE POLICY "Admins can manage ticket showcase config"
  ON ticket_showcase_config FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- Policy: Service role can manage
CREATE POLICY "Service role can manage ticket showcase config"
  ON ticket_showcase_config FOR ALL
  TO service_role
  USING (true);

-- 4. Create updated_at trigger
CREATE OR REPLACE FUNCTION update_ticket_showcase_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ticket_showcase_updated_at
  BEFORE UPDATE ON ticket_showcase_config
  FOR EACH ROW
  EXECUTE FUNCTION update_ticket_showcase_updated_at();

-- 5. Add comments
COMMENT ON TABLE ticket_showcase_config IS 'Configuration for the ticket showcase widget on homepage';
COMMENT ON COLUMN ticket_showcase_config.is_enabled IS 'Toggle to show/hide widget on client site';
COMMENT ON COLUMN ticket_showcase_config.features IS 'Array of feature strings to display';
COMMENT ON COLUMN ticket_showcase_config.experience_types IS 'Array of experience type objects with value and label';
