# End-to-End Testing for PDF Ticket Generation

This directory contains comprehensive end-to-end tests for the PDF ticket generation feature of the MGM Museum booking system.

## Overview

The E2E tests validate the complete booking flow from payment verification to PDF ticket download, ensuring all components work together seamlessly in a production-like environment.

## Test Coverage

### Automated Tests (`pdf-ticket-generation.e2e.test.ts`)

1. **Complete Booking Flow**
   - Booking creation with payment verification
   - Associated ticket records validation
   - Payment ID format verification

2. **Razorpay Payment ID Verification**
   - Real payment ID validation (not placeholders)
   - Format compliance (pay_XXXXX)
   - Database consistency checks

3. **QR Code Generation and Validation**
   - QR code generation from booking reference
   - Minimum size requirements (150x150 pixels)
   - Plain text encoding verification
   - Standard format compliance

4. **PDF Generation API**
   - Authenticated request handling
   - Unauthenticated request rejection (401)
   - Invalid booking ID handling (404)
   - Performance validation (< 3 seconds)

5. **PDF Content Validation**
   - All required booking details present
   - Cart snapshot for pricing tiers
   - Data completeness checks

6. **Multiple Bookings Handling**
   - Separate PDF generation for each booking
   - Unique content verification
   - Concurrent download support

7. **Error Handling and Resilience**
   - Graceful handling of missing optional data
   - Proper error logging with context
   - User-friendly error messages

8. **Performance and Optimization**
   - Optimized database queries
   - Concurrent request handling
   - Response time validation

9. **Data Integrity**
   - Consistency between booking and ticket data
   - Payment ID storage verification
   - Cross-reference validation

10. **Security Validation**
    - User ownership verification
    - Booking ID format validation
    - Payment ID format validation

### Manual Tests (`MANUAL_TESTING_GUIDE.md`)

1. **Complete Booking Flow** - Full user journey from cart to PDF
2. **PDF Content Verification** - Visual inspection of PDF content
3. **QR Code Scanning** - Physical scanning with mobile devices
4. **Cross-Browser Testing** - Chrome, Firefox, Safari, Edge
5. **Mobile Testing** - iOS and Android devices
6. **PDF Printing** - Physical printer testing on A4/Letter paper
7. **Multiple Bookings** - Multiple items in single transaction
8. **Error Handling** - User-facing error scenarios
9. **Performance Testing** - Load and stress testing
10. **Data Integrity** - End-to-end data consistency

## Prerequisites

### Environment Setup

1. **Environment Variables**
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
   SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key> # Optional, for test data setup
   RAZORPAY_KEY_ID=<your-razorpay-key-id>
   RAZORPAY_KEY_SECRET=<your-razorpay-key-secret>
   ```

2. **Test User Account**
   - Email: `test-e2e@mgmmuseum.com`
   - Password: `TestPassword123!`
   - Will be created automatically by setup script

3. **Dependencies**
   ```bash
   npm install
   ```

## Running Tests

### 1. Setup Test Data

Before running tests, set up the required test data:

```bash
npm run setup:e2e-data
# or
tsx scripts/setup-e2e-test-data.ts
```

This will create:
- Test user account
- Test exhibition
- Test time slot
- Test booking with payment
- Test tickets

### 2. Run Automated Tests

Run all automated E2E tests:

```bash
npm run test:e2e
```

Or run tests directly with vitest:

```bash
npm run test -- __tests__/e2e/pdf-ticket-generation.e2e.test.ts
```

### 3. Run Specific Test Suites

Run specific test suites:

```bash
# Run only QR code tests
npm run test -- __tests__/e2e/pdf-ticket-generation.e2e.test.ts -t "QR Code"

# Run only PDF generation tests
npm run test -- __tests__/e2e/pdf-ticket-generation.e2e.test.ts -t "PDF Generation"

