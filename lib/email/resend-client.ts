/**
 * Resend Email Client Configuration
 */

import { Resend } from 'resend';

// Initialize Resend client with API key
export const resend = new Resend(process.env.RESEND_API_KEY);

// Email configuration
export const EMAIL_CONFIG = {
  from: 'MGM Museum <bookings@mgmmuseum.com>',
  replyTo: 'info@mgmmuseum.com',
};
