# Admin Bookings - Missing Data Fix

## Problem
After fixing the RLS policy to show bookings, three columns were showing incorrect data:
- **Ticket #**: Showing "N/A" instead of actual ticket numbers
- **Razorpay ID**: Showing "N/A" instead of payment IDs
- **Tickets** (count): Showing "0" instead of actual ticket count

## Root Causes

### 1. Missing RLS Policy on Tickets Table
The `tickets` table had RLS enabled but no policy allowing admins to view tickets. The API query was joining with the tickets table, but RLS was blocking the data.

### 2. Wrong Field for Razorpay ID
The API was looking for `payment_details.razorpay_payment_id` but the actual payment ID is stored in the `payment_id` field directly on the bookings table.

### 3. Wrong Table for Ticket Count
The API was querying the `booking_tickets` table (which is empty) instead of counting records from the `tickets` table.

## Solutions Applied

### Fix 1: Added RLS Policy for Tickets ✅
**File**: `supabase/migrations/20260110_admin_tickets_rls_policy.sql`

```sql
CREATE POLICY "Admins can view all tickets"
ON public.tickets
FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'super_admin')
  )
);
```

### Fix 2: Corrected Razorpay ID Field ✅
**File**: `app/api/admin/bookings/route.ts`

Changed from:
```typescript
const razorpayId = booking.payment_details?.razorpay_payment_id || 'N/A';
```

To:
```typescript
const razorpayId = booking.payment_id || booking.payment_details?.razorpay_payment_id || 'N/A';
```

Also added `payment_id` to the SELECT query.

### Fix 3: Fixed Ticket Count Logic ✅
**File**: `app/api/admin/bookings/route.ts`

Changed from querying `booking_tickets` table:
```typescript
const { data: ticketCounts } = await supabase
  .from('booking_tickets')
  .select('booking_id, quantity')
  .in('booking_id', bookingIds);
```

To counting tickets directly from the joined data:
```typescript
const numberOfTickets = booking.tickets?.length || 0;
```

## Database Verification

Verified that bookings have the correct data:
```sql
SELECT 
  b.booking_reference,
  b.payment_id,
  COUNT(t.id) as ticket_count,
  STRING_AGG(t.ticket_number, ', ') as ticket_numbers
FROM bookings b
LEFT JOIN tickets t ON t.booking_id = b.id
GROUP BY b.id, b.booking_reference, b.payment_id
LIMIT 5;
```

Results showed:
- ✅ Payment IDs exist (e.g., `pay_RdlNaFxR6ftHOf`)
- ✅ Ticket numbers exist (e.g., `TKT17627178794947PCF`)
- ✅ Ticket counts are correct (1 ticket per booking)

## Expected Results

After deployment:
- **Ticket #** column: Shows actual ticket numbers like "TKT17627178794947PCF"
- **Razorpay ID** column: Shows actual payment IDs like "pay_RdlNaFxR6ftHOf"
- **Tickets** column: Shows correct count (e.g., "1" instead of "0")

## Commits
- `3cd53b9bf` - Fix: Show ticket numbers, Razorpay IDs, and ticket counts in admin bookings

## Deployment
Changes deployed to production via Vercel.
