import { NextRequest, NextResponse } from 'next/server';
import { sendEmail, isValidEmail } from '@/lib/email/send';
import { verifyEmailConnection, siteConfig } from '@/lib/email/config';

/**
 * Test email endpoint - sends a test email to verify configuration
 * Usage: POST /api/email/test with { "to": "recipient@example.com" }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { to } = body;

    // Validate email
    if (!to || !isValidEmail(to)) {
      return NextResponse.json(
        { error: 'Valid email address is required' },
        { status: 400 }
      );
    }

    // Verify email connection first
    const isConnected = await verifyEmailConnection();
    if (!isConnected) {
      return NextResponse.json(
        { error: 'Email server connection failed. Check your configuration.' },
        { status: 500 }
      );
    }

    // Send test email
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #3498db 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 5px; }
          .content { padding: 20px; background: #f9f9f9; border-radius: 5px; margin-top: 20px; }
          .success { color: #2ecc71; font-size: 48px; text-align: center; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🚀 ${siteConfig.name}</h1>
            <p>Email System Test</p>
          </div>
          <div class="content">
            <div class="success">✅</div>
            <h2 style="text-align: center;">Email Configuration Successful!</h2>
            <p>Congratulations! Your email system is working correctly.</p>
            <p><strong>Configuration Details:</strong></p>
            <ul>
              <li>Email Service: NodeMailer + Gmail</li>
              <li>From: ${siteConfig.supportEmail}</li>
              <li>Test Date: ${new Date().toLocaleString()}</li>
            </ul>
            <p>You can now send booking confirmations, event registrations, and other notifications!</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const success = await sendEmail({
      to,
      subject: '✅ Test Email - MGM Science Centre Email System',
      html,
      text: 'This is a test email from MGM Science Centre. If you received this, your email configuration is working correctly!',
    });

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to send test email' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Test email sent successfully to ${to}`,
      config: {
        from: siteConfig.supportEmail,
        host: 'smtp.gmail.com',
        port: 587,
      },
    });
  } catch (error) {
    console.error('Error sending test email:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint to check email configuration status
 */
export async function GET() {
  try {
    const isConnected = await verifyEmailConnection();

    return NextResponse.json({
      status: isConnected ? 'connected' : 'disconnected',
      config: {
        host: 'smtp.gmail.com',
        port: 587,
        from: siteConfig.supportEmail,
      },
      message: isConnected
        ? 'Email server is ready'
        : 'Email server connection failed',
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        message: 'Failed to verify email connection',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}






