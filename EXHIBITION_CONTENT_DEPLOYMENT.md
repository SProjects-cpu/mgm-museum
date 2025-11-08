# Exhibition Content Management - Deployment Guide

## Summary of Changes

### ✅ Files Created
1. `supabase/migrations/20260108_exhibition_content_sections.sql` - Database migration
2. `EXHIBITION_CONTENT_FIXES.md` - Detailed fix documentation

### ✅ Files Modified
1. `components/admin/exhibition-content-manager.tsx` - Added booking_widget section type and special form fields

## What Was Fixed

### 1. **Database Table Creation**
- Created `exhibition_content_sections` table
- Added proper indexes for performance
- Enabled Row Level Security (RLS)
- Added policies for public and authenticated access
- Created updated_at trigger
- Inserted default booking widgets for existing exhibitions

### 2. **Admin Panel Updates**
- Added "Book Your Visit Widget" as a section type
- Added special form fields for booking widget features
- Features can be edited as multi-line text (one per line)

## Deployment Steps

### Step 1: Run Database Migration

You have two options:

#### Option A: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy the entire contents of `supabase/migrations/20260108_exhibition_content_sections.sql`
5. Paste into the SQL editor
6. Click **Run** or press `Ctrl+Enter`
7. Verify success message

#### Option B: Using Supabase CLI

```bash
cd mgm-museum

# Make sure you're logged in
supabase login

# Link to your project (if not already linked)
supabase link --project-ref your-project-ref

# Push the migration
supabase db push
```

### Step 2: Verify Database Table

Run this query in Supabase SQL Editor:

```sql
-- Check if table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'exhibition_content_sections'
) as table_exists;

-- Check table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'exhibition_content_sections'
ORDER BY ordinal_position;

-- Check if default booking widgets were created
SELECT 
  e.name as exhibition_name,
  ecs.title,
  ecs.section_type,
  ecs.active
FROM exhibition_content_sections ecs
JOIN exhibitions e ON e.id = ecs.exhibition_id
WHERE ecs.section_type = 'booking_widget';
```

Expected results:
- `table_exists` should be `true`
- Should see all columns (id, exhibition_id, section_type, etc.)
- Should see booking widgets for active exhibitions

### Step 3: Deploy Code Changes to Vercel

```bash
cd mgm-museum

# Stage changes
git add components/admin/exhibition-content-manager.tsx
git add supabase/migrations/20260108_exhibition_content_sections.sql
git add EXHIBITION_CONTENT_FIXES.md
git add EXHIBITION_CONTENT_DEPLOYMENT.md

# Commit
git commit -m "feat: Add exhibition content sections management

- Create exhibition_content_sections database table
- Add booking_widget section type to admin panel
- Enable dynamic content management for exhibitions
- Add special form fields for booking widget features
- Insert default booking widgets for existing exhibitions

Fixes:
- 500 Internal Server Error when adding sections
- 'Failed to save section' error
- 'Failed to fetch content sections' error
- Hardcoded Book Your Visit section now editable"

# Push to GitHub
git push origin main

# Deploy to Vercel
vercel --prod --yes
```

### Step 4: Test in Admin Panel

1. **Login to Admin Panel**
   - Go to `/admin/login`
   - Login with admin credentials

2. **Navigate to Exhibitions**
   - Go to `/admin/exhibitions`
   - Click on any exhibition to edit

3. **Test Content Management**
   - Scroll to "Content Sections" card
   - Click "Add Section"
   - Select "Book Your Visit Widget" from dropdown
   - Fill in:
     - Title: "Book Your Visit"
     - Content: "Select your preferred date and time"
     - Features (one per line):
       ```
       Instant confirmation
       Free cancellation up to 24 hours
       Mobile ticket accepted
       Skip the line access
       ```
   - Click "Create Section"
   - ✅ Should save successfully (no 500 error)

4. **Test Editing**
   - Click edit icon on the section
   - Modify the features
   - Click "Update Section"
   - ✅ Should update successfully

5. **Test Reordering**
   - Drag sections to reorder
   - ✅ Order should save automatically

6. **Test Toggle Active**
   - Toggle the active switch
   - ✅ Should update immediately

### Step 5: Verify on Public Site

1. **Visit Exhibition Page**
   - Go to any exhibition detail page
   - Look for "Book Your Visit" section
   - ✅ Should display (currently may still be hardcoded)

2. **Note:** The public exhibition page still needs to be updated to fetch and render sections from the database. This is documented in `EXHIBITION_CONTENT_FIXES.md` as a follow-up task.

## Troubleshooting

### Error: "relation 'exhibition_content_sections' does not exist"

**Solution:** The migration hasn't been run yet.
- Follow Step 1 to run the migration
- Verify with Step 2 queries

### Error: "Failed to save section" (still happening)

**Possible causes:**
1. Migration not run - Check Step 2
2. RLS policies not applied - Re-run migration
3. User not authenticated - Check login status

**Debug query:**
```sql
-- Check RLS policies
SELECT * FROM pg_policies 
WHERE tablename = 'exhibition_content_sections';

-- Should see 5 policies
```

### Error: "Section type 'booking_widget' not recognized"

**Solution:** Code changes not deployed
- Make sure you pushed to GitHub
- Verify Vercel deployment completed
- Clear browser cache and reload

### Booking widget not showing on public page

**Expected:** This is normal for now. The public exhibition page needs to be updated separately to fetch and render sections from the database. This is documented as a follow-up task.

## Next Steps (Follow-up Tasks)

### 1. Update Public Exhibition Page

The exhibition detail page needs to be updated to:
- Fetch content sections from database
- Render booking widget dynamically
- Use real pricing and time slot data
- Fall back to default if no section exists

**Files to find and update:**
- Exhibition detail page (likely in `app/(public)/exhibitions/[slug]/page.tsx` or similar)
- May need to create `components/exhibition/BookingWidgetCard.tsx`

### 2. Add More Section Types

Consider adding:
- `video` - Embedded videos
- `testimonials` - Visitor reviews
- `related_exhibitions` - Cross-promotion
- `accessibility` - Accessibility information

### 3. Image Upload Support

Currently images field exists but no upload UI. Add:
- Image upload button
- Integration with Supabase Storage
- Image preview in admin panel
- Gallery rendering on public page

## Verification Checklist

- [ ] Database migration run successfully
- [ ] Table `exhibition_content_sections` exists
- [ ] RLS policies created (5 policies)
- [ ] Default booking widgets inserted
- [ ] Code changes deployed to Vercel
- [ ] Admin panel loads without errors
- [ ] Can add new section successfully
- [ ] Can edit existing section
- [ ] Can delete section
- [ ] Can reorder sections
- [ ] Can toggle active/inactive
- [ ] Booking widget section type available
- [ ] Features field works correctly

## Success Criteria

✅ **Admin Panel:**
- No more 500 errors when adding sections
- No more "Failed to save section" errors
- No more "Failed to fetch content sections" errors
- Booking widget section type available
- Can manage all section types

✅ **Database:**
- Table exists with proper structure
- RLS policies working
- Default data inserted
- Indexes created for performance

✅ **Code:**
- Changes deployed to production
- No console errors
- Admin UI responsive and functional

---

**Status:** Ready for Deployment  
**Risk Level:** Low (database migration is safe, code changes are additive)  
**Rollback:** Can drop table if needed, code changes are backward compatible

**Deployment Time:** ~10 minutes  
**Testing Time:** ~5 minutes  
**Total Time:** ~15 minutes

---

**Created:** January 2026  
**Last Updated:** January 2026  
**Version:** 1.0
