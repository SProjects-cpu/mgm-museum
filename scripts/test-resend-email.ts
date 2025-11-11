/**
 * Test Resend Email API
 * 
 * This script tests if the Resend API key is working correctly
 */

import { Resend } from 'resend';

const RESEND_API_KEY = 're_ZwMhju8q_FBigRbGgpHV3WtsReJbGJ8eE';

async function testResendAPI() {
  console.log('🧪 Testing Resend API');
  console.log('====================\n');

  try {
    const resend = new Resend(RESEND_API_KEY);

    console.log('📧 Sending test email...');
    
    const { data, error } = await resend.emails.send({
      from: 'MGM Museum <onboarding@resend.dev>',
      to: 'shivampaliwal37@gmail.com', // Your email
      subject: 'Test Email - MGM Museum Booking System',
      html: `
        <h1>Test Email</h1>
        <p>This is a test email to verify Resend API integration.</p>
        <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
        <p>If you receive this email, the Resend API is working correctly!</p>
      `,
    });

    if (error) {
      console.error('❌ FAILED to send email');
      console.error('Error details:', {
        message: error.message,
        name: error.name,
        error: error,
      });
      return { success: false, error };
    }

    console.log('✅ SUCCESS! Email sent');
    console.log('Email ID:', data?.id);
    console.log('\nCheck your inbox at: shivampaliwal37@gmail.com');
    console.log('Also check spam folder if not in inbox');
    
    return { success: true, data };
  } catch (error: any) {
    console.error('💥 EXCEPTION occurred');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    return { success: false, error };
  }
}

// Run test
testResendAPI()
  .then((result) => {
    console.log('\n📊 Test Result:', result.success ? '✅ PASSED' : '❌ FAILED');
    process.exit(result.success ? 0 : 1);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
