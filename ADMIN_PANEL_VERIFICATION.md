# Admin Panel Changes Verification Guide

## What Was Changed

### 1. Bookings Management Page (`/admin/bookings`)
**Status:** ✅ Fully Implemented

**What to see:**
- Full bookings table with 12 columns
- Date range filters (Today, Tomorrow, Last Week, Last Month, Custom)
- Search functionality
- Pagination (50 per page)
- Export to Excel button
- Sorting by clicking column headers

**How to verify:**
1. Navigate to `/admin/bookings`
2. You should see a table with booking data
3. Try the date filters at the top
4. Click "Export to Excel" to download a report

### 2. Settings Page (`/admin/settings`)
**Status:** ✅ Backend Connected

**What changed:**
- Settings now save to database (not dummy data)
- Settings load from database on page load
- Real-time validation
- Success/error notifications

**How to verify:**
1. Navigate to `/admin/settings`
2. Change any setting (e.g., museum name)
3. Click "Save All Settings"
4. Refresh the page - your changes should persist
5. Check the "Reset to Saved" button works

### 3. Account Settings (`/admin/settings/account`)
**Status:** ✅ New Page Created

**What to see:**
- Email change form with verification
- Password change form
- Password requirements list

**How to verify:**
1. Navigate to `/admin/settings/account` (or add a link to sidebar)
2. Try changing your password
3. Try changing your email (will send verification email)

### 4. Analytics PDF Export (`/admin/analytics`)
**Status:** ✅ Export Button Updated

**What changed:**
- "Export PDF" button now generates actual PDF reports
- Includes summary statistics, top exhibitions, revenue data

**How to verify:**
1. Navigate to `/admin/analytics`
2. Click "Export PDF" button
3. A PDF file should download with analytics data

### 5. Image Upload (`/admin/exhibitions/[id]`)
**Status:** ✅ Drag-and-Drop Implemented

**What changed:**
- New drag-and-drop upload zone
- File validation
- Upload progress
- Image preview with delete

**How to verify:**
1. Navigate to any exhibition edit page
2. Scroll to "Images" section
3. You should see a drag-and-drop zone
4. Try uploading an image

---

## Troubleshooting

### "I don't see any changes"

**Possible causes:**

1. **Browser Cache**
   - Solution: Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
   - Or clear browser cache completely

2. **Vercel Deployment Pending**
   - Check: https://vercel.com/dashboard
   - Wait for deployment to complete (usually 2-3 minutes)
   - Look for green checkmark

3. **Not Logged In as Admin**
   - Some features require admin role
   - Check your user role in database
   - Make sure you're logged in

4. **Database Migrations Not Applied**
   - Check Supabase dashboard
   - Verify these tables exist:
     - `system_settings`
     - `email_verification_tokens`
   - Verify storage buckets exist:
     - `exhibition-images`
     - `show-images`

### "Bookings page shows 404"

**Solution:**
- The file exists at `app/admin/bookings/page.tsx`
- Check if deployment succeeded
- Try accessing directly: `https://your-domain.vercel.app/admin/bookings`

### "Settings don't save"

**Possible causes:**
1. Database migration not applied
2. Not logged in as admin
3. API endpoint error

**Check:**
- Open browser console (F12)
- Look for error messages
- Check Network tab for failed requests

### "Export buttons don't work"

**Possible causes:**
1. Not enough data in database
2. API endpoint error
3. Browser blocking download

**Check:**
- Browser console for errors
- Network tab for API responses
- Try with different browser

---

## Database Verification

### Check if migrations are applied:

1. Go to Supabase Dashboard
2. Navigate to Table Editor
3. Look for these tables:
   - `system_settings` ✅
   - `email_verification_tokens` ✅

4. Navigate to Storage
5. Look for these buckets:
   - `exhibition-images` ✅
   - `show-images` ✅

### Check if default settings exist:

Run this query in Supabase SQL Editor:
```sql
SELECT * FROM system_settings;
```

You should see 14 rows with default settings.

---

## API Endpoints Verification

Test these endpoints (must be logged in as admin):

1. **Settings API:**
   ```
   GET /api/admin/settings
   ```
   Should return settings grouped by category

2. **Bookings API:**
   ```
   GET /api/admin/bookings?dateRange=last_week
   ```
   Should return bookings data

3. **Analytics Export:**
   ```
   POST /api/admin/export/analytics
   Body: { "startDate": "2025-01-01", "endDate": "2025-11-09" }
   ```
   Should return PDF file

4. **Bookings Export:**
   ```
   POST /api/admin/export/bookings
   Body: { "filters": {} }
   ```
   Should return Excel file

---

## Local Development Testing

If you want to test locally:

1. **Start dev server:**
   ```bash
   npm run dev
   ```

2. **Navigate to:**
   - http://localhost:3000/admin/bookings
   - http://localhost:3000/admin/settings
   - http://localhost:3000/admin/settings/account
   - http://localhost:3000/admin/analytics

3. **Check console for errors:**
   - Open browser DevTools (F12)
   - Look for red errors in Console tab
   - Check Network tab for failed requests

---

## Production Deployment Checklist

✅ Code committed to Git
✅ Pushed to GitHub
✅ Vercel deployment triggered
✅ Database migrations applied
✅ Storage buckets created
⏳ Waiting for deployment to complete

**Check deployment status:**
1. Go to https://vercel.com/dashboard
2. Find your project
3. Check latest deployment status
4. Look for green checkmark (success)

---

## What Each Feature Does

### Bookings Management
- **Purpose:** View and manage all customer bookings
- **Features:** Filters, search, pagination, sorting, Excel export
- **Data:** Shows 12 columns including visitor info, booking details, payment info

### Settings Management
- **Purpose:** Configure museum settings
- **Features:** General info, hours, booking policies, system settings
- **Persistence:** All settings saved to database

### Account Settings
- **Purpose:** Change admin credentials
- **Features:** Email change (with verification), password change
- **Security:** Email verification required, password strength validation

### Analytics Export
- **Purpose:** Generate PDF reports
- **Features:** Summary stats, top exhibitions, revenue data, bookings data
- **Format:** Professional PDF with MGM branding

### Image Upload
- **Purpose:** Upload exhibition images
- **Features:** Drag-and-drop, validation, progress, preview
- **Storage:** Supabase Storage with CDN

---

## Quick Test Checklist

Run through this checklist to verify everything works:

- [ ] Can access `/admin/bookings`
- [ ] Can see bookings data in table
- [ ] Can filter bookings by date
- [ ] Can export bookings to Excel
- [ ] Can access `/admin/settings`
- [ ] Can change a setting and save
- [ ] Settings persist after page refresh
- [ ] Can access `/admin/settings/account`
- [ ] Can change password
- [ ] Can access `/admin/analytics`
- [ ] Can export analytics to PDF
- [ ] Can upload exhibition images
- [ ] Images show in preview
- [ ] Can delete uploaded images

---

## Support

If you're still not seeing changes:

1. **Check Vercel deployment logs:**
   - Go to Vercel dashboard
   - Click on latest deployment
   - Check build logs for errors

2. **Check Supabase logs:**
   - Go to Supabase dashboard
   - Check Logs section
   - Look for API errors

3. **Check browser console:**
   - Press F12
   - Look for JavaScript errors
   - Check Network tab for failed requests

4. **Try incognito mode:**
   - Opens fresh browser session
   - No cache issues
   - Tests if it's a caching problem

---

**Last Updated:** November 9, 2025
**Status:** All features deployed and ready for testing
