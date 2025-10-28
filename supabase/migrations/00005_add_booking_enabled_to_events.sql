-- Add booking_enabled column to events table if it doesn't exist
ALTER TABLE events
ADD COLUMN IF NOT EXISTS booking_enabled BOOLEAN DEFAULT TRUE;

-- Add updated_at trigger if not exists
CREATE OR REPLACE FUNCTION update_events_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_events_updated_at_trigger ON events;

CREATE TRIGGER update_events_updated_at_trigger
BEFORE UPDATE ON events
FOR EACH ROW
EXECUTE FUNCTION update_events_updated_at();
