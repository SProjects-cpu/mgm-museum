/**
 * Send Booking Confirmation Email
 */

import { resend, EMAIL_CONFIG } from './resend-client';

interface SendBookingConfirmationParams {
  to: string;
  guestName: string;
  bookingReference: string;
  eventTitle: string;
  visitDate: string;
  timeSlot: string;
  totalAmount: number;
  ticketCount: number;
  paymentId: string;
}

/**
 * Generate HTML email template
 */
function generateEmailHtml(params: SendBookingConfirmationParams): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Booking Confirmed - MGM Museum</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 20px auto; background-color: #ffffff;">
    <!-- Header -->
    <tr>
      <td style="background: linear-gradient(135deg, #1a1a1a 0%, #333 100%); color: white; padding: 30px 20px; text-align: center;">
        <h1 style="margin: 0; font-size: 28px;">🎫 Booking Confirmed!</h1>
        <p style="margin: 10px 0 0 0;">Thank you for booking with MGM Museum</p>
      </td>
    </tr>
    
    <!-- Content -->
    <tr>
      <td style="padding: 30px 20px;">
        <p>Dear ${params.guestName},</p>
        <p>Your booking has been confirmed! We're excited to welcome you to MGM Museum.</p>
        
        <!-- Booking Reference Box -->
        <table width="100%" cellpadding="15" cellspacing="0" style="background-color: #f8f8f8; border-left: 4px solid #d4af37; margin: 20px 0;">
          <tr>
            <td>
              <div style="font-size: 24px; font-weight: bold; color: #1a1a1a; margin-bottom: 10px;">
                Booking: ${params.bookingReference}
              </div>
              <div style="font-size: 14px; color: #666;">
                Payment ID: ${params.paymentId}
              </div>
            </td>
          </tr>
        </table>
        
        <!-- Visit Details Box -->
        <table width="100%" cellpadding="15" cellspacing="0" style="background-color: #f8f8f8; margin: 20px 0;">
          <tr>
            <td>
              <h3 style="margin-top: 0; color: #1a1a1a;">Visit Details</h3>
              <table width="100%" cellpadding="8" cellspacing="0">
                <tr style="border-bottom: 1px solid #e0e0e0;">
                  <td style="color: #666;">Event:</td>
                  <td style="font-weight: bold; text-align: right;">${params.eventTitle}</td>
                </tr>
                <tr style="border-bottom: 1px solid #e0e0e0;">
                  <td style="color: #666;">Date:</td>
                  <td style="font-weight: bold; text-align: right;">${params.visitDate}</td>
                </tr>
                <tr style="border-bottom: 1px solid #e0e0e0;">
                  <td style="color: #666;">Time:</td>
                  <td style="font-weight: bold; text-align: right;">${params.timeSlot}</td>
                </tr>
                <tr>
                  <td style="color: #666;">Tickets:</td>
                  <td style="font-weight: bold; text-align: right;">${params.ticketCount} ticket(s)</td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
        
        <!-- Amount Paid -->
        <table width="100%" cellpadding="15" cellspacing="0" style="background-color: #d4af37; margin: 20px 0;">
          <tr>
            <td style="text-align: center; color: white; font-size: 20px; font-weight: bold;">
              Amount Paid: ₹${params.totalAmount.toFixed(2)}
            </td>
          </tr>
        </table>
        
        <!-- What's Next Box -->
        <table width="100%" cellpadding="15" cellspacing="0" style="background-color: #e3f2fd; border-left: 4px solid #2196f3; margin: 20px 0;">
          <tr>
            <td>
              <h3 style="margin-top: 0; color: #1976d2;">📋 What's Next?</h3>
              <ul style="margin: 10px 0; padding-left: 20px;">
                <li style="margin: 8px 0;">Download your ticket from the confirmation page</li>
                <li style="margin: 8px 0;">Please arrive 15 minutes before your scheduled time</li>
                <li style="margin: 8px 0;">Present your ticket (digital or printed) at the entrance</li>
                <li style="margin: 8px 0;">Keep your booking reference handy: <strong>${params.bookingReference}</strong></li>
              </ul>
            </td>
          </tr>
        </table>
        
        <!-- CTA Button -->
        <table width="100%" cellpadding="20" cellspacing="0">
          <tr>
            <td style="text-align: center;">
              <a href="https://mgm-museum.vercel.app/bookings/confirmation" 
                 style="background-color: #d4af37; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                View Booking Details
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    
    <!-- Footer -->
    <tr>
      <td style="text-align: center; padding: 20px; color: #666; font-size: 14px; border-top: 1px solid #e0e0e0;">
        <p style="margin: 5px 0;"><strong>MGM Museum</strong></p>
        <p style="margin: 5px 0;">
          For inquiries: <a href="mailto:info@mgmmuseum.com" style="color: #d4af37; text-decoration: none;">info@mgmmuseum.com</a> | +91 1234567890
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
}

/**
 * Send booking confirmation email to customer
 */
export async function sendBookingConfirmation(
  params: SendBookingConfirmationParams
): Promise<{ success: boolean; error?: string }> {
  try {
    // Generate email HTML
    const emailHtml = generateEmailHtml(params);

    // Send email via Resend
    const { data, error } = await resend.emails.send({
      from: EMAIL_CONFIG.from,
      to: params.to,
      replyTo: EMAIL_CONFIG.replyTo,
      subject: `Booking Confirmed - ${params.bookingReference} | MGM Museum`,
      html: emailHtml,
    });

    if (error) {
      console.error('Failed to send booking confirmation email:', error);
      return { success: false, error: error.message };
    }

    console.log('Booking confirmation email sent successfully:', {
      emailId: data?.id,
      to: params.to,
      bookingReference: params.bookingReference,
    });

    return { success: true };
  } catch (error) {
    console.error('Error sending booking confirmation email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
