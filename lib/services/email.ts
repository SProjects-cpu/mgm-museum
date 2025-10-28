// Optional imports to avoid build errors when email services aren't configured
let Resend: any = null;
let render: any = null;
let BookingConfirmationEmail: any = null;
let BookingReminderEmail: any = null;
let BookingCancellationEmail: any = null;
let EventRegistrationEmail: any = null;

try {
  Resend = (await import('resend')).Resend;
  const renderModule = await import('@react-email/components');
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

// Initialize Resend only if available
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
 * Send booking confirmation email with e-ticket
 */
export async function sendBookingConfirmation(data: BookingEmailData) {
  try {
    if (!render || !BookingConfirmationEmail || !resend) {
      console.warn('Email services not available');
      return { success: false, error: 'Email service not configured' };
    }

    const emailHtml = await render(BookingConfirmationEmail(data));

    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: data.customerEmail,
      subject: `Booking Confirmed! ${data.bookingReference} - ${data.exhibitionName}`,
      html: emailHtml,
      attachments: data.ticketPdfUrl ? [
        {
          filename: `ticket-${data.bookingReference}.pdf`,
          path: data.ticketPdfUrl,
        }
      ] : [],
      tags: [
        {
          name: 'category',
          value: 'booking-confirmation',
        },
      ],
    });

    return { success: true, messageId: result.data?.id };
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
    if (!render || !BookingReminderEmail || !resend) {
      console.warn('Email services not available');
      return { success: false, error: 'Email service not configured' };
    }

    const emailHtml = await render(BookingReminderEmail(data));

    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: data.customerEmail,
      subject: `Reminder: Your visit tomorrow at ${data.time} - ${data.exhibitionName}`,
      html: emailHtml,
      tags: [
        {
          name: 'category',
          value: 'booking-reminder',
        },
      ],
    });

    return { success: true, messageId: result.data?.id };
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
    if (!render || !BookingCancellationEmail || !resend) {
      console.warn('Email services not available');
      return { success: false, error: 'Email service not configured' };
    }

    const emailHtml = await render(BookingCancellationEmail(data));

    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: data.customerEmail,
      subject: `Booking Cancelled - ${data.bookingReference}`,
      html: emailHtml,
      tags: [
        {
          name: 'category',
          value: 'booking-cancellation',
        },
      ],
    });

    return { success: true, messageId: result.data?.id };
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
    if (!render || !EventRegistrationEmail || !resend) {
      console.warn('Email services not available');
      return { success: false, error: 'Email service not configured' };
    }

    const emailHtml = await render(EventRegistrationEmail(data));

    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: data.customerEmail,
      subject: `Registration Confirmed - ${data.eventTitle}`,
      html: emailHtml,
      tags: [
        {
          name: 'category',
          value: 'event-registration',
        },
      ],
    });

    return { success: true, messageId: result.data?.id };
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
    if (!resend) {
      console.warn('Email services not available');
      return { success: false, error: 'Email service not configured' };
    }

    const results = await Promise.all(
      subscribers.map((email) =>
        resend.emails.send({
          from: FROM_EMAIL,
          to: email,
          subject,
          html: content,
          tags: [
            {
              name: 'category',
              value: 'newsletter',
            },
          ],
        })
      )
    );

    return { success: true, sent: results.length };
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
    if (!resend) {
      console.warn('Email services not available');
      return { success: false, error: 'Email service not configured' };
    }

    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: 'We received your message - MGM Science Centre',
      html: `
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
      `,
      tags: [
        {
          name: 'category',
          value: 'contact-autoresponse',
        },
      ],
    });

    return { success: true, messageId: result.data?.id };
  } catch (error) {
    console.error('Error sending contact autoresponse:', error);
    return { success: false, error };
  }
}




