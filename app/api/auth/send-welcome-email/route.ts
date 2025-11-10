import { NextRequest, NextResponse } from 'next/server';
import { resend, EMAIL_CONFIG } from '@/lib/email/resend-client';

export async function POST(request: NextRequest) {
  try {
    const { email, name } = await request.json();

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      );
    }

    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to MGM Museum</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 20px auto; background-color: #ffffff;">
    <tr>
      <td style="background: linear-gradient(135deg, #1a1a1a 0%, #333 100%); color: white; padding: 30px 20px; text-align: center;">
        <h1 style="margin: 0; font-size: 28px;">🎉 Welcome to MGM Museum!</h1>
      </td>
    </tr>
    <tr>
      <td style="padding: 30px 20px;">
        <p>Dear ${name || 'Guest'},</p>
        <p>Thank you for creating an account with MGM Museum! We're excited to have you join our community.</p>
        
        <table width="100%" cellpadding="15" cellspacing="0" style="background-color: #e3f2fd; border-left: 4px solid #2196f3; margin: 20px 0;">
          <tr>
            <td>
              <h3 style="margin-top: 0; color: #1976d2;">What's Next?</h3>
              <ul style="margin: 10px 0; padding-left: 20px;">
                <li style="margin: 8px 0;">Browse our exhibitions and shows</li>
                <li style="margin: 8px 0;">Book your visit online</li>
                <li style="margin: 8px 0;">Get instant confirmation and tickets</li>
                <li style="margin: 8px 0;">Enjoy a seamless museum experience</li>
              </ul>
            </td>
          </tr>
        </table>
        
        <table width="100%" cellpadding="20" cellspacing="0">
          <tr>
            <td style="text-align: center;">
              <a href="https://mgm-museum.vercel.app" 
                 style="background-color: #d4af37; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                Start Exploring
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style="text-align: center; padding: 20px; color: #666; font-size: 14px; border-top: 1px solid #e0e0e0;">
        <p style="margin: 5px 0;"><strong>MGM Museum</strong></p>
        <p style="margin: 5px 0;">
          For inquiries: <a href="mailto:info@mgmmuseum.com" style="color: #d4af37; text-decoration: none;">info@mgmmuseum.com</a>
        </p>
        <p style="margin: 5px 0;">
          <a href="https://mgm-museum.vercel.app" style="color: #d4af37; text-decoration: none;">www.mgmmuseum.com</a>
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    const { data, error } = await resend.emails.send({
      from: EMAIL_CONFIG.from,
      to: email,
      replyTo: EMAIL_CONFIG.replyTo,
      subject: 'Welcome to MGM Museum! 🎉',
      html: emailHtml,
    });

    if (error) {
      console.error('Failed to send welcome email:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    console.log('✅ Welcome email sent:', { email, emailId: data?.id });

    return NextResponse.json({ success: true, emailId: data?.id });
  } catch (error) {
    console.error('Exception sending welcome email:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
