/**
 * Rate Limiting Middleware
 * Prevents abuse of payment endpoints
 */

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
}

// Default configurations for different endpoints
export const RATE_LIMITS = {
  payment: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 10, // 10 payment attempts per 15 minutes
  },
  verification: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 20, // 20 verification attempts per 15 minutes
  },
  webhook: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100, // 100 webhook calls per minute
  },
  general: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60, // 60 requests per minute
  },
};

/**
 * Check if request is rate limited
 * @param identifier - Unique identifier (IP, user ID, etc.)
 * @param config - Rate limit configuration
 * @returns Object with allowed status and remaining requests
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig = RATE_LIMITS.general
): {
  allowed: boolean;
  remaining: number;
  resetTime: number;
} {
  const now = Date.now();
  const key = `${identifier}`;

  // Get or initialize rate limit data
  let limitData = store[key];

  if (!limitData || now > limitData.resetTime) {
    // Initialize or reset
    limitData = {
      count: 0,
      resetTime: now + config.windowMs,
    };
    store[key] = limitData;
  }

  // Increment count
  limitData.count++;

  // Check if limit exceeded
  const allowed = limitData.count <= config.maxRequests;
  const remaining = Math.max(0, config.maxRequests - limitData.count);

  return {
    allowed,
    remaining,
    resetTime: limitData.resetTime,
  };
}

/**
 * Get rate limit headers for response
 * @param remaining - Remaining requests
 * @param resetTime - Reset time in milliseconds
 * @returns Headers object
 */
export function getRateLimitHeaders(
  remaining: number,
  resetTime: number
): Record<string, string> {
  return {
    'X-RateLimit-Remaining': remaining.toString(),
    'X-RateLimit-Reset': new Date(resetTime).toISOString(),
    'Retry-After': Math.ceil((resetTime - Date.now()) / 1000).toString(),
  };
}

/**
 * Clean up expired rate limit entries
 * Should be called periodically
 */
export function cleanupRateLimitStore(): void {
  const now = Date.now();
  Object.keys(store).forEach((key) => {
    if (store[key].resetTime < now) {
      delete store[key];
    }
  });
}

// Cleanup every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupRateLimitStore, 5 * 60 * 1000);
}
