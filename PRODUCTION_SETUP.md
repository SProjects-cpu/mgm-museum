# 🚀 Production Payment Integration Setup

## Encryption Key

```
DATABASE_ENCRYPTION_KEY=YzQ3GlNzntjVLy16kSgvEJZS4PNHDdit19QiosSftxM=
```

## Vercel Environment Setup

### Step 1: Add to Vercel Project

1. Go to https://vercel.com/dashboard
2. Select your project: **mgm-museum**
3. Go to **Settings** → **Environment Variables**
4. Click **Add New**
5. Fill in:
   - **Name**: `DATABASE_ENCRYPTION_KEY`
   - **Value**: `YzQ3GlNzntjVLy16kSgvEJZS4PNHDdit19QiosSftxM=`
   - **Environments**: Select all (Production, Preview, Development)
6. Click **Save**

### Step 2: Redeploy

After adding the environment variable:

1. Go to **Deployments** tab
2. Find the latest deployment
3. Click the **...** menu
4. Select **Redeploy**
5. Wait for build to complete

Or use CLI:
```bash
vercel --prod --yes
```

## Production Razorpay Credentials

After deployment, add your Razorpay credentials:

1. Go to: `https://mgm-museum-xxx.vercel.app/admin/payment-settings`
2. Select environment: **production**
3. Enter your Razorpay credentials:
   - Key ID (from Razorpay dashboard)
   - Key Secret
   - Webhook Secret
4. Click "Test Connection"
5. Click "Save Credentials"

## Verification

1. Check admin panel loads without alert
2. Credentials are encrypted in database
3. Payment system ready to use

## Security Notes

- Encryption key is stored in Vercel secrets
- Razorpay credentials are encrypted in database
- Never commit `.env.local` to Git
- Rotate keys periodically
