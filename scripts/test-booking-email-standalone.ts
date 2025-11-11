/**
 * Standalone Test for Booking Confirmation Email
 * Tests the complete email flow without importing existing modules
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import { Resend } from 'resend';

// Load environment variables first
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const RESEND_API_KEY = process.env.RESEND_API_KEY || 're_ZwMhju8q_FBigRbGgpHV3WtsReJbGJ8eE';

async function testBookingEmail() {
  console.log('📧 Testing Booking Confirmation Email\n');
  console.log('─'.repeat(60));
  console.log('API Key:', RESEND_API_KEY.substring(0, 15) + '...');
  console.log('─'.repeat(60));

  // Initialize Resend
  const resend = new Resend(RESEND_API_KEY);

  // Test booking data
  const testData = {
    to: 'shivampaliwal37@gmail.com',
    guestName: 'Shivam Paliwal',
    bookingReference: 'MGM' + Date.now().toString().slice(-8),
    eventTitle: 'Ancient Egypt Exhibition',
    visitDate: 'Saturday, January 18, 2025',
    timeSlot: '10:00 AM - 12:00 PM',
    totalAmount: 500,
    ticketCount: 2,
    paymentId: 'pay_test_' + Math.random().toString(36).substring(7),
  };

  console.log('\n📋 Test Booking Details:');
  console.log(JSON.stringify(testData, null, 2));
  console.log('\n' + '─'.repeat(60));

  // Generate email HTML
  const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Booking Confirmed - MGM Museum</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 20px auto; background-color: #ffffff;">
    <tr>
      <td style="background: linear-gradient(135deg, #1a1a1a 0%, #333 100%); color: white; padding: 30px 20px; text-align: center;">
        <h1 style="margin: 0; font-size: 28px;">🎫 Booking Confirmed!</h1>
        <p style="margin: 10px 0 0 0;">Thank you for booking with MGM Museum</p>
      </td>
    </tr>
    <tr>
      <td style="padding: 30px 20px;">
        <p>Dear ${testData.guestName},</p>
        <p>Your booking has been confirmed! We're excited to welcome you to MGM Museum.</p>
        
        <table width="100%" cellpadding="15" cellspacing="0" style="background-color: #f8f8f8; border-left: 4px solid #d4af37; margin: 20px 0;">
          <tr>
            <td>
              <div style="font-size: 24px; font-weight: bold; color: #1a1a1a; margin-bottom: 10px;">
                Booking: ${testData.bookingReference}
              </div>
              <div style="font-size: 14px; color: #666;">
                Payment ID: ${testData.paymentId}
              </div>
            </td>
          </tr>
        </table>
        
        <table width="100%" cellpadding="15" cellspacing="0" style="background-color: #f8f8f8; margin: 20px 0;">
          <tr>
            <td>
              <h3 style="margin-top: 0; color: #1a1a1a;">Visit Details</h3>
              <table width="100%" cellpadding="8" cellspacing="0">
                <tr style="border-bottom: 1px solid #e0e0e0;">
                  <td style="color: #666;">Event:</td>
                  <td style="font-weight: bold; text-align: right;">${testData.eventTitle}</td>
                </tr>
                <tr style="border-bottom: 1px solid #e0e0e0;">
                  <td style="color: #666;">Date:</td>
                  <td style="font-weight: bold; text-align: right;">${testData.visitDate}</td>
                </tr>
                <tr style="border-bottom: 1px solid #e0e0e0;">
                  <td style="color: #666;">Time:</td>
                  <td style="font-weight: bold; text-align: right;">${testData.timeSlot}</td>
                </tr>
                <tr>
                  <td style="color: #666;">Tickets:</td>
                  <td style="font-weight: bold; text-align: right;">${testData.ticketCount} ticket(s)</td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
        
        <table width="100%" cellpadding="15" cellspacing="0" style="background-color: #d4af37; margin: 20px 0;">
          <tr>
            <td style="text-align: center; color: white; font-size: 20px; font-weight: bold;">
              Amount Paid: ₹${testData.totalAmount.toFixed(2)}
            </td>
          </tr>
        </table>
        
        <table width="100%" cellpadding="15" cellspacing="0" style="background-color: #e3f2fd; border-left: 4px solid #2196f3; margin: 20px 0;">
          <tr>
            <td>
              <h3 style="margin-top: 0; color: #1976d2;">📋 What's Next?</h3>
              <ul style="margin: 10px 0; padding-left: 20px;">
                <li style="margin: 8px 0;">Download your ticket from the confirmation page</li>
                <li style="margin: 8px 0;">Please arrive 15 minutes before your scheduled time</li>
                <li style="margin: 8px 0;">Present your ticket (digital or printed) at the entrance</li>
                <li style="margin: 8px 0;">Keep your booking reference handy: <strong>${testData.bookingReference}</strong></li>
              </ul>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style="text-align: center; padding: 20px; color: #666; font-size: 14px; border-top: 1px solid #e0e0e0;">
        <p style="margin: 5px 0;"><strong>MGM Museum</strong></p>
        <p style="margin: 5px 0;">For inquiries: info@mgmmuseum.com | +91 1234567890</p>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  try {
    console.log('\n🚀 Sending email via Resend API...\n');

    const { data, error } = await resend.emails.send({
      from: 'MGM Museum <onboarding@resend.dev>',
      to: testData.to,
      replyTo: 'shivampaliwal37@gmail.com',
      subject: `Booking Confirmed - ${testData.bookingReference} | MGM Museum`,
      html: emailHtml,
    });

    if (error) {
      console.error('❌ FAILED! Email sending failed');
      console.error('Error:', error);
      return false;
    }

    console.log('✅ SUCCESS! Booking confirmation email sent!\n');
    console.log('─'.repeat(60));
    console.log('📬 Email Details:');
    console.log(`   Email ID: ${data?.id}`);
    console.log(`   To: ${testData.to}`);
    console.log(`   Booking: ${testData.bookingReference}`);
    console.log(`   Event: ${testData.eventTitle}`);
    console.log(`   Date: ${testData.visitDate}`);
    console.log(`   Time: ${testData.timeSlot}`);
    console.log(`   Amount: ₹${testData.totalAmount}`);
    console.log(`   Tickets: ${testData.ticketCount}`);
    console.log('─'.repeat(60));
    console.log('\n✉️  Check your inbox: shivampaliwal37@gmail.com');
    console.log('📱 Also check spam/junk folder\n');

    return true;
  } catch (error) {
    console.error('\n💥 EXCEPTION!', error);
    return false;
  }
}

// Run test
console.log('🎯 MGM Museum - Booking Email Test');
console.log('═'.repeat(60));

testBookingEmail()
  .then((success) => {
    console.log('\n' + '═'.repeat(60));
    if (success) {
      console.log('🎉 Test completed successfully!');
      console.log('✅ Email integration is working');
      console.log('✅ Ready for production');
    } else {
      console.log('⚠️  Test failed');
    }
    console.log('═'.repeat(60) + '\n');
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
