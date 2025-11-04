# Razorpay Integration - Quick Start Guide

## 🚀 5-Minute Setup

### Step 1: Verify Vercel Environment Variables (1 min)

```bash
vercel env ls
```

Ensure these exist:
- `NEXT_PUBLIC_RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`
- `RAZORPAY_WEBHOOK_SECRET`

### Step 2: Configure Webhook (2 min)

1. Go to https://dashboard.razorpay.com/
2. Settings > Webhooks > Add New Webhook
3. URL: `https://your-domain.vercel.app/api/webhooks/razorpay`
4. Events: payment.captured, payment.failed, refund.created
5. Save

### Step 3: Deploy (1 min)

```bash
git add .
git commit -m "feat: Razorpay integration complete"
git push origin main
```

### Step 4: Test (1 min)

1. Visit your site
2. Add item to cart
3. Checkout with test card: `4111 1111 1111 1111`
4. Verify booking created
5. Download ticket

## ✅ Done!

Your Razorpay integration is live and ready to accept payments.

## 📚 Full Documentation

- `RAZORPAY_INTEGRATION_COMPLETE.md` - Complete guide
- `RAZORPAY_WEBHOOK_SETUP.md` - Webhook details
- `RAZORPAY_DEPLOYMENT_GUIDE.md` - Deployment steps
- `RAZORPAY_SETUP_COMPLETE_SUMMARY.md` - What's included

## 🆘 Issues?

Check `RAZORPAY_INTEGRATION_COMPLETE.md` troubleshooting section.

---

**Status:** Ready for Production 🎉
