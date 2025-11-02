-- Create schedule_overrides table for date-specific availability and capacity
CREATE TABLE IF NOT EXISTS schedule_overrides (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exhibition_id UUID NOT NULL REFERENCES exhibitions(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  capacity INTEGER,
  available BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_exhibition_date UNIQUE(exhibition_id, date)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_schedule_overrides_exhibition ON schedule_overrides(exhibition_id);
CREATE INDEX IF NOT EXISTS idx_schedule_overrides_date ON schedule_overrides(date);
CREATE INDEX IF NOT EXISTS idx_schedule_overrides_exhibition_date ON schedule_overrides(exhibition_id, date);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_schedule_overrides_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER schedule_overrides_updated_at
  BEFORE UPDATE ON schedule_overrides
  FOR EACH ROW
  EXECUTE FUNCTION update_schedule_overrides_updated_at();

-- Add RLS policies
ALTER TABLE schedule_overrides ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read schedule overrides
CREATE POLICY "Allow authenticated users to read schedule overrides"
  ON schedule_overrides FOR SELECT
  TO authenticated
  USING (true);

-- Allow admin users to manage schedule overrides
CREATE POLICY "Allow admin users to manage schedule overrides"
  ON schedule_overrides FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'super_admin')
    )
  );

-- Add comment
COMMENT ON TABLE schedule_overrides IS 'Date-specific availability and capacity overrides for exhibitions';
