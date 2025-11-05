# PDF Ticket Generation - Manual Testing Guide

This guide provides step-by-step instructions for performing manual end-to-end testing of the PDF ticket generation feature.

## Prerequisites

- Access to the MGM Museum application (local or deployed)
- Test user account with valid credentials
- Test payment method (Razorpay test mode)
- Mobile devices (iOS and Android) for mobile testing
- Multiple browsers installed (Chrome, Firefox, Safari, Edge)
- QR code scanner app or device camera
- Printer for physical printing tests

## Test Environment Setup

### 1. Verify Environment Variables

```bash
# Check that all required environment variables are set
NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
RAZORPAY_KEY_ID=<your-razorpay-key-id>
RAZORPAY_KEY_SECRET=<your-razorpay-key-secret>
```

### 2. Start the Application

```bash
cd mgm-museum
npm run dev
```

Access the application at `http://localhost:3000`

## Test Scenarios

### Scenario 1: Complete Booking Flow

**Objective**: Verify the entire booking process from cart to PDF download

**Steps**:

1. **Navigate to Exhibitions/Shows**
   - Go to the exhibitions or shows page
   - Select an exhibition or show
   - Click "Book Now"

2. **Select Date and Time**
   - Choose a future date
   - Select an available time slot
   - Verify time slot availability

3. **Add to Cart**
   - Select ticket quantity (e.g., 2 Adults)
   - Click "Add to Cart"
   - Verify cart icon shows correct count

4. **Proceed to Checkout**
   - Click on cart icon
   - Review cart items
   - Click "Proceed to Checkout"

5. **Fill Guest Information**
   - Enter guest name
   - Enter email address
   - Enter phone number
   - Click "Continue to Payment"

6. **Complete Payment**
   - Verify Razorpay payment modal opens
   - Use test card: 4111 1111 1111 1111
   - Enter any future expiry date
   - Enter any CVV (e.g., 123)
   - Click "Pay"

7. **Verify Payment Processing**
   - Observe "Processing payment..." message
   - Wait for payment verification
   - Verify redirect to confirmation page

8. **Confirmation Page Verification**
   - [ ] Booking reference is displayed (format: BK17623504597486WZYCB)
   - [ ] Razorpay Payment ID is shown (format: pay_XXXXX)
   - [ ] Guest details are correct
   - [ ] Exhibition/Show name is displayed
   - [ ] Date and time are correct
   - [ ] Ticket quantity is accurate
   - [ ] Total amount paid is correct
   - [ ] Success checkmark icon is visible
   - [ ] "Download Ticket" button is present

9. **Download PDF Ticket**
   - Click "Download Ticket" button
   - Verify loading spinner appears
   - Wait for download to complete
   - Verify file downloads with correct name: `MGM-Ticket-BK17623504597486WZYCB.pdf`

**Expected Results**:
- ✅ Booking completes successfully
- ✅ Payment ID is real (not placeholder)
- ✅ PDF downloads within 2-3 seconds
- ✅ Filename includes booking reference

---

### Scenario 2: PDF Content Verification

**Objective**: Verify all required information is present in the PDF

**Steps**:

1. **Open Downloaded PDF**
   - Locate the downloaded PDF file
   - Open with PDF viewer (Adobe Reader, Preview, etc.)

2. **Verify Header Section**
   - [ ] MGM Museum logo is visible at top
   - [ ] "TICKET" title is prominent
   - [ ] Logo is clear and not pixelated

3. **Verify Booking Information**
   - [ ] Booking Reference: BK17623504597486WZYCB
   - [ ] Payment ID: pay_XXXXXXXXXXXXX (real Razorpay ID)
   - [ ] Payment ID format is correct (starts with "pay_")

4. **Verify QR Code**
   - [ ] QR code is present
   - [ ] QR code is at least 150x150 pixels
   - [ ] QR code is clear and scannable
   - [ ] QR code is positioned prominently

5. **Verify Guest Details**
   - [ ] Guest name is correct
   - [ ] Email address is correct
   - [ ] Phone number is correct (if provided)

6. **Verify Event Details**
   - [ ] Exhibition/Show name is displayed
   - [ ] Date is formatted correctly (e.g., "January 5, 2025")
   - [ ] Time slot is shown (e.g., "10:00 AM - 12:00 PM")

