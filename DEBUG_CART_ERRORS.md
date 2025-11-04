# Debug Cart Errors - Action Plan

## Deployment Status

**Production URL:** https://mgm-museum-1qfkypat1-shivam-s-projects-fd1d92c1.vercel.app

**Status:** ✅ DEPLOYED with comprehensive error logging

**Commit:** `ab897b9` - debug: add comprehensive error logging to cart API routes

---

## What Was Added

### Enhanced Error Logging

**File: `/app/api/cart/add/route.ts`**
- Log time slot fetch results
- Log seat reservation attempts with before/after values
- Log cart item insertion with full data
- Include error details in API responses

**File: `/app/api/cart/load/route.ts`**
- Log user ID when loading cart
- Log cart item count on success
- Include error details in API responses

---

## Next Steps to Diagnose

### 1. Test the Booking Flow Again

1. Clear browser cache and cookies
2. Visit: https://mgm-museum-1qfkypat1-shivam-s-projects-fd1d92c1.vercel.app
3. Navigate to an exhibition
4. Click "Book Visit"
5. Select date, time, and tickets
6. Click "Proceed to Checkout"
7. Complete login/signup
8. **Watch the browser console for detailed error messages**

### 2. Check Vercel Logs

After testing, check the Vercel logs for detailed error information:

```bash
cd mgm-museum
vercel logs --follow=false --limit=50
```

Look for these log messages:
- "Time slot found: ..."
- "Attempting to reserve seats: ..."
- "Seats reserved successfully: ..."
- "Attempting to insert cart item: ..."
- "Cart item inserted successfully: ..."

Or error messages:
- "Error fetching time slot: ..."
- "Failed to reserve seats: ..."
- "Failed to insert cart item: ..."

---

## Likely Root Causes

Based on the error pattern, here are the most likely issues:

### 1. RLS Policy Issue (Most Likely)

**Problem:** Service role might not have proper permissions to insert into `cart_items` table

**Check:**
- Verify RLS policies on `cart_items` table
- Ensure service role policy exists: `CREATE POLICY "System can manage expired cart items" ON cart_items FOR ALL TO service_role USING (true);`

**Fix:**
```sql
-- Check if policy exists
SELECT * FROM pg_policies WHERE tablename = 'cart_items';

-- If missing, add service role policy
CREATE POLICY "Service role can manage cart items"
  ON cart_items FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
```

### 2. Missing Table Columns

**Problem:** `cart_items` table might be missing required columns

**Check:**
```sql
-- Verify table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'cart_items'
ORDER BY ordinal_position;
```

**Expected columns:**
- id (UUID)
- user_id (UUID)
- time_slot_id (UUID)
- exhibition_id (UUID, nullable)
- show_id (UUID, nullable)
- exhibition_name (TEXT, nullable)
- show_name (TEXT, nullable)
- booking_date (DATE)
- adult_tickets (INTEGER)
- child_tickets (INTEGER)
- student_tickets (INTEGER)
- senior_tickets (INTEGER)
- total_tickets (INTEGER)
- subtotal (DECIMAL)
- expires_at (TIMESTAMPTZ)
- created_at (TIMESTAMPTZ)
- updated_at (TIMESTAMPTZ)

### 3. Foreign Key Constraint Failure

**Problem:** Referenced time_slot_id, exhibition_id, or show_id doesn't exist

**Check:** The logs will show which constraint failed

**Fix:** Ensure the IDs being passed are valid

### 4. Check Constraint Failure

**Problem:** `cart_items_check_entity` requires either exhibition_id OR show_id

**Check:** The logs will show if this constraint is violated

**Fix:** Ensure at least one of exhibition_id or show_id is provided

---

## Quick Database Checks

Run these queries in Supabase SQL Editor:

### 1. Check if cart_items table exists
```sql
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'cart_items'
);
```

### 2. Check RLS policies
```sql
SELECT * FROM pg_policies 
WHERE tablename = 'cart_items';
```

### 3. Check if migration was applied
```sql
SELECT * FROM supabase_migrations.schema_migrations 
WHERE version LIKE '%cart%';
```

### 4. Test insert manually
```sql
-- Replace with actual values
INSERT INTO cart_items (
  user_id,
  time_slot_id,
  exhibition_id,
  booking_date,
  adult_tickets,
  total_tickets,
  subtotal,
  expires_at
) VALUES (
  'YOUR_USER_ID',
  'YOUR_TIME_SLOT_ID',
  'YOUR_EXHIBITION_ID',
  CURRENT_DATE,
  2,
  2,
  0,
  NOW() + INTERVAL '15 minutes'
);
```

---

## Expected Log Output (Success)

When working correctly, you should see:

**Browser Console:**
```
Session established successfully on attempt 1
```

**Vercel Logs:**
```
Loading cart for user: xxx-xxx-xxx
Time slot found: { id: xxx, capacity: 50, current_bookings: 0 }
Attempting to reserve seats: { timeSlotId: xxx, currentBookings: 0, totalTickets: 2, newBookings: 2 }
Seats reserved successfully: [{ id: xxx, current_bookings: 2, ... }]
Attempting to insert cart item: { user_id: xxx, time_slot_id: xxx, ... }
Cart item inserted successfully: { id: xxx, ... }
```

---

## Expected Log Output (Failure)

If failing, you'll see:

**Browser Console:**
```
Session established successfully on attempt 1
Operation attempt 1 failed: Error: Failed to reserve seats: [ERROR MESSAGE]
```

**Vercel Logs:**
```
Time slot found: { id: xxx, capacity: 50, current_bookings: 0 }
Attempting to reserve seats: { timeSlotId: xxx, ... }
Failed to reserve seats: { message: "...", code: "...", details: "..." }
```

OR

```
Seats reserved successfully: [...]
Attempting to insert cart item: { ... }
Failed to insert cart item: { message: "...", code: "...", details: "..." }
```

---

## Action Items

### Immediate (Do Now):
1. ✅ Deploy with error logging (DONE)
2. ⏳ Test booking flow and capture error details
3. ⏳ Check Vercel logs for specific error messages
4. ⏳ Share the error details to diagnose root cause

### After Diagnosis:
- Fix identified issue (RLS policy, missing columns, etc.)
- Deploy fix
- Test again
- Verify success

---

## Contact Information

**Vercel Dashboard:** https://vercel.com/shivam-s-projects-fd1d92c1/mgm-museum

**Supabase Dashboard:** [Your Supabase project URL]

---

**Status:** 🔍 DEBUGGING MODE ACTIVE
**Next:** Test the flow and check logs for detailed error messages
