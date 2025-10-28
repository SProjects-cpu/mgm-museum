# Environment Setup Guide

## Quick Setup

### Step 1: Create `.env.local` File

Create a file named `.env.local` in the `mgm-museum` directory with the following content:

```env
# ============================================
# EMAIL CONFIGURATION (NodeMailer + Gmail)
# ============================================
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=paliwalshivam539@gmail.com
EMAIL_PASSWORD=shivam53955623ll
EMAIL_FROM=MGM Science Centre <paliwalshivam539@gmail.com>

# ============================================
# SITE CONFIGURATION
# ============================================
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SITE_NAME=MGM APJ Abdul Kalam Astrospace Science Centre

# ============================================
# GRAPHQL API
# ============================================
NEXT_PUBLIC_GRAPHQL_ENDPOINT=/api/graphql

# ============================================
# SUPABASE (Configure when college approves)
# ============================================
# NEXT_PUBLIC_SUPABASE_URL=
# NEXT_PUBLIC_SUPABASE_ANON_KEY=
# SUPABASE_SERVICE_ROLE_KEY=

# ============================================
# GOOGLE MAPS (Optional)
# ============================================
# NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=
```

### Step 2: Install Dependencies

```bash
cd mgm-museum
npm install
```

### Step 3: Test Email Configuration

Start the development server:

```bash
npm run dev
```

Test the email system:

```bash
# Using curl
curl -X POST http://localhost:3000/api/email/test \
  -H "Content-Type: application/json" \
  -d '{"to":"your-email@example.com"}'

# Or using fetch in browser console
fetch('/api/email/test', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ to: 'your-email@example.com' })
}).then(r => r.json()).then(console.log)
```

## What's Configured

### ✅ Email System (Complete)
- NodeMailer with Gmail SMTP
- 7 email templates ready to use
- 8 API endpoints for sending emails
- Test endpoint for verification

### ⏳ Waiting for College Approval
- Supabase database connection
- Authentication system
- File storage (Supabase Storage)
- Real-time features

### 📝 Next Steps (After Answers)
- PDF generation for e-tickets
- File upload handling

## Testing the Email System

### 1. Test Email Endpoint

```javascript
// Open browser console on http://localhost:3000
fetch('/api/email/test', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    to: 'paliwalshivam539@gmail.com' // Your email
  })
}).then(r => r.json()).then(console.log);
```

Expected response:
```json
{
  "success": true,
  "message": "Test email sent successfully to paliwalshivam539@gmail.com"
}
```

### 2. Test Booking Confirmation

```javascript
fetch('/api/email/booking-confirmation', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    bookingReference: 'MGM-20241014-TEST01',
    customerName: 'Test User',
    customerEmail: 'paliwalshivam539@gmail.com',
    exhibitionName: 'Full Dome Planetarium',
    bookingDate: 'October 20, 2024',
    timeSlot: '10:00 AM - 10:45 AM',
    totalAmount: 350.00,
    tickets: [
      { type: 'Adult', quantity: 2, price: 200.00 },
      { type: 'Child', quantity: 2, price: 150.00 }
    ]
  })
}).then(r => r.json()).then(console.log);
```

### 3. Test Event Registration

```javascript
fetch('/api/email/event-registration', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    eventTitle: '100 Hours of Astronomy',
    participantName: 'Test User',
    participantEmail: 'paliwalshivam539@gmail.com',
    eventDate: 'November 15, 2024',
    eventTime: '6:00 PM - 11:00 PM',
    location: 'MGM Science Centre Campus'
  })
}).then(r => r.json()).then(console.log);
```

## Troubleshooting

### Email Not Sending?

1. **Check Gmail credentials:**
   - Verify EMAIL_USER and EMAIL_PASSWORD in `.env.local`
   - Make sure you're using the correct Gmail account

2. **Check server logs:**
   ```bash
   # Look for email-related errors in terminal
   ```

3. **Test connection:**
   ```bash
   curl http://localhost:3000/api/email/test
   ```

### Email Goes to Spam?

- This is normal for development
- Gmail may flag emails from new senders
- Check spam folder
- Mark as "Not Spam" to train Gmail

## Security Notes

⚠️ **Important:** Never commit `.env.local` to Git!

The `.gitignore` file already excludes it, but always double-check before pushing code.

## What's Next?

Waiting for your answers to:

1. **PDF Generation:**
   - a) @react-pdf/renderer (React components, lighter)
   - b) Puppeteer (HTML to PDF, more flexible)

2. **File Storage (temporary until Supabase):**
   - a) Local filesystem (`public/uploads/` directory)
   - b) Keep in memory only (no persistence)

Once you answer, I'll implement:
- PDF generation for e-tickets with QR codes
- File upload system
- GraphQL API routes
- Integration with booking flow

---

**Current Status:** Email System ✅ Complete and Ready to Test!






