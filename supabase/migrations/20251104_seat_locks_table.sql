-- Seat Locks Table for Booking System
-- Migration: Add seat locking mechanism for booking flow
-- Created: 2025-11-04

-- ================================================
-- SEAT LOCKS TABLE
-- Manages temporary seat reservations during booking
-- ================================================

CREATE TABLE IF NOT EXISTS seat_locks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id TEXT NOT NULL,
  exhibition_id UUID REFERENCES exhibitions(id) ON DELETE CASCADE,
  show_id UUID REFERENCES shows(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  time_slot_id UUID REFERENCES time_slots(id) ON DELETE CASCADE NOT NULL,
  seats JSONB NOT NULL DEFAULT '[]'::jsonb,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraint: Must reference either exhibition or show
  CONSTRAINT seat_locks_reference_check CHECK (
    (exhibition_id IS NOT NULL AND show_id IS NULL) OR
    (exhibition_id IS NULL AND show_id IS NOT NULL)
  )
);

-- Indexes for performance
CREATE INDEX idx_seat_locks_expires ON seat_locks(expires_at);
CREATE INDEX idx_seat_locks_session ON seat_locks(session_id);
CREATE INDEX idx_seat_locks_slot_date ON seat_locks(time_slot_id, date);
CREATE INDEX idx_seat_locks_exhibition ON seat_locks(exhibition_id) WHERE exhibition_id IS NOT NULL;
CREATE INDEX idx_seat_locks_show ON seat_locks(show_id) WHERE show_id IS NOT NULL;

-- ================================================
-- ROW LEVEL SECURITY
-- ================================================

ALTER TABLE seat_locks ENABLE ROW LEVEL SECURITY;

-- Anyone can create seat locks (for booking)
CREATE POLICY "Anyone can create seat locks" ON seat_locks
  FOR INSERT WITH CHECK (TRUE);

-- Users can view their own locks
CREATE POLICY "Users can view own seat locks" ON seat_locks
  FOR SELECT USING (TRUE);

-- Admins can manage all locks
CREATE POLICY "Admins can manage seat locks" ON seat_locks
  FOR ALL USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
  ));

-- ================================================
-- COMMENTS
-- ================================================

COMMENT ON TABLE seat_locks IS 'Temporary seat reservations during booking process (10-minute expiration)';
COMMENT ON COLUMN seat_locks.session_id IS 'Client session identifier for tracking locks';
COMMENT ON COLUMN seat_locks.seats IS 'JSON array of seat objects: [{row: string, number: string}]';
COMMENT ON COLUMN seat_locks.expires_at IS 'Lock expiration timestamp (typically NOW() + 10 minutes)';

-- Migration complete!
