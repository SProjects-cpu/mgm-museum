# Admin Panel Credentials & Access

## Current Admin Users in Database

Based on the database query, these users have admin access:

### Super Admin
- **Email:** `paliwalshivam62@gmail.com`
- **Role:** `super_admin`
- **User ID:** `e1e01c91-0262-498d-a0bc-384282be73d5`

### Admin
- **Email:** `krushnarumale2022@gmail.com`
- **Role:** `admin`
- **User ID:** `aeddf000-3a26-4f6e-a7da-1f228edd487d`

---

## Why "admin@mgmmuseum.com" Doesn't Work

The default credentials `admin@mgmmuseum.com` / `admin123` **do not exist** in your database. You need to use one of the existing admin accounts above.

---

## Option 1: Use Existing Admin Account

**Login with one of these:**
1. `paliwalshivam62@gmail.com` (super_admin)
2. `krushnarumale2022@gmail.com` (admin)

You'll need to know the password for these accounts. If you don't know the password, use Option 2 or 3.

---

## Option 2: Create Test Admin Account

Run this script to create a test admin user:

```bash
npx tsx scripts/create-test-admin.ts
```

This will create:
- **Email:** `testadmin@mgmmuseum.com`
- **Password:** `TestAdmin123!`
- **Role:** `admin`

---

## Option 3: Update Existing User to Admin

If you have access to Supabase dashboard:

1. Go to Supabase Dashboard → SQL Editor
2. Run this query to make any user an admin:

```sql
-- Replace 'your-email@example.com' with the email you want to make admin
UPDATE users 
SET role = 'admin' 
WHERE email = 'your-email@example.com';
```

Or to create a new admin user:

```sql
-- First, create the user in Supabase Auth (Dashboard → Authentication → Users → Add User)
-- Then run this to set their role:
INSERT INTO users (id, email, role, full_name)
VALUES (
  'USER_ID_FROM_AUTH',  -- Replace with the ID from Auth
  'admin@mgmmuseum.com',
  'admin',
  'Admin User'
);
```

---

## Option 4: Reset Password for Existing Admin

If you want to reset the password for an existing admin:

### Via Supabase Dashboard:
1. Go to Authentication → Users
2. Find the user (e.g., `krushnarumale2022@gmail.com`)
3. Click the three dots → "Send Password Recovery"
4. Check email for reset link

### Via SQL (requires service role key):
```sql
-- This requires using Supabase Admin API
-- Cannot be done via SQL directly
```

---

## Testing the Admin Panel Features

Once you have admin access, test these features:

### 1. Bookings Management
**URL:** `/admin/bookings`

**What to test:**
- View bookings table
- Use date filters
- Search bookings
- Export to Excel

**Expected behavior:**
- Should load without "Unauthorized" error
- Should show bookings data
- Export button should download Excel file

### 2. Settings Management
**URL:** `/admin/settings`

**What to test:**
- Change museum name
- Click "Save All Settings"
- Refresh page

**Expected behavior:**
- Settings should save to database
- Changes should persist after refresh
- No "Unauthorized" error

### 3. Account Settings
**URL:** `/admin/settings/account`

**What to test:**
- Change password
- Change email (will send verification)

**Expected behavior:**
- Password change should work immediately
- Email change should send verification email
- No "Unauthorized" error

### 4. Analytics Export
**URL:** `/admin/analytics`

**What to test:**
- Click "Export PDF" button

**Expected behavior:**
- Should download PDF file
- PDF should contain analytics data
- No "Unauthorized" error

### 5. Image Upload
**URL:** `/admin/exhibitions/[any-exhibition-id]`

**What to test:**
- Drag and drop an image
- See upload progress
- See image preview

**Expected behavior:**
- Upload should work
- Image should appear in preview
- No "Unauthorized" error

---

## Troubleshooting "Unauthorized" Errors

### Check 1: User Role in Database
```sql
SELECT id, email, role FROM users WHERE email = 'your-email@example.com';
```

**Expected:** Role should be `admin` or `super_admin`

### Check 2: User Exists in Both Tables
```sql
-- Check Auth
SELECT id, email FROM auth.users WHERE email = 'your-email@example.com';

-- Check Users table
SELECT id, email, role FROM users WHERE email = 'your-email@example.com';
```

**Expected:** User should exist in both tables with matching IDs

### Check 3: Session is Valid
- Clear browser cookies
- Logout and login again
- Try incognito mode

### Check 4: API Endpoint Logs
Open browser console (F12) and check:
- Network tab for API calls
- Look for 401 or 403 errors
- Check error messages

---

## Quick Fix: Make Your Current User Admin

If you're already logged in but getting "Unauthorized":

1. Find your user ID:
```sql
SELECT id, email, role FROM users WHERE email = 'YOUR_CURRENT_EMAIL';
```

2. Update your role:
```sql
UPDATE users SET role = 'admin' WHERE email = 'YOUR_CURRENT_EMAIL';
```

3. Logout and login again

---

## Environment Variables Check

Make sure these are set in Vercel:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

---

## Summary

**The issue:** You're trying to use credentials that don't exist in the database.

**The solution:** Use one of these options:
1. ✅ Login with existing admin: `paliwalshivam62@gmail.com` or `krushnarumale2022@gmail.com`
2. ✅ Create test admin: Run `npx tsx scripts/create-test-admin.ts`
3. ✅ Update your current user to admin role in Supabase
4. ✅ Reset password for existing admin via Supabase dashboard

**After getting admin access:**
- All features should work without "Unauthorized" errors
- You can export analytics, bookings, change settings, etc.

---

**Last Updated:** November 9, 2025
