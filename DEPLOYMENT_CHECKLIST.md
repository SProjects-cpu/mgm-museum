# 🚀 Production Deployment Checklist

## Pre-Deployment Checklist

### 1. Code Quality & Testing
- [ ] All TypeScript compilation errors resolved
- [ ] All linting errors fixed
- [ ] Admin panel tested locally
- [ ] PDF generation tested locally
- [ ] Payment flow tested (with test keys)
- [ ] Email notifications tested
- [ ] GraphQL API tested

### 2. Environment Configuration
- [ ] `.env.production` reviewed and updated
- [ ] All required environment variables documented
- [ ] Production API keys obtained:
  - [ ] Supabase production credentials
  - [ ] Resend API key (production)
  - [ ] Razorpay live keys (if ready)
  - [ ] Twilio credentials (if using SMS)
- [ ] Database migrations ready
- [ ] Storage bucket configured in Supabase

### 3. Security Review
- [ ] No secrets in source code
- [ ] All API routes protected
- [ ] Admin routes require authentication
- [ ] CORS configured properly
- [ ] Security headers enabled (check `next.config.ts`)
- [ ] Rate limiting considered for APIs
- [ ] SQL injection prevention verified

### 4. Database Preparation
- [ ] Production database created in Supabase
- [ ] Migrations tested in staging
- [ ] Seed data removed (no dummy data)
- [ ] RLS (Row Level Security) policies enabled
- [ ] Database backups configured

### 5. Assets & Content
- [ ] All images optimized
- [ ] Favicon and metadata configured
- [ ] 404 page implemented
- [ ] Error pages styled
- [ ] Loading states implemented

---

## Vercel Deployment Checklist

### 1. Initial Setup
- [ ] GitHub repository connected to Vercel
- [ ] Project framework detected as Next.js
- [ ] Build settings verified:
  - Build Command: `npm run build`
  - Output Directory: `.next`
  - Install Command: `npm install`

### 2. Environment Variables
Configure in Vercel Dashboard → Settings → Environment Variables:

**Required for All Environments:**
- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `SUPABASE_STORAGE_BUCKET`
- [ ] `RESEND_API_KEY`
- [ ] `FROM_EMAIL`
- [ ] `NEXT_PUBLIC_APP_URL`
- [ ] `NEXT_PUBLIC_SITE_URL`
- [ ] `NEXT_PUBLIC_GRAPHQL_ENDPOINT`

**Payment Integration:**
- [ ] `NEXT_PUBLIC_RAZORPAY_KEY_ID`
- [ ] `RAZORPAY_KEY_SECRET`
- [ ] `RAZORPAY_WEBHOOK_SECRET`

**Optional Services:**
- [ ] `TWILIO_ACCOUNT_SID`
- [ ] `TWILIO_AUTH_TOKEN`
- [ ] `TWILIO_PHONE_NUMBER`
- [ ] `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`

### 3. Domain Configuration
- [ ] Custom domain added (if applicable)
- [ ] DNS records configured
- [ ] SSL certificate provisioned
- [ ] Domain verified and active

### 4. Build & Deploy
- [ ] First deployment successful
- [ ] Build logs reviewed (no errors)
- [ ] Deployment URL obtained
- [ ] Update environment variables with production URL

---

## Post-Deployment Checklist

### 1. Functional Testing
- [ ] Homepage loads correctly
- [ ] Navigation works across all pages
- [ ] Admin panel accessible at `/admin`
- [ ] Login/authentication working
- [ ] GraphQL endpoint responding (`/api/graphql`)
- [ ] Health check endpoint working (`/api/health`)

### 2. Admin Panel Verification
- [ ] Admin can login
- [ ] Dashboard displays analytics
- [ ] Visitor management working
- [ ] Booking management functional
- [ ] PDF generation working
- [ ] Email sending operational
- [ ] Settings can be updated
- [ ] Content management functional

### 3. Customer Experience
- [ ] Ticket booking flow complete
- [ ] Payment gateway integration working
- [ ] Email confirmations received
- [ ] QR codes generating correctly
- [ ] Mobile responsive design verified
- [ ] Page load times acceptable (< 3s)

### 4. Integration Testing
- [ ] Supabase connection verified
- [ ] Storage uploads working
- [ ] Email service operational (Resend)
- [ ] Payment webhooks configured
- [ ] GraphQL queries executing

### 5. Monitoring & Analytics
- [ ] Error tracking configured (if using Sentry)
- [ ] Performance monitoring active
- [ ] Analytics tracking implemented
- [ ] Log aggregation setup

### 6. Security Verification
- [ ] HTTPS enforced
- [ ] Security headers present (check browser dev tools)
- [ ] Admin routes require auth
- [ ] API endpoints protected
- [ ] No sensitive data in client-side code

### 7. Documentation
- [ ] README.md updated with production info
- [ ] API documentation current
- [ ] Admin user guide available
- [ ] Deployment guide updated
- [ ] Troubleshooting guide reviewed

---

## CI/CD Pipeline Checklist

### GitHub Actions Configuration
- [ ] Workflow file created (`.github/workflows/deploy.yml`)
- [ ] Automatic deployment on push to `main`
- [ ] Build verification step included
- [ ] Environment variables configured in GitHub Secrets
- [ ] Deployment notifications setup

### Vercel Integration
- [ ] GitHub integration enabled
- [ ] Auto-deploy on push enabled for production
- [ ] Preview deployments enabled for PRs
- [ ] Production branch set to `main`

---

## Rollback Plan

### In Case of Issues
- [ ] Previous deployment ID noted
- [ ] Rollback procedure documented
- [ ] Database backup available
- [ ] Vercel instant rollback tested

### Emergency Contacts
- [ ] DevOps team contact info
- [ ] Vercel support plan (if applicable)
- [ ] Supabase support contact
- [ ] Payment gateway support

---

## Maintenance Checklist

### Regular Tasks
- [ ] Database backups scheduled
- [ ] Dependency updates planned
- [ ] Security patches monitored
- [ ] Performance metrics reviewed
- [ ] Error logs monitored

---

## Sign-off

**Deployed by:** _________________  
**Date:** _________________  
**Deployment URL:** _________________  
**Version:** _________________  

**Approved by:** _________________  
**Date:** _________________
