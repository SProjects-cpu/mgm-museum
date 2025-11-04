# Razorpay Webhook Configuration Guide

## Overview

This guide will help you configure webhooks in the Razorpay Dashboard to enable real-time payment notifications.

## Why Webhooks?

Webhooks ensure that your system is notified about payment events even if:
- User closes the browser after payment
- Network issues prevent frontend callback
- Payment is captured/failed asynchronously

## Step-by-Step Setup

### 1. Access Razorpay Dashboard

1. Go to [Razorpay Dashboard](https://dashboard.razorpay.com/)
2. Log in with your credentials
3. Select your account (Test or Live mode)

### 2. Navigate to Webhooks

1. Click on **Settings** in the left sidebar
2. Select **Webhooks** from the menu
3. Click **+ Add New Webhook** button

### 3. Configure Webhook URL

**For Development (Local Testing):**
```
Use ngrok or similar tool to expose localhost:
https://your-ngrok-url.ngrok.io/api/webhooks/razorpay
```

**For Production:**
```
https://your-domain.vercel.app/api/webhooks/razorpay
```

**Important:** The URL must be HTTPS (required by Razorpay)

### 4. Select Events

Check the following events:

#### Required Events:
- ✅ **payment.captured** - Payment successfully captured
- ✅ **payment.failed** - Payment failed
- ✅ **refund.created** - Refund initiated

#### Optional Events (for future use):
- ⬜ payment.authorized - Payment authorized but not captured
- ⬜ refund.processed - Refund completed
- ⬜ refund.failed - Refund failed

### 5. Set Alert Email (Optional)

Add an email address to receive alerts if webhook delivery fails.

### 6. Save and Get Secret

1. Click **Create Webhook**
2. Copy the **Webhook Secret** shown
3. This secret is shown only once - save it securely!

### 7. Update Environment Variables

Add the webhook secret to your environment:

**Local Development (.env.local):**
```bash
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret_here
```

**Vercel Production:**
```bash
# Add via Vercel Dashboard or CLI
vercel env add RAZORPAY_WEBHOOK_SECRET
```

### 8. Verify Webhook Setup

#### Test Webhook Delivery

1. In Razorpay Dashboard, go to Webhooks
2. Click on your webhook
3. Click **Send Test Webhook**
4. Select event type (e.g., payment.captured)
5. Click **Send**

#### Check Webhook Logs

1. In Razorpay Dashboard, view webhook delivery logs
2. Check for successful deliveries (200 OK response)
3. If failed, check error messages

## Webhook Endpoint Details

### URL
```
POST /api/webhooks/razorpay
```

### Headers
```
X-Razorpay-Signature: <signature>
Content-Type: application/json
```

### Signature Verification

Our webhook handler automatically verifies signatures using:
```typescript
verifyWebhookSignature(rawBody, signature)
```

This uses HMAC SHA256 with your webhook secret.

### Supported Events

#### payment.captured
```json
{
  "event": "payment.captured",
  "payload": {
    "payment": {
      "entity": {
        "id": "pay_xxx",
        "order_id": "order_xxx",
        "amount": 50000,
        "status": "captured",
        "method": "card"
      }
    }
  }
}
```

**Action:** Creates bookings if not already created, updates payment status

#### payment.failed
```json
{
  "event": "payment.failed",
  "payload": {
    "payment": {
      "entity": {
        "id": "pay_xxx",
        "order_id": "order_xxx",
        "error_code": "BAU00",
        "error_description": "Payment failed"
      }
    }
  }
}
```

**Action:** Updates payment order status to 'failed', logs error

#### refund.created
```json
{
  "event": "refund.created",
  "payload": {
    "refund": {
      "entity": {
        "id": "rfnd_xxx",
        "payment_id": "pay_xxx",
        "amount": 50000
      }
    }
  }
}
```

**Action:** Updates payment order and booking status to 'refunded'

## Testing Webhooks

### Local Testing with ngrok

1. Install ngrok:
```bash
npm install -g ngrok
```

2. Start your development server:
```bash
npm run dev
```

3. Expose localhost with ngrok:
```bash
ngrok http 3000
```

4. Copy the HTTPS URL (e.g., https://abc123.ngrok.io)

5. Add webhook in Razorpay Dashboard:
```
https://abc123.ngrok.io/api/webhooks/razorpay
```

6. Make a test payment and watch webhook logs

### Production Testing

1. Deploy to Vercel
2. Configure webhook with production URL
3. Make a test payment using test cards
4. Check Vercel logs for webhook processing
5. Verify bookings are created

## Monitoring Webhooks

### Razorpay Dashboard

1. Go to Settings > Webhooks
2. Click on your webhook
3. View delivery logs:
   - Timestamp
   - Event type
   - Response status
   - Response time
   - Retry attempts

### Application Logs

Check your application logs for:
```
[PAYMENT INFO] Webhook payment.captured processed
[PAYMENT INFO] Booking created for order: order_xxx
```

### Common Issues

#### Webhook Returns 401 Unauthorized

**Cause:** Invalid signature
**Solution:** 
- Verify RAZORPAY_WEBHOOK_SECRET matches dashboard
- Check for whitespace in environment variable
- Ensure raw body is used for verification

#### Webhook Returns 404 Not Found

**Cause:** Incorrect URL
**Solution:**
- Verify URL is exactly: `/api/webhooks/razorpay`
- Check deployment is successful
- Ensure route file exists

#### Webhook Returns 500 Internal Server Error

**Cause:** Application error
**Solution:**
- Check application logs
- Verify database connection
- Check for missing environment variables

#### Webhook Not Received

**Cause:** Network/firewall issues
**Solution:**
- Verify URL is accessible publicly
- Check HTTPS is enabled
- Verify no firewall blocking Razorpay IPs

## Security Best Practices

### 1. Always Verify Signatures
```typescript
const isValid = verifyWebhookSignature(rawBody, signature);
if (!isValid) {
  return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
}
```

### 2. Use HTTPS Only
- Razorpay requires HTTPS for webhooks
- Never use HTTP in production

### 3. Validate Event Data
```typescript
if (!orderId || !paymentEntity) {
  console.error('Invalid webhook payload');
  return NextResponse.json({ received: true });
}
```

### 4. Idempotency
- Check if booking already exists before creating
- Prevent duplicate processing of same event

### 5. Log All Events
```typescript
logWebhookEvent(eventType, orderId, success);
```

## Webhook Retry Logic

Razorpay automatically retries failed webhooks:
- **Retry Interval:** Exponential backoff
- **Max Retries:** 10 attempts
- **Timeout:** 30 seconds per attempt

**Best Practice:** Always return 200 OK quickly, process asynchronously if needed

## Troubleshooting Checklist

- [ ] Webhook URL is correct and accessible
- [ ] HTTPS is enabled
- [ ] Webhook secret is set in environment
- [ ] Signature verification is working
- [ ] Events are selected in dashboard
- [ ] Application is deployed and running
- [ ] Database connection is working
- [ ] Logs show webhook received
- [ ] Response is 200 OK

## Support

If you encounter issues:

1. Check Razorpay webhook logs in dashboard
2. Check application logs in Vercel
3. Review error messages
4. Contact Razorpay support if needed

## References

- [Razorpay Webhooks Documentation](https://razorpay.com/docs/webhooks/)
- [Webhook Events Reference](https://razorpay.com/docs/webhooks/events/)
- [Webhook Security](https://razorpay.com/docs/webhooks/validate-test/)

---

**Last Updated:** November 4, 2025
**Status:** Ready for Configuration
