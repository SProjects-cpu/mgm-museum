# 🎯 Test Admin Account - Ready to Use!

## ✅ CREDENTIALS

**Email:** `testadmin@mgmmuseum.com`  
**Password:** `TestAdmin123!`  
**Role:** `admin`

---

## 📋 SETUP INSTRUCTIONS

### Step 1: Create User in Supabase Auth

1. **Go to Supabase Dashboard**
   - URL: https://supabase.com/dashboard
   - Select your MGM Museum project

2. **Navigate to Authentication → Users**
   - Click on "Authentication" in the left sidebar
   - Click on "Users" tab

3. **Click "Add User" button** (top right)

4. **Fill in the form:**
   - **Email:** `testadmin@mgmmuseum.com`
   - **Password:** `TestAdmin123!`
   - **Auto Confirm User:** ✅ **CHECK THIS BOX** (important!)
   - Leave other fields empty

5. **Click "Create User"**

6. **Copy the User ID**
   - After creation, you'll see the user in the list
   - Click on the user to see details
   - Copy the **User ID** (looks like: `abc12345-def6-7890-ghij-klmnopqrstuv`)

---

### Step 2: Add User to Users Table

1. **Go to SQL Editor**
   - Click "SQL Editor" in the left sidebar
   - Click "New Query"

2. **Paste this SQL** (replace `YOUR_USER_ID_HERE` with the ID you copied):

```sql
-- Insert test admin into users table
INSERT INTO users (id, email, role, full_name, created_at, updated_at)
VALUES (
  'YOUR_USER_ID_HERE',  -- ⚠️ REPLACE THIS with the User ID from Step 1
  'testadmin@mgmmuseum.com',
  'admin',
  'Test Admin User',
  NOW(),
  NOW()
);

-- Verify it was created
SELECT id, email, role, full_name FROM users WHERE email = 'testadmin@mgmmuseum.com';
```

3. **Click "Run"**

4. **You should see:**
   - Success message
   - A result showing the user with role = 'admin'

---

### Step 3: Login and Test

1. **Go to your website**
   - URL: https://your-site.vercel.app/admin/login

2. **Login with:**
   - Email: `testadmin@mgmmuseum.com`
   - Password: `TestAdmin123!`

3. **Test these features:**

   ✅ **Bookings Management** (`/admin/bookings`)
   - Should see bookings table
   - Can filter by date
   - Can export to Excel

   ✅ **Settings** (`/admin/settings`)
   - Can change settings
   - Settings save to database
   - Changes persist after refresh

   ✅ **Account Settings** (`/admin/settings/account`)
   - Can change password
   - Can change email (sends verification)

   ✅ **Analytics Export** (`/admin/analytics`)
   - Can export PDF report
   - PDF downloads successfully

   ✅ **Image Upload** (`/admin/exhibitions/[any-id]`)
   - Can drag and drop images
   - Upload works
   - Preview shows images

---

## 🚨 TROUBLESHOOTING

### "Email already exists" error in Step 1

**Solution:** The user already exists! Just get the User ID:
1. Go to Authentication → Users
2. Search for `testadmin@mgmmuseum.com`
3. Click on the user
4. Copy the User ID
5. Continue to Step 2

### "Duplicate key value" error in Step 2

**Solution:** User already exists in users table!
1. Run this to check:
```sql
SELECT id, email, role FROM users WHERE email = 'testadmin@mgmmuseum.com';
```

2. If role is not 'admin', update it:
```sql
UPDATE users SET role = 'admin' WHERE email = 'testadmin@mgmmuseum.com';
```

3. Try logging in!

### Still getting "Unauthorized" errors

**Check these:**

1. **Verify user role:**
```sql
SELECT id, email, role FROM users WHERE email = 'testadmin@mgmmuseum.com';
```
Should show: `role: admin`

2. **Clear browser cache:**
   - Press Ctrl+Shift+Delete
   - Clear cookies and cache
   - Or use incognito mode

3. **Logout and login again:**
   - Make sure you're using the correct credentials
   - Email: `testadmin@mgmmuseum.com`
   - Password: `TestAdmin123!`

4. **Check browser console:**
   - Press F12
   - Look for errors in Console tab
   - Check Network tab for failed API calls

---

## 📸 VISUAL GUIDE

### Step 1: Add User in Supabase Auth

```
Supabase Dashboard
└── Authentication
    └── Users
        └── [Add User Button]
            ├── Email: testadmin@mgmmuseum.com
            ├── Password: TestAdmin123!
            └── Auto Confirm User: ✅
```

### Step 2: Copy User ID

```
After creating user:
Users List
└── testadmin@mgmmuseum.com
    └── [Click to view details]
        └── User ID: abc12345-def6-7890-ghij-klmnopqrstuv
            └── [Copy this ID]
```

### Step 3: Run SQL

```
SQL Editor
└── [New Query]
    └── [Paste SQL with User ID]
        └── [Run Button]
            └── ✅ Success!
```

---

## ✨ ALTERNATIVE: Use Existing Admin

If you don't want to create a new user, you can use existing admins:

1. **Super Admin:** `paliwalshivam62@gmail.com`
2. **Admin:** `krushnarumale2022@gmail.com`

(You need to know their passwords)

---

## 🎉 SUCCESS CHECKLIST

After setup, verify these work:

- [ ] Can login with testadmin@mgmmuseum.com
- [ ] Can access /admin/bookings (no 401 error)
- [ ] Can export bookings to Excel
- [ ] Can access /admin/settings (no 401 error)
- [ ] Can save settings (persist after refresh)
- [ ] Can access /admin/settings/account
- [ ] Can change password
- [ ] Can access /admin/analytics
- [ ] Can export analytics PDF
- [ ] Can upload exhibition images

If all checked ✅ - **Everything is working!** 🎉

---

## 📞 NEED HELP?

If you're stuck:

1. **Check the User ID** - Make sure you copied it correctly
2. **Check the SQL** - Make sure you replaced `YOUR_USER_ID_HERE`
3. **Check the role** - Run: `SELECT role FROM users WHERE email = 'testadmin@mgmmuseum.com';`
4. **Clear cache** - Try incognito mode
5. **Check console** - Press F12 and look for errors

---

**Created:** November 9, 2025  
**Status:** Ready to use  
**Estimated Setup Time:** 2-3 minutes

