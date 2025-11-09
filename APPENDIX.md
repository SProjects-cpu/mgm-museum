# MGM Museum Booking System - Technical Appendices

**Project:** MGM APJ Abdul Kalam Astrospace Science Centre Online Booking System  
**Document Version:** 1.0  
**Last Updated:** November 9, 2025

---

## Table of Contents

- [Appendix A: Database Schema](#appendix-a-database-schema)
- [Appendix B: API Documentation](#appendix-b-api-documentation)
- [Appendix C: Environment Variables](#appendix-c-environment-variables)
- [Appendix D: Deployment Guide](#appendix-d-deployment-guide)
- [Appendix E: User Manual](#appendix-e-user-manual)
- [Appendix F: Troubleshooting Guide](#appendix-f-troubleshooting-guide)
- [Appendix G: Glossary](#appendix-g-glossary)

---

## Appendix A: Database Schema

### A.1 Core Database Tables

The MGM Museum system uses PostgreSQL 15 via Supabase with 18 core tables organized into functional groups:

#### User Management
- **users** - Extended profiles linked to Supabase auth (email, role, preferences)

#### Exhibition & Show Management
- **exhibitions** - 8 themed areas (Solar Observatory, Science Park, Planetarium, etc.)
- **shows** - Planetarium, 3D Theatre, and Holography shows
- **exhibition_content_sections** - Dynamic content for exhibition pages
- **pricing** - Ticket pricing by type (Adult, Child, Student, Senior, Group)
- **time_slots** - Available booking slots with capacity management

#### Booking & Payment
- **bookings** - Customer reservations with payment tracking
- **booking_tickets** - Individual tickets per booking with pricing tiers
- **tickets** - PDF ticket metadata with QR codes
- **seat_bookings** - Planetarium seat assignments
- **cart_items** - Temporary cart storage (15-minute expiration)
- **payment_orders** - Razorpay payment tracking with cart snapshots
- **seat_locks** - Temporary seat reservations during checkout

#### Customer Engagement
- **feedback** - Customer ratings (1-5 stars) and comments
- **events** - Special workshops and educational programs
- **event_registrations** - Event participant tracking

#### Content & Analytics
- **content_pages** - Dynamic CMS pages
- **newsletter_subscribers** - Email subscription management
- **contact_submissions** - Contact form inquiries
- **analytics_events** - User activity tracking

### A.2 Entity Relationship Diagram

```
users ──┬── bookings ──┬── booking_tickets ─── pricing
        │              ├── tickets (PDF metadata)
        │              └── seat_bookings
        │
        ├── cart_items ─── time_slots ──┬── exhibitions ─── exhibition_content_sections
        │                                └── shows
        │
        ├── feedback ─── bookings
        ├── event_registrations ─── events
        └── payment_orders
```

### A.3 Key Database Features

**Enums:**
- `user_role`: customer, admin, super_admin
- `exhibition_category`: solar_observatory, science_park, planetarium, astro_gallery, 3d_theatre, math_lab, physics_lab, holography
- `exhibition_status`: active, inactive, coming_soon, maintenance
- `booking_status`: pending, confirmed, cancelled, completed
- `payment_status`: pending, paid, refunded, failed

**Constraints:**
- Unique booking references (format: MGM-YYYYMMDD-XXXXXX)
- One feedback per booking
- Seat uniqueness per time slot
- Valid date ranges for pricing
- Capacity limits on time slots

**Security:**
- Row Level Security (RLS) enabled on all tables
- Users can only view/modify their own data
- Admins have full access
- Public read access for active exhibitions/shows
- Encrypted payment credentials in database

### A.4 Critical Migrations

1. **00001_initial_schema.sql** - Base tables, RLS policies, triggers
2. **00006_cart_system.sql** - Shopping cart with expiration
3. **00007_payment_orders.sql** - Razorpay integration
4. **20260108_exhibition_content_sections.sql** - Dynamic content management
5. **20260109_feedback_system.sql** - Customer feedback collection
6. **20260109_add_booking_time_column.sql** - Booking time tracking

---

## Appendix B: API Documentation

### B.1 Public API Endpoints

#### Exhibitions & Shows
```
GET  /api/exhibitions              - List all active exhibitions
GET  /api/exhibitions/[id]         - Get exhibition details
GET  /api/shows/[slug]             - Get show details
GET  /api/pricing/current          - Get current pricing
```

#### Booking Flow
```
GET  /api/availability/check       - Check time slot availability
POST /api/cart/add                 - Add items to cart
GET  /api/cart/load                - Load cart contents
POST /api/cart/remove              - Remove cart items
POST /api/cart/checkout            - Initiate checkout
```

#### Payment Processing
```
POST /api/payment/create-order     - Create Razorpay order
POST /api/payment/verify           - Verify payment signature
POST /api/webhooks/razorpay        - Razorpay webhook handler
```

#### Ticket Management
```
GET  /api/tickets/generate/[bookingId]  - Generate PDF ticket
GET  /api/user/bookings                 - List user bookings
```

#### Feedback
```
POST /api/feedback/create          - Submit feedback
GET  /api/feedback/list            - List feedback (admin)
```

### B.2 Admin API Endpoints

#### Dashboard & Analytics
```
GET  /api/admin/analytics          - Dashboard metrics
GET  /api/analytics/ticket-metrics - Ticket generation analytics
```

#### Content Management
```
GET  /api/admin/exhibitions        - Manage exhibitions
POST /api/admin/exhibitions        - Create exhibition
PUT  /api/admin/exhibitions/[id]   - Update exhibition
GET  /api/admin/shows              - Manage shows
```

#### Booking Management
```
GET  /api/admin/bookings           - List all bookings
GET  /api/admin/feedbacks          - View customer feedback
POST /api/admin/create-time-slots  - Create time slots
```

#### Payment Settings
```
GET  /api/admin/payment-settings   - Get payment credentials
POST /api/admin/payment-settings   - Update credentials (encrypted)
```

### B.3 GraphQL Endpoint

```
POST /api/graphql                  - GraphQL queries and mutations
```

**Sample Query:**
```graphql
query GetExhibitions {
  exhibitions(where: { status: { _eq: "active" } }) {
    id
    name
    slug
    category
    capacity
    pricing {
      ticket_type
      price
    }
  }
}
```

### B.4 Webhook Endpoints

```
POST /api/webhooks/razorpay        - Payment status updates
POST /api/webhooks/payment-gateway - Generic payment webhook
```

---

## Appendix C: Environment Variables

### C.1 Required Variables

#### Supabase (Database & Auth)
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
SUPABASE_STORAGE_BUCKET=mgm-museum-storage
```

#### Application URLs
```env
NEXT_PUBLIC_APP_URL=https://mgmapjscicentre.org
NEXT_PUBLIC_SITE_URL=https://mgmapjscicentre.org
NEXT_PUBLIC_GRAPHQL_ENDPOINT=https://mgmapjscicentre.org/api/graphql
```

#### Email Service (Resend)
```env
RESEND_API_KEY=re_xxxxxxxxxxxxx
FROM_EMAIL=MGM Science Centre <noreply@mgmapjscicentre.org>
```

#### Payment Gateway (Razorpay)
```env
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_xxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxx
RAZORPAY_WEBHOOK_SECRET=xxxxxxxxxxxxx
```

#### Database Encryption
```env
DATABASE_ENCRYPTION_KEY=your-32-byte-base64-key
```

### C.2 Optional Variables

#### SMTP Backup (Nodemailer)
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

#### SMS Notifications (Twilio)
```env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxx
TWILIO_PHONE_NUMBER=+1234567890
```

#### Monitoring
```env
SENTRY_DSN=https://xxxxx@sentry.io/xxxxx
LOG_LEVEL=info
```

### C.3 Environment Setup

**Development:**
```bash
cp .env.example .env.local
# Edit .env.local with your credentials
npm run dev
```

**Production (Vercel):**
```bash
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add RESEND_API_KEY
vercel env add RAZORPAY_KEY_SECRET
vercel env add DATABASE_ENCRYPTION_KEY
```

---

## Appendix D: Deployment Guide

### D.1 Prerequisites

**Required Accounts:**
- Vercel account (hosting)
- Supabase project (database)
- Razorpay account (payments)
- Resend account (email)
- GitHub repository (version control)

**Local Requirements:**
- Node.js 20.0.0+
- npm 9.0.0+
- Git 2.40.0+

### D.2 Initial Setup

**1. Clone Repository**
```bash
git clone https://github.com/your-org/mgm-museum.git
cd mgm-museum
npm install
```

**2. Configure Environment**
```bash
cp .env.example .env.local
# Edit .env.local with your credentials
```

**3. Database Setup**
```bash
# Run migrations in Supabase SQL Editor
# Execute files in order from supabase/migrations/
```

**4. Test Locally**
```bash
npm run dev
# Visit http://localhost:3000
```

### D.3 Vercel Deployment

**1. Connect Repository**
```bash
vercel login
vercel link
```

**2. Configure Environment Variables**
```bash
# Add all required variables from Section C.1
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add SUPABASE_SERVICE_ROLE_KEY production
# ... repeat for all variables
```

**3. Deploy**
```bash
vercel --prod
```

**4. Verify Deployment**
```bash
npm run verify:deployment
```

### D.4 Post-Deployment Checklist

- [ ] Database migrations applied
- [ ] Environment variables configured
- [ ] Payment gateway tested (test mode)
- [ ] Email delivery verified
- [ ] PDF ticket generation working
- [ ] Admin panel accessible
- [ ] SSL certificate active
- [ ] Custom domain configured
- [ ] Analytics tracking enabled
- [ ] Backup schedule confirmed

### D.5 Continuous Deployment

**GitHub Actions Workflow:**
```yaml
# .github/workflows/deploy.yml
name: Deploy to Vercel
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run build
      - uses: amondnet/vercel-action@v20
```

---

## Appendix E: User Manual

### E.1 For Visitors

#### Booking Tickets

**Step 1: Browse Exhibitions**
1. Visit https://mgmapjscicentre.org
2. Explore 8 themed exhibition areas
3. Click "Book Now" on desired exhibition

**Step 2: Select Date & Time**
1. Choose visit date from calendar
2. Select available time slot
3. View real-time seat availability

**Step 3: Choose Tickets**
1. Select ticket types:
   - Adult (₹100)
   - Child (₹50)
   - Student (₹75)
   - Senior (₹75)
2. Specify quantities
3. Review total amount

**Step 4: Enter Details**
1. Provide name, email, phone
2. Add special requirements (optional)
3. Review booking summary

**Step 5: Complete Payment**
1. Choose payment method (UPI/Card/Net Banking)
2. Complete secure payment via Razorpay
3. Receive instant confirmation

**Step 6: Download Ticket**
1. Check email for confirmation
2. Download PDF ticket with QR code
3. Or access from "My Bookings" dashboard

#### Managing Bookings

**View Bookings:**
1. Login to your account
2. Navigate to "My Bookings"
3. View all past and upcoming visits

**Download Tickets:**
1. Click "Download Ticket" button
2. Save PDF to device
3. Present QR code at entry

**Cancel Booking:**
1. Contact admin via contact form
2. Provide booking reference
3. Refund processed within 5-7 days

### E.2 For Administrators

#### Dashboard Overview

**Access Admin Panel:**
1. Login with admin credentials
2. Navigate to /admin/dashboard
3. View key metrics:
   - Today's revenue
   - Total bookings
   - Visitor count
   - Feedback ratings

#### Managing Exhibitions

**Create Exhibition:**
1. Go to Admin > Exhibitions
2. Click "Add New Exhibition"
3. Fill in details:
   - Name, slug, category
   - Description, duration
   - Capacity, images
4. Set pricing for ticket types
5. Create time slots
6. Publish exhibition

**Update Exhibition:**
1. Find exhibition in list
2. Click "Edit" button
3. Modify details
4. Save changes

#### Managing Bookings

**View All Bookings:**
1. Go to Admin > Bookings
2. Use filters:
   - Date range
   - Status (pending/confirmed/cancelled)
   - Exhibition/Show
3. Export to CSV for reports

**Update Booking Status:**
1. Click on booking
2. Change status
3. Add notes if needed
4. Save changes

#### Managing Feedback

**View Feedback:**
1. Go to Admin > Feedbacks
2. View ratings and comments
3. Filter by rating (1-5 stars)
4. Export feedback data

#### Creating Time Slots

**Bulk Create Slots:**
1. Go to Admin > Time Slots
2. Select exhibition/show
3. Choose date range
4. Set time intervals
5. Define capacity
6. Generate slots

---

## Appendix F: Troubleshooting Guide

### F.1 Common User Issues

#### Payment Failed
**Symptoms:** Payment not processing, error message displayed

**Solutions:**
1. Check internet connection stability
2. Verify payment details (card number, CVV, expiry)
3. Ensure sufficient balance
4. Try different payment method (UPI instead of card)
5. Clear browser cache and retry
6. Contact bank if issue persists

**Prevention:** Use stable internet, verify details before submission

---

#### Ticket Not Received
**Symptoms:** No confirmation email after successful payment

**Solutions:**
1. Check spam/junk folder
2. Verify email address in booking
3. Login to dashboard and download from "My Bookings"
4. Wait 5 minutes (email delivery delay)
5. Contact support with booking reference

**Prevention:** Whitelist noreply@mgmapjscicentre.org

---

#### Cannot Login
**Symptoms:** Login fails with correct credentials

**Solutions:**
1. Use "Forgot Password" to reset
2. Check for typos in email/password
3. Clear browser cookies
4. Try incognito/private mode
5. Try different browser
6. Check if account exists (try signup)

**Prevention:** Use password manager, verify email during signup

---

#### Booking Not Showing
**Symptoms:** Completed booking not visible in dashboard

**Solutions:**
1. Refresh page (Ctrl+F5)
2. Check if logged in with correct email
3. Verify booking reference in email
4. Wait 2 minutes for database sync
5. Contact support with payment proof

**Prevention:** Save booking reference immediately

---

### F.2 Common Admin Issues

#### Time Slots Not Appearing
**Symptoms:** Created time slots not visible to users

**Solutions:**
1. Verify slot is marked as "active"
2. Check date is in future
3. Ensure exhibition/show is "active"
4. Verify capacity > 0
5. Check RLS policies in database

**Prevention:** Test with admin preview before publishing

---

#### Payment Webhook Failures
**Symptoms:** Bookings stuck in "pending" after payment

**Solutions:**
1. Check Razorpay webhook configuration
2. Verify webhook secret matches
3. Check server logs for errors
4. Manually verify payment in Razorpay dashboard
5. Update booking status manually if needed

**Prevention:** Monitor webhook logs, set up alerts

---

#### PDF Generation Errors
**Symptoms:** Ticket download fails or shows blank PDF

**Solutions:**
1. Check booking has all required data
2. Verify logo file exists in public folder
3. Check QR code generation
4. Review server logs for errors
5. Test with different booking

**Prevention:** Validate booking data before PDF generation

---

#### Email Delivery Issues
**Symptoms:** Confirmation emails not sending

**Solutions:**
1. Check Resend API key is valid
2. Verify FROM_EMAIL domain is verified
3. Check email template rendering
4. Review Resend dashboard for errors
5. Test with SMTP backup if configured

**Prevention:** Monitor email delivery rates, set up alerts

---

### F.3 Performance Issues

#### Slow Page Load
**Symptoms:** Pages taking >3 seconds to load

**Solutions:**
1. Check Vercel deployment status
2. Verify CDN is working
3. Review database query performance
4. Check for large images (optimize)
5. Enable caching headers

**Prevention:** Regular performance audits, image optimization

---

#### Database Connection Errors
**Symptoms:** "Connection timeout" or "Too many connections"

**Solutions:**
1. Check Supabase project status
2. Verify connection pooling settings
3. Review database query efficiency
4. Check for connection leaks in code
5. Upgrade Supabase plan if needed

**Prevention:** Use connection pooling, close connections properly

---

### F.4 Error Codes Reference

| Code | Meaning | Action |
|------|---------|--------|
| PAYMENT_001 | Payment verification failed | Retry payment or contact support |
| BOOKING_002 | Time slot full | Choose different time |
| CART_003 | Cart expired | Re-add items to cart |
| AUTH_004 | Unauthorized access | Login again |
| PDF_005 | Ticket generation failed | Contact support with booking ref |
| EMAIL_006 | Email delivery failed | Check spam or download from dashboard |

---

## Appendix G: Glossary

### Technical Terms

**API (Application Programming Interface)**  
Interface for communication between frontend and backend systems

**Cart Expiration**  
15-minute timeout for items in shopping cart to prevent seat hoarding

**CDN (Content Delivery Network)**  
Global network of servers for fast content delivery (Vercel Edge Network)

**GraphQL**  
Query language for flexible API data fetching

**JWT (JSON Web Token)**  
Secure authentication token format

**PDF Ticket**  
Downloadable ticket document with QR code for entry verification

**PWA (Progressive Web App)**  
Installable web application with offline capabilities

**QR Code**  
Machine-readable barcode containing booking reference

**RLS (Row Level Security)**  
Database security feature restricting data access by user

**SSR (Server-Side Rendering)**  
Rendering pages on server for better performance and SEO

**Webhook**  
Automated HTTP callback for real-time event notifications

---

### Business Terms

**Booking Reference**  
Unique identifier for each booking (format: MGM-YYYYMMDD-XXXXXX)

**Exhibition**  
Themed area or attraction (8 total: Solar Observatory, Science Park, etc.)

**Guest Booking**  
Booking made without user account (email-based)

**Payment Gateway**  
Razorpay service for secure online payment processing

**Seat Lock**  
Temporary reservation during checkout (15 minutes)

**Show**  
Scheduled performance (Planetarium, 3D Theatre, Holography)

**Time Slot**  
Specific date and time for exhibition/show visit

**Ticket Type**  
Pricing category: Adult, Child, Student, Senior, Group

---

### System Components

**Admin Panel**  
Dashboard for managing exhibitions, bookings, and content (/admin)

**Booking Wizard**  
Multi-step form for ticket purchase

**Cart System**  
Temporary storage for selected tickets before checkout

**Email Service**  
Resend API for sending confirmation emails

**Payment Integration**  
Razorpay gateway for processing transactions

**Supabase**  
Backend platform providing database, auth, and storage

**Vercel**  
Hosting platform with global CDN and automatic scaling

---

**End of Appendices**

*For additional support, contact: support@mgmapjscicentre.org*
