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
// Supports custom domain via environment variables
// Falls back to test domain if not configured
export const EMAIL_CONFIG = {
  from: process.env.EMAIL_FROM || 'MGM Museum <onboarding@resend.dev>',
  replyTo: process.env.EMAIL_REPLY_TO || 'shivampaliwal37@gmail.com',
  testMode: !process.env.EMAIL_FROM, // Auto-detect test mode
};

// Export function to check if email is configured
export function isEmailConfigured(): boolean {
  return !!RESEND_API_KEY && RESEND_API_KEY !== 'missing-api-key';
}
