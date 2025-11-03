-- MGM Museum Database Schema
-- Migration: Initial Schema Setup
-- Created: 2025-10-13

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For full-text search
CREATE EXTENSION IF NOT EXISTS "pgcrypto"; -- For encryption

-- ================================================
-- ENUMS
-- ================================================

CREATE TYPE user_role AS ENUM ('customer', 'admin', 'super_admin');
CREATE TYPE exhibition_category AS ENUM (
  'solar_observatory',
  'science_park',
  'planetarium',
  'astro_gallery',
  '3d_theatre',
  'math_lab',
  'physics_lab',
  'holography'
);
CREATE TYPE exhibition_status AS ENUM ('active', 'inactive', 'coming_soon', 'maintenance');
CREATE TYPE show_type AS ENUM ('planetarium', '3d_theatre', 'holography');
CREATE TYPE ticket_type AS ENUM ('adult', 'child', 'student', 'senior', 'group');
CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'cancelled', 'completed');
CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'refunded', 'failed');
CREATE TYPE event_status AS ENUM ('upcoming', 'ongoing', 'completed', 'cancelled');
CREATE TYPE registration_status AS ENUM ('registered', 'attended', 'cancelled');
CREATE TYPE contact_status AS ENUM ('new', 'in_progress', 'resolved');

-- ================================================
-- USERS TABLE (extends auth.users)
-- ================================================

CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  phone TEXT,
  role user_role DEFAULT 'customer' NOT NULL,
  avatar_url TEXT,
  preferences JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- ================================================
-- EXHIBITIONS TABLE
-- ================================================

CREATE TABLE exhibitions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category exhibition_category NOT NULL,
  description TEXT,
  short_description TEXT,
  duration_minutes INTEGER NOT NULL,
  capacity INTEGER NOT NULL,
  images TEXT[] DEFAULT ARRAY[]::TEXT[],
  video_url TEXT,
  virtual_tour_url TEXT,
  status exhibition_status DEFAULT 'active' NOT NULL,
  featured BOOLEAN DEFAULT FALSE,
  display_order INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_exhibitions_status ON exhibitions(status);
CREATE INDEX idx_exhibitions_category ON exhibitions(category);
CREATE INDEX idx_exhibitions_featured ON exhibitions(featured) WHERE featured = TRUE;
CREATE INDEX idx_exhibitions_slug ON exhibitions(slug);

-- Full-text search
CREATE INDEX idx_exhibitions_search ON exhibitions USING gin(to_tsvector('english', name || ' ' || COALESCE(description, '')));

-- ================================================
-- SHOWS TABLE
-- ================================================

CREATE TABLE shows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  type show_type NOT NULL,
  duration_minutes INTEGER NOT NULL,
  trailer_url TEXT,
  thumbnail_url TEXT,
  status exhibition_status DEFAULT 'active' NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_shows_status ON shows(status);
CREATE INDEX idx_shows_type ON shows(type);
CREATE INDEX idx_shows_slug ON shows(slug);

-- ================================================
-- PRICING TABLE
-- ================================================

CREATE TABLE pricing (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exhibition_id UUID REFERENCES exhibitions(id) ON DELETE CASCADE,
  show_id UUID REFERENCES shows(id) ON DELETE CASCADE,
  ticket_type ticket_type NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  valid_from DATE NOT NULL DEFAULT CURRENT_DATE,
  valid_until DATE,
  active BOOLEAN DEFAULT TRUE,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraint: Must reference either exhibition or show, not both
  CONSTRAINT pricing_reference_check CHECK (
    (exhibition_id IS NOT NULL AND show_id IS NULL) OR
    (exhibition_id IS NULL AND show_id IS NOT NULL)
  )
);

-- Indexes
CREATE INDEX idx_pricing_exhibition ON pricing(exhibition_id);
CREATE INDEX idx_pricing_show ON pricing(show_id);
CREATE INDEX idx_pricing_active ON pricing(active) WHERE active = TRUE;
CREATE INDEX idx_pricing_valid_dates ON pricing(valid_from, valid_until);

-- ================================================
-- TIME SLOTS TABLE
-- ================================================

