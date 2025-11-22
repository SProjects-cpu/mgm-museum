-- Create exhibition_pricing table for managing ticket prices
CREATE TABLE IF NOT EXISTS exhibition_pricing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exhibition_id UUID NOT NULL REFERENCES exhibitions(id) ON DELETE CASCADE,
  ticket_type TEXT NOT NULL,
  price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
  active BOOLEAN DEFAULT true,
  valid_from TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure unique ticket type per exhibition
  UNIQUE(exhibition_id, ticket_type)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_exhibition_pricing_exhibition_id 
  ON exhibition_pricing(exhibition_id);

CREATE INDEX IF NOT EXISTS idx_exhibition_pricing_active 
  ON exhibition_pricing(active);

-- Add RLS policies
ALTER TABLE exhibition_pricing ENABLE ROW LEVEL SECURITY;

-- Allow public to read active pricing
CREATE POLICY "Public can view active pricing"
  ON exhibition_pricing
  FOR SELECT
  USING (active = true);

-- Allow authenticated users to view all pricing
CREATE POLICY "Authenticated users can view all pricing"
  ON exhibition_pricing
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow service role full access (for admin operations)
CREATE POLICY "Service role has full access to pricing"
  ON exhibition_pricing
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_exhibition_pricing_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER exhibition_pricing_updated_at
  BEFORE UPDATE ON exhibition_pricing
  FOR EACH ROW
  EXECUTE FUNCTION update_exhibition_pricing_updated_at();

-- Add comment
COMMENT ON TABLE exhibition_pricing IS 'Stores pricing information for different ticket types per exhibition';
