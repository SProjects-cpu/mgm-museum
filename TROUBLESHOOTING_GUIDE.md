# Troubleshooting Guide - Booking System

## Issue: Time Slots Not Loading (500 Error)

### Quick Checks

#### 1. Clear Browser Cache
The browser might be caching the old API response.

**Solution**:
- Hard refresh: `Ctrl + Shift + R` (Windows) or `Cmd + Shift + R` (Mac)
- Or open in incognito/private browsing mode
- Or clear browser cache completely

#### 2. Verify Latest Deployment
Check that the latest code is deployed.

**Check**:
- Current production URL: https://mgm-museum-o9b4gp9ha-shivam-s-projects-fd1d92c1.vercel.app
- Latest commit: `2ff0db6`
- Deployment time: Check Vercel dashboard

#### 3. Check Database Data
Verify that slot_availability records exist.

**Run in Supabase SQL Editor**:
```sql
-- Check if slot availability exists for your exhibition
SELECT 
  ts.start_time,
  ts.end_time,
  sa.date,
  sa.available_capacity,
  sa.booked_count
FROM time_slots ts
JOIN slot_availability sa ON sa.time_slot_id = ts.id
WHERE ts.exhibition_id = '44d3a98d-faff-4dcf-a255-436cefdd97ef'
AND sa.date = '2025-12-03'
ORDER BY ts.start_time;
```

**Expected**: Should return at least one row with time slot data

**If empty**: Run this to populate:
```sql
INSERT INTO slot_availability (time_slot_id, date, available_capacity, booked_count)
SELECT 
  ts.id,
  '2025-12-03'::date,
  ts.capacity,
  0
FROM time_slots ts
WHERE ts.exhibition_id = '44d3a98d-faff-4dcf-a255-436cefdd97ef'
AND ts.active = true
ON CONFLICT (time_slot_id, date) DO NOTHING;
```

#### 4. Test API Directly
Test the API endpoint in your browser.

**URL to test**:
```
https://mgm-museum-o9b4gp9ha-shivam-s-projects-fd1d92c1.vercel.app/api/exhibitions/44d3a98d-faff-4dcf-a255-436cefdd97ef/time-slots?date=2025-12-03
```

**Expected Response**:
```json
{
  "success": true,
  "data": {
    "timeSlots": [
      {
        "id": "...",
        "startTime": "10:00:00",
        "endTime": "11:00:00",
        "totalCapacity": 50,
        "availableCapacity": 50,
        "bookedCount": 0,
        "isFull": false,
        "pricing": [...]
      }
    ]
  }
}
```

**If 500 Error**: Check Vercel function logs for the actual error

#### 5. Check Environment Variables
Verify Supabase credentials are set in Vercel.

**Required Variables**:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

**How to Check**:
1. Go to Vercel Dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Verify all three variables are set

## Issue: Calendar Dates Not Selectable

### Solution
Dates need `exhibition_schedules` records.

**Check**:
```sql
SELECT date, is_available, capacity_override
FROM exhibition_schedules
WHERE exhibition_id = '44d3a98d-faff-4dcf-a255-436cefdd97ef'
AND date >= CURRENT_DATE
ORDER BY date
LIMIT 10;
```

**If empty, populate**:
```sql
INSERT INTO exhibition_schedules (exhibition_id, date, is_available, capacity_override)
SELECT 
  '44d3a98d-faff-4dcf-a255-436cefdd97ef'::uuid,
  CURRENT_DATE + i,
  true,
  50
FROM generate_series(0, 89) i
ON CONFLICT (exhibition_id, date) DO NOTHING;
```

## Issue: Pricing Not Showing

### Solution
Verify pricing records exist.

**Check**:
```sql
SELECT ticket_type, price, active
FROM pricing
WHERE exhibition_id = '44d3a98d-faff-4dcf-a255-436cefdd97ef'
AND active = true;
```

