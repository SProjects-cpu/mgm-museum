# Razorpay Payment Integration - Implementation Complete

## Overview

The Razorpay payment gateway has been successfully integrated with the MGM Museum booking system. This document provides a comprehensive guide for setup, usage, and maintenance.

## ✅ Completed Features

### Core Payment Flow
- ✅ Payment order creation with cart validation
- ✅ Razorpay payment modal integration
- ✅ Payment signature verification (HMAC SHA256)
- ✅ Booking creation after successful payment
- ✅ Ticket generation with QR codes
- ✅ Webhook handling for async payment updates

### Admin Features
- ✅ Admin bookings API with filtering and pagination
- ✅ Excel export for bookings and analytics
- ✅ Payment order tracking and status management

### User Features
- ✅ User bookings API
- ✅ Ticket download as PDF
- ✅ Payment failure handling with retry capability

### Security & Monitoring
- ✅ Signature verification for all payments
- ✅ Rate limiting on payment endpoints
- ✅ Structured logging for payment operations
- ✅ Error handling and user-friendly messages

## Setup Instructions

### 1. Environment Variables

Add the following to your `.env.local` file:

```bash
# Razorpay Configuration
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_your_key_id
RAZORPAY_KEY_SECRET=your_secret_key
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
```

**Getting Razorpay Credentials:**
1. Sign up at [Razorpay Dashboard](https://dashboard.razorpay.com/)
2. Navigate to Settings > API Keys
3. Generate test keys for development
4. Generate live keys for production

### 2. Database Setup

Ensure the following tables exist (migrations already created):
- `payment_orders` - Tracks Razorpay orders
- `bookings` - Confirmed bookings
- `tickets` - Generated tickets
- `cart_items` - Temporary cart storage

### 3. Install Dependencies

The following packages are required:
```bash
npm install razorpay qrcode jspdf exceljs
```

### 4. Configure Webhook

1. Go to Razorpay Dashboard > Settings > Webhooks
2. Add webhook URL: `https://your-domain.com/api/webhooks/razorpay`
3. Select events:
   - `payment.captured`
   - `payment.failed`
   - `refund.created`
4. Copy webhook secret to `RAZORPAY_WEBHOOK_SECRET`

## API Endpoints

### Payment APIs

#### Create Payment Order
```
POST /api/payment/create-order
Authorization: Bearer <token>

Body:
{
  "cartItems": [...],
  "userDetails": {
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "9876543210"
  }
}

Response:
{
  "success": true,
  "orderId": "order_xxx",
  "amount": 500,
  "amountInPaise": 50000,
  "currency": "INR",
  "razorpayKeyId": "rzp_test_xxx",
  "userDetails": {...}
}
```

#### Verify Payment
```
POST /api/payment/verify
Authorization: Bearer <token>

Body:
{
  "razorpay_order_id": "order_xxx",
  "razorpay_payment_id": "pay_xxx",
  "razorpay_signature": "signature_xxx"
}

Response:
{
  "success": true,
  "bookings": [...],
  "tickets": [...],
  "message": "Payment verified and bookings created successfully"
}
```

#### Handle Payment Failure
```
POST /api/payment/failure
Authorization: Bearer <token>

Body:
{
  "razorpay_order_id": "order_xxx",
  "error_code": "BAU00",
  "error_description": "Payment failed",
  "error_reason": "User cancelled"
}

Response:
{
  "success": false,
  "message": "Payment failed. Please try again.",
  "canRetry": true,
  "orderId": "order_xxx"
}
```

### Ticket APIs

#### Download Ticket
```
GET /api/tickets/generate?bookingId=<booking_id>
Authorization: Bearer <token>

Response: PDF file download
```

### Admin APIs

#### Get Bookings
```
GET /api/admin/bookings?page=1&limit=50&startDate=2025-01-01&endDate=2025-12-31&status=confirmed&paymentStatus=paid&search=BK123

Response:
{
  "success": true,
  "bookings": [...],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 100,
    "totalPages": 2
  }
}
```

#### Export Bookings to Excel
```
GET /api/admin/bookings/export?type=bookings&startDate=2025-01-01&endDate=2025-12-31

Response: Excel file download
```

#### Export Analytics to Excel
```
GET /api/admin/bookings/export?type=analytics&startDate=2025-01-01&endDate=2025-12-31

Response: Excel file with analytics
```

### User APIs

#### Get User Bookings
```
GET /api/user/bookings
Authorization: Bearer <token>

Response:
{
  "success": true,
  "bookings": [
    {
      "id": "uuid",
      "bookingReference": "BK123",
      "exhibitionName": "Space Exhibition",
      "bookingDate": "2025-11-15",
      "timeSlot": "10:00 AM - 11:00 AM",
      "totalTickets": 4,
      "totalAmount": 500,
      "status": "confirmed",
      "paymentStatus": "paid",
      "ticketUrl": "/api/tickets/generate?bookingId=uuid"
    }
  ]
}
```

### Webhook Endpoint

```
POST /api/webhooks/razorpay
X-Razorpay-Signature: <signature>

Body: Razorpay webhook payload

Response:
{
  "received": true
}
```

## Frontend Integration

### 1. Load Razorpay Script

```html
<script src="https://checkout.razorpay.com/v1/checkout.js"></script>
```

### 2. Create Payment Order

```typescript
const response = await fetch('/api/payment/create-order', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  },
  body: JSON.stringify({
    cartItems,
    userDetails,
  }),
});

const { orderId, amount, razorpayKeyId, userDetails } = await response.json();
```

### 3. Open Razorpay Modal

```typescript
const options = {
  key: razorpayKeyId,
  amount: amountInPaise,
  currency: 'INR',
  name: 'MGM Science Centre',
  description: 'Booking Payment',
  order_id: orderId,
  prefill: {
    name: userDetails.name,
    email: userDetails.email,
    contact: userDetails.contact,
  },
  handler: async function (response) {
    // Verify payment
    const verifyResponse = await fetch('/api/payment/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        razorpay_order_id: response.razorpay_order_id,
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_signature: response.razorpay_signature,
      }),
    });

    const result = await verifyResponse.json();
    if (result.success) {
      // Redirect to confirmation page
      router.push('/booking-confirmation');
    }
  },
  modal: {
    ondismiss: async function () {
      // Handle payment failure/cancellation
      await fetch('/api/payment/failure', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          razorpay_order_id: orderId,
          error_reason: 'User cancelled payment',
        }),
      });
    },
  },
};

const razorpay = new Razorpay(options);
razorpay.open();
```

## Security Best Practices

### 1. Signature Verification
- Always verify payment signatures using HMAC SHA256
- Never trust payment data without verification
- Use constant-time comparison to prevent timing attacks

### 2. Environment Variables
- Never expose `RAZORPAY_KEY_SECRET` or `RAZORPAY_WEBHOOK_SECRET`
- Keep secrets server-side only
- Use different keys for test and production

### 3. Rate Limiting
- Payment endpoints are rate-limited to prevent abuse
- 10 payment attempts per 15 minutes per user
- 20 verification attempts per 15 minutes per user

### 4. Input Validation
- All inputs are validated before processing
- Cart items are checked for availability
- User authentication is required for all payment operations

### 5. HTTPS Only
- All payment endpoints must use HTTPS in production
- Razorpay requires HTTPS for webhooks

## Testing

### Test Mode

Use test credentials for development:
```bash
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxx
RAZORPAY_KEY_SECRET=test_secret_xxx
```

### Test Cards

Razorpay provides test cards:
- **Success:** 4111 1111 1111 1111
- **Failure:** 4000 0000 0000 0002
- **CVV:** Any 3 digits
- **Expiry:** Any future date

See [Razorpay Test Cards](https://razorpay.com/docs/payments/payments/test-card-details/)

### Testing Webhooks

Use Razorpay's webhook testing tool in the dashboard to simulate events.

## Monitoring & Logging

### Payment Logs

All payment operations are logged with structured data:
- Order creation
- Payment verification attempts
- Payment failures
- Webhook events
- Booking creation

### Log Levels

- **INFO:** Successful operations
- **WARN:** Potential issues
- **ERROR:** Failures and security events
- **DEBUG:** Detailed debugging information

### Accessing Logs

Logs are output to console. In production, integrate with a logging service like:
- Vercel Logs
- Datadog
- Sentry
- CloudWatch

## Troubleshooting

### Payment Verification Fails

**Symptoms:** "Invalid payment signature" error

**Solutions:**
1. Check `RAZORPAY_KEY_SECRET` is correct
2. Ensure signature is passed correctly from frontend
3. Verify order ID and payment ID are correct
4. Check for whitespace in environment variables

### Webhook Not Received

**Symptoms:** Payments succeed but bookings not created

**Solutions:**
1. Verify webhook URL is correct in Razorpay dashboard
2. Check `RAZORPAY_WEBHOOK_SECRET` matches dashboard
3. Ensure webhook endpoint is accessible (HTTPS)
4. Check webhook logs in Razorpay dashboard

### Bookings Not Created

**Symptoms:** Payment succeeds but no bookings

**Solutions:**
1. Check database tables exist
2. Verify cart snapshot is saved correctly
3. Check for errors in payment verification logs
4. Ensure user has permission to create bookings

### Excel Export Fails

**Symptoms:** Export button doesn't work

**Solutions:**
1. Ensure `exceljs` package is installed
2. Check for TypeScript errors
3. Verify bookings data is available
4. Check browser console for errors

## Deployment Checklist

### Before Deployment

- [ ] Update environment variables in Vercel
- [ ] Switch to production Razorpay keys
- [ ] Configure webhook URL in Razorpay dashboard
- [ ] Test payment flow end-to-end
- [ ] Verify webhook delivery
- [ ] Test ticket generation
- [ ] Test Excel export
- [ ] Enable HTTPS
- [ ] Set up monitoring and alerts

### After Deployment

- [ ] Monitor payment logs for errors
- [ ] Check webhook delivery success rate
- [ ] Verify bookings are created correctly
- [ ] Test ticket downloads
- [ ] Monitor rate limiting effectiveness
- [ ] Review security logs

## Support & Resources

- **Razorpay Documentation:** https://razorpay.com/docs/
- **Razorpay API Reference:** https://razorpay.com/docs/api/
- **Razorpay Support:** https://razorpay.com/support/
- **Test Cards:** https://razorpay.com/docs/payments/payments/test-card-details/

## Maintenance

### Regular Tasks

1. **Monitor Payment Success Rate**
   - Track failed payments
   - Investigate recurring errors
   - Optimize checkout flow

2. **Review Webhook Logs**
   - Check for delivery failures
   - Monitor processing times
   - Identify patterns in failures

3. **Update Dependencies**
   - Keep Razorpay SDK updated
   - Update security patches
   - Test after updates

4. **Backup Data**
   - Regular database backups
   - Export payment logs
   - Archive old bookings

## Future Enhancements

- [ ] Email notifications for bookings
- [ ] SMS notifications
- [ ] Refund processing UI
- [ ] Advanced analytics dashboard
- [ ] Multi-currency support
- [ ] Subscription/membership payments
- [ ] Partial payments
- [ ] Payment reminders

## Contact

For technical support or questions about this integration, contact the development team.

---

**Last Updated:** November 4, 2025
**Version:** 1.0.0
**Status:** Production Ready