CREATE TABLE time_slots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exhibition_id UUID REFERENCES exhibitions(id) ON DELETE CASCADE,
  show_id UUID REFERENCES shows(id) ON DELETE CASCADE,
  day_of_week INTEGER, -- 0-6, NULL for all days
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  capacity INTEGER NOT NULL,
  active BOOLEAN DEFAULT TRUE,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraint: Must reference either exhibition or show
  CONSTRAINT time_slots_reference_check CHECK (
    (exhibition_id IS NOT NULL AND show_id IS NULL) OR
    (exhibition_id IS NULL AND show_id IS NOT NULL)
  ),
  
  -- Constraint: day_of_week must be 0-6
  CONSTRAINT time_slots_day_check CHECK (
    day_of_week IS NULL OR (day_of_week >= 0 AND day_of_week <= 6)
  )
);

-- Indexes
CREATE INDEX idx_time_slots_exhibition ON time_slots(exhibition_id);
CREATE INDEX idx_time_slots_show ON time_slots(show_id);
CREATE INDEX idx_time_slots_day ON time_slots(day_of_week);
CREATE INDEX idx_time_slots_active ON time_slots(active) WHERE active = TRUE;

-- ================================================
-- BOOKINGS TABLE
-- ================================================

CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_reference TEXT NOT NULL UNIQUE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  guest_email TEXT,
  guest_phone TEXT,
  guest_name TEXT,
  exhibition_id UUID REFERENCES exhibitions(id) ON DELETE RESTRICT,
  show_id UUID REFERENCES shows(id) ON DELETE RESTRICT,
  booking_date DATE NOT NULL,
  time_slot_id UUID REFERENCES time_slots(id) ON DELETE RESTRICT,
  status booking_status DEFAULT 'pending' NOT NULL,
  payment_status payment_status DEFAULT 'pending' NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  special_requirements TEXT,
  payment_details JSONB DEFAULT '{}'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraint: Must have either user_id or guest_email
  CONSTRAINT booking_user_check CHECK (
    user_id IS NOT NULL OR guest_email IS NOT NULL
  ),
  
  -- Constraint: Must reference either exhibition or show
  CONSTRAINT booking_reference_check CHECK (
    (exhibition_id IS NOT NULL AND show_id IS NULL) OR
    (exhibition_id IS NULL AND show_id IS NOT NULL)
  )
);

-- Indexes
CREATE INDEX idx_bookings_reference ON bookings(booking_reference);
CREATE INDEX idx_bookings_user ON bookings(user_id);
CREATE INDEX idx_bookings_guest_email ON bookings(guest_email);
CREATE INDEX idx_bookings_date ON bookings(booking_date);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_payment_status ON bookings(payment_status);
CREATE INDEX idx_bookings_created ON bookings(created_at DESC);
CREATE INDEX idx_bookings_exhibition ON bookings(exhibition_id);
CREATE INDEX idx_bookings_show ON bookings(show_id);

-- ================================================
-- BOOKING TICKETS TABLE
-- ================================================

CREATE TABLE booking_tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  pricing_id UUID NOT NULL REFERENCES pricing(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  price_per_ticket DECIMAL(10, 2) NOT NULL,
  subtotal DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_booking_tickets_booking ON booking_tickets(booking_id);
CREATE INDEX idx_booking_tickets_pricing ON booking_tickets(pricing_id);

-- ================================================
-- SEAT BOOKINGS TABLE (for planetarium)
-- ================================================

CREATE TABLE seat_bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  seat_number TEXT NOT NULL,
  row_letter TEXT NOT NULL,
  locked_until TIMESTAMP WITH TIME ZONE, -- For temporary seat locking
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Unique constraint for seat per booking date/time
  CONSTRAINT unique_seat_per_slot UNIQUE (booking_id, seat_number, row_letter)
);

-- Indexes
CREATE INDEX idx_seat_bookings_booking ON seat_bookings(booking_id);
CREATE INDEX idx_seat_bookings_locked ON seat_bookings(locked_until) WHERE locked_until IS NOT NULL;

-- ================================================
-- EVENTS TABLE
-- ================================================

CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  event_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  location TEXT NOT NULL,
  max_participants INTEGER,
  registration_required BOOLEAN DEFAULT TRUE,
  featured_image TEXT,
  status event_status DEFAULT 'upcoming' NOT NULL,
  booking_enabled BOOLEAN DEFAULT TRUE,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_events_slug ON events(slug);
CREATE INDEX idx_events_date ON events(event_date);
CREATE INDEX idx_events_status ON events(status);

-- ================================================
-- EVENT REGISTRATIONS TABLE
-- ================================================

