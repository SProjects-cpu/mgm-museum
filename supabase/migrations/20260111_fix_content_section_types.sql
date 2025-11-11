-- Fix exhibition content section types to include pricing_display
-- This migration adds 'pricing_display' to the allowed section types

-- Drop the existing check constraint
ALTER TABLE exhibition_content_sections 
DROP CONSTRAINT IF EXISTS exhibition_content_sections_section_type_check;

-- Add the updated check constraint with pricing_display included
ALTER TABLE exhibition_content_sections
ADD CONSTRAINT exhibition_content_sections_section_type_check
CHECK (section_type = ANY (ARRAY[
  'features'::text,
  'highlights'::text,
  'what_to_expect'::text,
  'gallery'::text,
  'faq'::text,
  'additional_info'::text,
  'booking_widget'::text,
  'pricing_display'::text
]));

-- Add comment
COMMENT ON CONSTRAINT exhibition_content_sections_section_type_check 
ON exhibition_content_sections IS 
'Allowed section types: features, highlights, what_to_expect, gallery, faq, additional_info, booking_widget, pricing_display';