# Run only performance tests
npm run test -- __tests__/e2e/pdf-ticket-generation.e2e.test.ts -t "Performance"
```

### 4. Run with Coverage

Generate test coverage report:

```bash
npm run test:coverage -- __tests__/e2e/pdf-ticket-generation.e2e.test.ts
```

### 5. Run in Watch Mode

Run tests in watch mode for development:

```bash
npm run test:watch -- __tests__/e2e/pdf-ticket-generation.e2e.test.ts
```

### 6. Manual Testing

Follow the comprehensive manual testing guide:

```bash
# Open the manual testing guide
cat __tests__/e2e/MANUAL_TESTING_GUIDE.md
```

## Test Reports

After running tests, reports are generated in:

- **Automated Test Report**: `__tests__/e2e/TEST_REPORT.md`
- **Manual Test Checklist**: `__tests__/e2e/MANUAL_TESTING_GUIDE.md`

## Test Data

### Test User Credentials

```
Email: test-e2e@mgmmuseum.com
Password: TestPassword123!
```

### Test Payment Details (Razorpay Test Mode)

```
Card Number: 4111 1111 1111 1111
Expiry: Any future date
CVV: Any 3 digits
```

### Sample Test Data

The setup script creates:
- 1 test exhibition
- 1 test time slot (tomorrow, 10:00 AM - 12:00 PM)
- 1 test booking with 2 tickets
- 1 test payment order with Razorpay payment ID

## Troubleshooting

### Issue: Tests Fail with "User not found"

**Solution**: Run the test data setup script:
```bash
tsx scripts/setup-e2e-test-data.ts
```

### Issue: Tests Fail with "Booking not found"

**Solution**: Ensure test data is set up and the booking ID is valid. Re-run setup script.

### Issue: PDF Generation Times Out

**Solution**: 
1. Check server is running: `npm run dev`
2. Verify environment variables are set
3. Check network connectivity
4. Review server logs for errors

### Issue: QR Code Tests Fail

**Solution**:
1. Verify `qrcode` package is installed
2. Check booking reference format
3. Ensure QR code generation function is working

### Issue: Authentication Errors

**Solution**:
1. Verify Supabase credentials
2. Check test user exists
3. Ensure auth token is valid
4. Re-run setup script to recreate user

## CI/CD Integration

### GitHub Actions

Add to `.github/workflows/e2e-tests.yml`:

```yaml
name: E2E Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  e2e-tests:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Setup test data
        run: npm run setup:e2e-data
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
          
      - name: Run E2E tests
        run: npm run test:e2e
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
          
      - name: Upload test report
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: e2e-test-report
          path: __tests__/e2e/TEST_REPORT.md
```

## Best Practices

1. **Always run setup script before tests**
   - Ensures fresh test data
   - Creates necessary database records
   - Sets up test user account

2. **Use test mode for Razorpay**
   - Never use production keys in tests
   - Use test card numbers only
   - Verify test mode is enabled

3. **Clean up test data**
   - Remove old test bookings periodically
   - Keep test database clean
   - Use unique identifiers for test data

4. **Run tests in isolation**
   - Each test should be independent
   - Don't rely on test execution order
   - Clean up after each test if needed

5. **Document test failures**
   - Take screenshots of failures
   - Save error logs
   - Include reproduction steps

6. **Keep tests up to date**
   - Update tests when features change
   - Add tests for new functionality
   - Remove obsolete tests

## Contributing

When adding new E2E tests:

1. Follow existing test structure
2. Add descriptive test names
3. Include proper assertions
4. Document expected behavior
5. Update this README if needed

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Supabase Testing Guide](https://supabase.com/docs/guides/testing)
- [Razorpay Test Cards](https://razorpay.com/docs/payments/payments/test-card-details/)
- [QR Code Standards](https://www.qrcode.com/en/about/standards.html)

## Support

For issues or questions:

1. Check the troubleshooting section above
2. Review test logs and error messages
3. Consult the manual testing guide
4. Contact the development team

---

**Last Updated**: November 5, 2025
**Maintained By**: MGM Museum Development Team