CREATE TABLE event_registrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  status registration_status DEFAULT 'registered' NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_event_registrations_event ON event_registrations(event_id);
CREATE INDEX idx_event_registrations_user ON event_registrations(user_id);
CREATE INDEX idx_event_registrations_email ON event_registrations(email);

-- ================================================
-- CONTENT PAGES TABLE (for dynamic content)
-- ================================================

CREATE TABLE content_pages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  content JSONB NOT NULL,
  meta_title TEXT,
  meta_description TEXT,
  published BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_content_pages_slug ON content_pages(slug);
CREATE INDEX idx_content_pages_published ON content_pages(published) WHERE published = TRUE;

-- ================================================
-- NEWSLETTER SUBSCRIBERS TABLE
-- ================================================

CREATE TABLE newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  subscribed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  unsubscribed_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes
CREATE INDEX idx_newsletter_subscribers_email ON newsletter_subscribers(email);
CREATE INDEX idx_newsletter_subscribers_active ON newsletter_subscribers(subscribed_at) 
  WHERE unsubscribed_at IS NULL;

-- ================================================
-- CONTACT SUBMISSIONS TABLE
-- ================================================

CREATE TABLE contact_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status contact_status DEFAULT 'new' NOT NULL,
  response TEXT,
  responded_at TIMESTAMP WITH TIME ZONE,
  responded_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_contact_submissions_status ON contact_submissions(status);
CREATE INDEX idx_contact_submissions_created ON contact_submissions(created_at DESC);

-- ================================================
-- ANALYTICS EVENTS TABLE
-- ================================================

CREATE TABLE analytics_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type TEXT NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  session_id TEXT,
  properties JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_analytics_events_type ON analytics_events(event_type);
CREATE INDEX idx_analytics_events_user ON analytics_events(user_id);
CREATE INDEX idx_analytics_events_created ON analytics_events(created_at DESC);

-- ================================================
-- FUNCTIONS AND TRIGGERS
-- ================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_exhibitions_updated_at BEFORE UPDATE ON exhibitions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shows_updated_at BEFORE UPDATE ON shows
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pricing_updated_at BEFORE UPDATE ON pricing
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_event_registrations_updated_at BEFORE UPDATE ON event_registrations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_content_pages_updated_at BEFORE UPDATE ON content_pages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to generate unique booking reference
CREATE OR REPLACE FUNCTION generate_booking_reference()
RETURNS TEXT AS $$
DECLARE
  ref TEXT;
  exists BOOLEAN;
BEGIN
  LOOP
    ref := 'MGM-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || 
           UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6));
    
    SELECT EXISTS(SELECT 1 FROM bookings WHERE booking_reference = ref) INTO exists;
    
    EXIT WHEN NOT exists;
  END LOOP;
  
  RETURN ref;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate booking reference
CREATE OR REPLACE FUNCTION set_booking_reference()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.booking_reference IS NULL OR NEW.booking_reference = '' THEN
    NEW.booking_reference := generate_booking_reference();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_bookings_reference BEFORE INSERT ON bookings
  FOR EACH ROW EXECUTE FUNCTION set_booking_reference();

-- ================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE exhibitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE shows ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE seat_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- Users table policies
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Exhibitions (public read, admin write)
CREATE POLICY "Exhibitions are publicly readable" ON exhibitions
  FOR SELECT USING (status = 'active' OR EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
  ));

CREATE POLICY "Admins can manage exhibitions" ON exhibitions
  FOR ALL USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
  ));

-- Shows (public read, admin write)
CREATE POLICY "Shows are publicly readable" ON shows
  FOR SELECT USING (status = 'active' OR EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
  ));

CREATE POLICY "Admins can manage shows" ON shows
  FOR ALL USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
  ));

-- Pricing (public read, admin write)
CREATE POLICY "Pricing is publicly readable" ON pricing
  FOR SELECT USING (active = TRUE OR EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
  ));

CREATE POLICY "Admins can manage pricing" ON pricing
  FOR ALL USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
  ));

-- Time slots (public read, admin write)
CREATE POLICY "Time slots are publicly readable" ON time_slots
  FOR SELECT USING (active = TRUE OR EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
  ));

CREATE POLICY "Admins can manage time slots" ON time_slots
  FOR ALL USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
  ));

