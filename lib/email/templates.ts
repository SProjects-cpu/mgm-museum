import { siteConfig } from './config';

interface BookingEmailData {
  bookingReference: string;
  customerName: string;
  customerEmail: string;
  exhibitionName?: string;
  showName?: string;
  bookingDate: string;
  timeSlot: string;
  totalAmount: number;
  tickets: Array<{
    type: string;
    quantity: number;
    price: number;
  }>;
  qrCodeUrl?: string;
}

interface EventRegistrationData {
  eventTitle: string;
  participantName: string;
  participantEmail: string;
  eventDate: string;
  eventTime: string;
  location: string;
}

interface ContactReplyData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

// Email template wrapper with consistent styling
const emailWrapper = (content: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${siteConfig.name}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background-color: #f4f4f4;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
    }
    .header {
      background: linear-gradient(135deg, #3498db 0%, #764ba2 100%);
      padding: 30px 20px;
      text-align: center;
      color: white;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
    }
    .content {
      padding: 30px 20px;
      color: #333;
      line-height: 1.6;
    }
    .button {
      display: inline-block;
      padding: 12px 30px;
      background: linear-gradient(135deg, #3498db 0%, #764ba2 100%);
      color: white !important;
      text-decoration: none;
      border-radius: 5px;
      margin: 20px 0;
      font-weight: 600;
    }
    .info-box {
      background-color: #f8f9fa;
      border-left: 4px solid #3498db;
      padding: 15px;
      margin: 20px 0;
    }
    .ticket-details {
      background-color: #f8f9fa;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
    }
    .ticket-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #e0e0e0;
    }
    .ticket-row:last-child {
      border-bottom: none;
      font-weight: bold;
      font-size: 18px;
      padding-top: 15px;
    }
    .qr-code {
      text-align: center;
      margin: 20px 0;
    }
    .qr-code img {
      max-width: 200px;
      height: auto;
    }
    .footer {
      background-color: #2c3e50;
      color: #ecf0f1;
      padding: 20px;
      text-align: center;
      font-size: 14px;
    }
    .footer a {
      color: #3498db;
      text-decoration: none;
    }
    .social-links {
      margin: 15px 0;
    }
    .social-links a {
      margin: 0 10px;
      color: #3498db;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🚀 ${siteConfig.name}</h1>
    </div>
    ${content}
    <div class="footer">
      <p><strong>Contact Us</strong></p>
      <p>📧 ${siteConfig.supportEmail} | 📞 ${siteConfig.phone}</p>
      <p>📍 ${siteConfig.address}</p>
      <div class="social-links">
        <a href="${siteConfig.url}">Visit Website</a> |
        <a href="${siteConfig.url}/contact">Contact</a> |
        <a href="${siteConfig.url}/plan-visit">Plan Your Visit</a>
      </div>
      <p style="font-size: 12px; color: #95a5a6; margin-top: 20px;">
        © ${new Date().getFullYear()} ${siteConfig.name}. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>
`;

// Booking Confirmation Email
export function bookingConfirmationTemplate(data: BookingEmailData): string {
  const attractionName = data.exhibitionName || data.showName || 'Attraction';
  
  const ticketsHtml = data.tickets
    .map(
      (ticket) => `
    <div class="ticket-row">
      <span>${ticket.type} (x${ticket.quantity})</span>
      <span>₹${ticket.price.toFixed(2)}</span>
    </div>
  `
    )
    .join('');

  const qrCodeSection = data.qrCodeUrl
    ? `
    <div class="qr-code">
      <h3>Your E-Ticket QR Code</h3>
      <img src="${data.qrCodeUrl}" alt="QR Code" />
      <p style="font-size: 12px; color: #666;">Show this QR code at the entrance</p>
    </div>
  `
    : '';

  const content = `
    <div class="content">
      <h2>🎉 Booking Confirmed!</h2>
      <p>Dear ${data.customerName},</p>
      <p>Thank you for booking with ${siteConfig.name}! Your booking has been confirmed.</p>
      
      <div class="info-box">
        <h3 style="margin-top: 0;">Booking Details</h3>
        <p><strong>Booking Reference:</strong> ${data.bookingReference}</p>
        <p><strong>Attraction:</strong> ${attractionName}</p>
        <p><strong>Date:</strong> ${data.bookingDate}</p>
        <p><strong>Time Slot:</strong> ${data.timeSlot}</p>
      </div>

      <div class="ticket-details">
        <h3 style="margin-top: 0;">Ticket Breakdown</h3>
        ${ticketsHtml}
        <div class="ticket-row">
          <span>Total Amount</span>
          <span>₹${data.totalAmount.toFixed(2)}</span>
        </div>
      </div>

      ${qrCodeSection}

      <div class="info-box" style="border-left-color: #e67e22;">
        <h4 style="margin-top: 0;">📋 Important Information</h4>
        <ul style="margin: 10px 0; padding-left: 20px;">
          <li>Please arrive 15 minutes before your scheduled time</li>
          <li>Carry a valid ID proof for verification</li>
          <li>Children below 3 years get free entry</li>
          <li>Photography is allowed in most areas</li>
          <li>Museum is closed on Mondays</li>
        </ul>
      </div>

      <center>
        <a href="${siteConfig.url}/dashboard" class="button">View My Bookings</a>
      </center>

      <p>If you have any questions, feel free to contact us at ${siteConfig.supportEmail}</p>
      <p>We look forward to welcoming you!</p>
      <p>Best regards,<br><strong>Team MGM Science Centre</strong></p>
    </div>
  `;

  return emailWrapper(content);
}

// Event Registration Confirmation Email
export function eventRegistrationTemplate(data: EventRegistrationData): string {
  const content = `
    <div class="content">
      <h2>✅ Event Registration Confirmed!</h2>
      <p>Dear ${data.participantName},</p>
      <p>You have successfully registered for our event!</p>
      
      <div class="info-box">
        <h3 style="margin-top: 0;">Event Details</h3>
        <p><strong>Event:</strong> ${data.eventTitle}</p>
        <p><strong>Date:</strong> ${data.eventDate}</p>
        <p><strong>Time:</strong> ${data.eventTime}</p>
        <p><strong>Location:</strong> ${data.location}</p>
      </div>

      <div class="info-box" style="border-left-color: #2ecc71;">
        <h4 style="margin-top: 0;">📝 What to Bring</h4>
        <ul style="margin: 10px 0; padding-left: 20px;">
          <li>This confirmation email (printed or digital)</li>
          <li>Valid photo ID</li>
          <li>Notebook and pen for taking notes</li>
          <li>Water bottle</li>
        </ul>
      </div>

      <center>
        <a href="${siteConfig.url}/events" class="button">View All Events</a>
      </center>

      <p>We're excited to see you at the event!</p>
      <p>Best regards,<br><strong>Team MGM Science Centre</strong></p>
    </div>
  `;

  return emailWrapper(content);
}

// Contact Form Auto-Reply
export function contactAutoReplyTemplate(data: ContactReplyData): string {
  const content = `
    <div class="content">
      <h2>📬 We Received Your Message!</h2>
      <p>Dear ${data.name},</p>
      <p>Thank you for contacting ${siteConfig.name}. We have received your message and will respond within 24-48 hours.</p>
      
      <div class="info-box">
        <h3 style="margin-top: 0;">Your Message</h3>
        <p><strong>Subject:</strong> ${data.subject}</p>
        <p><strong>Message:</strong></p>
        <p style="white-space: pre-wrap;">${data.message}</p>
      </div>

      <p>If your inquiry is urgent, please call us at ${siteConfig.phone}</p>
      
      <center>
        <a href="${siteConfig.url}" class="button">Visit Our Website</a>
      </center>

      <p>Best regards,<br><strong>Team MGM Science Centre</strong></p>
    </div>
  `;

  return emailWrapper(content);
}

// Newsletter Welcome Email
export function newsletterWelcomeTemplate(name: string): string {
  const content = `
    <div class="content">
      <h2>🎉 Welcome to Our Newsletter!</h2>
      <p>Dear ${name || 'Science Enthusiast'},</p>
      <p>Thank you for subscribing to the ${siteConfig.name} newsletter!</p>
      
      <div class="info-box" style="border-left-color: #2ecc71;">
        <h3 style="margin-top: 0;">What to Expect</h3>
        <ul style="margin: 10px 0; padding-left: 20px;">
          <li>🚀 Latest updates on exhibitions and shows</li>
          <li>🎓 Upcoming workshops and events</li>
          <li>🎟️ Exclusive offers and early bird discounts</li>
          <li>🔬 Science news and educational content</li>
          <li>📸 Behind-the-scenes stories</li>
        </ul>
      </div>

      <center>
        <a href="${siteConfig.url}/exhibitions" class="button">Explore Exhibitions</a>
      </center>

      <p>Stay curious and keep exploring!</p>
      <p>Best regards,<br><strong>Team MGM Science Centre</strong></p>
    </div>
  `;

  return emailWrapper(content);
}

// Booking Reminder Email (1 day before)
export function bookingReminderTemplate(data: BookingEmailData): string {
  const attractionName = data.exhibitionName || data.showName || 'Attraction';
  
  const content = `
    <div class="content">
      <h2>⏰ Reminder: Your Visit Tomorrow!</h2>
      <p>Dear ${data.customerName},</p>
      <p>This is a friendly reminder about your upcoming visit to ${siteConfig.name}!</p>
      
      <div class="info-box" style="border-left-color: #e67e22;">
        <h3 style="margin-top: 0;">Your Booking Details</h3>
        <p><strong>Booking Reference:</strong> ${data.bookingReference}</p>
        <p><strong>Attraction:</strong> ${attractionName}</p>
        <p><strong>Date:</strong> ${data.bookingDate}</p>
        <p><strong>Time Slot:</strong> ${data.timeSlot}</p>
      </div>

      <div class="info-box" style="border-left-color: #3498db;">
        <h4 style="margin-top: 0;">✅ Checklist for Tomorrow</h4>
        <ul style="margin: 10px 0; padding-left: 20px;">
          <li>Arrive 15 minutes early</li>
          <li>Bring your booking confirmation (this email)</li>
          <li>Carry valid ID proof</li>
          <li>Wear comfortable shoes</li>
          <li>Bring a water bottle</li>
        </ul>
      </div>

      <center>
        <a href="${siteConfig.url}/plan-visit" class="button">Plan Your Visit</a>
      </center>

      <p>Looking forward to seeing you tomorrow!</p>
      <p>Best regards,<br><strong>Team MGM Science Centre</strong></p>
    </div>
  `;

  return emailWrapper(content);
}

// Booking Cancellation Email
export function bookingCancellationTemplate(data: { bookingReference: string; customerName: string; attractionName: string; refundAmount?: number }): string {
  const refundSection = data.refundAmount
    ? `
    <div class="info-box" style="border-left-color: #2ecc71;">
      <h4 style="margin-top: 0;">💰 Refund Information</h4>
      <p>A refund of <strong>₹${data.refundAmount.toFixed(2)}</strong> will be processed to your original payment method within 5-7 business days.</p>
    </div>
  `
    : '';

  const content = `
    <div class="content">
      <h2>❌ Booking Cancelled</h2>
      <p>Dear ${data.customerName},</p>
      <p>Your booking has been successfully cancelled as per your request.</p>
      
      <div class="info-box">
        <h3 style="margin-top: 0;">Cancelled Booking</h3>
        <p><strong>Booking Reference:</strong> ${data.bookingReference}</p>
        <p><strong>Attraction:</strong> ${data.attractionName}</p>
      </div>

      ${refundSection}

      <p>We're sorry to see you cancel. We hope to welcome you again in the future!</p>
      
      <center>
        <a href="${siteConfig.url}/exhibitions" class="button">Book Again</a>
      </center>

      <p>If you have any questions about this cancellation, please contact us at ${siteConfig.supportEmail}</p>
      <p>Best regards,<br><strong>Team MGM Science Centre</strong></p>
    </div>
  `;

  return emailWrapper(content);
}

// Admin Notification Email (New Booking)
export function adminNewBookingTemplate(data: BookingEmailData): string {
  const attractionName = data.exhibitionName || data.showName || 'Attraction';
  
  const content = `
    <div class="content">
      <h2>🔔 New Booking Received</h2>
      <p>A new booking has been made on the website.</p>
      
      <div class="info-box">
        <h3 style="margin-top: 0;">Booking Details</h3>
        <p><strong>Booking Reference:</strong> ${data.bookingReference}</p>
        <p><strong>Customer:</strong> ${data.customerName}</p>
        <p><strong>Email:</strong> ${data.customerEmail}</p>
        <p><strong>Attraction:</strong> ${attractionName}</p>
        <p><strong>Date:</strong> ${data.bookingDate}</p>
        <p><strong>Time:</strong> ${data.timeSlot}</p>
        <p><strong>Amount:</strong> ₹${data.totalAmount.toFixed(2)}</p>
      </div>

      <center>
        <a href="${siteConfig.url}/admin/bookings" class="button">View in Admin Panel</a>
      </center>
    </div>
  `;

  return emailWrapper(content);
}






