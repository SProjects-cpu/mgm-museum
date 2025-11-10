/**
 * Resend Email Client Configuration
 */

import { Resend } from 'resend';

// Check if API key is configured
const RESEND_API_KEY = process.env.RESEND_API_KEY;

if (!RESEND_API_KEY) {
  console.error('❌ RESEND_API_KEY is not configured in environment variables!');
  console.error('Email functionality will not work. Please add RESEND_API_KEY to your environment.');
}

// Initialize Resend client with API key
export const resend = new Resend(RESEND_API_KEY || 'missing-api-key');

// Email configuration
// Note: Using Resend's test domain. To use custom domain, verify it in Resend dashboard first.
export const EMAIL_CONFIG = {
  from: 'MGM Museum <onboarding@resend.dev>', // Resend test domain
  replyTo: 'shivampaliwal37@gmail.com', // Your actual email for replies
};

// Export function to check if email is configured
export function isEmailConfigured(): boolean {
  return !!RESEND_API_KEY && RESEND_API_KEY !== 'missing-api-key';
}
