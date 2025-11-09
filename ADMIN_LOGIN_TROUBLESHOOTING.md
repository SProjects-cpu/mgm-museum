# Admin Login Troubleshooting Guide

## Issue: "Please log in" popup in Admin Feedbacks Page

### What's Happening
The admin feedbacks page shows "Please log in" because there's no active session detected.

### Root Causes

1. **Not logged in** - User hasn't logged in yet
2. **Session expired** - The authentication session has expired
3. **Wrong account** - Logged in with a non-admin account
4. **Session cleared** - Browser data was cleared

### Solution Steps

#### Step 1: Log In to the Application

1. Navigate to the login page: `/login`
2. Log in with one of these admin accounts:
   - `krushnarumale2022@gmail.com`
   - `paliwalshivam62@gmail.com`

#### Step 2: Verify You're Logged In

After logging in, check:
- You should see your profile/account info in the header
- You should be able to access user-specific pages

#### Step 3: Access Admin Panel

1. Navigate to `/admin/feedbacks`
2. The page should now load without errors

### Database Admin Users

| Email | Role | Status |
|-------|------|--------|
| krushnarumale2022@gmail.com | admin | ✅ Active |
| paliwalshivam62@gmail.com | super_admin | ✅ Active |

### Common Issues & Fixes

#### Issue: "Session expired. Please log in again"

**Cause**: Your session has expired (typically after 1 hour of inactivity)

**Fix**:
1. Go to `/login`
2. Log in again with your admin credentials
3. Return to `/admin/feedbacks`

#### Issue: "Admin role required current role: Customer"

**Cause**: You're logged in with a non-admin account

**Fix**:
1. Log out from current account
2. Log in with an admin account (see table above)

#### Issue: Page keeps showing "Please log in" even after logging in

**Possible causes**:
1. Session not persisting in browser
2. Browser blocking cookies
3. Supabase configuration issue

**Fix**:
1. **Check browser cookies**:
   - Open DevTools (F12)
   - Go to Application → Cookies
   - Look for Supabase auth cookies
   - If missing, check if cookies are blocked

2. **Clear browser data and try again**:
   ```javascript
   // Run in browser console
   localStorage.clear();
   sessionStorage.clear();
   location.reload();
   ```

3. **Try incognito/private mode**:
   - Open incognito window
   - Navigate to the site
   - Log in
   - Test admin access

4. **Check Supabase connection**:
   - Open browser console (F12)
   - Look for Supabase connection errors
   - Check network tab for failed auth requests

### How Authentication Works

```
1. User logs in at /login
   ↓
2. Supabase creates session
   ↓
3. Session stored in browser (localStorage)
   ↓
4. Admin page checks session
   ↓
5. If session exists → Fetch user role from database
   ↓
6. If role is admin/super_admin → Allow access
   ↓
7. Otherwise → Show error
```

### Debugging Steps

#### Check if you're logged in:

```javascript
// Run in browser console
const { data } = await supabase.auth.getSession();
console.log('Session:', data.session);
console.log('User:', data.session?.user);
```

#### Check your role:

```javascript
// Run in browser console
const { data: { user } } = await supabase.auth.getUser();
if (user) {
  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();
  console.log('Your role:', userData?.role);
}
```

### Adding More Admin Users

If you need to grant admin access to another user:

1. **User must first create an account** on the site
2. **Then update their role in database**:

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

3. **User must log out and log back in** for role to take effect

### Code Changes Made

**File**: `app/admin/feedbacks/page.tsx`

**Changes**:
- Added session check before fetching feedbacks
- Improved error messages
- Better loading state handling
- Clearer console logging for debugging

**Commit**: `358872660c544274f3673ac57c3c465268b0b576`

### Testing Checklist

After logging in with admin account:

- [ ] Navigate to `/admin/feedbacks`
- [ ] Page loads without "Please log in" error
- [ ] Feedbacks list displays (if any exist)
- [ ] Filters work (rating, event type)
- [ ] Search works
- [ ] Pagination works

### Still Having Issues?

1. **Check browser console** for error messages
2. **Check network tab** for failed API requests
3. **Verify Supabase environment variables** are set correctly
4. **Check if user exists in both tables**:
   - `auth.users` (Supabase Auth)
   - `public.users` (Your app's user table)

### Related Documentation

- `ADMIN_ROLE_FIX_COMPLETE.md` - Database role updates
- `ADMIN_SESSION_FIX.md` - Session troubleshooting
- `CHECKOUT_AND_BUILD_FIX_COMPLETE.md` - Previous fixes

---

**Updated**: January 9, 2025  
**Status**: Session handling improved  
**Next Steps**: Log in with admin account to test
