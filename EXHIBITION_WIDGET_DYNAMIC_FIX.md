# Exhibition Booking Widget - Make Dynamic

## Problem

The "Book Your Visit" widget on exhibition pages is **completely hardcoded**:
- Hardcoded features: "Instant confirmation", "Free cancellation", "Mobile ticket accepted"
- Hardcoded time slots: "10:00 AM", "1:00 PM", "4:00 PM", "7:00 PM"
- Changes in admin panel don't affect customer-facing pages
- No connection between database content sections and public display

## Solution

Update exhibition detail pages to:
1. Fetch content sections from database
2. Find `booking_widget` section type
3. Render widget dynamically with admin-editable content
4. Fall back to defaults if no section exists

## Files to Modify

1. `app/exhibitions/[slug]/page.tsx` - Add content sections fetching
2. `app/exhibitions/[slug]/exhibition-detail-client.tsx` - Use dynamic data
3. `types/index.ts` - Add ContentSection type (if needed)

## Implementation

### Step 1: Update Server Page to Fetch Content Sections

```typescript
// app/exhibitions/[slug]/page.tsx

async function getExhibition(slug: string) {
  const supabase = getServiceSupabase();
  
  // Fetch exhibition
  const { data: exhibition, error } = await supabase
    .from('exhibitions')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'active')
    .single();

  if (error || !exhibition) {
    return null;
  }

  // Fetch content sections for this exhibition
  const { data: contentSections } = await supabase
    .from('exhibition_content_sections')
    .select('*')
    .eq('exhibition_id', exhibition.id)
    .eq('active', true)
    .order('display_order');

  exhibition.contentSections = contentSections || [];
  
  return exhibition;
}
```

### Step 2: Update Client Component to Use Dynamic Data

```typescript
// app/exhibitions/[slug]/exhibition-detail-client.tsx

// Find booking widget section
const bookingWidget = exhibition.contentSections?.find(
  (section: any) => section.section_type === 'booking_widget'
);

// Get features from section or use defaults
const features = bookingWidget?.images || [
  'Instant confirmation',
  'Free cancellation up to 24 hours',
  'Mobile ticket accepted'
];

// Render features dynamically
{features.map((feature: string, index: number) => (
  <div key={index} className="flex items-center gap-2">
    <div className="w-1 h-1 rounded-full bg-primary" />
    <span>{feature}</span>
  </div>
))}
```

## Testing

1. Go to admin panel → Exhibitions → Edit any exhibition
2. Find "Content Sections" card
3. Edit the "Book Your Visit" section
4. Change features to:
   ```
   Instant digital tickets
   Cancel anytime before visit
   Mobile & printed tickets accepted
   Family-friendly experience
   ```
5. Save changes
6. Visit exhibition page on customer site
7. ✅ Should see updated features
8. ✅ Changes from admin panel should reflect immediately

## Status

- [ ] Update server page to fetch content sections
- [ ] Update client component to use dynamic data
- [ ] Test in admin panel
- [ ] Verify on customer site
- [ ] Deploy to production
