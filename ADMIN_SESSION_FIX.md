# Admin Session Fix Guide

## Issue
The admin feedbacks page shows "Admin role required current role: Customer" even though the database has been updated with admin roles.

## Root Cause
The user's browser session may be cached, or the user currently logged in doesn't have admin access.

## Solution Steps

### Step 1: Verify Which User is Logged In

The database currently has these admin users:
- `krushnarumale2022@gmail.com` - **admin** role
- `paliwalshivam62@gmail.com` - **super_admin** role

All other users have **customer** role.

### Step 2: Log Out and Log Back In

1. **Log out** from the current session
2. **Clear browser cache** (optional but recommended):
   - Press `Ctrl+Shift+Delete` (Windows) or `Cmd+Shift+Delete` (Mac)
   - Select "Cookies and other site data"
   - Click "Clear data"
3. **Log back in** using one of the admin accounts:
   - `krushnarumale2022@gmail.com` OR
   - `paliwalshivam62@gmail.com`

### Step 3: Test Admin Access

After logging in with an admin account:
1. Navigate to `/admin/feedbacks`
2. The page should load without errors
3. You should see the feedbacks list

## Why This Happens

The API correctly checks the role from the database on each request, but:
1. If you're logged in as a different user (not one of the admin accounts), you'll get the error
2. The session needs to be refreshed after role changes

## How to Add More Admin Users

If you need to grant admin access to another user:

```sql
-- For admin role
UPDATE users 
SET role = 'admin' 
WHERE email = 'new-admin@example.com';

-- For super_admin role
UPDATE users 
SET role = 'super_admin' 
WHERE email = 'new-superadmin@example.com';
```

Then that user needs to:
1. Log out
2. Log back in
3. Access admin pages

## Current Admin Users

| Email | Role | User ID |
|-------|------|---------|
| krushnarumale2022@gmail.com | admin | aeddf000-3a26-4f6e-a7da-1f228edd487d |
| paliwalshivam62@gmail.com | super_admin | e1e01c91-0262-498d-a0bc-384282be73d5 |

## Troubleshooting

### Still Getting "Customer" Role Error?

1. **Check which email you're logged in with**:
   - Open browser DevTools (F12)
   - Go to Application tab → Local Storage
   - Look for Supabase auth data
   - Verify the email matches one of the admin accounts

2. **Force logout and clear all data**:
   ```javascript
   // Run in browser console
   localStorage.clear();
   sessionStorage.clear();
   location.reload();
   ```

3. **Verify the user exists in database**:
   - The user must exist in both `auth.users` AND `public.users` tables
   - The role must be set in `public.users` table

### API is Checking Database Correctly

The API code at `/api/admin/feedbacks` does this:
```typescript
// Get user from auth token
const { data: { user } } = await supabase.auth.getUser();

// Fetch role from database (NOT from JWT)
const { data: userData } = await supabase
  .from('users')
  .select('role')
  .eq('id', user.id)
  .single();

// Check if admin
if (userData.role !== 'admin' && userData.role !== 'super_admin') {
  return 403; // Forbidden
}
```

This means the API always checks the **current** role in the database, not a cached value.

## Most Likely Issue

**You're logged in as a user that doesn't have admin role.**

Solution: Log out and log in as one of these accounts:
- krushnarumale2022@gmail.com
- paliwalshivam62@gmail.com

---

**Updated**: January 9, 2025  
**Status**: Database roles are correct, user needs to use admin account
