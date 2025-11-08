# Exhibition Content Management Fixes

## Issues Identified

### 1. **Content Sections API Errors**
- ❌ "Failed to save section" when adding new sections
- ❌ "Failed to fetch content sections" on content page
- ❌ 500 Internal Server Error from POST request
- ❌ Console error: `POST ​ 500 (Internal Server Error)`

### 2. **Hardcoded "Book Your Visit" Section**
- ❌ "Book Your Visit" card is hardcoded in exhibition pages
- ❌ Not editable from admin panel
- ❌ Shows dummy data (₹0 price, static times)
- ❌ No database backing for this section

## Root Causes

### Issue 1: Missing Database Table
**Problem:** The `exhibition_content_sections` table doesn't exist in the database

**Evidence:**
- API route exists at `/api/admin/exhibitions/[id]/content/route.ts`
- Component exists at `components/admin/exhibition-content-manager.tsx`
- But database table is missing

### Issue 2: Hardcoded Booking Widget
**Problem:** The "Book Your Visit" section is hardcoded in the exhibition detail page, not managed through the content system

**Location:** Exhibition detail page (needs to be found and updated)

## Solutions

### Fix 1: Create Database Table

```sql
-- Create exhibition_content_sections table
CREATE TABLE IF NOT EXISTS exhibition_content_sections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exhibition_id UUID NOT NULL REFERENCES exhibitions(id) ON DELETE CASCADE,
  section_type TEXT NOT NULL,
  title TEXT,
  content TEXT,
  images TEXT[] DEFAULT ARRAY[]::TEXT[],
  display_order INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT TRUE,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_exhibition_content_sections_exhibition_id 
  ON exhibition_content_sections(exhibition_id);
CREATE INDEX idx_exhibition_content_sections_display_order 
  ON exhibition_content_sections(exhibition_id, display_order);
CREATE INDEX idx_exhibition_content_sections_active 
  ON exhibition_content_sections(active) WHERE active = TRUE;

-- Add RLS policies
ALTER TABLE exhibition_content_sections ENABLE ROW LEVEL SECURITY;

-- Allow public to read active sections
CREATE POLICY "Public can view active content sections"
  ON exhibition_content_sections
  FOR SELECT
  USING (active = TRUE);

-- Allow authenticated users to read all sections
CREATE POLICY "Authenticated users can view all content sections"
  ON exhibition_content_sections
  FOR SELECT
  TO authenticated
  USING (TRUE);

-- Allow authenticated users to manage sections
CREATE POLICY "Authenticated users can insert content sections"
  ON exhibition_content_sections
  FOR INSERT
  TO authenticated
  WITH CHECK (TRUE);

CREATE POLICY "Authenticated users can update content sections"
  ON exhibition_content_sections
  FOR UPDATE
  TO authenticated
  USING (TRUE);

CREATE POLICY "Authenticated users can delete content sections"
  ON exhibition_content_sections
  FOR DELETE
  TO authenticated
  USING (TRUE);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_exhibition_content_sections_updated_at
  BEFORE UPDATE ON exhibition_content_sections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### Fix 2: Add "Booking Widget" Section Type

Update the section types to include a booking widget:

```typescript
// components/admin/exhibition-content-manager.tsx
const SECTION_TYPES = [
  { value: "features", label: "Features" },
  { value: "highlights", label: "Highlights" },
  { value: "what_to_expect", label: "What to Expect" },
  { value: "gallery", label: "Gallery" },
  { value: "faq", label: "FAQ" },
  { value: "additional_info", label: "Additional Information" },
  { value: "booking_widget", label: "Book Your Visit Widget" }, // NEW
];
```

### Fix 3: Create Booking Widget Section Schema

The booking widget section should store:

```typescript
interface BookingWidgetSection {
  section_type: "booking_widget";
  title: string; // "Book Your Visit"
  content: string; // Description text
  metadata: {
    showPricing: boolean;
    showAvailableTimes: boolean;
    showFeatures: boolean;
    features: string[]; // ["Instant confirmation", "Free cancellation", etc.]
    customButtonText?: string;
  };
}
```

### Fix 4: Update Exhibition Detail Page

The exhibition detail page needs to:
1. Fetch content sections from database
2. Render booking widget section dynamically
3. Fall back to default widget if no section exists

```typescript
// In exhibition detail page
const { data: contentSections } = await supabase
  .from('exhibition_content_sections')
  .select('*')
  .eq('exhibition_id', exhibitionId)
  .eq('active', true)
  .order('display_order');

// Find booking widget section
const bookingWidget = contentSections?.find(
  s => s.section_type === 'booking_widget'
);

