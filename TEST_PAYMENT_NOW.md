# 🧪 Test Your Razorpay Integration NOW

## Everything is Ready! Here's How to Test:

---

## ✅ What's Already Done

- ✅ All code deployed to Vercel
- ✅ Razorpay credentials configured
- ✅ Webhook configured
- ✅ Automated tests passed
- ✅ Test order created successfully

---

## 🚀 Test in 3 Simple Steps

### Step 1: Find Your Vercel URL (30 seconds)

Go to: https://vercel.com/dashboard

Or run:
```bash
vercel ls
```

Your site URL will be something like:
```
https://mgm-museum-[your-project].vercel.app
```

### Step 2: Make a Test Payment (2 minutes)

1. **Visit your site:**
   ```
   https://your-vercel-url.vercel.app
   ```

2. **Add an item to cart** (any exhibition or show)

3. **Go to checkout**

4. **Use this test card:**
   ```
   Card Number: 4111 1111 1111 1111
   CVV: 123
   Expiry: 12/25
   Name: Test User
   ```

5. **Complete the payment**

### Step 3: Verify It Worked (1 minute)

**Check 1: Booking Created**
- You should see a booking confirmation
- Booking reference starts with "BK"

**Check 2: Ticket Available**
- Click "Download Ticket" button
- PDF should download with QR code

**Check 3: Webhook Delivered**
- Go to: https://dashboard.razorpay.com/
- Navigate to: Settings > Webhooks
- Check logs: Should show "200 OK"

---

## 🎯 Expected Results

✅ Razorpay payment modal opens  
✅ Payment succeeds  
✅ Booking created in database  
✅ Ticket PDF generated  
✅ Can download ticket  
✅ Webhook received (200 OK)  

---

## 🐛 If Something Fails

### Payment Modal Doesn't Open
- Check browser console for errors
- Verify Razorpay script is loaded
- Check environment variables in Vercel

### Payment Succeeds But No Booking
- Check Vercel logs: `vercel logs --follow`
- Verify database connection
- Check payment verification endpoint

### Webhook Not Received
- Verify webhook URL in Razorpay dashboard
- Check webhook secret matches
- Review Razorpay webhook logs

### Ticket Download Fails
- Check if booking exists in database
- Verify exceljs is installed
- Check Vercel function logs

---

## 📊 Where to Check Logs

**Vercel Logs:**
```bash
vercel logs --follow
```

**Razorpay Dashboard:**
```
https://dashboard.razorpay.com/
Settings > Webhooks > View Logs
```

**Database:**
Check these tables in Supabase:
- `payment_orders` - Should have new entry
- `bookings` - Should have confirmed booking
- `tickets` - Should have generated ticket

---

## 🎉 Success Criteria

Your integration is working if:

1. ✅ Payment completes successfully
2. ✅ Booking appears in database
3. ✅ Ticket can be downloaded
4. ✅ Webhook shows 200 OK
5. ✅ No errors in logs

---

## 🔄 Test Different Scenarios

### Test 1: Successful Payment
Card: 4111 1111 1111 1111
Expected: Success

### Test 2: Failed Payment
Card: 4000 0000 0000 0002
Expected: Error message, cart preserved

### Test 3: Multiple Items
Add 2-3 items to cart
Expected: All bookings created

### Test 4: Ticket Download
Complete payment, download ticket
Expected: PDF with QR code

---

## 📞 Need Help?

If tests fail, check:
1. `RAZORPAY_INTEGRATION_COMPLETE.md` - Troubleshooting section
2. `RAZORPAY_INTEGRATION_TEST_RESULTS.md` - Test checklist
3. Vercel deployment logs
4. Razorpay webhook logs

---

## ✅ After Testing

Once tests pass:

1. **Mark as complete** ✅
2. **Monitor for 24 hours** 📊
3. **Switch to live keys** (when ready) 🔑
4. **Start accepting real payments** 💰

---

**Your Razorpay integration is deployed and ready!**  
**Just test with the card above to verify everything works!** 🚀

---

**Quick Test Card:** 4111 1111 1111 1111  
**CVV:** Any 3 digits  
**Expiry:** Any future date  

**GO TEST NOW!** 🎯
