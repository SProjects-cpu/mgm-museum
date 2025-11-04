# Razorpay Integration Module

This module provides a complete integration with Razorpay payment gateway for the MGM Museum booking system.

## Features

- ✅ Secure credential management (environment variables + database)
- ✅ Payment signature verification using HMAC SHA256
- ✅ Webhook signature verification
- ✅ Amount conversion utilities (rupees ↔ paise)
- ✅ Receipt and booking reference generation
- ✅ Order creation and management
- ✅ Payment verification
- ✅ Refund processing
- ✅ TypeScript support with full type definitions

## Setup

### 1. Environment Variables

Add the following to your `.env.local` file:

```bash
# Razorpay Configuration
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_your_key_id
RAZORPAY_KEY_SECRET=your_secret_key
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
```

**Important:**
- Use `rzp_test_` prefix for test/development keys
- Use `rzp_live_` prefix for production keys
- Never commit these values to version control

### 2. Get Razorpay Credentials

1. Sign up at [Razorpay Dashboard](https://dashboard.razorpay.com/)
2. Navigate to Settings > API Keys
3. Generate test keys for development
4. Generate live keys for production (after testing)

### 3. Configure Webhook

1. Go to Settings > Webhooks in Razorpay Dashboard
2. Add webhook URL: `https://your-domain.com/api/webhooks/razorpay`
3. Select events: `payment.captured`, `payment.failed`, `refund.created`
4. Copy the webhook secret to `RAZORPAY_WEBHOOK_SECRET`

## Usage

### Configuration

```typescript
import { 
  getRazorpayConfig, 
  validateRazorpayConfig,
  isRazorpayConfigured 
} from '@/lib/razorpay';

// Check if Razorpay is configured
if (!isRazorpayConfigured()) {
  console.error('Razorpay not configured');
}

// Get configuration
const config = getRazorpayConfig();
console.log('Environment:', config.environment); // 'test' or 'production'

// Validate configuration
const validation = validateRazorpayConfig();
if (!validation.valid) {
  console.error('Missing:', validation.missing);
  console.error('Errors:', validation.errors);
}
```

### Creating Orders

```typescript
import { createRazorpayOrder, formatAmountForRazorpay, generateReceipt } from '@/lib/razorpay';

// Create an order
const amount = 500; // ₹500
const receipt = generateReceipt('booking');

const order = await createRazorpayOrder(
  formatAmountForRazorpay(amount), // Convert to paise
  'INR',
  receipt,
  { bookingId: '123', userId: '456' }
);

console.log('Order ID:', order.id);
console.log('Amount:', order.amount); // in paise
```

### Verifying Payments

```typescript
import { verifyPaymentSignature } from '@/lib/razorpay';

// Verify payment signature from Razorpay callback
const isValid = verifyPaymentSignature(
  razorpay_order_id,
  razorpay_payment_id,
  razorpay_signature
);

if (isValid) {
  // Payment is legitimate, create booking
  console.log('Payment verified successfully');
} else {
  // Invalid signature, reject payment
  console.error('Payment verification failed');
}
```

### Verifying Webhooks

```typescript
import { verifyWebhookSignature } from '@/lib/razorpay';

// In your webhook handler
const signature = request.headers['x-razorpay-signature'];
const body = await request.text();

const isValid = verifyWebhookSignature(body, signature);

if (isValid) {
  // Process webhook event
  const event = JSON.parse(body);
  console.log('Event:', event.event);
} else {
  // Invalid webhook, reject
  return new Response('Invalid signature', { status: 400 });
}
```

### Amount Conversion

```typescript
import { 
  formatAmountForRazorpay, 
  formatAmountFromRazorpay,
  formatCurrency 
} from '@/lib/razorpay';

// Convert rupees to paise (for Razorpay API)
const amountInPaise = formatAmountForRazorpay(299.50); // 29950

// Convert paise to rupees (from Razorpay response)
const amountInRupees = formatAmountFromRazorpay(29950); // 299.50

// Format for display
const formatted = formatCurrency(299.50); // "₹299.50"
```

### Generating References

```typescript
import { generateReceipt, generateBookingReference } from '@/lib/razorpay';

// Generate order receipt
const receipt = generateReceipt('order'); // "order_1730736000000_ABC123"

// Generate booking reference
const bookingRef = generateBookingReference(); // "BK1730736000000ABC123"
```

### Validation Helpers

```typescript
import { isValidOrderId, isValidPaymentId } from '@/lib/razorpay';

// Validate order ID format
const validOrder = isValidOrderId('order_ABC123'); // true
const invalidOrder = isValidOrderId('invalid'); // false

// Validate payment ID format
const validPayment = isValidPaymentId('pay_XYZ789'); // true
const invalidPayment = isValidPaymentId('invalid'); // false
```

### Error Handling

```typescript
import { parseRazorpayError } from '@/lib/razorpay';

try {
  const order = await createRazorpayOrder(...);
} catch (error) {
  const message = parseRazorpayError(error);
  console.error('Payment error:', message);
}
```

## API Reference

### Configuration Functions

- `getRazorpayConfig()` - Get current Razorpay configuration
- `validateRazorpayConfig()` - Validate configuration and return errors
- `getConfigErrorMessage()` - Get formatted error message
- `isRazorpayConfigured()` - Check if Razorpay is properly configured

### Utility Functions

- `verifyPaymentSignature(orderId, paymentId, signature)` - Verify payment signature
- `verifyWebhookSignature(body, signature)` - Verify webhook signature
- `formatAmountForRazorpay(amount)` - Convert rupees to paise
- `formatAmountFromRazorpay(amount)` - Convert paise to rupees
- `generateReceipt(prefix)` - Generate unique receipt
- `generateBookingReference()` - Generate booking reference
- `isValidOrderId(orderId)` - Validate order ID format
- `isValidPaymentId(paymentId)` - Validate payment ID format
- `formatCurrency(amount, currency)` - Format amount for display
- `parseRazorpayError(error)` - Parse Razorpay error response

### Client Functions

- `getRazorpayInstance(environment)` - Get Razorpay SDK instance
- `createRazorpayOrder(amount, currency, receipt, notes, environment)` - Create order
- `fetchPaymentDetails(paymentId, environment)` - Fetch payment details
- `fetchOrderDetails(orderId, environment)` - Fetch order details
- `createRefund(paymentId, amount, notes, environment)` - Create refund

## Security Best Practices

1. **Never expose secrets**: Keep `RAZORPAY_KEY_SECRET` and `RAZORPAY_WEBHOOK_SECRET` server-side only
2. **Always verify signatures**: Use `verifyPaymentSignature()` and `verifyWebhookSignature()`
3. **Use HTTPS**: All payment endpoints must use HTTPS in production
4. **Validate inputs**: Always validate order IDs, payment IDs, and amounts
5. **Rate limiting**: Implement rate limiting on payment endpoints
6. **Logging**: Log all payment operations for audit trail (sanitize sensitive data)

## Testing

### Test Mode

Use test credentials (starting with `rzp_test_`) for development:

```bash
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_your_key_id
RAZORPAY_KEY_SECRET=your_test_secret
```

### Test Cards

Razorpay provides test cards for testing:
- Success: 4111 1111 1111 1111
- Failure: 4000 0000 0000 0002

See [Razorpay Test Cards](https://razorpay.com/docs/payments/payments/test-card-details/) for more.

## Troubleshooting

### Configuration Errors

```typescript
import { validateRazorpayConfig, getConfigErrorMessage } from '@/lib/razorpay';

const validation = validateRazorpayConfig();
if (!validation.valid) {
  console.error(getConfigErrorMessage());
}
```

### Common Issues

1. **"Razorpay credentials not configured"**
   - Check environment variables are set correctly
   - Ensure `.env.local` is loaded
   - Verify key format (must start with `rzp_`)

2. **"Payment verification failed"**
   - Check `RAZORPAY_KEY_SECRET` is correct
   - Ensure signature is passed correctly from frontend
   - Verify order ID and payment ID are correct

3. **"Webhook signature invalid"**
   - Check `RAZORPAY_WEBHOOK_SECRET` matches dashboard
   - Ensure raw request body is used for verification
   - Verify webhook is configured in Razorpay dashboard

## Support

- [Razorpay Documentation](https://razorpay.com/docs/)
- [Razorpay API Reference](https://razorpay.com/docs/api/)
- [Razorpay Support](https://razorpay.com/support/)
