import nodemailer from 'nodemailer';

// Email configuration
export const emailConfig = {
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER || 'paliwalshivam539@gmail.com',
    pass: process.env.EMAIL_PASSWORD || 'shivam53955623ll',
  },
};

// Create reusable transporter
export const transporter = nodemailer.createTransport(emailConfig);

// Verify connection configuration
export async function verifyEmailConnection() {
  try {
    await transporter.verify();
    console.log('✅ Email server is ready to send messages');
    return true;
  } catch (error) {
    console.error('❌ Email server connection failed:', error);
    return false;
  }
}

// Default sender
export const defaultFrom = process.env.EMAIL_FROM || 'MGM Science Centre <paliwalshivam539@gmail.com>';

// Site configuration
export const siteConfig = {
  name: process.env.NEXT_PUBLIC_SITE_NAME || 'MGM APJ Abdul Kalam Astrospace Science Centre',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
  supportEmail: process.env.EMAIL_USER || 'paliwalshivam539@gmail.com',
  phone: '+91 240 2372737',
  address: 'N-6, CIDCO, Aurangabad, Maharashtra 431003',
};






