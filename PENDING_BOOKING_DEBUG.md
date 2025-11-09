# Pending Booking Debug Guide

## Issue
The checkout page shows "Adding booking to cart" toast but the booking isn't actually being added to the cart.

## Fix Applied
Added comprehensive validation, error handling, and logging to the checkout page to identify and fix the issue.

## How to Debug

### 1. Check Browser Console
Open the browser console (F12) and look for these log messages:

```javascript
// When processing starts
"Processing pending booking:" {exhibitionId, selectedDate, selectedTimeSlot, selectedTickets, totalAmount}

// When adding to cart
"Adding to cart with data:" {exhibitionId, timeSlotId, tickets, totalTickets}

// On success
"Booking successfully added to cart"

// On error
"Error adding pending booking:" <error object>
"Error details:" <error message> <stack trace>
```

### 2. Check sessionStorage
In browser console, check what's stored:

```javascript
// Check if pendingBooking exists
sessionStorage.getItem('pendingBooking')

// Parse and view the data
JSON.parse(sessionStorage.getItem('pendingBooking'))
```

### 3. Common Issues and Solutions

#### Issue: "Invalid booking data"
**Cause**: Missing required fields in pendingBooking  
**Solution**: Ensure book-visit page sets all required fields:
- `exhibitionId`
- `exhibitionName`
- `selectedDate`
- `selectedTimeSlot` (with id, startTime, endTime, totalCapacity, availableCapacity)
- `selectedTickets` (array with ticketType and quantity)
- `totalAmount`

#### Issue: "No tickets selected"
**Cause**: All ticket quantities are 0  
**Solution**: Ensure at least one ticket type has quantity > 0

#### Issue: API error from `/api/cart/add`
**Cause**: Backend validation or database error  
**Check**:
- Supabase connection
- Time slot availability
- User authentication
- Database constraints

### 4. Test Flow

1. **Start Fresh**:
   ```javascript
   // Clear sessionStorage
   sessionStorage.clear()
   ```

2. **Book Visit (Not Logged In)**:
   - Go to exhibition page
   - Click "Book Visit"
   - Select date, time, tickets
   - Click "Proceed to Checkout"
   - Should redirect to login

3. **Login**:
   - Login with credentials
   - Should redirect to `/cart/checkout`

4. **Check Console**:
   - Look for "Processing pending booking" log
   - Look for "Adding to cart with data" log
   - Look for success or error messages

5. **Verify Cart**:
   - Check if item appears in cart
   - Check cart count in UI
   - Navigate to `/cart` to see items

### 5. API Endpoint Check

If the issue is with the API, test the endpoint directly:

```javascript
// Get auth token
const { data: { session } } = await supabase.auth.getSession();

// Test add to cart
const response = await fetch('/api/cart/add', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session.access_token}`
  },
  body: JSON.stringify({
    timeSlotId: 'your-time-slot-id',
    bookingDate: '2025-01-10',
    exhibitionId: 'your-exhibition-id',
    tickets: { adult: 2, child: 0, student: 0, senior: 0 },
    totalTickets: 2
  })
});

const data = await response.json();
console.log('API Response:', data);
```

## Validation Added

The fix includes these validations:

1. ✅ Check if `pendingBooking` exists in sessionStorage
2. ✅ Validate all required fields are present
3. ✅ Check if at least one ticket is selected
4. ✅ Validate time slot data structure
5. ✅ Handle API errors gracefully
6. ✅ Log all steps for debugging

## Error Messages

| Error Message | Meaning | Solution |
|--------------|---------|----------|
| "Invalid booking data. Please try booking again." | Missing required fields | Complete the booking flow again |
| "No tickets selected. Please try booking again." | All ticket quantities are 0 | Select at least one ticket |
| "Failed to add to cart" | API error | Check console for details, verify backend |

## Next Steps

1. Deploy the fix to production
2. Test the complete flow:
   - Book visit (not logged in)
   - Login
   - Verify booking added to cart
3. Check browser console for any errors
4. If issues persist, share the console logs

## Rollback

If this fix causes issues:

```bash
git revert 4fd5af8bda5c884a2c955245417ac5230e3d3ee9
git push origin main
```

---

**Fix Commit**: `4fd5af8bda5c884a2c955245417ac5230e3d3ee9`  
**Date**: January 9, 2025  
**Status**: Deployed
