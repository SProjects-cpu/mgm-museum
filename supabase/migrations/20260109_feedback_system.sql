-- Feedback System Migration
-- Creates feedback table for customer reviews and ratings
-- Migration: 20260109_feedback_system

-- ================================================
-- FEEDBACK TABLE
-- ================================================

CREATE TABLE IF NOT EXISTS feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one feedback per booking
  CONSTRAINT unique_feedback_per_booking UNIQUE (booking_id)
);

-- ================================================
-- INDEXES
-- ================================================

CREATE INDEX idx_feedback_booking ON feedback(booking_id);
CREATE INDEX idx_feedback_user ON feedback(user_id);
CREATE INDEX idx_feedback_rating ON feedback(rating);
CREATE INDEX idx_feedback_created ON feedback(created_at DESC);

-- ================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ================================================

ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- Users can insert feedback for their own bookings
CREATE POLICY "Users can create feedback for own bookings" ON feedback
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM bookings 
      WHERE id = feedback.booking_id 
      AND user_id = auth.uid()
    )
  );

-- Users can view their own feedback
CREATE POLICY "Users can view own feedback" ON feedback
  FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

-- Admins can view all feedback
CREATE POLICY "Admins can view all feedback" ON feedback
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

-- Users can update their own feedback
CREATE POLICY "Users can update own feedback" ON feedback
  FOR UPDATE USING (user_id = auth.uid());

-- ================================================
-- TRIGGERS
-- ================================================

-- Update updated_at timestamp on feedback updates
CREATE TRIGGER update_feedback_updated_at 
  BEFORE UPDATE ON feedback
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- ================================================
-- COMMENTS
-- ================================================

COMMENT ON TABLE feedback IS 'Customer feedback and ratings for completed bookings';
COMMENT ON COLUMN feedback.rating IS 'Rating from 1-5 stars';
COMMENT ON COLUMN feedback.comment IS 'Optional text feedback from customer';
COMMENT ON CONSTRAINT unique_feedback_per_booking ON feedback IS 'Ensures one feedback per booking';

-- ================================================
-- GRANT PERMISSIONS
-- ================================================

GRANT SELECT, INSERT, UPDATE ON feedback TO authenticated;
GRANT SELECT ON feedback TO anon;
