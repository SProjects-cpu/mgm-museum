# Booking Date & Time Critical Fixes

## Issues Identified

### 1. **Booking Date Issues**
- ❌ Dummy/wrong dates showing in confirmation page
- ❌ PDF tickets showing incorrect booking dates
- ❌ Database not storing correct visit date from user selection

### 2. **Timestamp Issues**
- ❌ HH:MM:SS values marking wrong times
- ❌ Not capturing actual booking time correctly
- ❌ created_at timestamps not reflecting actual booking time

### 3. **Calendar Selection Issues**
- ❌ Some dates not marking after clicking
- ❌ Wrong date showing on time slot selection page
- ❌ Real-time communication with database not working properly

### 4. **Time Slot Display Issues**
- ❌ Time element showing empty: `<p>Time:  - </p>`
- ❌ Selected time slot not showing in booking steps

## Root Causes

### Issue 1: Date Storage Problem
**Location:** `app/api/payment/verify/route.ts` (Line 133-145)

```typescript
// PROBLEM: Using item.bookingDate from cart which may be stale
const actualBookingDate = timeSlot?.slot_date || item.bookingDate;
```

**Root Cause:** The `bookingDate` in cart items is stored as ISO string but `slot_date` from time_slots table is the authoritative source. When time slot is not found, it falls back to potentially incorrect cart data.

### Issue 2: Timestamp Problem
**Location:** Multiple places using `new Date().toISOString()`

**Root Cause:** 
- `toISOString()` returns UTC time, not local Indian time
- Database timestamps should use `NOW()` function for server-side accuracy
- Client-side timestamps are unreliable due to timezone differences

### Issue 3: Calendar Selection
**Location:** `components/booking/BookingCalendar.tsx` & `components/ui/calendar-ark.tsx`

**Root Cause:**
- Date object timezone handling inconsistency
- Calendar component not properly updating selected state
- Date comparison logic not accounting for timezone offsets

### Issue 4: Time Slot Display
**Location:** `app/(public)/book-visit/page.tsx` (Line 267-270)

```typescript
// PROBLEM: TimeSlot object incomplete
selectTimeSlot({
  id,
  startTime: '',  // ❌ Empty strings!
  endTime: '',    // ❌ Empty strings!
  totalCapacity: 0,
  availableCapacity: 0,
});
```

**Root Cause:** TimeSlotSelector only passes `id`, but the booking flow expects full TimeSlot object with start_time and end_time.

## Solutions

### Fix 1: Correct Date Storage
**File:** `app/api/payment/verify/route.ts`

```typescript
// BEFORE
const { data: timeSlot } = await supabase
  .from('time_slots')
  .select('slot_date')
  .eq('id', item.timeSlotId)
  .single();

const actualBookingDate = timeSlot?.slot_date || item.bookingDate;

// AFTER
const { data: timeSlot, error: timeSlotError } = await supabase
  .from('time_slots')
  .select('slot_date, start_time, end_time')
  .eq('id', item.timeSlotId)
  .single();

if (timeSlotError || !timeSlot) {
  console.error('Time slot not found:', item.timeSlotId);
  errors.push({
    item: item.exhibitionName || item.showName,
    error: 'Time slot not found',
    code: 'TIME_SLOT_NOT_FOUND',
  });
  continue;
}

const actualBookingDate = timeSlot.slot_date; // Always use slot_date
```

### Fix 2: Use Server-Side Timestamps
**File:** `app/api/payment/verify/route.ts`

```typescript
// BEFORE
created_at: new Date().toISOString(),
updated_at: new Date().toISOString(),

// AFTER
// Remove these fields - let database handle with DEFAULT NOW()
// Or use server-side function
```

**Database Schema:** Ensure all timestamp columns have `DEFAULT NOW()` or `DEFAULT CURRENT_TIMESTAMP`

### Fix 3: Fix Calendar Date Selection
**File:** `components/ui/calendar-ark.tsx`

Need to ensure:
1. Date comparison uses normalized dates (00:00:00 time)
2. Selected date state updates immediately
3. Date passed to parent uses consistent timezone

