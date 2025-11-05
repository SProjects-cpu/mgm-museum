# Quick Start Guide - E2E Testing

Get started with end-to-end testing for PDF ticket generation in 5 minutes.

## Prerequisites

✅ Node.js installed
✅ Project dependencies installed (`npm install`)
✅ Environment variables configured (`.env.local`)

## Step 1: Setup Test Data (First Time Only)

```bash
npm run setup:e2e-data
```

This creates:
- Test user account
- Test exhibition and time slot
- Test booking with payment
- Test tickets

**Output:**
```
✅ Test data setup complete!

📊 Test Data Summary:
   User ID: xxx-xxx-xxx
   Email: test-e2e@mgmmuseum.com
   Password: TestPassword123!
   Booking Reference: BK17623504597486WZYCB
   Payment ID: pay_test_xxxxx
```

## Step 2: Run Automated Tests

```bash
npm run test:e2e
```

**Expected Output:**
```
🚀 Starting End-to-End Tests for PDF Ticket Generation

📋 Checking Prerequisites...
   ✅ NEXT_PUBLIC_SUPABASE_URL - Set
   ✅ NEXT_PUBLIC_SUPABASE_ANON_KEY - Set

🧪 Running Automated Tests...
   ✓ Complete Booking Flow (245ms)
   ✓ Razorpay Payment ID Verification (123ms)
   ✓ QR Code Generation (89ms)
   ✓ PDF Generation API (1234ms)
   ...

📊 Test Execution Summary
   Total Tests: 25
   ✅ Passed: 25
   ❌ Failed: 0
   ⏱️  Duration: 8.45s
   📈 Success Rate: 100%

🎉 All automated tests passed!
```

## Step 3: Review Test Report

```bash
# View the generated test report
cat __tests__/e2e/TEST_REPORT.md
```

## Step 4: Manual Testing (Optional)

Follow the comprehensive manual testing guide:

```bash
# View the manual testing guide
cat __tests__/e2e/MANUAL_TESTING_GUIDE.md
```

### Quick Manual Test Checklist

1. **Complete a booking**
   - Go to http://localhost:3000
   - Select an exhibition
   - Add to cart and checkout
   - Use test card: 4111 1111 1111 1111
   - Complete payment

2. **Download PDF**
   - Click "Download Ticket" on confirmation page
   - Verify PDF downloads

3. **Verify PDF Content**
   - Open PDF
   - Check Razorpay Payment ID (starts with "pay_")
   - Verify all booking details are correct

4. **Scan QR Code**
   - Open camera on mobile device
   - Scan QR code in PDF
   - Verify booking reference is displayed

## Common Commands

```bash
# Setup test data
npm run setup:e2e-data

# Run all E2E tests
npm run test:e2e

# Run specific test suite
npm run test -- __tests__/e2e/pdf-ticket-generation.e2e.test.ts -t "QR Code"

# Run tests in watch mode
npm run test:watch -- __tests__/e2e/pdf-ticket-generation.e2e.test.ts

# Generate coverage report
npm run test:coverage -- __tests__/e2e/pdf-ticket-generation.e2e.test.ts
```

## Troubleshooting

### Tests fail with "User not found"
```bash
# Re-run setup script
npm run setup:e2e-data
```

### Tests fail with authentication errors
```bash
# Check environment variables
cat .env.local | grep SUPABASE

# Verify Supabase connection
npm run test -- __tests__/e2e/pdf-ticket-generation.e2e.test.ts -t "Prerequisites"
```

### PDF generation times out
```bash
# Ensure dev server is running
npm run dev

# Check server logs for errors
```

## Test User Credentials

```
Email: test-e2e@mgmmuseum.com
Password: TestPassword123!
```

## Test Payment Details (Razorpay Test Mode)

```
Card Number: 4111 1111 1111 1111
Expiry: 12/25 (any future date)
CVV: 123 (any 3 digits)
```

## Next Steps

After all tests pass:

1. ✅ Review test report
2. ✅ Complete manual testing checklist
3. ✅ Test on multiple browsers
4. ✅ Test on mobile devices
5. ✅ Verify QR code scanning
6. ✅ Test PDF printing

## Need Help?

- 📖 Full documentation: `__tests__/e2e/README.md`
- 📋 Manual testing guide: `__tests__/e2e/MANUAL_TESTING_GUIDE.md`
- 🐛 Troubleshooting: See README.md troubleshooting section

---

**Ready to test?** Run `npm run test:e2e` to get started! 🚀
