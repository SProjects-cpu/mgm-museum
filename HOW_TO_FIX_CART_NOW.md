# How to Fix Cart System RIGHT NOW (5 Minutes)

## The Problem

Your database is missing the `cart_items` table and `current_bookings` column. That's why you're seeing:
- ❌ "Could not find the table 'public.cart_items'"
- ❌ "Could not find the 'current_bookings' column"
- ❌ "Failed to reserve seats"
- ❌ "Failed to add to cart"

## The Solution (3 Simple Steps)

### Step 1: Open Supabase Dashboard

1. Go to https://supabase.com/dashboard
2. Select your MGM Museum project
3. Click **"SQL Editor"** in the left sidebar (looks like a database icon)
4. Click **"New Query"** button

### Step 2: Copy & Paste This SQL

Copy this ENTIRE script and paste it into the SQL Editor:

```sql
-- Fix Cart System - Run this entire script

-- 1. Add missing columns to time_slots
ALTER TABLE time_slots
ADD COLUMN IF NOT EXISTS slot_date DATE,
ADD COLUMN IF NOT EXISTS current_bookings INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS buffer_capacity INTEGER DEFAULT 5;

-- 2. Create cart_items table
CREATE TABLE IF NOT EXISTS cart_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  time_slot_id UUID REFERENCES time_slots(id) ON DELETE CASCADE,
  exhibition_id UUID REFERENCES exhibitions(id) ON DELETE SET NULL,
  show_id UUID REFERENCES shows(id) ON DELETE SET NULL,
  exhibition_name TEXT,
  show_name TEXT,
  booking_date DATE NOT NULL,
  adult_tickets INTEGER DEFAULT 0,
  child_tickets INTEGER DEFAULT 0,
  student_tickets INTEGER DEFAULT 0,
  senior_tickets INTEGER DEFAULT 0,
  total_tickets INTEGER NOT NULL,
  subtotal DECIMAL(10, 2) DEFAULT 0,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT cart_items_check_entity CHECK (exhibition_id IS NOT NULL OR show_id IS NOT NULL),
  CONSTRAINT cart_items_check_tickets CHECK (total_tickets > 0)
);

-- 3. Add indexes
CREATE INDEX IF NOT EXISTS idx_cart_items_user ON cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_expires ON cart_items(expires_at);
CREATE INDEX IF NOT EXISTS idx_cart_items_time_slot ON cart_items(time_slot_id);

-- 4. Enable security
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

-- 5. Create policies
DROP POLICY IF EXISTS "Users can view own cart items" ON cart_items;
DROP POLICY IF EXISTS "Users can insert own cart items" ON cart_items;
DROP POLICY IF EXISTS "Users can update own cart items" ON cart_items;
DROP POLICY IF EXISTS "Users can delete own cart items" ON cart_items;

CREATE POLICY "Users can view own cart items"
  ON cart_items FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own cart items"
  ON cart_items FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own cart items"
  ON cart_items FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own cart items"
  ON cart_items FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- 6. Add payment columns to bookings
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS payment_order_id TEXT,
ADD COLUMN IF NOT EXISTS payment_id TEXT,
ADD COLUMN IF NOT EXISTS payment_signature TEXT,
ADD COLUMN IF NOT EXISTS payment_method TEXT,
ADD COLUMN IF NOT EXISTS payment_details JSONB DEFAULT '{}'::jsonb;

-- Done!
SELECT '✅ Cart system fixed! You can now test bookings.' as message;
```

### Step 3: Click "RUN" Button

- Click the **"RUN"** button (or press **Ctrl+Enter** / **Cmd+Enter**)
- Wait 2-3 seconds
- You should see: **"✅ Cart system fixed! You can now test bookings."**

---

## Verify It Worked

Run this quick check:

```sql
SELECT 
  CASE WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'cart_items')
    THEN '✅ cart_items table created'
    ELSE '❌ cart_items table missing'
  END as status
UNION ALL
SELECT 
  CASE WHEN EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'time_slots' AND column_name = 'current_bookings')
    THEN '✅ current_bookings column added'
    ELSE '❌ current_bookings column missing'
  END;
```

You should see two ✅ checkmarks.

---

## Test Your Cart

1. **Clear browser cache** (Ctrl+Shift+Delete)
2. Visit: https://mgm-museum-9v1jidtbj-shivam-s-projects-fd1d92c1.vercel.app
3. Go to an exhibition
4. Click "Book Visit"
5. Select date, time, tickets
6. Click "Proceed to Checkout"
7. Login
8. **Cart should work now!** ✅

---

## What If It Still Doesn't Work?

### Check 1: Verify Tables Exist
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_name IN ('cart_items', 'time_slots', 'bookings');
```

Should show all 3 tables.

### Check 2: Verify Columns Exist
```sql
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'time_slots' 
AND column_name IN ('current_bookings', 'buffer_capacity', 'slot_date');
```

Should show all 3 columns.

### Check 3: Check for Errors
If you see any red error messages when running the script, copy them and share them.

---

## Common Issues

### "relation already exists"
✅ This is FINE - it means the table was already created. Continue.

### "column already exists"
✅ This is FINE - it means the column was already added. Continue.

### "permission denied"
❌ Make sure you're logged in as the project owner.

### "foreign key violation"
❌ Check that `auth.users`, `time_slots`, `exhibitions`, `shows`, and `bookings` tables exist.

---

## After Fixing

Once the migration is applied:
- ✅ Cart will work
- ✅ Bookings will complete
- ✅ Payments will process
- ✅ No more database errors

---

**Time Required:** 5 minutes
**Difficulty:** Easy (just copy & paste)
**Impact:** Fixes everything!

🎯 **DO THIS FIRST** before anything else!