```typescript
// Normalize dates for comparison
const normalizeDate = (date: Date): Date => {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
};

// When date is clicked
const handleDateClick = (date: Date) => {
  const normalized = normalizeDate(date);
  setSelectedDate(normalized);
  onDateSelect(normalized);
};
```

### Fix 4: Pass Complete TimeSlot Object
**File:** `app/(public)/book-visit/page.tsx`

```typescript
// BEFORE
<TimeSlotSelector
  exhibitionId={exhibitionId}
  date={selectedDate}
  onSlotSelect={(id) => {
    selectTimeSlot({
      id,
      startTime: '',  // ❌ Wrong!
      endTime: '',
      totalCapacity: 0,
      availableCapacity: 0,
    });
  }}
  selectedSlotId={selectedTimeSlot?.id}
/>

// AFTER
<TimeSlotSelector
  exhibitionId={exhibitionId}
  date={selectedDate}
  onSlotSelect={(slot) => {  // ✅ Pass full slot object
    selectTimeSlot(slot);
  }}
  selectedSlotId={selectedTimeSlot?.id}
/>
```

**File:** `components/booking/TimeSlotSelector.tsx`

```typescript
// BEFORE
interface TimeSlotSelectorProps {
  onSlotSelect: (slotId: string) => void;  // ❌ Only ID
}

// AFTER
interface TimeSlotSelectorProps {
  onSlotSelect: (slot: TimeSlot) => void;  // ✅ Full object
}

// In component
onClick={() => !slot.isFull && onSlotSelect(slot)}  // ✅ Pass full slot
```

### Fix 5: Display Time in Booking Steps
**File:** `app/(public)/book-visit/page.tsx`

```typescript
// In tickets step
<div className="mb-4 text-muted-foreground">
  <p>Date: {selectedDate?.toLocaleDateString()}</p>
  {selectedTimeSlot && selectedTimeSlot.startTime && selectedTimeSlot.endTime && (
    <p>Time: {selectedTimeSlot.startTime} - {selectedTimeSlot.endTime}</p>
  )}
</div>
```

## Implementation Priority

1. **CRITICAL** - Fix TimeSlot object passing (Fix 4)
2. **CRITICAL** - Fix date storage in database (Fix 1)
3. **HIGH** - Fix timestamp handling (Fix 2)
4. **HIGH** - Fix calendar date selection (Fix 3)
5. **MEDIUM** - Fix time display in booking steps (Fix 5)

## Testing Checklist

After implementing fixes:

- [ ] Select a date from calendar - verify it marks immediately
- [ ] Proceed to time slot selection - verify correct date shows
- [ ] Select a time slot - verify time shows in next step
- [ ] Complete booking - verify correct date in confirmation
- [ ] Download PDF - verify correct date and time in ticket
- [ ] Check database - verify booking_date matches selected date
- [ ] Check database - verify created_at is accurate server time
- [ ] Test across different timezones
- [ ] Test with multiple bookings in same session

## Database Verification Queries

```sql
-- Check booking dates match time slot dates
SELECT 
  b.id,
  b.booking_reference,
  b.booking_date,
  ts.slot_date,
  CASE 
    WHEN b.booking_date = ts.slot_date THEN '✅ Match'
    ELSE '❌ Mismatch'
  END as status
FROM bookings b
JOIN time_slots ts ON b.time_slot_id = ts.id
ORDER BY b.created_at DESC
LIMIT 20;

-- Check timestamp accuracy
SELECT 
  id,
  booking_reference,
  created_at,
  booking_date,
  EXTRACT(TIMEZONE FROM created_at) as timezone_offset
FROM bookings
ORDER BY created_at DESC
LIMIT 10;
```

## Files to Modify

1. ✅ `app/api/payment/verify/route.ts` - Fix date storage and timestamps
2. ✅ `components/booking/TimeSlotSelector.tsx` - Pass full slot object
3. ✅ `app/(public)/book-visit/page.tsx` - Receive full slot object, display time
4. ✅ `components/ui/calendar-ark.tsx` - Fix date selection and comparison
5. ✅ `lib/hooks/useBookingFlow.ts` - Ensure TimeSlot interface is correct

---

**Status:** Ready for implementation
**Estimated Time:** 2-3 hours
**Risk Level:** Medium (affects core booking flow)
