# Cart Schema Mismatch Fix

## Issue
Cart page showing "Adding booking to cart..." but "No pending bookings" displayed. Pending bookings from book-visit flow weren't appearing in the cart.

## Root Cause
**Schema Mismatch**: The API was querying for columns that don't exist in the `cart_items` table.

### Wrong Columns (API was using):
- `quantity` ❌
- `date` ❌  
- `time` ❌
- `pricing_tier_id` ❌

### Correct Columns (actual database schema):
- `total_tickets` ✅
- `booking_date` ✅
- `adult_tickets`, `child_tickets`, `student_tickets`, `senior_tickets` ✅
- `exhibition_name`, `show_name` ✅

## Solution

### 1. Fixed API Query (`app/api/cart/bookings/route.ts`)

**Before**:
```typescript
.select(`
  id,
  quantity,      // ❌ Doesn't exist
  subtotal,
  date,          // ❌ Doesn't exist
  time,          // ❌ Doesn't exist
  ...
`)
```

**After**:
```typescript
.select(`
  id,
  total_tickets,        // ✅ Correct
  subtotal,
  booking_date,         // ✅ Correct
  adult_tickets,        // ✅ Correct
  child_tickets,        // ✅ Correct
  student_tickets,      // ✅ Correct
  senior_tickets,       // ✅ Correct
  exhibition_name,      // ✅ Correct
  show_name,            // ✅ Correct
  ...
`)
```

### 2. Updated Cart Page Interface (`app/cart/page.tsx`)

**Before**:
```typescript
interface CartItem {
  id: string;
  quantity: number;    // ❌
  subtotal: number;
  date: string;        // ❌
  time: string;        // ❌
  ...
}
```

**After**:
```typescript
interface CartItem {
  id: string;
  total_tickets: number;      // ✅
  subtotal: number;
  booking_date: string;        // ✅
  adult_tickets: number;       // ✅
  child_tickets: number;       // ✅
  student_tickets: number;     // ✅
  senior_tickets: number;      // ✅
  exhibition_name?: string;    // ✅
  show_name?: string;          // ✅
  ...
}
```

### 3. Enhanced Display

Added ticket breakdown display:
```typescript
// Build ticket summary
const tickets = [];
if (item.adult_tickets > 0) tickets.push(`${item.adult_tickets} Adult`);
if (item.child_tickets > 0) tickets.push(`${item.child_tickets} Child`);
if (item.student_tickets > 0) tickets.push(`${item.student_tickets} Student`);
if (item.senior_tickets > 0) tickets.push(`${item.senior_tickets} Senior`);
const ticketSummary = tickets.join(', ') || `${item.total_tickets} tickets`;
```

### 4. Fixed Checkout Navigation

Changed from `/checkout` to `/cart/checkout` to match actual route structure.

## Database Schema Reference

### cart_items Table
```sql
CREATE TABLE cart_items (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id),
  time_slot_id uuid REFERENCES time_slots(id),
  exhibition_id uuid REFERENCES exhibitions(id),
  show_id uuid REFERENCES shows(id),
  exhibition_name text,
  show_name text,
  booking_date date NOT NULL,
  adult_tickets integer DEFAULT 0,
  child_tickets integer DEFAULT 0,
  student_tickets integer DEFAULT 0,
  senior_tickets integer DEFAULT 0,
  total_tickets integer NOT NULL CHECK (total_tickets > 0),
  subtotal numeric DEFAULT 0,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

## Files Modified

1. **app/api/cart/bookings/route.ts**
   - Fixed column names in SELECT query
   - Added better error logging

2. **app/cart/page.tsx**
   - Updated CartItem interface
   - Fixed field references
   - Added ticket breakdown display
   - Fixed checkout button navigation

## Testing

After deployment, verify:

1. **Add to Cart Flow**:
   - [ ] Go to exhibition page
   - [ ] Click "Book Visit"
   - [ ] Select date, time, tickets
   - [ ] Click "Add to Cart"
   - [ ] Navigate to `/cart`
   - [ ] Verify booking appears in "Pending Bookings"

2. **Cart Display**:
   - [ ] Event name shows correctly
   - [ ] Date displays properly
   - [ ] Time slot shows (or "Time TBD")
   - [ ] Ticket breakdown displays (e.g., "2 Adult, 1 Child")
   - [ ] Price shows correctly

3. **Cart Actions**:
   - [ ] "Checkout" button navigates to `/cart/checkout`
   - [ ] Delete button removes item
   - [ ] Page refreshes after delete

## Commit

**Hash**: `fff752e351a74250a7557db756a7abe4cfa4a4de`

**Message**: 
```
fix: correct cart items schema mismatch

- Update API to query correct cart_items columns
- Fix cart page to use correct field names
- Add ticket breakdown display
- Fix checkout button navigation
- Add better error logging
```

## Related Issues

This fix resolves:
- Pending bookings not showing in cart
- "Adding booking to cart..." stuck message
- Cart appearing empty after book-visit flow

## Previous Context

From earlier sessions:
- Cart and feedback system was implemented
- Database schema was created with correct columns
- But API and frontend were using wrong column names
- This mismatch prevented cart items from loading

---

**Fixed**: January 9, 2025  
**Status**: ✅ Deployed  
**Next Steps**: Test on production after Vercel deployment completes