// Render with data or defaults
<BookingWidgetCard
  title={bookingWidget?.title || "Book Your Visit"}
  description={bookingWidget?.content}
  features={bookingWidget?.metadata?.features || defaultFeatures}
  exhibitionId={exhibitionId}
/>
```

## Implementation Steps

### Step 1: Create Database Migration

Create file: `supabase/migrations/YYYYMMDD_exhibition_content_sections.sql`

```sql
-- Full SQL from Fix 1 above
```

### Step 2: Run Migration

```bash
# If using Supabase CLI
supabase db push

# Or run directly in Supabase SQL Editor
```

### Step 3: Update Section Types

File: `components/admin/exhibition-content-manager.tsx`

Add "booking_widget" to SECTION_TYPES array.

### Step 4: Create Booking Widget Form Fields

Add special form fields for booking widget section type:

```typescript
{formData.sectionType === 'booking_widget' && (
  <>
    <div className="space-y-2">
      <Label>Features (one per line)</Label>
      <Textarea
        value={formData.metadata?.features?.join('\n') || ''}
        onChange={(e) => setFormData({
          ...formData,
          metadata: {
            ...formData.metadata,
            features: e.target.value.split('\n').filter(f => f.trim())
          }
        })}
        placeholder="Instant confirmation&#10;Free cancellation up to 24 hours&#10;Mobile ticket accepted"
        rows={4}
      />
    </div>
    
    <div className="flex items-center gap-2">
      <Switch
        checked={formData.metadata?.showPricing ?? true}
        onCheckedChange={(checked) => setFormData({
          ...formData,
          metadata: { ...formData.metadata, showPricing: checked }
        })}
      />
      <Label>Show Pricing</Label>
    </div>
  </>
)}
```

### Step 5: Find and Update Exhibition Detail Page

Need to locate the exhibition detail page and update it to:
1. Fetch content sections
2. Render booking widget dynamically
3. Use real pricing data from database

## Testing Checklist

After implementing fixes:

- [ ] Run database migration successfully
- [ ] Verify table exists in Supabase
- [ ] Test adding new content section (should work)
- [ ] Test fetching content sections (should work)
- [ ] Add a "booking_widget" section type
- [ ] Verify it appears in exhibition page
- [ ] Edit booking widget features
- [ ] Verify changes reflect on public page
- [ ] Test with real pricing data
- [ ] Test with real time slots

## Database Verification Queries

```sql
-- Check if table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'exhibition_content_sections'
);

-- Check table structure
\d exhibition_content_sections

-- Check RLS policies
SELECT * FROM pg_policies 
WHERE tablename = 'exhibition_content_sections';

-- Test insert
INSERT INTO exhibition_content_sections (
  exhibition_id,
  section_type,
  title,
  content,
  active
) VALUES (
  (SELECT id FROM exhibitions LIMIT 1),
  'booking_widget',
  'Book Your Visit',
  'Select your preferred date and time',
  true
) RETURNING *;

-- Fetch sections for an exhibition
SELECT * FROM exhibition_content_sections
WHERE exhibition_id = '<exhibition_id>'
ORDER BY display_order;
```

## Files to Modify

1. ✅ Create: `supabase/migrations/YYYYMMDD_exhibition_content_sections.sql`
2. ✅ Update: `components/admin/exhibition-content-manager.tsx`
3. ⚠️ Find & Update: Exhibition detail page (public-facing)
4. ⚠️ Create: `components/exhibition/BookingWidgetCard.tsx` (if needed)

## Expected Behavior After Fixes

### Admin Panel
1. Go to Exhibitions → Edit Exhibition → Content tab
2. Click "Add Section"
3. Select "Book Your Visit Widget" from dropdown
4. Fill in title, description, features
5. Click "Create Section"
6. ✅ Section saves successfully
7. ✅ Appears in sections list
8. Can drag to reorder
9. Can toggle active/inactive
10. Can edit and update

### Public Exhibition Page
1. Visit exhibition detail page
2. ✅ "Book Your Visit" section shows
3. ✅ Uses data from database (not hardcoded)
4. ✅ Shows real pricing from pricing table
5. ✅ Shows real available times from time_slots
6. ✅ Features list is editable from admin
7. ✅ Can be hidden by setting active=false

## Priority

1. **CRITICAL** - Create database table (Fix 1)
2. **HIGH** - Add booking_widget section type (Fix 2)
3. **HIGH** - Update exhibition detail page (Fix 4)
4. **MEDIUM** - Add special form fields (Fix 3)

---

**Status:** Ready for implementation
**Estimated Time:** 2-3 hours
**Risk Level:** Medium (requires database migration)
