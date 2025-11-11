/**
 * Test Complete Booking Email Flow
 * This script tests the booking confirmation email with realistic data
 */

// Load environment variables
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env.local file
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { sendBookingConfirmation } from '../lib/email/send-booking-confirmation';

async function testBookingEmailFlow() {
  console.log('📧 Testing Booking Confirmation Email Flow\n');
  console.log('─'.repeat(60));

  // Test data simulating a real booking
  const testBooking = {
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
  console.log(JSON.stringify(testBooking, null, 2));
  console.log('\n' + '─'.repeat(60));

  try {
    console.log('\n🚀 Sending booking confirmation email...\n');

    const result = await sendBookingConfirmation(testBooking);

    if (result.success) {
      console.log('✅ SUCCESS! Booking confirmation email sent successfully!\n');
      console.log('─'.repeat(60));
      console.log('📬 Email Details:');
      console.log(`   To: ${testBooking.to}`);
      console.log(`   Booking Reference: ${testBooking.bookingReference}`);
      console.log(`   Event: ${testBooking.eventTitle}`);
      console.log(`   Date: ${testBooking.visitDate}`);
      console.log(`   Time: ${testBooking.timeSlot}`);
      console.log(`   Amount: ₹${testBooking.totalAmount}`);
      console.log(`   Tickets: ${testBooking.ticketCount}`);
      console.log('─'.repeat(60));
      console.log('\n✉️  Check your inbox at: shivampaliwal37@gmail.com');
      console.log('📱 Also check spam/junk folder if not in inbox\n');
      
      return true;
    } else {
      console.error('❌ FAILED! Email sending failed');
      console.error('Error:', result.error);
      console.log('\n🔍 Troubleshooting:');
      console.log('1. Check if RESEND_API_KEY is set in environment');
      console.log('2. Verify API key is valid: re_ZwMhju8q_FBigRbGgpHV3WtsReJbGJ8eE');
      console.log('3. Check Resend dashboard for errors: https://resend.com/emails');
      
      return false;
    }
  } catch (error) {
    console.error('\n💥 EXCEPTION! Unexpected error occurred');
    console.error('Error:', error);
    if (error instanceof Error) {
      console.error('Message:', error.message);
      console.error('Stack:', error.stack);
    }
    
    return false;
  }
}

// Run the test
console.log('🎯 MGM Museum - Booking Email Flow Test');
console.log('═'.repeat(60));

testBookingEmailFlow()
  .then((success) => {
    console.log('\n' + '═'.repeat(60));
    if (success) {
      console.log('🎉 Test completed successfully!');
      console.log('✅ Email integration is working correctly');
      console.log('✅ Ready for production use');
    } else {
      console.log('⚠️  Test failed - please review errors above');
    }
    console.log('═'.repeat(60) + '\n');
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('\n💥 Fatal error:', error);
    process.exit(1);
  });