**If empty, add pricing**:
```sql
INSERT INTO pricing (exhibition_id, ticket_type, price, active, valid_from)
VALUES 
  ('44d3a98d-faff-4dcf-a255-436cefdd97ef', 'adult', 100, true, CURRENT_DATE),
  ('44d3a98d-faff-4dcf-a255-436cefdd97ef', 'child', 50, true, CURRENT_DATE),
  ('44d3a98d-faff-4dcf-a255-436cefdd97ef', 'student', 75, true, CURRENT_DATE);
```

## Issue: 404 Errors for Terms/Privacy/Sitemap

These are expected and don't affect booking functionality.

**Why**: These pages haven't been created yet.

**Impact**: None - they're just footer links

**Solution** (optional): Create these pages later

## Issue: Manifest.json 401 Error

This is expected and doesn't affect functionality.

**Why**: PWA manifest is optional and requires authentication

**Impact**: None - booking works without it

**Solution**: Ignore this warning

## Common Fixes

### Fix 1: Redeploy
Sometimes a fresh deployment helps.

```bash
cd mgm-museum
vercel deploy --prod
```

### Fix 2: Restart Vercel Functions
In Vercel Dashboard:
1. Go to Deployments
2. Click on latest deployment
3. Click "Redeploy"

### Fix 3: Check Supabase Connection
Test if Supabase is accessible:

```sql
SELECT COUNT(*) FROM exhibitions WHERE status = 'active';
```

Should return a number > 0

### Fix 4: Verify RPC Function
Test the database function:

```sql
SELECT * FROM get_available_slots_for_exhibition(
  '44d3a98d-faff-4dcf-a255-436cefdd97ef'::uuid,
  CURRENT_DATE
);
```

Should return time slot data

## Getting Help

### Information to Provide

1. **Exact error message** from browser console
2. **API endpoint** that's failing
3. **Exhibition ID** you're testing with
4. **Date** you're selecting
5. **Browser** and version
6. **Screenshot** of the error

### Where to Check

1. **Browser Console**: F12 → Console tab
2. **Network Tab**: F12 → Network tab → Look for failed requests
3. **Vercel Logs**: Vercel Dashboard → Functions → Logs
4. **Supabase Logs**: Supabase Dashboard → Logs

## Quick Test Script

Run this in Supabase SQL Editor to verify everything:

```sql
-- Test 1: Check exhibition exists
SELECT id, name, status FROM exhibitions 
WHERE id = '44d3a98d-faff-4dcf-a255-436cefdd97ef';

-- Test 2: Check time slots exist
SELECT id, start_time, end_time, capacity, active 
FROM time_slots 
WHERE exhibition_id = '44d3a98d-faff-4dcf-a255-436cefdd97ef';

-- Test 3: Check schedules exist
SELECT COUNT(*) as schedule_count 
FROM exhibition_schedules 
WHERE exhibition_id = '44d3a98d-faff-4dcf-a255-436cefdd97ef';

-- Test 4: Check slot availability exists
SELECT COUNT(*) as availability_count 
FROM slot_availability sa
JOIN time_slots ts ON ts.id = sa.time_slot_id
WHERE ts.exhibition_id = '44d3a98d-faff-4dcf-a255-436cefdd97ef';

-- Test 5: Check pricing exists
SELECT COUNT(*) as pricing_count 
FROM pricing 
WHERE exhibition_id = '44d3a98d-faff-4dcf-a255-436cefdd97ef' 
AND active = true;

-- Test 6: Test RPC function
SELECT * FROM get_available_slots_for_exhibition(
  '44d3a98d-faff-4dcf-a255-436cefdd97ef'::uuid,
  CURRENT_DATE
);
```

**All tests should return data**. If any test returns empty, that's your issue!

## Status Indicators

✅ **Working**: API returns 200 with data  
⚠️ **Warning**: Non-critical console warnings  
❌ **Error**: API returns 500 or fails to load  

Current Status: ✅ **Should be working after latest deployment**
