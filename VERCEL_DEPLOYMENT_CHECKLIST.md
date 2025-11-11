# 🚀 Vercel Deployment Checklist - Resend Integration

## Pre-Deployment Verification

### ✅ Local Testing Complete
- [x] API key tested and validated
- [x] Email sending functional
- [x] Booking confirmation template working
- [x] All test scripts passing

---

## Vercel Environment Configuration

### Step 1: Verify Environment Variable

1. **Go to Vercel Dashboard:**
   - Navigate to: https://vercel.com/dashboard
   - Select your MGM Museum project

2. **Check Environment Variables:**
   - Go to: **Settings** → **Environment Variables**
   - Look for: `RESEND_API_KEY`

3. **Verify Configuration:**
   ```
   Variable Name: RESEND_API_KEY
   Value: re_ZwMhju8q_FBigRbGgpHV3WtsReJbGJ8eE
   Environments: ✅ Production ✅ Preview ✅ Development
   ```

### Step 2: Add Variable (If Not Present)

**Option A: Via Vercel Dashboard**
1. Click "Add New" button
2. Enter:
   - **Name:** `RESEND_API_KEY`
   - **Value:** `re_ZwMhju8q_FBigRbGgpHV3WtsReJbGJ8eE`
3. Select all environments:
   - ✅ Production
   - ✅ Preview
   - ✅ Development
4. Click "Save"

**Option B: Via Vercel CLI**
```bash
# Install Vercel CLI (if not installed)
npm i -g vercel

# Login to Vercel
vercel login

# Add environment variable
vercel env add RESEND_API_KEY
# When prompted, enter: re_ZwMhju8q_FBigRbGgpHV3WtsReJbGJ8eE
# Select: Production, Preview, Development
```

### Step 3: Redeploy (If Variable Was Just Added)

**Option A: Trigger Redeploy via Dashboard**
1. Go to: **Deployments** tab
2. Click on latest deployment
3. Click "Redeploy" button
4. Select "Use existing Build Cache" (faster)

**Option B: Push to Git**
```bash
# Commit and push (triggers automatic deployment)
git add .
git commit -m "Verify Resend email integration"
git push origin main
```

---

## Post-Deployment Testing

### Test 1: Check Deployment Logs
1. Go to Vercel Dashboard → Deployments
2. Click on latest deployment
3. Check "Build Logs" for any errors
4. Verify deployment status: ✅ Ready

### Test 2: Test Email in Production
1. Visit your production site
2. Make a test booking:
   - Use a real email address
   - Complete payment (use test mode if available)
   - Verify booking is created
3. Check email inbox:
   - Look for booking confirmation email
   - Check spam/junk folder if not in inbox
   - Verify all details are correct

### Test 3: Monitor Resend Dashboard
1. Go to: https://resend.com/emails
2. Check recent emails:
   - Verify email was sent
   - Check delivery status
   - Review any errors

### Test 4: Check Application Logs
1. In Vercel Dashboard → Deployments → Functions
2. Look for logs from `/api/payment/verify`
3. Search for:
   - ✅ "Confirmation email sent successfully"
   - ❌ "Failed to send confirmation email" (if any errors)

---

## Verification Checklist

### Environment Configuration
- [ ] `RESEND_API_KEY` exists in Vercel
- [ ] Value is correct: `re_ZwMhju8q_FBigRbGgpHV3WtsReJbGJ8eE`
- [ ] Enabled for Production environment
- [ ] Enabled for Preview environment
- [ ] Enabled for Development environment

### Deployment Status
- [ ] Latest deployment successful
- [ ] No build errors
- [ ] No runtime errors in logs
- [ ] Application is accessible

### Email Functionality
- [ ] Test booking completed successfully
- [ ] Confirmation email received
- [ ] Email content displays correctly
- [ ] All links in email work
- [ ] Booking reference is correct
- [ ] Payment details are accurate

### Monitoring
- [ ] Resend dashboard shows sent email
- [ ] Email delivery status is "Delivered"
- [ ] No bounce or spam reports
- [ ] Application logs show success

---

## Troubleshooting

### Issue: Environment Variable Not Found
**Symptoms:**
- Error: "Missing API key"
- Emails not sending

**Solution:**
1. Verify variable name is exactly: `RESEND_API_KEY`
2. Check variable is enabled for Production
3. Redeploy after adding variable
4. Clear build cache if needed

### Issue: Email Not Received
**Symptoms:**
- Booking created but no email
- No errors in logs

**Solution:**
1. Check spam/junk folder
2. Verify email address is correct
3. Check Resend dashboard for delivery status
4. Review application logs for email sending attempts
5. Test with different email address

### Issue: Email Sending Fails
**Symptoms:**
- Error in application logs
- Resend dashboard shows error

**Solution:**
1. Verify API key is correct
2. Check Resend account status
3. Review error message in logs
4. Check Resend API status: https://resend.com/status
5. Verify email format is valid

---

## Quick Commands

### Check Vercel Environment Variables
```bash
vercel env ls
```

### Pull Environment Variables Locally
```bash
vercel env pull .env.local
```

### View Deployment Logs
```bash
vercel logs [deployment-url]
```

### Redeploy Latest
```bash
vercel --prod
```

---

## Success Criteria

✅ **Integration is successful when:**
1. Environment variable is configured in Vercel
2. Deployment completes without errors
3. Test booking creates confirmation email
4. Email is received in inbox
5. All email content displays correctly
6. Resend dashboard shows successful delivery
7. No errors in application logs

---

## Support Resources

- **Vercel Documentation:** https://vercel.com/docs
- **Vercel Environment Variables:** https://vercel.com/docs/projects/environment-variables
- **Resend Documentation:** https://resend.com/docs
- **Resend Dashboard:** https://resend.com/emails
- **Resend Status:** https://resend.com/status

---

## Contact Information

**For Issues:**
- Check application logs in Vercel
- Review Resend dashboard for email status
- Test locally first to isolate issue

**API Key:** `re_ZwMhju8q_FBigRbGgpHV3WtsReJbGJ8eE`  
**Test Email:** `shivampaliwal37@gmail.com`

---

**Last Updated:** January 11, 2025  
**Status:** Ready for Deployment ✅