-- Bookings (users see own, admins see all)
CREATE POLICY "Users can view own bookings" ON bookings
  FOR SELECT USING (
    auth.uid() = user_id OR
    auth.email() = guest_email OR
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Users can create bookings" ON bookings
  FOR INSERT WITH CHECK (
    auth.uid() = user_id OR user_id IS NULL
  );

CREATE POLICY "Admins can manage all bookings" ON bookings
  FOR ALL USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
  ));

-- Booking tickets (inherit from bookings)
CREATE POLICY "Users can view own booking tickets" ON booking_tickets
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM bookings WHERE id = booking_tickets.booking_id AND (
      auth.uid() = user_id OR
      auth.email() = guest_email OR
      EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
    )
  ));

CREATE POLICY "Users can create booking tickets" ON booking_tickets
  FOR INSERT WITH CHECK (TRUE);

-- Seat bookings (inherit from bookings)
CREATE POLICY "Users can view own seat bookings" ON seat_bookings
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM bookings WHERE id = seat_bookings.booking_id AND (
      auth.uid() = user_id OR
      auth.email() = guest_email OR
      EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
    )
  ));

CREATE POLICY "Users can create seat bookings" ON seat_bookings
  FOR INSERT WITH CHECK (TRUE);

-- Events (public read, admin write)
CREATE POLICY "Events are publicly readable" ON events
  FOR SELECT USING (status != 'cancelled' OR EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
  ));

CREATE POLICY "Admins can manage events" ON events
  FOR ALL USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
  ));

-- Event registrations (users see own, admins see all)
CREATE POLICY "Users can view own registrations" ON event_registrations
  FOR SELECT USING (
    auth.uid() = user_id OR
    auth.email() = email OR
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Anyone can register for events" ON event_registrations
  FOR INSERT WITH CHECK (TRUE);

CREATE POLICY "Admins can manage registrations" ON event_registrations
  FOR ALL USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
  ));

-- Content pages (public read published, admin manage all)
CREATE POLICY "Published content is publicly readable" ON content_pages
  FOR SELECT USING (published = TRUE OR EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
  ));

CREATE POLICY "Admins can manage content" ON content_pages
  FOR ALL USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
  ));

-- Newsletter (anyone can subscribe, only subscribers can unsubscribe)
CREATE POLICY "Anyone can subscribe to newsletter" ON newsletter_subscribers
  FOR INSERT WITH CHECK (TRUE);

CREATE POLICY "Subscribers can view own subscription" ON newsletter_subscribers
  FOR SELECT USING (auth.email() = email OR EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
  ));

CREATE POLICY "Admins can manage subscribers" ON newsletter_subscribers
  FOR ALL USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
  ));

-- Contact submissions (anyone can create, admins can manage)
CREATE POLICY "Anyone can submit contact form" ON contact_submissions
  FOR INSERT WITH CHECK (TRUE);

CREATE POLICY "Admins can view submissions" ON contact_submissions
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
  ));

CREATE POLICY "Admins can manage submissions" ON contact_submissions
  FOR ALL USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
  ));

-- Analytics (track everything, admins can view)
CREATE POLICY "Anyone can create analytics events" ON analytics_events
  FOR INSERT WITH CHECK (TRUE);

CREATE POLICY "Admins can view analytics" ON analytics_events
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
  ));

-- ================================================
-- GRANT PERMISSIONS
-- ================================================

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Grant permissions on all tables
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;

-- Grant permissions on all sequences
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ================================================
-- COMMENTS
-- ================================================

COMMENT ON TABLE users IS 'Extended user profiles linked to auth.users';
COMMENT ON TABLE exhibitions IS 'Main exhibitions and attractions';
COMMENT ON TABLE shows IS 'Planetarium and theatre shows';
COMMENT ON TABLE pricing IS 'Dynamic pricing for exhibitions and shows';
COMMENT ON TABLE time_slots IS 'Available time slots for bookings';
COMMENT ON TABLE bookings IS 'Customer bookings';
COMMENT ON TABLE booking_tickets IS 'Individual tickets in a booking';
COMMENT ON TABLE seat_bookings IS 'Seat assignments for planetarium shows';
COMMENT ON TABLE events IS 'Special events and workshops';
COMMENT ON TABLE event_registrations IS 'Event registrations';
COMMENT ON TABLE content_pages IS 'Dynamic CMS content';
COMMENT ON TABLE newsletter_subscribers IS 'Newsletter email list';
COMMENT ON TABLE contact_submissions IS 'Contact form submissions';
COMMENT ON TABLE analytics_events IS 'User activity tracking';

-- Migration complete!
-- Run: supabase db push





