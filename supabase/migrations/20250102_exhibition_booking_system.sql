-- Exhibition Booking System Enhancement
-- Migration: Add comprehensive booking configuration and content management
-- Created: 2025-01-02

-- ================================================
-- EXHIBITION SCHEDULES TABLE
-- Manages date-specific availability for exhibitions
-- ================================================

CREATE TABLE IF NOT EXISTS exhibition_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exhibition_id UUID REFERENCES exhibitions(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  is_available BOOLEAN DEFAULT TRUE,
  max_capacity INTEGER,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Unique constraint: one schedule per exhibition per date
  CONSTRAINT unique_exhibition_date UNIQUE (exhibition_id, date)
);

CREATE INDEX idx_exhibition_schedules_exhibition ON exhibition_schedules(exhibition_id);
CREATE INDEX idx_exhibition_schedules_date ON exhibition_schedules(date);
CREATE INDEX idx_exhibition_schedules_available ON exhibition_schedules(is_available) WHERE is_available = TRUE;

-- ================================================
-- SHOW SCHEDULES TABLE
-- Manages date-specific availability for shows
-- ================================================

CREATE TABLE IF NOT EXISTS show_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  show_id UUID REFERENCES shows(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  is_available BOOLEAN DEFAULT TRUE,
  max_capacity INTEGER,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Unique constraint: one schedule per show per date
  CONSTRAINT unique_show_date UNIQUE (show_id, date)
);

CREATE INDEX idx_show_schedules_show ON show_schedules(show_id);
CREATE INDEX idx_show_schedules_date ON show_schedules(date);
CREATE INDEX idx_show_schedules_available ON show_schedules(is_available) WHERE is_available = TRUE;

-- ================================================
-- EXHIBITION CONTENT SECTIONS TABLE
-- Stores detailed content sections for exhibitions
-- ================================================

CREATE TABLE IF NOT EXISTS exhibition_content_sections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exhibition_id UUID REFERENCES exhibitions(id) ON DELETE CASCADE NOT NULL,
  section_type TEXT NOT NULL, -- 'features', 'highlights', 'what_to_expect', 'gallery', 'faq', etc.
  title TEXT,
  content TEXT,
  images TEXT[],
  display_order INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT TRUE,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_exhibition_content_exhibition ON exhibition_content_sections(exhibition_id);
CREATE INDEX idx_exhibition_content_type ON exhibition_content_sections(section_type);
CREATE INDEX idx_exhibition_content_order ON exhibition_content_sections(display_order);

-- ================================================
-- SHOW CONTENT SECTIONS TABLE
-- Stores detailed content sections for shows
-- ================================================

CREATE TABLE IF NOT EXISTS show_content_sections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  show_id UUID REFERENCES shows(id) ON DELETE CASCADE NOT NULL,
  section_type TEXT NOT NULL,
  title TEXT,
  content TEXT,
  images TEXT[],
  display_order INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT TRUE,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_show_content_show ON show_content_sections(show_id);
CREATE INDEX idx_show_content_type ON show_content_sections(section_type);
CREATE INDEX idx_show_content_order ON show_content_sections(display_order);

-- ================================================
-- SLOT AVAILABILITY TABLE
-- Tracks real-time availability for each time slot on specific dates
-- ================================================

CREATE TABLE IF NOT EXISTS slot_availability (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  time_slot_id UUID REFERENCES time_slots(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  available_capacity INTEGER NOT NULL,
  booked_count INTEGER DEFAULT 0,
  is_blocked BOOLEAN DEFAULT FALSE,
  block_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Unique constraint: one availability record per slot per date
  CONSTRAINT unique_slot_date UNIQUE (time_slot_id, date),
  
  -- Constraint: booked_count cannot exceed available_capacity
  CONSTRAINT valid_booking_count CHECK (booked_count <= available_capacity)
);

CREATE INDEX idx_slot_availability_slot ON slot_availability(time_slot_id);
CREATE INDEX idx_slot_availability_date ON slot_availability(date);
CREATE INDEX idx_slot_availability_blocked ON slot_availability(is_blocked);

-- ================================================
-- DYNAMIC PRICING TABLE
-- Allows different pricing for different dates/times
-- ================================================

CREATE TABLE IF NOT EXISTS dynamic_pricing (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exhibition_id UUID REFERENCES exhibitions(id) ON DELETE CASCADE,
  show_id UUID REFERENCES shows(id) ON DELETE CASCADE,
  time_slot_id UUID REFERENCES time_slots(id) ON DELETE CASCADE,
  ticket_type ticket_type NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  valid_from DATE NOT NULL,
  valid_until DATE,
  days_of_week INTEGER[], -- Array of days (0-6) when this pricing applies
  is_special_pricing BOOLEAN DEFAULT FALSE,
  label TEXT, -- e.g., "Weekend Special", "Holiday Rate"
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraint: Must reference either exhibition or show
  CONSTRAINT dynamic_pricing_reference_check CHECK (
    (exhibition_id IS NOT NULL AND show_id IS NULL) OR
    (exhibition_id IS NULL AND show_id IS NOT NULL)
  )
);

CREATE INDEX idx_dynamic_pricing_exhibition ON dynamic_pricing(exhibition_id);
CREATE INDEX idx_dynamic_pricing_show ON dynamic_pricing(show_id);
CREATE INDEX idx_dynamic_pricing_slot ON dynamic_pricing(time_slot_id);
CREATE INDEX idx_dynamic_pricing_dates ON dynamic_pricing(valid_from, valid_until);
CREATE INDEX idx_dynamic_pricing_active ON dynamic_pricing(active) WHERE active = TRUE;

-- ================================================
-- UPDATE TRIGGERS
-- ================================================

-- Update updated_at timestamp automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_exhibition_schedules_updated_at
  BEFORE UPDATE ON exhibition_schedules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_show_schedules_updated_at
  BEFORE UPDATE ON show_schedules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_exhibition_content_sections_updated_at
  BEFORE UPDATE ON exhibition_content_sections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_show_content_sections_updated_at
  BEFORE UPDATE ON show_content_sections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_slot_availability_updated_at
  BEFORE UPDATE ON slot_availability
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dynamic_pricing_updated_at
  BEFORE UPDATE ON dynamic_pricing
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ================================================
-- ROW LEVEL SECURITY
-- ================================================

ALTER TABLE exhibition_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE show_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE exhibition_content_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE show_content_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE slot_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE dynamic_pricing ENABLE ROW LEVEL SECURITY;

-- Public read policies
CREATE POLICY "Exhibition schedules are publicly readable" ON exhibition_schedules
  FOR SELECT USING (is_available = TRUE OR EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
  ));

