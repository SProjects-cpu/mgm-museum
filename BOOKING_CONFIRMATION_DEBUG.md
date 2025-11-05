# Booking Confirmation Page - Debug Guide

## Issue
The confirmation page shows empty booking IDs: `?ids=` after successful payment.

## Root Cause Analysis

### Possible Causes:
1. **Payment verification not creating bookings** - Most likely
2. **Bookings created but not returned in API response**
3. **Frontend not extracting booking IDs correctly**
4. **Deployment not updated with latest fixes**

## Recent Fixes Applied

### 1. Database Schema Fix (✅ Applied to Production DB)
```sql
-- Added missing columns
ALTER TABLE payment_orders
ADD COLUMN payment_id TEXT,
ADD COLUMN payment_signature TEXT;

-- Added RLS policies
CREATE POLICY "Users can update own payment orders"
ON payment_orders FOR UPDATE
USING (auth.uid() = user_id);
```

### 2. Code Fixes (✅ Committed, ⏳ Pending Deployment)
- Fixed cart_snapshot parsing in `/api/payment/verify`
- Added comprehensive logging throughout payment flow
- Added validation to ensure bookings are created
- Added error handling for empty bookings

## How to Debug

### Step 1: Check Browser Console
After completing a payment, check the browser console for:

```javascript
// Should see these logs:
"Payment verification response: { success: true, bookings: [...], tickets: [...] }"
"Redirecting to confirmation with booking IDs: uuid1,uuid2,..."
```

### Step 2: Check Vercel Logs
Go to Vercel dashboard → Functions → `/api/payment/verify` and look for:

```
Cart snapshot structure: { isArray: true, cartItemsLength: 1, firstItem: {...} }
Creating booking for item: { timeSlotId: "...", exhibitionId: "...", ... }
Booking created successfully: uuid
Payment verification complete: { bookingsCreated: 1, ticketsCreated: 1, bookingIds: [...] }
```

### Step 3: Check Database
Query the database to see if bookings were created:

```sql
-- Check recent bookings
SELECT id, booking_reference, payment_id, created_at
FROM bookings
WHERE user_id = 'YOUR_USER_ID'
ORDER BY created_at DESC
LIMIT 5;

-- Check payment orders
SELECT id, razorpay_order_id, status, payment_id, cart_snapshot
FROM payment_orders
WHERE user_id = 'YOUR_USER_ID'
ORDER BY created_at DESC
LIMIT 5;
```

## Expected Flow

1. User completes Razorpay payment
2. Frontend calls `/api/payment/verify` with payment details
3. API verifies signature ✅
4. API updates payment_orders status to 'paid' ✅
5. API creates bookings from cart_snapshot ⚠️ (Check this)
6. API creates tickets for each booking ⚠️ (Check this)
7. API returns `{ success: true, bookings: [...], tickets: [...] }`
8. Frontend extracts booking IDs: `bookings.map(b => b.id).join(',')`
9. Frontend redirects to `/bookings/confirmation?ids=uuid1,uuid2`
10. Confirmation page fetches booking details
11. Confirmation page shows download button

## Common Issues

### Issue 1: Cart Snapshot Structure Mismatch
**Symptom**: Logs show `cartItemsLength: 0`

**Solution**: Check how cart items are saved in `/api/payment/create-order`:
```javascript
// Should be an array of items
cart_snapshot: cartItems  // ✅ Correct
// NOT
cart_snapshot: { items: cartItems }  // ❌ Wrong
```

### Issue 2: Missing Required Fields
**Symptom**: Booking creation fails with database error

**Check**: Ensure all required fields are present:
- `time_slot_id` (required)
- `booking_date` (required)
- `guest_name` (required)
- `guest_email` (required)
- Either `exhibition_id` OR `show_id` (at least one)

### Issue 3: RLS Policy Blocking Insert
**Symptom**: Booking insert fails silently

**Solution**: Check RLS policies on bookings table:
```sql
-- Should have policy allowing users to insert their own bookings
SELECT * FROM pg_policies WHERE tablename = 'bookings';
```

## Deployment Status

### Database Changes: ✅ LIVE
- payment_orders columns added
- RLS policies created
- Indexes created

### Code Changes: ⏳ PENDING
- Commit: 726c1ff87cf8686ceb58577cafe9176d31d9e8a7
- Status: Pushed to GitHub
- Vercel: Will auto-deploy on next push or after 5 hours

## Temporary Workaround

Until deployment completes, you can:

1. Check Vercel logs to see actual error messages
2. Manually query database to find created bookings
3. Construct confirmation URL manually: `/bookings/confirmation?ids=BOOKING_UUID`

## Next Steps

1. Wait for Vercel deployment (auto-deploys from GitHub)
2. Test complete payment flow
3. Check browser console for new debug logs
4. Check Vercel function logs for server-side logs
5. If still failing, check database queries directly

## Contact Points

- Database: Supabase dashboard → SQL Editor
- Logs: Vercel dashboard → Functions → Logs
- Code: GitHub repository → Latest commit
