/**
 * Museum Logo Loader Utility
 * Loads and encodes museum logo for PDF embedding
 */

import fs from 'fs';
import path from 'path';

/**
 * Load museum logo and convert to base64 data URL
 * @returns Base64 data URL of the logo, or null if logo not found
 */
export async function loadMuseumLogo(): Promise<string | null> {
  try {
    // Path to museum logo in public directory
    const logoPath = path.join(process.cwd(), 'public', 'images', 'museum-logo.png');

    // Check if logo file exists
    if (!fs.existsSync(logoPath)) {
      console.warn('Museum logo not found at:', logoPath);
      return null;
    }

    // Read logo file as buffer
    const logoBuffer = fs.readFileSync(logoPath);

    // Convert to base64 data URL
    const base64Logo = logoBuffer.toString('base64');
    const dataUrl = `data:image/png;base64,${base64Logo}`;

    return dataUrl;
  } catch (error) {
    console.error('Failed to load museum logo:', error);
    return null;
  }
}

/**
 * Synchronous version of loadMuseumLogo for use in API routes
 * @returns Base64 data URL of the logo, or null if logo not found
 */
export function loadMuseumLogoSync(): string | null {
  try {
    // Path to museum logo in public directory
    const logoPath = path.join(process.cwd(), 'public', 'images', 'museum-logo.png');

    // Check if logo file exists
    if (!fs.existsSync(logoPath)) {
      console.warn('Museum logo not found at:', logoPath);
      return null;
    }

    // Read logo file as buffer
    const logoBuffer = fs.readFileSync(logoPath);

    // Convert to base64 data URL
    const base64Logo = logoBuffer.toString('base64');
    const dataUrl = `data:image/png;base64,${base64Logo}`;

    return dataUrl;
  } catch (error) {
    console.error('Failed to load museum logo:', error);
    return null;
  }
}
