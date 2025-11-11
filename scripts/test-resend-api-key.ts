/**
 * Test Resend API Key
 * This script tests the Resend API key to ensure it's valid and working
 */

import { Resend } from 'resend';

const RESEND_API_KEY = 're_ZwMhju8q_FBigRbGgpHV3WtsReJbGJ8eE';

async function testResendApiKey() {
  console.log('🔍 Testing Resend API Key...\n');
  console.log('API Key:', RESEND_API_KEY.substring(0, 15) + '...');
  console.log('─'.repeat(60));

  try {
    // Initialize Resend client
    const resend = new Resend(RESEND_API_KEY);

    // Test 1: Send a test email
    console.log('\n📧 Test 1: Sending test email...');
    const { data, error } = await resend.emails.send({
      from: 'MGM Museum <onboarding@resend.dev>',
      to: 'shivampaliwal37@gmail.com', // Your email
      subject: 'Resend API Key Test - MGM Museum',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>API Key Test</title>
        </head>
        <body style="font-family: Arial, sans-serif; padding: 20px; background-color: #f4f4f4;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 8px;">
            <h1 style="color: #1a1a1a; margin-top: 0;">✅ Resend API Key Test Successful!</h1>
            <p style="color: #666; font-size: 16px; line-height: 1.6;">
              This is a test email to verify that your Resend API key is working correctly.
            </p>
            <div style="background-color: #e3f2fd; padding: 15px; border-left: 4px solid #2196f3; margin: 20px 0;">
              <p style="margin: 0; color: #1976d2;"><strong>API Key:</strong> ${RESEND_API_KEY.substring(0, 15)}...</p>
              <p style="margin: 10px 0 0 0; color: #1976d2;"><strong>Test Date:</strong> ${new Date().toLocaleString()}</p>
            </div>
            <p style="color: #666; font-size: 14px; margin-top: 30px;">
              If you received this email, your Resend integration is ready to use! 🎉
            </p>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error('❌ Email send failed:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      return false;
    }

    console.log('✅ Email sent successfully!');
    console.log('Email ID:', data?.id);
    console.log('─'.repeat(60));

    // Test 2: Verify API key format
    console.log('\n🔑 Test 2: Verifying API key format...');
    if (RESEND_API_KEY.startsWith('re_')) {
      console.log('✅ API key format is valid (starts with "re_")');
    } else {
      console.log('⚠️  Warning: API key format may be invalid');
    }

    console.log('\n' + '─'.repeat(60));
    console.log('🎉 All tests passed! Resend API key is working correctly.');
    console.log('─'.repeat(60));
    console.log('\n📋 Next Steps:');
    console.log('1. Check your email inbox (shivampaliwal37@gmail.com)');
    console.log('2. Verify you received the test email');
    console.log('3. If successful, the API key is ready for production use');
    console.log('\n💡 Note: Make sure to add this key to Vercel environment variables:');
    console.log('   RESEND_API_KEY=' + RESEND_API_KEY);

    return true;
  } catch (error) {
    console.error('\n❌ Test failed with exception:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    return false;
  }
}

// Run the test
testResendApiKey()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });
