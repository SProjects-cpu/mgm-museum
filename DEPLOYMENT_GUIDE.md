# Cart and Payment System - Deployment Guide

## Overview
This guide covers the deployment of the complete cart and payment system for MGM Museum, including database migrations, environment configuration, and verification steps.

## Pre-Deployment Checklist

### 1. Database Migrations
Ensure all migrations are applied in order:

```bash
# Migrations to apply (in order)
1. 00006_cart_system.sql          # Cart items table and cleanup functions
2. 00007_payment_orders.sql       # Payment orders table
3. 00008_pricing_tiers.sql        # Pricing management system
```

**Verification:**
```sql
-- Check if tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('cart_items', 'payment_orders', 'pricing_tiers');

-- Verify RLS policies are enabled
SELECT tablename, rowsecurity FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('cart_items', 'payment_orders', 'pricing_tiers');
```

### 2. Environment Variables

**Required Environment Variables:**

```env
# Razorpay Configuration
RAZORPAY_KEY_ID=rzp_test_xxxxx              # Test: rzp_test_, Production: rzp_live_
RAZORPAY_KEY_SECRET=your_secret_key
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret

# Database Encryption (for storing Razorpay credentials)
DATABASE_ENCRYPTION_KEY=YzQ3GlNzntjVLy16kSgvEJZS4PNHDdit19QiosSftxM=

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Email Service (Optional - for booking confirmations)
RESEND_API_KEY=your_resend_key
# OR
SENDGRID_API_KEY=your_sendgrid_key
```

**Environment Setup:**
1. Add variables to Vercel project settings
2. Add to `.env.local` for local development
3. Never commit `.env.local` to version control

### 3. Razorpay Configuration

**Test Mode Setup:**
1. Create Razorpay test account at https://dashboard.razorpay.com
2. Navigate to Settings → API Keys
3. Generate test API keys (rzp_test_xxx)
4. Create webhook secret for test mode
5. Configure webhook URL: `https://your-domain.com/api/payment/webhook`

**Production Mode Setup:**
1. Complete KYC verification on Razorpay
2. Activate live mode
3. Generate live API keys (rzp_live_xxx)
4. Update webhook URL to production domain
5. Test webhook delivery

**Webhook Events to Subscribe:**
- `payment.captured`
- `payment.failed`
- `refund.processed`

## Deployment Steps

### Step 1: Deploy Code to Vercel

```bash
# Install Vercel CLI (if not installed)
npm i -g vercel

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

**Vercel Configuration:**
- Framework Preset: Next.js
- Build Command: `npm run build`
- Output Directory: `.next`
- Install Command: `npm install`
- Node Version: 18.x or higher

### Step 2: Run Database Migrations

**Option A: Using Supabase CLI**
```bash
# Install Supabase CLI
npm install -g supabase

# Link to project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push
```

**Option B: Using Supabase Dashboard**
1. Navigate to SQL Editor in Supabase Dashboard
2. Run each migration file content in order
3. Verify tables are created

### Step 3: Configure Razorpay Credentials

1. Navigate to: `https://your-domain.com/admin/payment-settings`
2. Login as admin
3. Add Razorpay credentials:
   - Environment: Test/Production
   - Key ID
   - Key Secret
   - Webhook Secret
4. Test connection
5. Save credentials

### Step 4: Set Up Default Pricing

**For Free Admission (Default):**
The migration automatically creates ₹0 pricing for all existing exhibitions and shows.

**For Paid Exhibitions:**
1. Navigate to admin panel
2. Go to Pricing Management
3. Create pricing tiers for each ticket type:
   - Adult: ₹X.XX
   - Child: ₹X.XX
   - Student: ₹X.XX
   - Senior: ₹X.XX
4. Set valid date ranges
5. Activate pricing

### Step 5: Configure Webhook URL

1. Login to Razorpay Dashboard
2. Navigate to Settings → Webhooks
3. Add webhook URL: `https://your-domain.com/api/payment/webhook`
4. Enter webhook secret (same as in environment variables)
5. Select events:
   - payment.captured
   - payment.failed
   - refund.processed
6. Activate webhook

## Post-Deployment Verification

