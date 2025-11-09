# Admin API Authentication Fix

## Problem
The admin panel was showing "Failed to fetch exhibitions" errors with 500 status codes. The console showed:
- `/api/admin/exhibitions` returning 500 errors
- Shows and events APIs also failing
- Authentication issues preventing data from loading

## Root Cause
Admin API routes were not properly verifying:
1. User authentication (session existence)
2. Admin role authorization

The middleware was excluding all `/api` routes from authentication checks, meaning API routes needed to handle their own auth but weren't doing so properly.

## Solution Implemented

### 1. Created Reusable Auth Helper
Created `/lib/auth/admin-auth.ts` with `verifyAdminAuth()` function that:
- Checks for valid session
- Verifies user has admin role in profiles table
- Returns appropriate error responses (401 for unauthorized, 403 for forbidden)
- Returns authenticated supabase client on success

### 2. Updated Admin API Routes
Applied authentication to:
- `/app/api/admin/exhibitions/route.ts` - GET, POST, PUT methods
- `/app/api/admin/shows/route.ts` - GET, POST methods
- `/app/api/admin/events/route.ts` - GET, POST methods

### 3. Fixed Implementation Issues
- Changed shows API from `getServiceSupabase()` to authenticated client
- Fixed events API missing `await` on `createClient()`
- Standardized authentication pattern across all admin endpoints

## Code Changes

### Before (exhibitions API):
```typescript
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    // No authentication check!
    const { data: exhibitions, error } = await supabase
      .from('exhibitions')
      .select('*')
    // ...
  }
}
```

### After:
```typescript
export async function GET(request: NextRequest) {
  try {
    const { error: authError, supabase } = await verifyAdminAuth();
    if (authError) return authError;
    
    const { data: exhibitions, error } = await supabase
      .from('exhibitions')
      .select('*')
    // ...
  }
}
```

## Testing
After deployment, verify:
1. Admin login works correctly
2. Exhibitions page loads without errors
3. Shows and events pages load properly
4. Non-admin users cannot access admin APIs (403 error)
5. Unauthenticated requests return 401 errors

## Deployment
Changes committed and pushed to main branch. Vercel will automatically deploy.

Commit: `2c9a23913` - "Fix admin API authentication - add proper session and role verification"

## Files Modified
- `lib/auth/admin-auth.ts` (new)
- `app/api/admin/exhibitions/route.ts`
- `app/api/admin/shows/route.ts`
- `app/api/admin/events/route.ts`
