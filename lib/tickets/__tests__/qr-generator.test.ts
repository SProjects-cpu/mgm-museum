/**
 * Unit tests for QR Code Generation Utility
 */

import { describe, it, expect, vi } from 'vitest';
import { generateQRCode, isValidBookingReference } from '../qr-generator';
import QRCode from 'qrcode';

// Mock the qrcode library
vi.mock('qrcode', () => ({
  default: {
    toDataURL: vi.fn(),
  },
}));

describe('generateQRCode', () => {
  it('should generate QR code with valid booking reference', async () => {
    const mockDataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    (QRCode.toDataURL as any).mockResolvedValue(mockDataUrl);

    const bookingRef = 'BK17623504597486WZYCB';
    const result = await generateQRCode(bookingRef);

    expect(result).toBe(mockDataUrl);
    expect(QRCode.toDataURL).toHaveBeenCalledWith(
      bookingRef,
      expect.objectContaining({
        width: 200,
        margin: 2,
        errorCorrectionLevel: 'M',
      })
    );
  });

  it('should generate QR code with custom options', async () => {
    const mockDataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    (QRCode.toDataURL as any).mockResolvedValue(mockDataUrl);

    const bookingRef = 'MGM-20250105-ABCD';
    const options = {
      width: 300,
      margin: 4,
      errorCorrectionLevel: 'H' as const,
    };

    await generateQRCode(bookingRef, options);

    expect(QRCode.toDataURL).toHaveBeenCalledWith(bookingRef, options);
  });

  it('should throw error for empty string', async () => {
    await expect(generateQRCode('')).rejects.toThrow('Invalid QR code data: must be a non-empty string');
  });

  it('should throw error for whitespace-only string', async () => {
    await expect(generateQRCode('   ')).rejects.toThrow('Invalid QR code data: must be a non-empty string');
  });

  it('should throw error for non-string input', async () => {
    await expect(generateQRCode(null as any)).rejects.toThrow('Invalid QR code data: must be a non-empty string');
    await expect(generateQRCode(undefined as any)).rejects.toThrow('Invalid QR code data: must be a non-empty string');
    await expect(generateQRCode(123 as any)).rejects.toThrow('Invalid QR code data: must be a non-empty string');
  });

  it('should throw error when QRCode.toDataURL fails', async () => {
    (QRCode.toDataURL as any).mockRejectedValue(new Error('QR generation failed'));

    await expect(generateQRCode('BK12345')).rejects.toThrow('Failed to generate QR code');
  });

  it('should throw error for invalid output format', async () => {
    (QRCode.toDataURL as any).mockResolvedValue('invalid-format');

    await expect(generateQRCode('BK12345')).rejects.toThrow('Failed to generate QR code');
  });
});

describe('isValidBookingReference', () => {
  it('should validate BK format booking references', () => {
    expect(isValidBookingReference('BK17623504597486WZYCB')).toBe(true);
    expect(isValidBookingReference('BK123456789ABC')).toBe(true);
  });

  it('should validate MGM format booking references', () => {
    expect(isValidBookingReference('MGM-20250105-ABCD')).toBe(true);
    expect(isValidBookingReference('MGM-20241231-XYZ9')).toBe(true);
  });

  it('should reject invalid formats', () => {
    expect(isValidBookingReference('')).toBe(false);
    expect(isValidBookingReference('INVALID')).toBe(false);
    expect(isValidBookingReference('BK')).toBe(false);
    expect(isValidBookingReference('MGM-2024-ABCD')).toBe(false);
    expect(isValidBookingReference('MGM-20240101')).toBe(false);
  });
});
