// Optional imports to avoid build errors when email services aren't configured
let Resend: any = null;
let nodemailer: any = null;
let render: any = null;
let BookingConfirmationEmail: any = null;
let BookingReminderEmail: any = null;
let BookingCancellationEmail: any = null;
let EventRegistrationEmail: any = null;

try {
  Resend = (await import('resend')).Resend;
  nodemailer = await import('nodemailer');
  const renderModule = await import('@react-email/render');
  render = renderModule.render;

  // Import email components
  const emailComponents = await import('@/emails/booking-confirmation');
  BookingConfirmationEmail = emailComponents.BookingConfirmationEmail;

  const reminderComponents = await import('@/emails/booking-reminder');
  BookingReminderEmail = reminderComponents.BookingReminderEmail;

  const cancellationComponents = await import('@/emails/booking-cancellation');
  BookingCancellationEmail = cancellationComponents.BookingCancellationEmail;

  const eventComponents = await import('@/emails/event-registration');
  EventRegistrationEmail = eventComponents.EventRegistrationEmail;
} catch (error) {
  console.warn('Email services not available:', error);
}

// Initialize services only if dependencies are available
const resend = Resend && process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const FROM_EMAIL = process.env.FROM_EMAIL || 'MGM Science Centre <noreply@mgmapjscicentre.org>';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export interface BookingEmailData {
  bookingReference: string;
  customerName: string;
  customerEmail: string;
  exhibitionName: string;
  date: string;
  time: string;
  ticketCount: number;
  totalAmount: number;
  qrCodeUrl: string;
  ticketPdfUrl: string;
  specialRequirements?: string;
}

export interface EventEmailData {
  eventTitle: string;
  customerName: string;
  customerEmail: string;
  eventDate: string;
  eventTime: string;
  location: string;
  registrationId: string;
}

/**
 * Send email using Resend as primary, Nodemailer as fallback
 */
