/**
 * API Response Formatting Utilities
 * Provides standardized response formats for booking system APIs
 */

import { NextResponse } from 'next/server';
import { BookingError, logError } from './errors';

/**
 * Standard API response structure
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
    timestamp: string;
  };
  meta?: {
    timestamp: string;
    requestId?: string;
    [key: string]: any;
  };
}

/**
 * Pagination metadata
 */
export interface PaginationMeta {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

/**
 * Create a successful API response
 */
export function successResponse<T>(
  data: T,
  meta?: Record<string, any>,
  status: number = 200
): NextResponse<ApiResponse<T>> {
  const response: ApiResponse<T> = {
    success: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      ...meta,
    },
  };

  return NextResponse.json(response, { status });
}

/**
 * Create an error API response
 */
export function errorResponse(
  error: BookingError | Error | unknown,
  context?: Record<string, any>
): NextResponse<ApiResponse> {
  let bookingError: BookingError;

  // Convert to BookingError if needed
  if (error instanceof BookingError) {
    bookingError = error;
  } else if (error instanceof Error) {
    bookingError = new BookingError(
      'INTERNAL_ERROR' as any,
      error.message,
      { originalError: error.name }
    );
  } else {
    bookingError = new BookingError(
      'INTERNAL_ERROR' as any,
      'An unexpected error occurred',
      { error: String(error) }
    );
  }

  // Log the error
  logError(bookingError, context);

  const response: ApiResponse = {
    success: false,
    error: {
      code: bookingError.code,
      message: bookingError.message,
      details: bookingError.details,
      timestamp: bookingError.timestamp,
    },
  };

  return NextResponse.json(response, { status: bookingError.statusCode });
}

/**
 * Create a paginated response
 */
export function paginatedResponse<T>(
  data: T[],
  pagination: PaginationMeta,
  meta?: Record<string, any>
): NextResponse<ApiResponse<T[]>> {
  return successResponse(data, {
    pagination,
    ...meta,
  });
}

/**
 * Create a response with cache headers
 */
export function cachedResponse<T>(
  data: T,
  cacheSeconds: number,
  meta?: Record<string, any>
): NextResponse<ApiResponse<T>> {
  const response = successResponse(data, meta);
  
  // Add cache control headers
  response.headers.set(
    'Cache-Control',
    `public, s-maxage=${cacheSeconds}, stale-while-revalidate=${cacheSeconds * 2}`
  );
  
  return response;
}

/**
 * Create a no-cache response (for real-time data)
 */
export function noCacheResponse<T>(
  data: T,
  meta?: Record<string, any>
): NextResponse<ApiResponse<T>> {
  const response = successResponse(data, meta);
  
  // Prevent caching
  response.headers.set(
    'Cache-Control',
    'no-store, no-cache, must-revalidate, proxy-revalidate'
  );
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');
  
  return response;
}

/**
 * Validate request body against required fields
 */
export function validateRequestBody<T extends Record<string, any>>(
  body: any,
  requiredFields: (keyof T)[]
): { valid: boolean; missing?: string[] } {
  if (!body || typeof body !== 'object') {
    return { valid: false, missing: requiredFields as string[] };
  }

  const missing = requiredFields.filter(field => {
    const value = body[field];
    return value === undefined || value === null || value === '';
  });

  if (missing.length > 0) {
    return { valid: false, missing: missing as string[] };
  }

  return { valid: true };
}

/**
 * Parse and validate query parameters
 */
export function parseQueryParams(
  searchParams: URLSearchParams,
  schema: Record<string, 'string' | 'number' | 'boolean' | 'date'>
): Record<string, any> {
  const params: Record<string, any> = {};

  for (const [key, type] of Object.entries(schema)) {
    const value = searchParams.get(key);
    
    if (value === null) {
      continue;
    }

    switch (type) {
      case 'string':
        params[key] = value;
        break;
      case 'number':
        const num = parseFloat(value);
        if (!isNaN(num)) {
          params[key] = num;
        }
        break;
      case 'boolean':
        params[key] = value === 'true' || value === '1';
        break;
      case 'date':
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
          params[key] = date.toISOString().split('T')[0];
        }
        break;
    }
  }

  return params;
}

/**
 * Create pagination metadata from query params
 */
export function createPaginationMeta(
  page: number = 1,
  perPage: number = 10,
  total: number = 0
): PaginationMeta {
  const totalPages = Math.ceil(total / perPage);
  
  return {
    page,
    perPage,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };
}

/**
 * Extract pagination params from query string
 */
export function extractPaginationParams(
  searchParams: URLSearchParams,
  defaults: { page?: number; perPage?: number } = {}
): { page: number; perPage: number; offset: number } {
  const page = Math.max(1, parseInt(searchParams.get('page') || String(defaults.page || 1)));
  const perPage = Math.min(
    100,
    Math.max(1, parseInt(searchParams.get('perPage') || String(defaults.perPage || 10)))
  );
  const offset = (page - 1) * perPage;

  return { page, perPage, offset };
}

/**
 * Wrap async route handler with error handling
 */
export function withErrorHandling<T extends any[]>(
  handler: (...args: T) => Promise<NextResponse>
) {
  return async (...args: T): Promise<NextResponse> => {
    try {
      return await handler(...args);
    } catch (error) {
      return errorResponse(error, {
        handler: handler.name,
        args: args.map(arg => {
          // Safely stringify args for logging
          try {
            return JSON.stringify(arg);
          } catch {
            return String(arg);
          }
        }),
      });
    }
  };
}

/**
 * CORS headers for API responses
 */
export function addCorsHeaders(response: NextResponse): NextResponse {
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return response;
}

/**
 * Handle OPTIONS request for CORS
 */
export function handleOptions(): NextResponse {
  const response = new NextResponse(null, { status: 204 });
  return addCorsHeaders(response);
}

/**
 * Aliases for backward compatibility
 */
export const createSuccessResponse = successResponse;
export const createErrorResponse = (
  code: string,
  message: string,
  status: number = 500,
  details?: any
): NextResponse<ApiResponse> => {
  const error = new BookingError(code as any, message, details);
  error.statusCode = status;
  return errorResponse(error);
};
