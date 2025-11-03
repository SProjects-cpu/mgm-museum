// Email Confirmation Service for Booking
// Note: This is a placeholder implementation
// You'll need to integrate with an email service like Resend, SendGrid, or AWS SES

interface BookingDetails {
  bookingReference: string;
  visitorName: string;
  visitorEmail: string;
  bookingDate: string;
  timeSlot: {
    startTime: string;
    endTime: string;
  };
  totalTickets: number;
  adultTickets: number;
  childTickets: number;
  studentTickets: number;
  seniorTickets: number;
  exhibitionName?: string;
  showName?: string;
  totalAmount: number;
}

/**
 * Send booking confirmation email
 * @param booking - Booking details
 * @returns Promise<boolean> - Success status
 */
export async function sendBookingConfirmationEmail(
  booking: BookingDetails
): Promise<boolean> {
  try {
    // TODO: Integrate with email service (Resend, SendGrid, etc.)
    
    const emailHtml = generateBookingEmailHTML(booking);
    const emailText = generateBookingEmailText(booking);

    // Example with Resend (uncomment when configured):
    /*
    const { Resend } = await import('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);

    await resend.emails.send({
      from: 'MGM Museum <bookings@mgmmuseum.com>',
      to: booking.visitorEmail,
      subject: `Booking Confirmation - ${booking.bookingReference}`,
      html: emailHtml,
      text: emailText,
    });
    */

    // For now, just log the email content
    console.log('📧 Booking Confirmation Email:');
    console.log('To:', booking.visitorEmail);
    console.log('Subject:', `Booking Confirmation - ${booking.bookingReference}`);
    console.log('Content:', emailText);

    return true;
  } catch (error) {
    console.error('Error sending booking confirmation email:', error);
    return false;
  }
}

/**
 * Generate HTML email template
 */
function generateBookingEmailHTML(booking: BookingDetails): string {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Booking Confirmation</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
    .booking-ref { background: #dbeafe; border: 2px solid #3b82f6; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0; }
    .booking-ref-number { font-size: 24px; font-weight: bold; color: #3b82f6; }
    .details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
    .detail-label { color: #6b7280; }
    .detail-value { font-weight: bold; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
    .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Booking Confirmed!</h1>
      <p>Thank you for booking with MGM Museum</p>
    </div>
    
    <div class="content">
      <p>Dear ${booking.visitorName},</p>
      <p>Your booking has been successfully confirmed. We're excited to welcome you!</p>
      
      <div class="booking-ref">
        <p style="margin: 0; font-size: 14px; color: #6b7280;">Booking Reference</p>
        <p class="booking-ref-number">${booking.bookingReference}</p>
      </div>
      
      <div class="details">
        <h3>Booking Details</h3>
        <div class="detail-row">
          <span class="detail-label">Date:</span>
          <span class="detail-value">${formatDate(booking.bookingDate)}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Time:</span>
          <span class="detail-value">${booking.timeSlot.startTime} - ${booking.timeSlot.endTime}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Total Tickets:</span>
          <span class="detail-value">${booking.totalTickets}</span>
        </div>
        ${booking.adultTickets > 0 ? `
        <div class="detail-row">
          <span class="detail-label">Adult Tickets:</span>
          <span class="detail-value">${booking.adultTickets}</span>
        </div>` : ''}
        ${booking.childTickets > 0 ? `
        <div class="detail-row">
          <span class="detail-label">Child Tickets:</span>
          <span class="detail-value">${booking.childTickets}</span>
        </div>` : ''}
        ${booking.studentTickets > 0 ? `
        <div class="detail-row">
          <span class="detail-label">Student Tickets:</span>
          <span class="detail-value">${booking.studentTickets}</span>
        </div>` : ''}
        ${booking.seniorTickets > 0 ? `
        <div class="detail-row">
          <span class="detail-label">Senior Tickets:</span>
          <span class="detail-value">${booking.seniorTickets}</span>
        </div>` : ''}
        ${booking.exhibitionName || booking.showName ? `
        <div class="detail-row">
          <span class="detail-label">Experience:</span>
          <span class="detail-value">${booking.exhibitionName || booking.showName}</span>
        </div>` : ''}
        <div class="detail-row">
          <span class="detail-label">Total Amount:</span>
          <span class="detail-value">₹${booking.totalAmount.toFixed(2)}</span>
        </div>
      </div>
      
      <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px;">
        <h4 style="margin: 0 0 10px 0; color: #92400e;">Important Information</h4>
        <ul style="margin: 0; padding-left: 20px; color: #92400e;">
          <li>Please arrive 15 minutes before your scheduled time</li>
          <li>Bring a valid ID for verification</li>
          <li>Show this booking reference at the entrance</li>
          <li>Keep this email for your records</li>
        </ul>
      </div>
      
      <p>If you have any questions, please contact us at <a href="mailto:info@mgmmuseum.com">info@mgmmuseum.com</a></p>
      
      <p>We look forward to seeing you!</p>
      <p><strong>MGM APJ Abdul Kalam Astrospace Science Centre & Museum</strong></p>
    </div>
    
    <div class="footer">
      <p>© ${new Date().getFullYear()} MGM Museum. All rights reserved.</p>
      <p>This is an automated email. Please do not reply to this message.</p>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Generate plain text email
 */
function generateBookingEmailText(booking: BookingDetails): string {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return `
BOOKING CONFIRMED!

Dear ${booking.visitorName},

Your booking has been successfully confirmed. We're excited to welcome you!

BOOKING REFERENCE: ${booking.bookingReference}

BOOKING DETAILS:
- Date: ${formatDate(booking.bookingDate)}
- Time: ${booking.timeSlot.startTime} - ${booking.timeSlot.endTime}
- Total Tickets: ${booking.totalTickets}
${booking.adultTickets > 0 ? `- Adult Tickets: ${booking.adultTickets}\n` : ''}${booking.childTickets > 0 ? `- Child Tickets: ${booking.childTickets}\n` : ''}${booking.studentTickets > 0 ? `- Student Tickets: ${booking.studentTickets}\n` : ''}${booking.seniorTickets > 0 ? `- Senior Tickets: ${booking.seniorTickets}\n` : ''}${booking.exhibitionName || booking.showName ? `- Experience: ${booking.exhibitionName || booking.showName}\n` : ''}- Total Amount: ₹${booking.totalAmount.toFixed(2)}

IMPORTANT INFORMATION:
• Please arrive 15 minutes before your scheduled time
• Bring a valid ID for verification
• Show this booking reference at the entrance
• Keep this email for your records

If you have any questions, please contact us at info@mgmmuseum.com

We look forward to seeing you!

MGM APJ Abdul Kalam Astrospace Science Centre & Museum

---
© ${new Date().getFullYear()} MGM Museum. All rights reserved.
This is an automated email. Please do not reply to this message.
  `;
}

/**
 * Send payment receipt email
 */
export async function sendPaymentReceiptEmail(
  booking: BookingDetails,
  paymentDetails: {
    paymentId: string;
    paymentMethod: string;
    transactionDate: string;
  }
): Promise<boolean> {
  try {
    // TODO: Implement payment receipt email
    console.log('📧 Payment Receipt Email:');
    console.log('To:', booking.visitorEmail);
    console.log('Payment ID:', paymentDetails.paymentId);
    
    return true;
  } catch (error) {
    console.error('Error sending payment receipt email:', error);
    return false;
  }
}