CREATE POLICY "Show schedules are publicly readable" ON show_schedules
  FOR SELECT USING (is_available = TRUE OR EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
  ));

CREATE POLICY "Exhibition content is publicly readable" ON exhibition_content_sections
  FOR SELECT USING (active = TRUE OR EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
  ));

CREATE POLICY "Show content is publicly readable" ON show_content_sections
  FOR SELECT USING (active = TRUE OR EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
  ));

CREATE POLICY "Slot availability is publicly readable" ON slot_availability
  FOR SELECT USING (NOT is_blocked OR EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
  ));

CREATE POLICY "Dynamic pricing is publicly readable" ON dynamic_pricing
  FOR SELECT USING (active = TRUE OR EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
  ));

-- Admin write policies
CREATE POLICY "Admins can manage exhibition schedules" ON exhibition_schedules
  FOR ALL USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
  ));

CREATE POLICY "Admins can manage show schedules" ON show_schedules
  FOR ALL USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
  ));

CREATE POLICY "Admins can manage exhibition content" ON exhibition_content_sections
  FOR ALL USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
  ));

CREATE POLICY "Admins can manage show content" ON show_content_sections
  FOR ALL USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
  ));

CREATE POLICY "Admins can manage slot availability" ON slot_availability
  FOR ALL USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
  ));

CREATE POLICY "Admins can manage dynamic pricing" ON dynamic_pricing
  FOR ALL USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
  ));

-- ================================================
-- HELPER FUNCTIONS
-- ================================================

-- Function to get available slots for a specific date and exhibition
CREATE OR REPLACE FUNCTION get_available_slots_for_exhibition(
  p_exhibition_id UUID,
  p_date DATE
)
RETURNS TABLE (
  slot_id UUID,
  start_time TIME,
  end_time TIME,
  total_capacity INTEGER,
  available_capacity INTEGER,
  booked_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ts.id as slot_id,
    ts.start_time,
    ts.end_time,
    ts.capacity as total_capacity,
    COALESCE(sa.available_capacity, ts.capacity) as available_capacity,
    COALESCE(sa.booked_count, 0) as booked_count
  FROM time_slots ts
  LEFT JOIN slot_availability sa ON ts.id = sa.time_slot_id AND sa.date = p_date
  WHERE ts.exhibition_id = p_exhibition_id
    AND ts.active = TRUE
    AND (sa.is_blocked IS NULL OR sa.is_blocked = FALSE)
    AND (ts.day_of_week IS NULL OR ts.day_of_week = EXTRACT(DOW FROM p_date))
  ORDER BY ts.start_time;
END;
$$ LANGUAGE plpgsql;

-- Function to get available slots for a specific date and show
CREATE OR REPLACE FUNCTION get_available_slots_for_show(
  p_show_id UUID,
  p_date DATE
)
RETURNS TABLE (
  slot_id UUID,
  start_time TIME,
  end_time TIME,
  total_capacity INTEGER,
  available_capacity INTEGER,
  booked_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ts.id as slot_id,
    ts.start_time,
    ts.end_time,
    ts.capacity as total_capacity,
    COALESCE(sa.available_capacity, ts.capacity) as available_capacity,
    COALESCE(sa.booked_count, 0) as booked_count
  FROM time_slots ts
  LEFT JOIN slot_availability sa ON ts.id = sa.time_slot_id AND sa.date = p_date
  WHERE ts.show_id = p_show_id
    AND ts.active = TRUE
    AND (sa.is_blocked IS NULL OR sa.is_blocked = FALSE)
    AND (ts.day_of_week IS NULL OR ts.day_of_week = EXTRACT(DOW FROM p_date))
  ORDER BY ts.start_time;
END;
$$ LANGUAGE plpgsql;

-- ================================================
-- COMMENTS
-- ================================================

COMMENT ON TABLE exhibition_schedules IS 'Date-specific availability for exhibitions';
COMMENT ON TABLE show_schedules IS 'Date-specific availability for shows';
COMMENT ON TABLE exhibition_content_sections IS 'Detailed content sections for exhibitions';
COMMENT ON TABLE show_content_sections IS 'Detailed content sections for shows';
COMMENT ON TABLE slot_availability IS 'Real-time availability tracking for time slots';
COMMENT ON TABLE dynamic_pricing IS 'Date and time-specific pricing rules';
