/**
 * Date Helper Utilities
 * 
 * These functions handle dates without timezone conversion to prevent
 * the common "off-by-one-day" bug when storing and displaying dates.
 */

/**
 * Format date as YYYY-MM-DD without timezone conversion
 * @param date - Date object or date string
 * @returns Date string in YYYY-MM-DD format
 */
export function formatDateOnly(date: Date | string): string {
  if (typeof date === 'string') {
    // If already in YYYY-MM-DD format, return as-is
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return date;
    }
    date = new Date(date);
  }
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

/**
 * Parse date string without timezone conversion
 * @param dateString - Date string in YYYY-MM-DD format
 * @returns Date object in local timezone
 */
export function parseDateOnly(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Format date for display (e.g., "Saturday, January 18, 2025")
 * @param dateString - Date string in YYYY-MM-DD format
 * @returns Formatted date string for display
 */
export function formatDateForDisplay(dateString: string): string {
  const date = parseDateOnly(dateString);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Validate date format (YYYY-MM-DD)
 * @param dateString - Date string to validate
 * @returns True if valid YYYY-MM-DD format
 */
export function validateDateOnly(dateString: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return false;
  }
  
  const date = parseDateOnly(dateString);
  return !isNaN(date.getTime());
}