### 1. Cart Functionality

**Test Guest User Flow:**
```
1. Visit booking page
2. Select date and time slot
3. Select tickets
4. Add to cart
5. Verify cart shows items with countdown timer
6. Verify cart persists in localStorage
7. Remove item from cart
8. Verify seats are released
```

**Test Authenticated User Flow:**
```
1. Login as user
2. Add items to cart
3. Verify cart syncs to database
4. Logout and login again
5. Verify cart items persist
6. Clear cart
7. Verify all items removed
```

### 2. Payment Flow

**Test Payment (Test Mode):**
```
1. Add items to cart
2. Proceed to checkout
3. Fill user details
4. Click "Proceed to Payment"
5. Razorpay modal should appear
6. Use test card: 4111 1111 1111 1111
7. Any CVV and future expiry date
8. Complete payment
9. Verify redirect to confirmation page
10. Check booking created in database
11. Verify payment_orders record created
12. Check cart is cleared
```

**Test Payment Failure:**
```
1. Add items to cart
2. Proceed to checkout
3. In Razorpay modal, close without paying
4. Verify cart items remain
5. Verify no booking created
6. Verify payment_orders status is 'created'
```

### 3. Webhook Handling

**Verify Webhook Delivery:**
```sql
-- Check payment_logs table
SELECT * FROM payment_logs 
ORDER BY created_at DESC 
LIMIT 10;

-- Should see entries for:
-- - payment.captured
-- - payment.failed (if tested)
```

**Test Webhook Manually:**
```bash
# Use Razorpay Dashboard → Webhooks → Test Webhook
# Or use curl:
curl -X POST https://your-domain.com/api/payment/webhook \
  -H "Content-Type: application/json" \
  -H "X-Razorpay-Signature: test_signature" \
  -d '{"event":"payment.captured","payload":{"payment":{"entity":{"id":"pay_test123"}}}}'
```

### 4. Admin Panel Features

**Test Admin Bookings View:**
```
1. Login as admin
2. Navigate to /admin/bookings-new
3. Verify bookings display with payment info
4. Test filters (status, payment status)
5. Test search by reference/email/payment ID
6. Click "View Details" on a booking
7. Verify payment information displays
8. Test refund button (if payment exists)
```

**Test Payment Transactions View:**
```
1. Navigate to /admin/payments
2. Verify payment orders display
3. Test filters and search
4. Click "View Details" on a payment
5. Verify order and cart information
```

**Test Refund Processing:**
```
1. Find a paid booking
2. Click "View Details"
3. Click "Process Refund"
4. Enter refund reason
5. Confirm refund
6. Verify:
   - Booking status changed to 'cancelled'
   - Payment status changed to 'refunded'
   - Seats released (current_bookings decremented)
   - Refund logged in payment_logs
```

### 5. Pricing Management

**Test Pricing Display:**
```
1. Create pricing tier for an exhibition
2. Visit booking page for that exhibition
3. Select date within pricing validity
4. Verify prices display in ticket selector
5. Select tickets
6. Verify subtotal calculates correctly
7. Add to cart
8. Verify cart shows correct pricing
```

**Test Free Admission:**
```
1. Visit booking page for exhibition with ₹0 pricing
2. Verify "Free" badges display
3. Add to cart
4. Verify subtotal is ₹0
5. Proceed to checkout
6. Verify payment is skipped
7. Booking should be created directly
```

## Monitoring and Maintenance

### 1. Error Monitoring

**Check Application Logs:**
```bash
# Vercel logs
vercel logs

# Or in Vercel Dashboard → Deployments → Logs
```

**Monitor for Common Errors:**
- Payment signature verification failures
- Webhook delivery failures
- Cart expiration cleanup errors
- Seat reservation conflicts

### 2. Database Monitoring

**Monitor Cart Cleanup:**
```sql
-- Check for expired cart items
SELECT COUNT(*) FROM cart_items 
WHERE expires_at < NOW();

-- Should be 0 if cleanup is running properly
```

**Monitor Payment Orders:**
```sql
-- Check for stuck payment orders
SELECT COUNT(*) FROM payment_orders 
WHERE status = 'created' 
AND created_at < NOW() - INTERVAL '1 hour';

-- Investigate if count is high
```

