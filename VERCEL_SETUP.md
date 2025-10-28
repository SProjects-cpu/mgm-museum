# 🚀 Vercel Deployment Guide for MGM Museum

This guide walks you through deploying the MGM Museum application to Vercel.

## Prerequisites

- [ ] GitHub account with repository access
- [ ] Vercel account (sign up at https://vercel.com)
- [ ] Supabase project created
- [ ] Resend API key obtained
- [ ] Razorpay account (test/live keys)
- [ ] All required credentials ready

---

## Part 1: Prepare Your Repository

### 1.1 Install Dependencies

```bash
npm install
```

### 1.2 Add Razorpay SDK

Already added in `package.json`. Verify it's present:

```bash
npm list razorpay
```

### 1.3 Build Test Locally

```bash
npm run build
```

Fix any build errors before proceeding.

---

## Part 2: Connect to Vercel

### 2.1 Install Vercel CLI (Optional)

```bash
npm install -g vercel
```

### 2.2 Login to Vercel

**Option A: Via CLI**
```bash
vercel login
```

**Option B: Via Dashboard**
- Go to https://vercel.com/dashboard
- Click "New Project"

### 2.3 Import Repository

1. Select "Import Git Repository"
2. Choose your GitHub account
3. Select the `mgm-museum` repository
4. Click "Import"

---

## Part 3: Configure Project Settings

### 3.1 Framework Preset
- **Framework:** Next.js (auto-detected)
- **Build Command:** `npm run build`
- **Output Directory:** `.next`
- **Install Command:** `npm install`

### 3.2 Root Directory
- Leave as root (`./`)

### 3.3 Node.js Version
- Recommended: `20.x` (latest LTS)

---

## Part 4: Environment Variables

### 4.1 Add Environment Variables

Go to **Project Settings → Environment Variables**

#### Core Supabase Configuration

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_STORAGE_BUCKET=mgm-museum-storage
```

#### Application URLs (Update after first deployment)

```env
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
NEXT_PUBLIC_SITE_URL=https://your-app.vercel.app
NEXT_PUBLIC_GRAPHQL_ENDPOINT=https://your-app.vercel.app/api/graphql
```

#### Email Service (Resend)

```env
RESEND_API_KEY=re_ZwMhju8q_FBigRbGgpHV3WtsReJbGJ8eE
FROM_EMAIL=MGM Science Centre <noreply@mgmapjscicentre.org>
```

#### Payment Gateway (Razorpay)

For **Testing:**
```env
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_your_key_id
RAZORPAY_KEY_SECRET=your_test_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
```

For **Production:**
```env
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_your_key_id
RAZORPAY_KEY_SECRET=your_live_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
```

#### Optional Services

**SMTP (Backup Email):**
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_SECURE=false
```

**Twilio (SMS):**
```env
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=your_phone_number
```

#### Application Settings

```env
NODE_ENV=production
```

### 4.2 Environment Scope

For each variable, select:
- ✅ **Production**
- ✅ **Preview** (for testing branches)
- ⬜ **Development** (keep unchecked)

---

## Part 5: Initial Deployment

### 5.1 Deploy via Dashboard

1. Click **"Deploy"** button
2. Wait for build to complete (2-5 minutes)
3. Monitor build logs for errors
4. Note the deployment URL

### 5.2 Deploy via CLI

```bash
# Link project
vercel link

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

### 5.3 Verify Build Success

Check the build logs for:
- ✅ No TypeScript errors
- ✅ No dependency issues
- ✅ Successful Next.js build
- ✅ All routes generated

---

## Part 6: Update Configuration

### 6.1 Update Environment URLs

After getting your deployment URL (e.g., `https://mgm-museum.vercel.app`):

1. Go to **Settings → Environment Variables**
2. Update these variables:
   - `NEXT_PUBLIC_APP_URL` → `https://mgm-museum.vercel.app`
   - `NEXT_PUBLIC_SITE_URL` → `https://mgm-museum.vercel.app`
   - `NEXT_PUBLIC_GRAPHQL_ENDPOINT` → `https://mgm-museum.vercel.app/api/graphql`
3. Click **"Save"**
4. Redeploy (Deployments → ⋮ → Redeploy)

### 6.2 Configure Custom Domain (Optional)

1. Go to **Settings → Domains**
2. Click **"Add Domain"**
3. Enter your domain (e.g., `mgmmuseum.org`)
4. Follow DNS configuration instructions
5. Wait for DNS propagation (can take 24-48 hours)

---

## Part 7: Database Setup

### 7.1 Run Migrations in Supabase

1. Go to Supabase Dashboard → SQL Editor
2. Copy content from `supabase/migrations/00001_initial_schema.sql`
3. Execute the migration
4. Verify tables created successfully

### 7.2 Configure Storage Bucket

1. Go to Storage in Supabase
2. Create bucket: `mgm-museum-storage`
3. Set public access policies as needed
4. Update bucket name in environment variables (if different)

### 7.3 Test Database Connection

```bash
npm run verify:deployment
```

---

## Part 8: Configure Webhooks

### 8.1 Razorpay Webhooks

1. Go to Razorpay Dashboard → Webhooks
2. Create new webhook
3. URL: `https://your-app.vercel.app/api/webhooks/payment`
4. Select events:
   - `payment.authorized`
   - `payment.captured`
   - `payment.failed`
   - `refund.created`
5. Copy webhook secret
6. Add to Vercel env vars as `RAZORPAY_WEBHOOK_SECRET`
7. Redeploy

---

## Part 9: Setup CI/CD

### 9.1 GitHub Integration

Vercel automatically:
- ✅ Deploys production on push to `main`
- ✅ Creates preview deployments for PRs
- ✅ Shows deployment status in GitHub

### 9.2 Create GitHub Actions Workflow

Already created at `.github/workflows/deploy.yml`

Add these secrets to GitHub (Settings → Secrets):
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`
- `VERCEL_TOKEN`

Get these from Vercel:
- **Org ID:** Settings → General → Team ID
- **Project ID:** Settings → General → Project ID
- **Token:** Account Settings → Tokens → Create Token

---

## Part 10: Post-Deployment Testing

### 10.1 Automated Verification

```bash
# Set production URL
export NEXT_PUBLIC_APP_URL=https://your-app.vercel.app

# Run verification
npm run verify:deployment
```

### 10.2 Manual Testing Checklist

- [ ] Homepage loads
- [ ] Admin panel accessible (`/admin`)
- [ ] GraphQL API working (`/api/graphql`)
- [ ] Health check responding (`/api/health`)
- [ ] Test booking flow
- [ ] Verify email notifications
- [ ] Test PDF generation
- [ ] Check payment integration
- [ ] Mobile responsiveness
- [ ] Cross-browser testing

### 10.3 Performance Testing

Use these tools:
- **Lighthouse:** Chrome DevTools → Lighthouse
- **PageSpeed Insights:** https://pagespeed.web.dev/
- **GTmetrix:** https://gtmetrix.com/

Target scores:
- Performance: > 90
- Accessibility: > 95
- Best Practices: > 90
- SEO: > 90

---

## Part 11: Monitoring & Maintenance

### 11.1 Enable Vercel Analytics

1. Go to **Analytics** tab
2. Enable **Web Analytics**
3. Enable **Speed Insights** (recommended)

### 11.2 Set Up Alerts

**Build Failures:**
- Settings → Notifications → Build errors

**Deployment Status:**
- Integrations → Slack/Discord notifications

### 11.3 Review Logs

- **Function Logs:** Functions → Select function → Logs
- **Build Logs:** Deployments → Select deployment → Building
- **Runtime Logs:** Runtime Logs (real-time)

---

## Part 12: Troubleshooting

### Build Failures

**Error: Module not found**
```bash
# Clear cache and rebuild
vercel --force
```

**Error: TypeScript errors**
```bash
# Check locally first
npm run build
```

### Runtime Errors

**Check Function Logs:**
1. Go to Deployments
2. Click on active deployment
3. Go to Functions tab
4. View logs for specific API routes

**Common Issues:**
- Missing environment variables
- Database connection timeout
- API rate limits
- CORS issues

### Database Connection Issues

**Verify Supabase URL:**
```bash
curl https://your-project.supabase.co/rest/v1/
```

**Check Service Role Key:**
- Ensure it's the **service_role** key, not anon key
- No extra spaces/newlines

### Email Not Sending

**Verify Resend API Key:**
- Check it starts with `re_`
- Verify domain is verified in Resend
- Check Resend dashboard for delivery logs

---

## Part 13: Rollback Procedure

### 13.1 Instant Rollback

1. Go to **Deployments**
2. Find last working deployment
3. Click **⋮** (three dots)
4. Click **"Promote to Production"**

### 13.2 Rollback via CLI

```bash
# List deployments
vercel ls

# Promote specific deployment
vercel promote <deployment-url>
```

---

## Part 14: Production Checklist

Before marking as production-ready:

- [ ] All environment variables configured
- [ ] Custom domain configured (if applicable)
- [ ] SSL certificate active
- [ ] Database migrations completed
- [ ] Webhooks configured
- [ ] Email service tested
- [ ] Payment gateway tested (use test mode first)
- [ ] Analytics enabled
- [ ] Error monitoring setup
- [ ] Backup strategy in place
- [ ] Documentation updated
- [ ] Team members have access
- [ ] Support contacts documented

---

## Support Resources

- **Vercel Docs:** https://vercel.com/docs
- **Next.js Docs:** https://nextjs.org/docs
- **Supabase Docs:** https://supabase.com/docs
- **Razorpay Docs:** https://razorpay.com/docs
- **Resend Docs:** https://resend.com/docs

## Emergency Contacts

- **Vercel Support:** https://vercel.com/support
- **Project Lead:** [Add contact]
- **DevOps Team:** [Add contact]

---

**Last Updated:** 2025-10-28  
**Version:** 1.0.0
