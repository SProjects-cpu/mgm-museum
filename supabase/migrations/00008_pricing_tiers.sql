-- Migration: Pricing Tiers System
-- Description: Add pricing_tiers table for managing ticket pricing

-- 1. Create pricing_tiers table
CREATE TABLE IF NOT EXISTS pricing_tiers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exhibition_id UUID REFERENCES exhibitions(id) ON DELETE CASCADE,
  show_id UUID REFERENCES shows(id) ON DELETE CASCADE,
  ticket_type TEXT NOT NULL CHECK (ticket_type IN ('adult', 'child', 'student', 'senior')),
  price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
  currency TEXT DEFAULT 'INR',
  valid_from DATE NOT NULL,
  valid_until DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT pricing_tiers_check_entity CHECK (
    (exhibition_id IS NOT NULL AND show_id IS NULL) OR 
    (exhibition_id IS NULL AND show_id IS NOT NULL)
  ),
  CONSTRAINT pricing_tiers_check_dates CHECK (valid_until IS NULL OR valid_until >= valid_from)
);

-- 2. Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_pricing_tiers_exhibition ON pricing_tiers(exhibition_id);
CREATE INDEX IF NOT EXISTS idx_pricing_tiers_show ON pricing_tiers(show_id);
CREATE INDEX IF NOT EXISTS idx_pricing_tiers_ticket_type ON pricing_tiers(ticket_type);
CREATE INDEX IF NOT EXISTS idx_pricing_tiers_valid_dates ON pricing_tiers(valid_from, valid_until);
CREATE INDEX IF NOT EXISTS idx_pricing_tiers_active ON pricing_tiers(is_active);

-- 3. Enable RLS on pricing_tiers
ALTER TABLE pricing_tiers ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view active pricing tiers
CREATE POLICY "Anyone can view active pricing tiers"
  ON pricing_tiers FOR SELECT
  USING (is_active = true);

-- Policy: Admins can manage all pricing tiers
CREATE POLICY "Admins can manage pricing tiers"
  ON pricing_tiers FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- Policy: Service role can manage all pricing tiers
CREATE POLICY "Service role can manage pricing tiers"
  ON pricing_tiers FOR ALL
  TO service_role
  USING (true);

-- 4. Create function to get current pricing for an entity
CREATE OR REPLACE FUNCTION get_current_pricing(
  p_exhibition_id UUID DEFAULT NULL,
  p_show_id UUID DEFAULT NULL,
  p_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE(
  ticket_type TEXT,
  price DECIMAL(10, 2),
  currency TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pt.ticket_type,
    pt.price,
    pt.currency
  FROM pricing_tiers pt
  WHERE 
    pt.is_active = true
    AND pt.valid_from <= p_date
    AND (pt.valid_until IS NULL OR pt.valid_until >= p_date)
    AND (
      (p_exhibition_id IS NOT NULL AND pt.exhibition_id = p_exhibition_id) OR
      (p_show_id IS NOT NULL AND pt.show_id = p_show_id)
    )
  ORDER BY pt.ticket_type;
END;
$$ LANGUAGE plpgsql STABLE;

-- 5. Create updated_at trigger for pricing_tiers
CREATE OR REPLACE FUNCTION update_pricing_tiers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER pricing_tiers_updated_at
  BEFORE UPDATE ON pricing_tiers
  FOR EACH ROW
  EXECUTE FUNCTION update_pricing_tiers_updated_at();

-- 6. Add comments
COMMENT ON TABLE pricing_tiers IS 'Pricing tiers for exhibitions and shows with date-based validity';
COMMENT ON COLUMN pricing_tiers.ticket_type IS 'Type of ticket: adult, child, student, or senior';
COMMENT ON COLUMN pricing_tiers.price IS 'Price in the smallest currency unit (e.g., paise for INR)';
COMMENT ON COLUMN pricing_tiers.valid_from IS 'Date from which this pricing is valid';
COMMENT ON COLUMN pricing_tiers.valid_until IS 'Date until which this pricing is valid (NULL for indefinite)';
COMMENT ON FUNCTION get_current_pricing IS 'Get current pricing for an exhibition or show on a specific date';

-- 7. Insert default free admission pricing for existing exhibitions
INSERT INTO pricing_tiers (exhibition_id, ticket_type, price, valid_from, is_active)
SELECT 
  id,
  ticket_type,
  0.00,
  CURRENT_DATE,
  true
FROM exhibitions
CROSS JOIN (
  SELECT unnest(ARRAY['adult', 'child', 'student', 'senior']) AS ticket_type
) AS ticket_types
WHERE NOT EXISTS (
  SELECT 1 FROM pricing_tiers pt WHERE pt.exhibition_id = exhibitions.id
);

-- 8. Insert default free admission pricing for existing shows
INSERT INTO pricing_tiers (show_id, ticket_type, price, valid_from, is_active)
SELECT 
  id,
  ticket_type,
  0.00,
  CURRENT_DATE,
  true
FROM shows
CROSS JOIN (
  SELECT unnest(ARRAY['adult', 'child', 'student', 'senior']) AS ticket_type
) AS ticket_types
WHERE NOT EXISTS (
  SELECT 1 FROM pricing_tiers pt WHERE pt.show_id = shows.id
);
