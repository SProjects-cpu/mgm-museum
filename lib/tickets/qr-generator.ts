/**
 * QR Code Generation Utility
 * Generates QR codes as base64 data URLs for embedding in PDF tickets
 */

import QRCode from 'qrcode';
import { QRCodeOptions } from '@/types/tickets';

/**
 * Generate QR code as base64 data URL
 * @param data - Data to encode in QR code (typically booking reference)
 * @param options - QR code generation options
 * @returns Promise resolving to base64 data URL
 * @throws Error if QR code generation fails
 */
export async function generateQRCode(
  data: string,
  options: QRCodeOptions = {}
): Promise<string> {
  // Validate input
  if (!data || typeof data !== 'string' || data.trim().length === 0) {
    throw new Error('Invalid QR code data: must be a non-empty string');
  }

  // Set default options
  const qrOptions = {
    width: options.width || 200,
    margin: options.margin || 2,
    errorCorrectionLevel: options.errorCorrectionLevel || ('M' as const),
  };

  try {
    // Generate QR code as data URL
    const dataUrl = await QRCode.toDataURL(data, qrOptions);
    
    // Validate output format
    if (!dataUrl.startsWith('data:image/png;base64,')) {
      throw new Error('Invalid QR code output format');
    }

    return dataUrl;
  } catch (error) {
    console.error('QR code generation failed:', {
      data: data.substring(0, 50), // Log first 50 chars only
      options: qrOptions,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw new Error('Failed to generate QR code');
  }
}

/**
 * Validate booking reference format
 * @param bookingReference - Booking reference to validate
 * @returns true if valid format
 */
export function isValidBookingReference(bookingReference: string): boolean {
  // Format: BK{timestamp}{random} or MGM-YYYYMMDD-XXXX
  return /^(BK\d+[A-Z0-9]+|MGM-\d{8}-[A-Z0-9]+)$/.test(bookingReference);
}