### 3. Performance Monitoring

**Key Metrics to Track:**
- Cart addition success rate
- Payment completion rate
- Webhook delivery success rate
- Average booking time
- Cart expiration rate

**Database Indexes to Monitor:**
```sql
-- Check index usage
SELECT schemaname, tablename, indexname, idx_scan 
FROM pg_stat_user_indexes 
WHERE schemaname = 'public' 
AND tablename IN ('cart_items', 'payment_orders', 'bookings', 'pricing_tiers')
ORDER BY idx_scan DESC;
```

### 4. Scheduled Tasks

**Cart Cleanup (Recommended: Every 5 minutes):**
```bash
# Using Vercel Cron Jobs (vercel.json)
{
  "crons": [{
    "path": "/api/cart/cleanup-expired",
    "schedule": "*/5 * * * *"
  }]
}
```

**Alternative: External Cron Service:**
```bash
# Use services like cron-job.org or EasyCron
# Schedule: */5 * * * *
# URL: https://your-domain.com/api/cart/cleanup-expired
# Method: POST
```

## Rollback Plan

### If Issues Occur:

**1. Code Rollback:**
```bash
# Revert to previous deployment in Vercel Dashboard
# Or redeploy previous version
vercel --prod
```

**2. Database Rollback:**
```sql
-- Disable new features
UPDATE pricing_tiers SET is_active = false;

-- Or drop new tables (CAUTION: Data loss)
DROP TABLE IF EXISTS pricing_tiers CASCADE;
DROP TABLE IF EXISTS payment_orders CASCADE;
DROP TABLE IF EXISTS cart_items CASCADE;
```

**3. Razorpay Rollback:**
- Disable webhook in Razorpay Dashboard
- Switch back to test mode if needed

## Support and Troubleshooting

### Common Issues

**1. Payment Signature Verification Fails:**
- Check RAZORPAY_KEY_SECRET is correct
- Verify webhook secret matches
- Check server time is synchronized

**2. Cart Items Not Expiring:**
- Verify cleanup cron job is running
- Check cleanup_expired_cart_items() function exists
- Monitor cleanup API endpoint logs

**3. Seats Not Released:**
- Check trigger on cart_items table
- Verify current_bookings column exists
- Test seat release manually

**4. Webhook Not Receiving Events:**
- Verify webhook URL is accessible
- Check Razorpay webhook logs
- Test webhook signature verification

### Getting Help

**Razorpay Support:**
- Dashboard: https://dashboard.razorpay.com
- Docs: https://razorpay.com/docs
- Support: support@razorpay.com

**Supabase Support:**
- Dashboard: https://app.supabase.com
- Docs: https://supabase.com/docs
- Discord: https://discord.supabase.com

## Security Checklist

- [ ] All API keys stored in environment variables
- [ ] Webhook signature verification enabled
- [ ] RLS policies enabled on all tables
- [ ] HTTPS enforced on all endpoints
- [ ] Rate limiting configured
- [ ] CORS properly configured
- [ ] Admin routes protected with authentication
- [ ] Sensitive data encrypted in database
- [ ] Payment logs secured with RLS
- [ ] Test mode disabled in production

## Success Criteria

Deployment is successful when:
- [ ] All database migrations applied
- [ ] Environment variables configured
- [ ] Razorpay credentials saved and tested
- [ ] Webhook receiving events
- [ ] Cart functionality working (guest and authenticated)
- [ ] Payment flow completing successfully
- [ ] Refunds processing correctly
- [ ] Admin panel accessible and functional
- [ ] Pricing displaying correctly
- [ ] No errors in application logs
- [ ] Cart cleanup running automatically
- [ ] All security measures in place

## Next Steps

After successful deployment:
1. Monitor error logs for 24-48 hours
2. Test with real users (beta testing)
3. Gather feedback on user experience
4. Optimize performance based on metrics
5. Plan for scaling if needed
6. Document any custom configurations
7. Train admin users on new features
8. Create user documentation/help guides

---

**Deployment Date:** _____________
**Deployed By:** _____________
**Version:** _____________
**Notes:** _____________