async function sendEmail(
  to: string,
  subject: string,
  html: string,
  attachments?: Array<{ filename: string; path: string }>
) {
  const emailData = {
    from: FROM_EMAIL,
    to,
    subject,
    html,
    attachments,
  };

  // Try Resend first
  if (process.env.RESEND_API_KEY && resend) {
    try {
      const result = await resend.emails.send(emailData);
      return { success: true, provider: 'resend', messageId: result.data?.id };
    } catch (error) {
      console.error('Resend failed, trying Nodemailer:', error);
    }
  }

  // Fallback to Nodemailer
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS && nodemailer) {
    try {
      const nodemailerTransporter = nodemailer.createTransporter({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      const result = await nodemailerTransporter.sendMail({
        from: FROM_EMAIL,
        to,
        subject,
        html,
        attachments,
      });
      return { success: true, provider: 'nodemailer', messageId: result.messageId };
    } catch (error) {
      console.error('Nodemailer failed:', error);
      return { success: false, error };
    }
  }

  return { success: false, error: 'No email service configured' };
}

/**
 * Send booking confirmation email with e-ticket
 */
export async function sendBookingConfirmation(data: BookingEmailData) {
  try {
    if (!render || !BookingConfirmationEmail) {
      console.warn('Email components not available');
      return { success: false, error: 'Email service not configured' };
    }

    const emailHtml = await render(BookingConfirmationEmail(data));

    const result = await sendEmail(
      data.customerEmail,
      `Booking Confirmed! ${data.bookingReference} - ${data.exhibitionName}`,
      emailHtml,
      data.ticketPdfUrl ? [
        {
          filename: `ticket-${data.bookingReference}.pdf`,
          path: data.ticketPdfUrl,
        }
      ] : []
    );

    return result;
  } catch (error) {
    console.error('Error sending booking confirmation:', error);
    return { success: false, error };
  }
}

/**
 * Send booking reminder (24 hours before)
 */
export async function sendBookingReminder(data: BookingEmailData) {
  try {
    if (!render || !BookingReminderEmail) {
      console.warn('Email components not available');
      return { success: false, error: 'Email service not configured' };
    }

    const emailHtml = await render(BookingReminderEmail(data));

    const result = await sendEmail(
      data.customerEmail,
      `Reminder: Your visit tomorrow at ${data.time} - ${data.exhibitionName}`,
      emailHtml
    );

    return result;
  } catch (error) {
    console.error('Error sending booking reminder:', error);
    return { success: false, error };
  }
}

/**
 * Send booking cancellation email
 */
export async function sendBookingCancellation(data: BookingEmailData & { refundAmount?: number }) {
  try {
    if (!render || !BookingCancellationEmail) {
      console.warn('Email components not available');
      return { success: false, error: 'Email service not configured' };
    }

    const emailHtml = await render(BookingCancellationEmail(data));

    const result = await sendEmail(
      data.customerEmail,
      `Booking Cancelled - ${data.bookingReference}`,
      emailHtml
    );

    return result;
  } catch (error) {
    console.error('Error sending booking cancellation:', error);
    return { success: false, error };
  }
}

/**
 * Send event registration confirmation
 */
export async function sendEventRegistration(data: EventEmailData) {
  try {
    if (!render || !EventRegistrationEmail) {
      console.warn('Email components not available');
      return { success: false, error: 'Email service not configured' };
    }

    const emailHtml = await render(EventRegistrationEmail(data));

    const result = await sendEmail(
      data.customerEmail,
      `Registration Confirmed - ${data.eventTitle}`,
      emailHtml
    );

    return result;
  } catch (error) {
    console.error('Error sending event registration:', error);
    return { success: false, error };
  }
}

/**
 * Send newsletter
 */
export async function sendNewsletter(
  subscribers: string[],
  subject: string,
  content: string
) {
  try {
    const results = await Promise.allSettled(
      subscribers.map((email) =>
        sendEmail(email, subject, content)
      )
    );

    const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
    const failed = results.length - successful;

    return {
      success: true,
      sent: successful,
      failed,
      total: results.length
    };
  } catch (error) {
    console.error('Error sending newsletter:', error);
    return { success: false, error };
  }
}

/**
 * Send contact form autoresponse
 */
export async function sendContactAutoResponse(
  email: string,
  name: string
) {
  try {
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Thank you for contacting us, ${name}!</h2>
        <p>We have received your message and will get back to you within 24-48 hours.</p>
        <p>In the meantime, feel free to:</p>
        <ul>
          <li>Explore our <a href="${SITE_URL}/exhibitions">Exhibitions</a></li>
          <li>Book <a href="${SITE_URL}/shows">Planetarium Shows</a></li>
          <li>View upcoming <a href="${SITE_URL}/events">Events</a></li>
        </ul>
        <p>Best regards,<br/>MGM Science Centre Team</p>
      </div>
    `;

    const result = await sendEmail(
      email,
      'We received your message - MGM Science Centre',
      htmlContent
    );

    return result;
  } catch (error) {
    console.error('Error sending contact autoresponse:', error);
    return { success: false, error };
  }
}

/**
 * Test email configuration
 */
export async function testEmailConfiguration() {
  try {
    const testHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Email Configuration Test</h2>
        <p>This is a test email to verify your email service configuration.</p>
        <p>If you received this email, your email service is working correctly!</p>
        <p>Sent at: ${new Date().toISOString()}</p>
      </div>
    `;

    // Send to a test email (you should configure this)
    const testEmail = process.env.TEST_EMAIL || 'test@example.com';

    const result = await sendEmail(
      testEmail,
      'Email Configuration Test - MGM Science Centre',
      testHtml
    );

    return {
      success: result.success,
      message: result.success
        ? 'Email configuration test successful'
        : 'Email configuration test failed',
      details: result,
    };
  } catch (error) {
    return {
      success: false,
      message: 'Email configuration test error',
      error,
    };
  }
}