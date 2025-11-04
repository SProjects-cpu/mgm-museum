# 🚨 URGENT: Database Migration Required

## Problem Identified

The cart system is failing because **the database migration was never applied to production**.

### Missing from Database:
1. ❌ `cart_items` table doesn't exist
2. ❌ `time_slots.current_bookings` column doesn't exist
3. ❌ `time_slots.buffer_capacity` column doesn't exist
4. ❌ `time_slots.slot_date` column doesn't exist

### Error Messages:
```
Could not find the table 'public.cart_items' in the schema cache
Could not find the 'current_bookings' column of 'time_slots' in the schema cache
```

---

## IMMEDIATE FIX (5 Minutes)

### Step 1: Open Supabase SQL Editor

1. Go to your Supabase Dashboard
2. Click on "SQL Editor" in the left sidebar
3. Click "New Query"

### Step 2: Copy and Run the Migration

Copy the **ENTIRE** contents of `APPLY_CART_MIGRATION.sql` file and paste it into the SQL Editor.

Or copy this:

```sql
-- 1. Add missing columns to time_slots
ALTER TABLE time_slots
ADD COLUMN IF NOT EXISTS slot_date DATE,
ADD COLUMN IF NOT EXISTS current_bookings INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS buffer_capacity INTEGER DEFAULT 5;

CREATE INDEX IF NOT EXISTS idx_time_slots_slot_date ON time_slots(slot_date);
CREATE INDEX IF NOT EXISTS idx_time_slots_exhibition_date ON time_slots(exhibition_id, slot_date);
CREATE INDEX IF NOT EXISTS idx_time_slots_show_date ON time_slots(show_id, slot_date);

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

CREATE INDEX IF NOT EXISTS idx_cart_items_user ON cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_expires ON cart_items(expires_at);
CREATE INDEX IF NOT EXISTS idx_cart_items_time_slot ON cart_items(time_slot_id);

-- 3. Enable RLS
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own cart items" ON cart_items;
DROP POLICY IF EXISTS "Users can insert own cart items" ON cart_items;
DROP POLICY IF EXISTS "Users can update own cart items" ON cart_items;
DROP POLICY IF EXISTS "Users can delete own cart items" ON cart_items;
DROP POLICY IF EXISTS "System can manage expired cart items" ON cart_items;

CREATE POLICY "Users can view own cart items"
  ON cart_items FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own cart items"
  ON cart_items FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own cart items"
  ON cart_items FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own cart items"
  ON cart_items FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can manage expired cart items"
  ON cart_items FOR ALL
  TO service_role
  USING (true);

-- 4. Create cleanup function
CREATE OR REPLACE FUNCTION cleanup_expired_cart_items()
RETURNS TABLE(cleaned_count INTEGER) AS $$
DECLARE
  expired_item RECORD;
  total_cleaned INTEGER := 0;
BEGIN
  FOR expired_item IN
    SELECT id, time_slot_id, total_tickets
    FROM cart_items
    WHERE expires_at < NOW()
  LOOP
    UPDATE time_slots
    SET current_bookings = GREATEST(0, current_bookings - expired_item.total_tickets)
    WHERE id = expired_item.time_slot_id;
    
    DELETE FROM cart_items WHERE id = expired_item.id;
    
    total_cleaned := total_cleaned + 1;
  END LOOP;
  
  RETURN QUERY SELECT total_cleaned;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Create trigger
CREATE OR REPLACE FUNCTION release_seats_on_cart_delete()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE time_slots
  SET current_bookings = GREATEST(0, current_bookings - OLD.total_tickets)
  WHERE id = OLD.time_slot_id;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS cart_items_release_seats ON cart_items;
CREATE TRIGGER cart_items_release_seats
  BEFORE DELETE ON cart_items
  FOR EACH ROW
  EXECUTE FUNCTION release_seats_on_cart_delete();

-- 6. Add payment columns
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS payment_order_id TEXT,
ADD COLUMN IF NOT EXISTS payment_id TEXT,
ADD COLUMN IF NOT EXISTS payment_signature TEXT,
ADD COLUMN IF NOT EXISTS payment_method TEXT,
ADD COLUMN IF NOT EXISTS payment_details JSONB DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_bookings_payment_order ON bookings(payment_order_id);

-- Verify
SELECT '✅ Migration Complete!' as status;
```

### Step 3: Click "Run" or Press F5

Wait for the query to complete. You should see:
```
✅ Migration Complete!
```

### Step 4: Verify the Migration

Run this verification query:

```sql
-- Check if everything was created
SELECT 
  'cart_items table' as item,
  CASE WHEN EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_name = 'cart_items'
  ) THEN '✅ EXISTS' ELSE '❌ MISSING' END as status
UNION ALL
SELECT 
  'current_bookings column',
  CASE WHEN EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'time_slots' 
    AND column_name = 'current_bookings'
  ) THEN '✅ EXISTS' ELSE '❌ MISSING' END
UNION ALL
SELECT 
  'RLS policies',
  '✅ ' || COUNT(*)::text || ' policies'
FROM pg_policies 
WHERE tablename = 'cart_items';
```

You should see all ✅ checkmarks.

---

## After Migration

### Test the Cart System

1. Clear browser cache
2. Visit: https://mgm-museum-9v1jidtbj-shivam-s-projects-fd1d92c1.vercel.app
3. Book tickets → Login → Add to cart
4. **Expected:** Cart should work without errors!

### Expected Results

✅ No more "Could not find the table 'public.cart_items'" errors
✅ No more "Could not find the 'current_bookings' column" errors
✅ Cart operations succeed
✅ Bookings can be completed

---

## Why This Happened

The migration file exists in `/supabase/migrations/00006_cart_system.sql` but was never applied to the production database. This is why:

1. The code expects `cart_items` table → doesn't exist
2. The code expects `current_bookings` column → doesn't exist
3. All cart operations fail

---

## Alternative: Use Supabase CLI

If you prefer using CLI:

```bash
# Install Supabase CLI if not installed
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# Apply migrations
supabase db push
```

---

## Troubleshooting

### If you get "relation already exists" errors:
This is fine - it means some parts were already created. The `IF NOT EXISTS` clauses will skip them.

### If you get permission errors:
Make sure you're logged in as the project owner in Supabase dashboard.

### If you get foreign key errors:
Check that the referenced tables (`users`, `time_slots`, `exhibitions`, `shows`, `bookings`) exist.

---

## Priority

🔴 **CRITICAL** - This must be done before cart system can work

**Estimated Time:** 5 minutes

**Impact:** Fixes all cart errors immediately

---

**Status:** ⏳ WAITING FOR DATABASE MIGRATION
**Next:** Run the SQL script in Supabase, then test the cart
