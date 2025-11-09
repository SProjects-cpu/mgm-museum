import { Resend } from 'resend';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const resend = new Resend(process.env.RESEND_API_KEY);

async function testResendEmail() {
  console.log('Testing Resend API...\n');
  console.log('API Key:', process.env.RESEND_API_KEY ? `${process.env.RESEND_API_KEY.substring(0, 10)}...` : 'NOT SET');
  
  try {
    const { data, error } = await resend.emails.send({
      from: 'MGM Museum <onboarding@resend.dev>', // Using Resend's test domain
      to: ['shivampaliwal37@gmail.com'], // Your email
      subject: 'Test Email from MGM Museum',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h1 style="color: #333;">Test Email</h1>
          <p>This is a test email from MGM Museum booking system.</p>
          <p>If you're receiving this, the Resend API is working correctly!</p>
          <hr style="margin: 20px 0;">
          <p style="color: #666; font-size: 12px;">
            Sent at: ${new Date().toISOString()}<br>
            API Key: ${process.env.RESEND_API_KEY?.substring(0, 15)}...
          </p>
        </div>
      `,
    });

    if (error) {
      console.error('❌ Error sending email:', error);
      return;
    }

    console.log('✅ Email sent successfully!');
    console.log('Email ID:', data?.id);
    console.log('\nCheck your inbox at: shivampaliwal37@gmail.com');
  } catch (error: any) {
    console.error('❌ Exception occurred:', error.message);
    console.error('Full error:', error);
  }
}

testResendEmail();
