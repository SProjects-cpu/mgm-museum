# Final Deployment Steps

## Step 1: Apply Database Migration

### Via Supabase Dashboard (Recommended):
1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Open file: `supabase/migrations/20250102_exhibition_booking_system.sql`
4. Copy entire content
5. Paste in SQL Editor
6. Click "Run"
7. Verify: Check that new tables exist in Table Editor

### Via Supabase CLI (Alternative):
```bash
supabase db push
```

## Step 2: Verify Environment Variables in Vercel

Go to Vercel Dashboard → Your Project → Settings → Environment Variables

Ensure these are set:
```
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key
NEXT_PUBLIC_RAZORPAY_KEY_ID=your_razorpay_key
RAZORPAY_KEY_SECRET=your_razorpay_secret
NEXT_PUBLIC_SITE_URL=https://mgm-museum.vercel.app
```

## Step 3: Deploy to Production

```powershell
# Stage all changes
git add .

# Commit
git commit -m "feat: Complete museum ticket booking system with full admin control"

# Push to deploy
git push origin main
```

Vercel will automatically deploy. Monitor at: https://vercel.com/dashboard

## Step 4: Post-Deployment Configuration

### A. Create Sample Exhibition
1. Go to: https://mgm-museum.vercel.app/admin/exhibitions
2. Click "Add Exhibition"
3. Fill in:
   - Name: "Full Dome Digital Planetarium"
   - Category: Planetarium
   - Short Description: "Experience 360° immersive shows"
   - Description: (Add detailed description)
   - Capacity: 100
   - Duration: 45 minutes
   - Status: Active
   - Featured: Yes
4. Save

### B. Configure Exhibition Details
1. Click "Manage" on the exhibition card
2. **Content Tab**:
   - Add "Features" section with key features
   - Add "What to Expect" section
   - Add "FAQ" section
3. **Time Slots Tab**:
   - Add slot: 10:00 AM - 10:45 AM, Capacity: 100
   - Add slot: 1:00 PM - 1:45 PM, Capacity: 100
   - Add slot: 4:00 PM - 4:45 PM, Capacity: 100
   - Add slot: 7:00 PM - 7:45 PM, Capacity: 100
4. **Pricing Tab**:
   - Adult: ₹100
   - Child: ₹60
   - Student: ₹75
   - Senior: ₹80

### C. Test the System
1. Visit: https://mgm-museum.vercel.app/exhibitions
2. Click on "Full Dome Digital Planetarium"
3. Verify all content displays correctly
4. Test booking flow (use Razorpay test mode)

## Step 5: Enable Razorpay Test Mode

1. Go to Razorpay Dashboard
2. Switch to "Test Mode"
3. Use test cards for payments:
   - Card: 4111 1111 1111 1111
   - CVV: Any 3 digits
   - Expiry: Any future date

## What's Now Working

✅ **Admin Panel**:
- Full control over exhibitions and shows
- Content management (features, highlights, FAQ)
- Time slot configuration with capacity
- Pricing management
- Real-time updates

✅ **Public Pages**:
- Dynamic exhibition pages (no more 404s)
- All content from admin displays automatically
- Booking widget with date/time selection

✅ **Booking System**:
- Create bookings with seat availability check
- Razorpay payment integration
- Order creation and payment verification
- Booking confirmation

✅ **Database**:
- Comprehensive schema for bookings
- Real-time availability tracking
- Content sections storage
- Payment records

## Troubleshooting

### Issue: Migration fails
**Solution**: Run migrations one table at a time, check for existing tables

### Issue: 404 on exhibition pages
**Solution**: Ensure NEXT_PUBLIC_SITE_URL is set correctly in Vercel

### Issue: Payment fails
**Solution**: Verify Razorpay keys are correct and in test mode

### Issue: Admin panel not accessible
**Solution**: Check user role in Supabase users table (should be 'admin')

## Next Phase Features (Optional)

- Ticket PDF generation with QR codes
- Email/SMS notifications
- Booking history for customers
- Analytics dashboard
- Group booking discounts
- Membership system
- Mobile app

## Support

For issues, check:
1. Vercel deployment logs
2. Supabase logs
3. Browser console errors
4. Network tab for API failures
