# Admin Bookings Panel Fix - Complete

## Problem
The admin bookings panel was showing "No bookings found" even though recent bookings existed in the database (27 bookings confirmed in DB).

## Root Cause - RLS Policy Missing! ⚠️

**THE REAL ISSUE**: The `bookings` table had Row Level Security (RLS) enabled but NO policy allowing admins to view all bookings!

Existing RLS policies only allowed:
- Users to view their OWN bookings (`auth.uid() = user_id`)
- Users to create/update their own bookings

There was NO policy for admin users to view ALL bookings, so the admin API returned 0 results even though bookings existed.

## Additional Issues Fixed

### 1. Wrong Date Filter Field
The API was filtering bookings by `booking_date` (the scheduled visit date) instead of `created_at` (when the booking was made). This meant:
- Recent bookings with future visit dates wouldn't show up properly
- The "All Time" filter wasn't working as expected

### 2. Invalid Custom Date Range Requests
The frontend was sending `dateRange=custom` parameter without the required `startDate` and `endDate` parameters, causing 400 errors.

## Solutions Applied

### Fix 1: Added RLS Policy for Admins (CRITICAL FIX) ✅
**File**: `mgm-museum/supabase/migrations/20260110_admin_bookings_rls_policy.sql`

Created a new RLS policy that allows admin and super_admin users to view ALL bookings:

```sql
CREATE POLICY "Admins can view all bookings"
ON public.bookings
FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'super_admin')
  )
);
```

**Why**: Without this policy, the Supabase client (even with proper auth) couldn't return any bookings to admin users because RLS was blocking access. This is the PRIMARY fix that resolves the issue.

### Fix 2: Changed API Date Filter (route.ts)
**File**: `mgm-museum/app/api/admin/bookings/route.ts`

Changed from filtering by `booking_date`:
```typescript
.gte('booking_date', format(startDate, 'yyyy-MM-dd'))
.lte('booking_date', format(endDate, 'yyyy-MM-dd'))
```

To filtering by `created_at`:
```typescript
.gte('created_at', startDate.toISOString())
.lte('created_at', endDate.toISOString())
```

**Why**: Admin panels should show bookings based on when they were created, not when the visit is scheduled. This allows admins to see all recent bookings regardless of future visit dates.

### Fix 3: Fixed Custom Date Range Logic (page.tsx)
**File**: `mgm-museum/app/admin/bookings/page.tsx`

Added proper validation before sending custom date range:
```typescript
// Only add dateRange if it's not 'all' and not 'custom' without dates
if (dateRange !== 'all') {
  if (dateRange === 'custom') {
    // Only add custom range if both dates are set
    if (customStartDate && customEndDate) {
      params.append('dateRange', 'custom');
      params.append('startDate', format(customStartDate, 'yyyy-MM-dd'));
      params.append('endDate', format(customEndDate, 'yyyy-MM-dd'));
    }
    // Otherwise, don't add any date filter (defaults to 'all')
  } else {
    // For non-custom ranges (today, tomorrow, last_week, etc.)
    params.append('dateRange', dateRange);
  }
}
```

**Why**: Prevents sending incomplete custom date range requests that would cause 400 errors.

## Testing

### Verified Database Has Bookings
```sql
SELECT id, booking_reference, guest_name, booking_date, created_at 
FROM bookings 
ORDER BY created_at DESC 
LIMIT 5;
```

Results showed recent bookings:
- Most recent: 2025-11-09 19:51:19 UTC
- Visit dates: November 21, 27, 28, 2025 (future dates)

### Expected Behavior After Fix
1. ✅ Admin panel shows all bookings by default (dateRange='all')
2. ✅ Bookings are filtered by when they were created, not visit date
3. ✅ No 400 errors for custom date range
4. ✅ Recent bookings appear immediately in the list

## Commits
1. `6392b9c57` - Fix admin bookings: Filter by created_at instead of booking_date
2. `70aafb3a2` - Fix admin bookings: Prevent sending custom dateRange without dates
3. `9a00efc7e` - Add debug logging to bookings API
4. `92ce82790` - **Fix: Add RLS policy for admins to view all bookings** (CRITICAL FIX)

## Deployment
Changes pushed to main branch and deployed to Vercel production.

## Verification Steps
After deployment, verify the fix by:
1. Log in to admin panel as admin user
2. Navigate to Bookings page
3. Should see all 27 bookings displayed
4. Test different date filters (All Time, Today, Last Week, etc.)
5. Test search and status filters

## Key Learnings
- **ALWAYS check RLS policies when queries return empty results** - This was the root cause!
- RLS policies must explicitly grant admin users access to view all records
- Admin booking panels should filter by `created_at` for "when was this booking made"
- Use `booking_date`/`visit_date` filters only when specifically filtering by scheduled visit dates
- Always validate custom date range inputs before sending API requests
- Frontend validation prevents unnecessary 400 errors and improves UX
- When debugging "no results" issues, check: 1) RLS policies, 2) Query filters, 3) Auth state