7. **Verify Ticket Details**
   - [ ] Ticket number is displayed
   - [ ] Ticket quantity is correct (e.g., "2 Adults")
   - [ ] Amount paid is accurate (e.g., "₹500.00")

8. **Verify Footer**
   - [ ] Museum contact information is present
   - [ ] Museum address is shown
   - [ ] Website URL is included

9. **Verify Design Quality**
   - [ ] Brand colors are used (#1a1a1a, #d4af37)
   - [ ] Typography is professional and readable
   - [ ] Layout is balanced with proper spacing
   - [ ] All sections are properly aligned
   - [ ] No text is cut off or overlapping

**Expected Results**:
- ✅ All required information is present
- ✅ Razorpay Payment ID is real (not dummy)
- ✅ Design is professional and branded
- ✅ PDF is print-ready

---

### Scenario 3: QR Code Scanning

**Objective**: Verify QR code can be scanned and decoded correctly

**Steps**:

1. **Scan with iPhone Camera**
   - Open Camera app on iPhone
   - Point camera at QR code in PDF (on screen or printed)
   - Wait for notification to appear
   - Tap notification
   - [ ] Booking reference is displayed correctly
   - [ ] Format matches: BK17623504597486WZYCB

2. **Scan with Android Camera**
   - Open Camera app on Android
   - Point camera at QR code
   - Wait for scan result
   - [ ] Booking reference is decoded correctly

3. **Scan with QR Scanner App**
   - Download a QR scanner app (e.g., "QR Code Reader")
   - Open the app
   - Scan the QR code
   - [ ] Booking reference is shown
   - [ ] No errors or invalid format messages

4. **Scan Printed QR Code**
   - Print the PDF ticket
   - Scan the printed QR code with mobile device
   - [ ] QR code is still scannable after printing
   - [ ] Booking reference is correct

**Expected Results**:
- ✅ QR code scans successfully on all devices
- ✅ Booking reference is decoded correctly
- ✅ QR code works on both screen and printed versions

---

### Scenario 4: Cross-Browser Testing

**Objective**: Verify PDF download works across different browsers

**Test Matrix**:

| Browser | OS | Download Works | Filename Correct | PDF Opens |
|---------|----|--------------|--------------------|-----------|
| Chrome | Windows | [ ] | [ ] | [ ] |
| Chrome | macOS | [ ] | [ ] | [ ] |
| Firefox | Windows | [ ] | [ ] | [ ] |
| Firefox | macOS | [ ] | [ ] | [ ] |
| Safari | macOS | [ ] | [ ] | [ ] |
| Edge | Windows | [ ] | [ ] | [ ] |

**Steps for Each Browser**:

1. Open the application in the browser
2. Complete a booking (or navigate to existing confirmation)
3. Click "Download Ticket" button
4. Verify download starts
5. Check download location for file
6. Verify filename: `MGM-Ticket-BK17623504597486WZYCB.pdf`
7. Open the PDF
8. Verify content displays correctly

**Expected Results**:
- ✅ Download works in all browsers
- ✅ Filename is consistent across browsers
- ✅ PDF opens and displays correctly

---

### Scenario 5: Mobile Testing

**Objective**: Verify PDF download and viewing on mobile devices

**iOS Testing**:

1. **Safari on iPhone**
   - Open application in Safari
   - Navigate to confirmation page
   - Tap "Download Ticket"
   - [ ] Download starts
   - [ ] PDF opens in Safari viewer
   - [ ] Content is readable
   - [ ] Can save to Files app
   - [ ] Can share via AirDrop/Messages

2. **Chrome on iPhone**
   - Repeat above steps in Chrome
   - [ ] Download works
   - [ ] PDF opens correctly

**Android Testing**:

1. **Chrome on Android**
   - Open application in Chrome
   - Navigate to confirmation page
   - Tap "Download Ticket"
   - [ ] Download notification appears
   - [ ] PDF saves to Downloads folder
   - [ ] Can open with PDF viewer
   - [ ] Content displays correctly

2. **Firefox on Android**
   - Repeat above steps in Firefox
   - [ ] Download works
   - [ ] PDF opens correctly

**Expected Results**:
- ✅ Download works on all mobile browsers
- ✅ PDF is viewable on mobile devices
- ✅ Content is readable on small screens
- ✅ Can save and share PDF

---

### Scenario 6: PDF Printing

**Objective**: Verify PDF prints correctly on physical paper

**Steps**:

1. **Print on A4 Paper**
   - Open PDF in viewer
   - Select Print (Ctrl+P / Cmd+P)
   - Choose A4 paper size
   - Print the document
   - [ ] All content fits on one page
   - [ ] No content is cut off
   - [ ] QR code is clear and scannable
   - [ ] Text is readable
   - [ ] Colors print correctly

2. **Print on Letter Size Paper**
   - Repeat above with Letter size (8.5" x 11")
   - [ ] Content fits properly
   - [ ] Layout is maintained

3. **Test Printed QR Code**
   - Scan the printed QR code with mobile device
   - [ ] QR code scans successfully
   - [ ] Booking reference is correct

**Expected Results**:
- ✅ PDF prints correctly on both A4 and Letter
- ✅ All content is visible and readable
- ✅ QR code remains scannable after printing

---

### Scenario 7: Multiple Bookings

**Objective**: Verify handling of multiple bookings in one transaction

**Steps**:

1. **Create Multiple Bookings**
   - Add multiple items to cart (e.g., 2 different exhibitions)
   - Complete checkout with single payment
   - Verify redirect to confirmation page

2. **Verify Separate Bookings**
   - [ ] Each booking has unique booking reference
   - [ ] Each booking has same payment ID
   - [ ] Each booking shows separate "Download Ticket" button

3. **Download Multiple PDFs**
   - Click "Download Ticket" for first booking
   - Verify PDF downloads with correct filename
   - Click "Download Ticket" for second booking
   - Verify second PDF downloads with different filename
   - [ ] Both PDFs download successfully
   - [ ] Filenames are unique
   - [ ] Each PDF contains correct booking details

4. **Verify PDF Content**
   - Open both PDFs
   - [ ] Each PDF has unique booking reference
   - [ ] Each PDF has unique QR code
   - [ ] Both PDFs have same payment ID
   - [ ] Event details are different in each PDF

**Expected Results**:
- ✅ Multiple bookings generate separate PDFs
- ✅ Each PDF has unique content
- ✅ Payment ID is consistent across bookings
- ✅ All PDFs download successfully

---

### Scenario 8: Error Handling

**Objective**: Verify graceful error handling

**Test Cases**:

1. **Unauthenticated Access**
   - Sign out of the application
   - Try to access `/api/tickets/generate/[bookingId]` directly
   - [ ] Returns 401 Unauthorized
   - [ ] Error message is user-friendly

2. **Invalid Booking ID**
   - Try to download ticket with invalid ID
   - [ ] Returns 404 Not Found
   - [ ] Error toast is displayed
   - [ ] User remains on confirmation page

3. **Network Error**
   - Disable network connection
   - Try to download ticket
   - [ ] Error message is displayed
   - [ ] User can retry after reconnecting

4. **Slow Network**
   - Throttle network to slow 3G
   - Click "Download Ticket"
   - [ ] Loading spinner is shown
   - [ ] Download completes eventually
   - [ ] No timeout errors

**Expected Results**:
- ✅ Errors are handled gracefully
- ✅ User-friendly error messages
- ✅ Application remains functional

---

### Scenario 9: Performance Testing

**Objective**: Verify PDF generation performance

**Steps**:

1. **Measure Generation Time**
   - Open browser developer tools
   - Go to Network tab
   - Click "Download Ticket"
   - Measure time from request to response
   - [ ] PDF generates in < 3 seconds
   - [ ] Response size is reasonable (< 500KB)

2. **Concurrent Downloads**
   - Open multiple tabs with same confirmation page
   - Click "Download Ticket" in all tabs simultaneously
   - [ ] All downloads complete successfully
   - [ ] No errors or timeouts

3. **Repeated Downloads**
   - Download same ticket 5 times in a row
   - [ ] All downloads succeed
   - [ ] No rate limiting errors
   - [ ] Performance remains consistent

**Expected Results**:
- ✅ PDF generates within 3 seconds
- ✅ Concurrent downloads work
- ✅ Repeated downloads are allowed

---

### Scenario 10: Data Integrity

**Objective**: Verify data accuracy and consistency

**Steps**:

1. **Compare Payment ID**
   - Note the Razorpay Payment ID from payment confirmation
   - Download the PDF ticket
   - Open the PDF
   - [ ] Payment ID in PDF matches payment confirmation
   - [ ] Payment ID format is correct (pay_XXXXX)

2. **Verify Booking Details**
   - Compare booking details on confirmation page with PDF
   - [ ] Guest name matches
   - [ ] Email matches
   - [ ] Phone number matches
   - [ ] Exhibition/Show name matches
   - [ ] Date matches
   - [ ] Time slot matches
   - [ ] Amount paid matches

3. **Check Database Records**
   - Query the database for the booking
   - [ ] payment_id column is populated
   - [ ] payment_id matches PDF
   - [ ] booking_reference matches PDF
   - [ ] All fields are consistent

**Expected Results**:
- ✅ All data is accurate and consistent
- ✅ Payment ID is real and matches records
- ✅ No discrepancies between systems

---

## Test Results Summary

### Test Execution Date: _______________

### Tester Name: _______________

### Environment: [ ] Local [ ] Staging [ ] Production

### Overall Results:

| Test Scenario | Status | Notes |
|--------------|--------|-------|
| 1. Complete Booking Flow | [ ] Pass [ ] Fail | |
| 2. PDF Content Verification | [ ] Pass [ ] Fail | |
| 3. QR Code Scanning | [ ] Pass [ ] Fail | |
| 4. Cross-Browser Testing | [ ] Pass [ ] Fail | |
| 5. Mobile Testing | [ ] Pass [ ] Fail | |
| 6. PDF Printing | [ ] Pass [ ] Fail | |
| 7. Multiple Bookings | [ ] Pass [ ] Fail | |
| 8. Error Handling | [ ] Pass [ ] Fail | |
| 9. Performance Testing | [ ] Pass [ ] Fail | |
| 10. Data Integrity | [ ] Pass [ ] Fail | |

### Issues Found:

1. _______________________________________________
2. _______________________________________________
3. _______________________________________________

### Recommendations:

1. _______________________________________________
2. _______________________________________________
3. _______________________________________________

### Sign-off:

- [ ] All critical tests passed
- [ ] All issues documented
- [ ] Feature ready for production

**Tester Signature**: _______________  **Date**: _______________

**Reviewer Signature**: _______________  **Date**: _______________

---

## Troubleshooting Guide

### Issue: PDF Download Fails

**Possible Causes**:
- Network connectivity issues
- Authentication token expired
- Invalid booking ID
- Server error

**Solutions**:
1. Check browser console for errors
2. Verify user is logged in
3. Try refreshing the page
4. Check server logs for errors

### Issue: QR Code Not Scanning

**Possible Causes**:
- QR code too small
- Poor print quality
- Damaged QR code
- Scanner app issues

**Solutions**:
1. Ensure QR code is at least 150x150 pixels
2. Print at higher quality
3. Try different scanner app
4. Regenerate PDF and try again

### Issue: Payment ID Shows as Placeholder

**Possible Causes**:
- Payment verification failed
- Database not updated
- API integration issue

**Solutions**:
1. Check payment verification logs
2. Verify Razorpay webhook is working
3. Check database for payment_id value
4. Re-verify payment manually

### Issue: PDF Content Missing

**Possible Causes**:
- Database query failed
- Missing related records
- PDF rendering error

**Solutions**:
1. Check server logs for errors
2. Verify all related records exist (exhibitions, shows, time_slots)
3. Test PDF generation in isolation
4. Check for null/undefined values

---

## Additional Resources

- [Razorpay Test Cards](https://razorpay.com/docs/payments/payments/test-card-details/)
- [QR Code Standards](https://www.qrcode.com/en/about/standards.html)
- [PDF/A Standard](https://en.wikipedia.org/wiki/PDF/A)
- [Browser Compatibility Testing](https://caniuse.com/)

---

## Notes

- Always use test mode for Razorpay during testing
- Document any unexpected behavior
- Take screenshots of issues for bug reports
- Test on real devices, not just emulators
- Verify with different user accounts
- Test with various booking scenarios (exhibitions vs shows, different time slots, etc.)
