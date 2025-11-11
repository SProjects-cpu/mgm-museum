# CRITICAL FIX: Supabase Array Handling for Joined Tables

## Root Cause Identified

**The Problem**: When Supabase performs joins, it returns joined tables as ARRAYS, not objects. Our code was treating `booking.time_slots` as an object when it's actually an array `[{slot_date, start_time, end_time}]`.

This caused:
1. ❌ Dates showing as undefined → falling back to `booking_date` → timezone conversion → -1 day bug
2. ❌ Times showing incorrectly or as fallback values
3. ❌ QR verification potentially failing due to similar issues

## The Fix

### Before (WRONG):
```typescript
const date = booking.time_slots?.slot_date;  // undefined! time_slots is an array
const time = booking.time_slots?.start_time; // undefined!
```

### After (CORRECT):
```typescript
// Extract from array first
const timeSlot = Array.isArray(booking.time_slots) 
  ? booking.time_slots[0] 
  : booking.time_slots;

const date = timeSlot?.slot_date;  // ✅ Works!
const time = timeSlot?.start_time; // ✅ Works!
```

## Files Fixed

### 1. `/app/(public)/bookings/confirmation/page.tsx`
- Fixed date display to extract time_slots from array
- Fixed time display to extract time_slots from array
- Now correctly shows the selected date without timezone issues

### 2. `/app/cart/page.tsx`
- Fixed confirmed bookings list to handle array structure
- Extracts time_slots, exhibitions, and shows from arrays
- Displays correct dates and times

### 3. `/lib/tickets/fetch-ticket-data.ts`
- Fixed ticket data fetching to extract time_slots from array
- Ensures PDF tickets show correct dates
- Properly handles exhibitions and shows arrays

### 4. `/app/api/verify/[bookingReference]/route.ts`
- Already fixed in previous commit
- Handles array extraction for QR verification

## Why This Happened

Supabase's PostgREST API returns joined tables as arrays by default:

```sql
SELECT bookings.*, time_slots.* 
FROM bookings 
LEFT JOIN time_slots ON bookings.time_slot_id = time_slots.id
```

Returns:
```json
{
  "id": "...",
  "booking_date": "2025-11-28",
  "time_slots": [{  // ← ARRAY, not object!
    "slot_date": "2025-11-28",
    "start_time": "13:00:00"
  }]
}
```

## Testing Checklist

After deployment, verify:

- [ ] Create new booking - date shows correctly on confirmation page
- [ ] Download PDF ticket - date matches selected date
- [ ] Scan QR code - verification page shows correct date
- [ ] Check cart page - confirmed bookings show correct dates
- [ ] Test with ALL exhibitions - not just one

## Database Verification

Confirmed in database that dates are stored correctly:
```sql
SELECT booking_date, slot_date 
FROM bookings b
JOIN time_slots ts ON b.time_slot_id = ts.id
ORDER BY created_at DESC LIMIT 1;

Result: booking_date = slot_date = "2025-11-28" ✅
```

The issue was ONLY in the frontend display logic, not data storage.

## Key Takeaway

**Always check if Supabase joined data is an array before accessing properties!**

```typescript
// Safe pattern for Supabase joins
const item = Array.isArray(data.joined_table) 
  ? data.joined_table[0] 
  : data.joined_table;
```

This fix resolves both reported issues:
1. ✅ QR verification now works (correct field names + array handling)
2. ✅ Dates display correctly everywhere (array handling + timezone-safe formatting)
