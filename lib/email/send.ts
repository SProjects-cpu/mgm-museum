import { transporter, defaultFrom } from './config';
import type { SendMailOptions } from 'nodemailer';

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  attachments?: Array<{
    filename: string;
    content?: Buffer | string;
    path?: string;
    contentType?: string;
  }>;
  cc?: string | string[];
  bcc?: string | string[];
}

/**
 * Send an email using NodeMailer
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    const mailOptions: SendMailOptions = {
      from: defaultFrom,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
      attachments: options.attachments,
      cc: options.cc,
      bcc: options.bcc,
    };

    const info = await transporter.sendMail(mailOptions);
    
    console.log('✅ Email sent successfully:', {
      messageId: info.messageId,
      to: options.to,
      subject: options.subject,
    });

    return true;
  } catch (error) {
    console.error('❌ Error sending email:', error);
    return false;
  }
}

/**
 * Send multiple emails (batch sending)
 */
export async function sendBulkEmails(emails: EmailOptions[]): Promise<{
  success: number;
  failed: number;
  total: number;
}> {
  const results = {
    success: 0,
    failed: 0,
    total: emails.length,
  };

  for (const email of emails) {
    const sent = await sendEmail(email);
    if (sent) {
      results.success++;
    } else {
      results.failed++;
    }
    
    // Add a small delay to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  console.log(`📧 Bulk email results: ${results.success}/${results.total} sent successfully`);

  return results;
}

/**
 * Send email with retry logic
 */
export async function sendEmailWithRetry(
  options: EmailOptions,
  maxRetries = 3
): Promise<boolean> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const success = await sendEmail(options);
    
    if (success) {
      return true;
    }

    if (attempt < maxRetries) {
      console.log(`⚠️ Retry attempt ${attempt}/${maxRetries} for email to ${options.to}`);
      // Exponential backoff
      await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempt) * 1000));
    }
  }

  console.error(`❌ Failed to send email after ${maxRetries} attempts to ${options.to}`);
  return false;
}

/**
 * Validate email address format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Sanitize email content to prevent injection
 */
export function sanitizeEmailContent(content: string): string {
  return content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '');
}






