# Analytics 403 Error Fix

## Problem
After successful admin login, the analytics dashboard was showing a 403 Forbidden error when trying to fetch data from `/api/admin/analytics`.

**Console Error:**
```
Analytics error: Error: Failed to fetch analytics
/api/admin/analytics:1 Failed to load resource: the server responded with a status of 403 ()
```

## Root Cause
The analytics API route (`app/api/admin/analytics/route.ts`) was querying a table called `profiles` to check the user's admin role:

```typescript
const { data: profile } = await supabase
  .from('profiles')  // ❌ This table doesn't exist!
  .select('role')
  .eq('id', user.id)
  .single();
```

However, the actual table in the database is called `users`, not `profiles`. This caused the query to fail and return a 403 error.

## Solution
Changed the table name from `profiles` to `users`:

```typescript
const { data: profile } = await supabase
  .from('users')  // ✅ Correct table name
  .select('role')
  .eq('id', user.id)
  .single();
```

## Deployment
- **Commit**: `559e2cd5c0763aa2e3720bd40495098e0f37003a`
- **Pushed to**: `main` branch
- **Status**: Vercel will automatically deploy this fix

## Testing
Once deployed (usually takes 2-3 minutes), test by:

1. Login at: `https://mgm-museum-76lco86mo-shivam-s-projects-fd1d92c1.vercel.app/admin/login`
   - Email: `testadmin@mgmmuseum.com`
   - Password: `TestAdmin123!`

2. Navigate to: `/admin/analytics`

3. The dashboard should now load with real data:
   - Total revenue
   - Total bookings
   - Total visitors
   - Charts and graphs

## Database Verification
Confirmed the test admin exists in the database:
- **User ID**: `f7d00b8a-7a76-44d7-9566-097fe9c91709`
- **Email**: `testadmin@mgmmuseum.com`
- **Role**: `admin`
- **Created**: November 9, 2025

## Next Steps
After deployment completes:
1. Clear browser cache (Ctrl+Shift+Delete)
2. Log in again
3. Navigate to analytics dashboard
4. Verify real data is displayed

The fix is minimal and targeted - only correcting the table name in the analytics API authentication check.
