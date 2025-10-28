// @ts-nocheck
import * as twilio from 'twilio';

// Initialize Twilio client
const twilioClient = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
  ? twilio.Twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  : null;

const FROM_PHONE = process.env.TWILIO_PHONE_NUMBER || '+1234567890';

export interface SMSData {
  to: string;
  message: string;
  bookingReference?: string;
  customerName?: string;
}

/**
 * Send SMS using Twilio
 */
export async function sendSMS(data: SMSData) {
  // Check if Twilio is configured
  if (!twilioClient) {
    console.warn('Twilio not configured, SMS not sent');
    return { success: false, error: 'Twilio not configured' };
  }

  try {
    const result = await twilioClient.messages.create({
      body: data.message,
      from: FROM_PHONE,
      to: data.to,
    });

    return {
      success: true,
      messageId: result.sid,
      status: result.status,
    };
  } catch (error: any) {
    console.error('Error sending SMS:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send booking confirmation SMS
 */
export async function sendBookingConfirmationSMS(data: {
  phone: string;
  customerName: string;
  bookingReference: string;
  exhibitionName: string;
  date: string;
  time: string;
}) {
  const message = `Hi ${data.customerName}! Your booking ${data.bookingReference} for ${data.exhibitionName} is confirmed for ${data.date} at ${data.time}. Show this SMS at entry. - MGM Science Centre`;

  return await sendSMS({
    to: data.phone,
    message,
    bookingReference: data.bookingReference,
    customerName: data.customerName,
  });
}

/**
 * Send booking reminder SMS (24 hours before)
 */
export async function sendBookingReminderSMS(data: {
  phone: string;
  customerName: string;
  bookingReference: string;
  exhibitionName: string;
  date: string;
  time: string;
}) {
  const message = `Hi ${data.customerName}! Reminder: Your visit to ${data.exhibitionName} is tomorrow (${data.date}) at ${data.time}. Don't forget to bring valid ID. - MGM Science Centre`;

  return await sendSMS({
    to: data.phone,
    message,
    bookingReference: data.bookingReference,
    customerName: data.customerName,
  });
}

/**
 * Send booking cancellation SMS
 */
export async function sendBookingCancellationSMS(data: {
  phone: string;
  customerName: string;
  bookingReference: string;
  refundAmount?: number;
}) {
  let message = `Hi ${data.customerName}! Your booking ${data.bookingReference} has been cancelled.`;

  if (data.refundAmount && data.refundAmount > 0) {
    message += ` Refund of ₹${data.refundAmount} will be processed within 5-7 business days.`;
  }

  message += ` - MGM Science Centre`;

  return await sendSMS({
    to: data.phone,
    message,
    bookingReference: data.bookingReference,
    customerName: data.customerName,
  });
}

/**
 * Send event registration SMS
 */
export async function sendEventRegistrationSMS(data: {
  phone: string;
  customerName: string;
  eventTitle: string;
  eventDate: string;
  eventTime: string;
  location: string;
}) {
  const message = `Hi ${data.customerName}! You're registered for "${data.eventTitle}" on ${data.eventDate} at ${data.eventTime} at ${data.location}. See you there! - MGM Science Centre`;

  return await sendSMS({
    to: data.phone,
    message,
    customerName: data.customerName,
  });
}

/**
 * Send general notification SMS
 */
export async function sendNotificationSMS(data: {
  to: string;
  title: string;
  message: string;
  priority?: 'low' | 'medium' | 'high';
}) {
  const priorityEmoji = {
    low: 'ℹ️',
    medium: '📢',
    high: '⚠️',
  };

  const emoji = priorityEmoji[data.priority || 'medium'];
  const fullMessage = `${emoji} ${data.title}: ${data.message} - MGM Science Centre`;

  return await sendSMS({
    to: data.to,
    message: fullMessage,
  });
}

/**
 * Test SMS configuration
 */
export async function testSMSConfiguration(testPhone?: string) {
  if (!twilioClient) {
    return {
      success: false,
      message: 'Twilio not configured',
      error: 'Missing TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, or TWILIO_PHONE_NUMBER',
    };
  }

  try {
    const phone = testPhone || process.env.TEST_PHONE;
    if (!phone) {
      return {
        success: false,
        message: 'No test phone number provided',
        error: 'Set TEST_PHONE environment variable or pass testPhone parameter',
      };
    }

    const message = `🧪 SMS Configuration Test - If you received this message, your SMS service is working correctly! Sent at: ${new Date().toLocaleString('en-IN')} - MGM Science Centre`;

    const result = await sendSMS({
      to: phone,
      message,
    });

    return {
      success: result.success,
      message: result.success
        ? 'SMS configuration test successful'
        : 'SMS configuration test failed',
      details: result,
    };
  } catch (error: any) {
    return {
      success: false,
      message: 'SMS configuration test error',
      error: error.message,
    };
  }
}

/**
 * Format phone number for Indian numbers
 */
export function formatPhoneNumber(phone: string): string {
  // Remove all non-digit characters
  let cleaned = phone.replace(/\D/g, '');

  // Add country code if not present
  if (cleaned.length === 10) {
    cleaned = `+91${cleaned}`;
  } else if (cleaned.length === 12 && cleaned.startsWith('91')) {
    cleaned = `+${cleaned}`;
  } else if (cleaned.length === 13 && cleaned.startsWith('+91')) {
    // Already formatted correctly
  } else {
    throw new Error('Invalid phone number format');
  }

  return cleaned;
}

/**
 * Validate phone number format
 */
export function isValidPhoneNumber(phone: string): boolean {
  try {
    formatPhoneNumber(phone);
    return true;
  } catch {
    return false;
  }
}