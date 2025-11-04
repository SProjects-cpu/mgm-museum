# Booking System Deployment Guide

## 🚀 Pre-Deployment Checklist

### 1. Database Migration
**CRITICAL**: Run this migration before deploying

```bash
# Connect to your Supabase project
# Go to SQL Editor in Supabase Dashboard
# Run the migration file:
```

Execute: `supabase/migrations/20251104_seat_locks_table.sql`

**Verify**:
```sql
-- Check table exists
SELECT * FROM seat_locks LIMIT 1;

-- Check indexes
SELECT indexname FROM pg_indexes WHERE tablename = 'seat_locks';
```

### 2. Environment Variables
Ensure these are set in Vercel:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NODE_ENV=production
```

### 3. Vercel Cron Job
The `vercel.json` file configures a cron job to run every minute:

```json
{
  "crons": [
    {
      "path": "/api/jobs/cleanup-expired-locks",
      "schedule": "* * * * *"
    }
  ]
}
```

**Verify in Vercel Dashboard**:
- Go to Project Settings → Crons
- Ensure the cron job is listed and enabled

---

## 📦 Deployment Steps

### Step 1: Commit Changes
```bash
cd mgm-museum
git add .
git commit -m "feat: Complete booking system integration with real-time data"
git push origin main
```

### Step 2: Deploy to Vercel
```bash
# If using Vercel CLI
vercel --prod

# Or push to main branch (auto-deploys if connected to GitHub)
```

### Step 3: Run Database Migration
1. Go to Supabase Dashboard
2. Navigate to SQL Editor
3. Copy content from `supabase/migrations/20251104_seat_locks_table.sql`
4. Execute the migration
5. Verify table created successfully

### Step 4: Verify Deployment
Visit your production URL and test:

1. **API Endpoints**:
   - https://your-domain.com/api/exhibitions/[id]/available-dates
   - https://your-domain.com/api/exhibitions/[id]/time-slots?date=2025-12-01
   - https://your-domain.com/api/exhibitions/[id]/ticket-types

2. **Booking Page**:
   - https://your-domain.com/book-visit?exhibitionId=[ID]&exhibitionName=Test

3. **Cron Job**:
   - Check Vercel Dashboard → Deployments → Functions
   - Look for `/api/jobs/cleanup-expired-locks` executions

---

## 🧪 Post-Deployment Testing

### Test 1: Available Dates API
```bash
curl https://your-domain.com/api/exhibitions/[EXHIBITION_ID]/available-dates
```

**Expected**: JSON response with dates array

### Test 2: Time Slots API
```bash
curl "https://your-domain.com/api/exhibitions/[EXHIBITION_ID]/time-slots?date=2025-12-01"
```

**Expected**: JSON response with timeSlots array

### Test 3: Booking Flow
1. Navigate to `/book-visit?exhibitionId=[ID]&exhibitionName=Test`
2. Select a date
3. Select a time slot
4. Select ticket quantities
5. Verify total amount calculates correctly

### Test 4: Admin Sync (30-second polling)
1. Update exhibition schedule in admin panel
2. Wait 30 seconds
3. Refresh booking page
4. Verify changes appear

### Test 5: Cron Job
```bash
# Check cron execution logs in Vercel
# Or manually trigger:
curl https://your-domain.com/api/jobs/cleanup-expired-locks
```

**Expected**: JSON response with cleanup statistics

---

## 🔍 Monitoring

### Key Metrics to Watch

1. **API Response Times**:
   - Available dates: < 2 seconds
   - Time slots: < 2 seconds
   - Seat locking: < 500ms

2. **Error Rates**:
   - Monitor 4xx/5xx responses
   - Check Vercel logs for errors

3. **Cron Job Execution**:
   - Should run every minute
   - Check for failures in Vercel dashboard

### Logging

Check logs in Vercel Dashboard:
```
Deployments → [Latest Deployment] → Functions → Logs
```

Look for:
- `[API]` prefixed logs from API routes
- `[Cleanup]` prefixed logs from cron job
- `[Booking]` prefixed logs from booking operations

---

## 🐛 Troubleshooting

### Issue: API returns 500 errors
**Solution**:
1. Check Vercel function logs
2. Verify environment variables are set
3. Check Supabase connection

### Issue: No time slots returned
**Solution**:
1. Verify `time_slots` table has data
2. Check `exhibition_id` is correct
3. Verify `get_available_slots_for_exhibition` function exists

### Issue: Cron job not running
**Solution**:
1. Check `vercel.json` is deployed
2. Verify cron is enabled in Vercel dashboard
3. Check function logs for errors

### Issue: Seat locks not expiring
**Solution**:
1. Verify cron job is running
2. Check `seat_locks` table for expired entries
3. Manually run cleanup endpoint

### Issue: Calendar not showing dates
**Solution**:
1. Check browser console for errors
2. Verify API endpoint returns data
3. Check `exhibition_schedules` table has entries

---

## 📊 Database Queries for Debugging

### Check Recent Bookings
```sql
SELECT 
  b.id,
  b.booking_reference,
  b.booking_date,
  b.status,
  b.total_amount,
  b.created_at
