/**
 * Resend Email Client Configuration
 */

import { Resend } from 'resend';

// Initialize Resend client with API key
export const resend = new Resend(process.env.RESEND_API_KEY);

// Email configuration
// Note: Using Resend's test domain. To use custom domain, verify it in Resend dashboard first.
export const EMAIL_CONFIG = {
  from: 'MGM Museum <onboarding@resend.dev>', // Resend test domain
  replyTo: 'shivampaliwal37@gmail.com', // Your actual email for replies
};
