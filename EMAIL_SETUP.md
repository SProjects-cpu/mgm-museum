# Email Domain Verification Guide

## Current Status: Test Mode

Your MGM Museum application is currently running in **test mode** for email sending. This means:

- ✅ Emails can be sent to: `shivampaliwal37@gmail.com` (verified email)
- ❌ Emails to other addresses will fail with error: "You can only send testing emails to your own email address"
- 📧 Using sender: `MGM Museum <onboarding@resend.dev>` (Resend test domain)

## Why Verify a Custom Domain?

To send booking confirmation emails to all your customers, you need to:
1. Own a domain (e.g., `mgmmuseum.com`)
2. Verify it with Resend
3. Update your email configuration

## Steps to Enable Production Email Sending

### Step 1: Purchase/Own a Domain

If you don't already have one, purchase a domain from:
- GoDaddy (https://godaddy.com)
- Namecheap (https://namecheap.com)
- Google Domains (https://domains.google)
- Any other domain registrar

**Recommended domain**: `mgmmuseum.com` or similar

### Step 2: Verify Domain in Resend

1. **Login to Resend Dashboard**
   - Go to: https://resend.com/login
   - Login with your account

2. **Add Your Domain**
   - Navigate to: https://resend.com/domains
   - Click "Add Domain"
   - Enter your domain name (e.g., `mgmmuseum.com`)
   - Click "Add"

3. **Get DNS Records**
   - Resend will provide DNS records to add:
     - **SPF Record** (TXT): Authorizes Resend to send emails
     - **DKIM Record** (TXT): Authenticates your emails
     - **DMARC Record** (TXT): Email policy record
   
   Example records:
   ```
   Type: TXT
   Name: @
   Value: v=spf1 include:_spf.resend.com ~all
   
   Type: TXT
   Name: resend._domainkey
   Value: [provided by Resend]
   
   Type: TXT
   Name: _dmarc
   Value: v=DMARC1; p=none
   ```

4. **Add DNS Records to Your Domain**
   - Login to your domain registrar (GoDaddy, Namecheap, etc.)
   - Find DNS settings / DNS management
   - Add the TXT records provided by Resend
   - Save changes

5. **Verify in Resend**
   - Return to Resend dashboard
   - Click "Verify" next to your domain
   - Wait for verification (can take 24-48 hours)
   - Status will change to "Verified" ✅

### Step 3: Update Environment Variables

Once your domain is verified, update your environment variables:

#### Local Development (.env.local)
```bash
# Email Configuration
EMAIL_FROM=MGM Museum <noreply@mgmmuseum.com>
EMAIL_REPLY_TO=info@mgmmuseum.com

# Existing
RESEND_API_KEY=re_xxxxx
```

#### Vercel Production
1. Go to: https://vercel.com/dashboard
2. Select your project: `mgm-museum`
3. Go to: Settings → Environment Variables
4. Add/Update:
   - `EMAIL_FROM` = `MGM Museum <noreply@mgmmuseum.com>`
   - `EMAIL_REPLY_TO` = `info@mgmmuseum.com`
5. Redeploy your application

### Step 4: Test Email Sending

After updating environment variables:

1. **Test Locally**
   ```bash
   cd mgm-museum
   npm run test:email
   ```

2. **Test in Production**
   - Make a test booking with a different email address
   - Check if confirmation email is received
   - Verify email appears from your custom domain

## Email Addresses to Configure

### Sender Address (EMAIL_FROM)
- **Format**: `MGM Museum <noreply@yourdomain.com>`
- **Purpose**: Appears as the "From" address in customer emails
- **Recommendation**: Use `noreply@` or `bookings@` subdomain
- **Example**: `MGM Museum <noreply@mgmmuseum.com>`

### Reply-To Address (EMAIL_REPLY_TO)
- **Format**: `info@yourdomain.com`
- **Purpose**: Where customer replies go
- **Recommendation**: Use a monitored email address
- **Example**: `info@mgmmuseum.com` or `support@mgmmuseum.com`

## Troubleshooting

### Domain Verification Fails
- **Wait 24-48 hours**: DNS changes take time to propagate
- **Check DNS records**: Use https://mxtoolbox.com/SuperTool.aspx
- **Verify exact values**: Copy-paste from Resend, don't type manually
- **Contact support**: Resend support can help verify records

### Emails Still Not Sending
1. **Check environment variables**: Ensure they're set in Vercel
2. **Redeploy**: After changing env vars, redeploy the app
3. **Check Resend logs**: https://resend.com/emails
4. **Verify domain status**: Must show "Verified" in Resend dashboard

### Emails Going to Spam
- **Add DMARC record**: Improves deliverability
- **Warm up domain**: Start with small volume, increase gradually
- **Monitor reputation**: Use https://postmaster.google.com

## Cost Considerations

### Resend Pricing (as of 2024)
- **Free Tier**: 3,000 emails/month
- **Pro Plan**: $20/month for 50,000 emails
- **Custom domain**: Free (included in all plans)

### Domain Cost
- **Annual cost**: $10-15/year for .com domain
- **One-time setup**: DNS configuration is free

## Alternative: Continue with Test Mode

If you don't want to verify a domain right now:
- ✅ Development and testing will work fine
- ✅ You can send emails to `shivampaliwal37@gmail.com`
- ❌ Customer bookings won't receive emails
- ⚠️ Not suitable for production use

## Support

- **Resend Documentation**: https://resend.com/docs
- **Resend Support**: support@resend.com
- **DNS Help**: Contact your domain registrar support

## Summary Checklist

- [ ] Purchase/own a domain
- [ ] Add domain to Resend dashboard
- [ ] Add DNS records to domain registrar
- [ ] Wait for verification (24-48 hours)
- [ ] Update EMAIL_FROM environment variable
- [ ] Update EMAIL_REPLY_TO environment variable
- [ ] Redeploy application
- [ ] Test email sending
- [ ] Monitor Resend dashboard for delivery

---

**Need Help?** Contact your development team or Resend support for assistance with domain verification.