FROM bookings b
ORDER BY b.created_at DESC
LIMIT 10;
```

### Check Active Seat Locks
```sql
SELECT 
  sl.*,
  EXTRACT(EPOCH FROM (sl.expires_at - NOW())) as seconds_remaining
FROM seat_locks sl
WHERE sl.expires_at > NOW()
ORDER BY sl.created_at DESC;
```

### Check Slot Availability
```sql
SELECT 
  sa.date,
  ts.start_time,
  ts.end_time,
  sa.available_capacity,
  sa.booked_count,
  (sa.available_capacity - sa.booked_count) as remaining
FROM slot_availability sa
JOIN time_slots ts ON ts.id = sa.time_slot_id
WHERE sa.date >= CURRENT_DATE
ORDER BY sa.date, ts.start_time;
```

### Check Exhibition Schedules
```sql
SELECT 
  es.date,
  es.is_available,
  e.name as exhibition_name
FROM exhibition_schedules es
JOIN exhibitions e ON e.id = es.exhibition_id
WHERE es.date >= CURRENT_DATE
ORDER BY es.date;
```

---

## 🔄 Rollback Plan

If issues occur after deployment:

### Step 1: Revert Code
```bash
git revert HEAD
git push origin main
```

### Step 2: Keep Database Changes
The `seat_locks` table is backward compatible - no need to drop it

### Step 3: Monitor
- Check error rates decrease
- Verify old functionality works

---

## ✅ Success Criteria

Deployment is successful when:

- [ ] All API endpoints return 200 OK
- [ ] Booking page loads without errors
- [ ] Date selection works
- [ ] Time slot selection works
- [ ] Ticket selection works
- [ ] Total amount calculates correctly
- [ ] Admin changes appear within 30 seconds
- [ ] Cron job runs every minute
- [ ] No console errors in browser
- [ ] No 500 errors in Vercel logs

---

## 📞 Support

### If Deployment Fails

1. **Check Vercel Logs**:
   - Deployments → Latest → Functions → Logs

2. **Check Supabase Logs**:
   - Supabase Dashboard → Logs → API

3. **Test Locally First**:
   ```bash
   npm run dev
   # Test all endpoints locally
   ```

4. **Gradual Rollout**:
   - Deploy to preview environment first
   - Test thoroughly
   - Then deploy to production

---

## 🎯 Next Steps After Deployment

1. **Monitor for 24 hours**:
   - Watch error rates
   - Check cron job executions
   - Monitor API response times

2. **Gather User Feedback**:
   - Test booking flow end-to-end
   - Verify admin sync works
   - Check mobile responsiveness

3. **Optimize if Needed**:
   - Add caching headers
   - Optimize database queries
   - Add error tracking (Sentry)

4. **Complete Remaining Features**:
   - Payment integration (Razorpay)
   - Email confirmations
   - Shows booking system

---

**Deployment Checklist**:
- [ ] Database migration executed
- [ ] Environment variables verified
- [ ] Code committed and pushed
- [ ] Vercel deployment successful
- [ ] Cron job configured
- [ ] API endpoints tested
- [ ] Booking flow tested
- [ ] Admin sync verified
- [ ] Monitoring enabled
- [ ] Team notified

**Status**: Ready for Deployment ✅
**Estimated Deployment Time**: 15-20 minutes
**Risk Level**: Low (backward compatible changes)
