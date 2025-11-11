# Cart Amount Display and Site Crash Fixes

## Date: November 12, 2025

## Issues Resolved

### 1. Cart Pending Bookings Showing ₹0.00

**Problem**: Pending bookings in the cart page displayed ₹0.00 instead of the correct booking amounts.

**Root Cause**: The cart add API was hardcoding `subtotal: 0` when inserting cart items, with a comment "Will be calculated with pricing" but the calculation was never implemented.

**Solution**:
- Modified `/api/cart/add/route.ts` to accept `subtotal` from request body
- Updated `lib/store/cart.ts` to pass the calculated `subtotal` when adding items
- Fixed existing cart items in database using SQL to calculate correct subtotals

**Files Changed**:
- `app/api/cart/add/route.ts`
- `lib/store/cart.ts`
- `scripts/fix-cart-subtotals.ts` (new)

**SQL Fix Applied**:
```sql
WITH cart_pricing AS (
  SELECT 
    ci.id as cart_item_id,
    COALESCE(
      (ci.adult_tickets * (SELECT price FROM pricing WHERE exhibition_id = ci.exhibition_id AND ticket_type = 'adult' AND active = true LIMIT 1)) +
      (ci.child_tickets * (SELECT price FROM pricing WHERE exhibition_id = ci.exhibition_id AND ticket_type = 'child' AND active = true LIMIT 1)) +
      (ci.student_tickets * (SELECT price FROM pricing WHERE exhibition_id = ci.exhibition_id AND ticket_type = 'student' AND active = true LIMIT 1)) +
      (ci.senior_tickets * (SELECT price FROM pricing WHERE exhibition_id = ci.exhibition_id AND ticket_type = 'senior' AND active = true LIMIT 1)),
      0
    ) as calculated_subtotal
  FROM cart_items ci
  WHERE ci.subtotal = 0
)
UPDATE cart_items
SET subtotal = cp.calculated_subtotal
FROM cart_pricing cp
WHERE cart_items.id = cp.cart_item_id;
```

**Result**: 
- 5 cart items updated with correct amounts (₹100, ₹60, ₹320)
- 2 test items remain at ₹0 (no pricing configured for test exhibition)

### 2. Site Crash - "Cannot read properties of undefined (reading 'length')"

**Problem**: The entire site was crashing with a client-side error when trying to access the length property of undefined arrays.

**Root Causes**: 
1. **Testimonials Component** (PRIMARY): The testimonials-with-marquee component was mapping over testimonials array without checking if it exists
2. Featured exhibitions component was accessing `exhibition.images[0]` without proper array validation
3. Cart page wasn't defensively handling API response arrays

**Solutions**:

**Testimonials Fix** (`components/ui/testimonials-with-marquee.tsx`):
```typescript
// Before (unsafe):
{[...Array(4)].map((_, setIndex) => (
  testimonials.map((testimonial, i) => (
    <TestimonialCard key={`${setIndex}-${i}`} {...testimonial} />
  ))
))}

// After (safe):
{Array.isArray(testimonials) && testimonials.length > 0 && [...Array(4)].map((_, setIndex) => (
  testimonials.map((testimonial, i) => (
    <TestimonialCard key={`${setIndex}-${i}`} {...testimonial} />
  ))
))}
```

**Featured Exhibitions Fix** (`components/shared/featured-exhibitions.tsx`):
```typescript
src={
  (Array.isArray(exhibition.images) && exhibition.images.length > 0)
    ? exhibition.images[0]
    : "fallback-image-url"
}
```

**Cart Page Fix** (`app/cart/page.tsx`):
```typescript
setPendingItems(Array.isArray(data.pending) ? data.pending : []);
setConfirmedBookings(Array.isArray(data.confirmed) ? data.confirmed : []);
```

**Files Changed**:
- `components/ui/testimonials-with-marquee.tsx` (PRIMARY FIX)
- `components/shared/featured-exhibitions.tsx`
- `app/cart/page.tsx`

**Result**: Site now loads without crashes and handles undefined/null data gracefully.

## Console Warnings Addressed

The following console warnings are informational and don't affect functionality:
- `[Supabase] Realtime: DISABLED` - Using polling instead of realtime (expected in production)
- `Supabase service role key not configured` - Service role key is intentionally not exposed to client

## Testing Performed

1. ✅ Verified cart items now show correct amounts
2. ✅ Confirmed site loads without crashes
3. ✅ Tested cart page with and without pending items
4. ✅ Verified featured exhibitions display correctly
5. ✅ Checked database for updated subtotals

## Deployment Status

- [x] Code changes committed
- [ ] Ready for deployment to Vercel
- [ ] Requires testing in production environment

## Next Steps

1. Deploy to Vercel
2. Test cart functionality in production
3. Verify amounts display correctly for new bookings
4. Monitor for any additional console errors
