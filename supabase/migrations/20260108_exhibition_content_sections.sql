-- Migration: Create exhibition_content_sections table
-- Created: 2026-01-08
-- Purpose: Enable dynamic content management for exhibition pages

-- Create exhibition_content_sections table
CREATE TABLE IF NOT EXISTS exhibition_content_sections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exhibition_id UUID NOT NULL REFERENCES exhibitions(id) ON DELETE CASCADE,
  section_type TEXT NOT NULL CHECK (section_type IN (
    'features',
    'highlights',
    'what_to_expect',
    'gallery',
    'faq',
    'additional_info',
    'booking_widget'
  )),
  title TEXT,
  content TEXT,
  images TEXT[] DEFAULT ARRAY[]::TEXT[],
  display_order INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT TRUE,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT exhibition_content_sections_display_order_check CHECK (display_order >= 0)
);

-- Create indexes for performance
CREATE INDEX idx_exhibition_content_sections_exhibition_id 
  ON exhibition_content_sections(exhibition_id);

CREATE INDEX idx_exhibition_content_sections_display_order 
  ON exhibition_content_sections(exhibition_id, display_order);

CREATE INDEX idx_exhibition_content_sections_active 
  ON exhibition_content_sections(active) 
  WHERE active = TRUE;

CREATE INDEX idx_exhibition_content_sections_section_type 
  ON exhibition_content_sections(section_type);

-- Add comment for documentation
COMMENT ON TABLE exhibition_content_sections IS 'Stores dynamic content sections for exhibition detail pages';
COMMENT ON COLUMN exhibition_content_sections.section_type IS 'Type of content section: features, highlights, what_to_expect, gallery, faq, additional_info, booking_widget';
COMMENT ON COLUMN exhibition_content_sections.metadata IS 'Additional section-specific data stored as JSON';
COMMENT ON COLUMN exhibition_content_sections.display_order IS 'Order in which sections appear on the page (0-based)';

-- Enable Row Level Security
ALTER TABLE exhibition_content_sections ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Public can view active sections
CREATE POLICY "Public can view active content sections"
  ON exhibition_content_sections
  FOR SELECT
  USING (active = TRUE);

-- RLS Policy: Authenticated users can view all sections
CREATE POLICY "Authenticated users can view all content sections"
  ON exhibition_content_sections
  FOR SELECT
  TO authenticated
  USING (TRUE);

-- RLS Policy: Authenticated users can insert sections
CREATE POLICY "Authenticated users can insert content sections"
  ON exhibition_content_sections
  FOR INSERT
  TO authenticated
  WITH CHECK (TRUE);

-- RLS Policy: Authenticated users can update sections
CREATE POLICY "Authenticated users can update content sections"
  ON exhibition_content_sections
  FOR UPDATE
  TO authenticated
  USING (TRUE)
  WITH CHECK (TRUE);

-- RLS Policy: Authenticated users can delete sections
CREATE POLICY "Authenticated users can delete content sections"
  ON exhibition_content_sections
  FOR DELETE
  TO authenticated
  USING (TRUE);

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION update_exhibition_content_sections_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER update_exhibition_content_sections_updated_at
  BEFORE UPDATE ON exhibition_content_sections
  FOR EACH ROW
  EXECUTE FUNCTION update_exhibition_content_sections_updated_at();

-- Insert default booking widget section for existing exhibitions
INSERT INTO exhibition_content_sections (
  exhibition_id,
  section_type,
  title,
  content,
  display_order,
  active,
  metadata
)
SELECT 
  id as exhibition_id,
  'booking_widget' as section_type,
  'Book Your Visit' as title,
  'Select your preferred date and time' as content,
  0 as display_order,
  true as active,
  jsonb_build_object(
    'showPricing', true,
    'showAvailableTimes', true,
    'showFeatures', true,
    'features', jsonb_build_array(
      'Instant confirmation',
      'Free cancellation up to 24 hours',
      'Mobile ticket accepted'
    )
  ) as metadata
FROM exhibitions
WHERE status = 'active'
ON CONFLICT DO NOTHING;

-- Grant permissions
GRANT SELECT ON exhibition_content_sections TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON exhibition_content_sections TO authenticated;

