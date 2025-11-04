# Comprehensive Fix Plan - Cart "Failed to Reserve Seats" Issue

## Current Status

**Problem:** Cart operations fail with "Failed to reserve seats" error after login
**Session:** Establishes successfully ✅
**Issue:** Backend database operation failing ❌

---

## Root Cause Analysis

Based on the console logs:
```
Session established successfully on attempt 1  ✅
Operation attempt 1 failed: Error: Failed to reserve seats  ❌
Operation attempt 2 failed: Error: Failed to reserve seats  ❌
Operation attempt 3 failed: Error: Failed to reserve seats  ❌
```

**The session is working fine. The problem is in the database operation.**

---

## Most Likely Issues (In Order of Probability)

### 1. RLS Policy Blocking Service Role (90% Likely)

**Problem:** The service role doesn't have permission to insert into `cart_items` table

**Why:** The migration creates RLS policies for authenticated users, but might be missing the service role policy

**Check in Supabase SQL Editor:**
```sql
SELECT * FROM pg_policies WHERE tablename = 'cart_items';
```

**Expected policies:**
- Users can view own cart items
- Users can insert own cart items
- Users can update own cart items
- Users can delete own cart items
- **System can manage expired cart items** (service_role)

**Fix:**
```sql
-- Add service role policy if missing
CREATE POLICY IF NOT EXISTS "Service role full access to cart items"
  ON cart_items FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
```

### 2. Migration Not Applied (5% Likely)

**Problem:** The `00006_cart_system.sql` migration wasn't applied to production database

**Check:**
```sql
-- Check if cart_items table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'cart_items'
);

-- Check migration history
SELECT * FROM supabase_migrations.schema_migrations 
ORDER BY version DESC 
LIMIT 10;
```

**Fix:** Apply the migration manually or via Supabase CLI

### 3. Service Role Key Not Configured (3% Likely)

**Problem:** `SUPABASE_SERVICE_ROLE_KEY` environment variable not set in Vercel

**Check in Vercel:**
1. Go to Project Settings → Environment Variables
2. Look for `SUPABASE_SERVICE_ROLE_KEY`

**Fix:** Add the service role key from Supabase dashboard

### 4. Time Slot Doesn't Exist (2% Likely)

**Problem:** The time_slot_id being passed doesn't exist in the database

**Check:** The new logs will show "Time slot not found" if this is the issue

**Fix:** Ensure time slots are created for the exhibition

---

## Immediate Action Plan

### Step 1: Check Database Schema

Run in Supabase SQL Editor:

```sql
-- 1. Check if cart_items table exists
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('cart_items', 'time_slots');

-- 2. Check cart_items columns
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'cart_items'
ORDER BY ordinal_position;

-- 3. Check RLS policies
SELECT schemaname, tablename, policyname, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'cart_items';

-- 4. Check if service role policy exists
SELECT COUNT(*) as service_role_policies
FROM pg_policies 
WHERE tablename = 'cart_items' 
AND 'service_role' = ANY(roles);
```

### Step 2: Fix RLS Policies

If service role policy is missing, run:

```sql
-- Drop existing restrictive policies if needed
DROP POLICY IF EXISTS "System can manage expired cart items" ON cart_items;

-- Create comprehensive service role policy
CREATE POLICY "Service role full access"
  ON cart_items FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Verify
SELECT * FROM pg_policies WHERE tablename = 'cart_items';
```

### Step 3: Test Database Insert Manually

```sql
-- Get a valid user ID
SELECT id, email FROM auth.users LIMIT 1;

-- Get a valid time slot ID
SELECT id, exhibition_id, start_time, end_time, capacity, current_bookings 
FROM time_slots 
WHERE active = true 
LIMIT 1;

-- Get a valid exhibition ID
SELECT id, name FROM exhibitions WHERE active = true LIMIT 1;

-- Try manual insert (replace with actual IDs)
INSERT INTO cart_items (
  user_id,
  time_slot_id,
  exhibition_id,
  booking_date,
  adult_tickets,
  child_tickets,
  student_tickets,
  senior_tickets,
  total_tickets,
  subtotal,
  expires_at
) VALUES (
  'REPLACE_WITH_USER_ID',
  'REPLACE_WITH_TIME_SLOT_ID',
  'REPLACE_WITH_EXHIBITION_ID',
  CURRENT_DATE,
  2,
  0,
  0,
  0,
  2,
  0,
  NOW() + INTERVAL '15 minutes'
) RETURNING *;
```

If this fails, you'll see the exact error message.

### Step 4: Check Vercel Environment Variables

1. Go to https://vercel.com/shivam-s-projects-fd1d92c1/mgm-museum/settings/environment-variables
2. Verify these exist:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` ← **Most important**

3. If `SUPABASE_SERVICE_ROLE_KEY` is missing:
   - Go to Supabase Dashboard → Project Settings → API
   - Copy the `service_role` key (secret)
   - Add to Vercel as `SUPABASE_SERVICE_ROLE_KEY`
   - Redeploy

---

## Alternative: Bypass RLS for Cart Operations

If RLS is the issue, we can modify the API to use the authenticated user's session instead of service role:

**File: `/app/api/cart/add/route.ts`**

Change from:
```typescript
const supabase = getServiceSupabase(); // Uses service role
```

To:
```typescript
// Create client with user's session
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    global: {
      headers: {
        Authorization: authHeader
      }
    }
  }
);
```

This way, the insert will use the authenticated user's permissions, which should work with the existing RLS policies.

---

## Testing After Fix

1. Clear browser cache
2. Visit production URL
3. Complete booking flow
4. Check browser console for:
   - "Session established successfully"
   - "Booking added to cart successfully"
5. Check Vercel logs for:
   - "Seats reserved successfully"
   - "Cart item inserted successfully"

---

## Monitoring

After applying the fix, monitor:

1. **Success Rate:** Cart add operations should succeed
2. **Error Logs:** Should see no more "Failed to reserve seats"
3. **User Experience:** Bookings should complete smoothly

---

## Rollback Plan

If the fix causes issues:

```bash
cd mgm-museum
git revert HEAD
vercel deploy --prod --yes
```

---

**Priority:** 🔴 CRITICAL
**Impact:** Blocks all bookings
**Estimated Fix Time:** 5-10 minutes once root cause identified
**Next Step:** Run database checks in Supabase SQL Editor
