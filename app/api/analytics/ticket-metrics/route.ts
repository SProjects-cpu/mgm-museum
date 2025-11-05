/**
 * Ticket Analytics Metrics API
 * Provides access to ticket download analytics and performance metrics
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAnalyticsMetrics, logAnalyticsMetrics } from '@/lib/analytics/ticket-analytics';

/**
 * GET /api/analytics/ticket-metrics
 * Retrieve current ticket download analytics metrics
 * Requires authentication (admin or authenticated user)
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Validate authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    // 2. Create Supabase client with user's auth token
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: authHeader,
          },
        },
      }
    );

    // 3. Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, message: 'Invalid authentication' },
        { status: 401 }
      );
    }

    // 4. Get analytics metrics
    const metrics = getAnalyticsMetrics();

    // 5. Log metrics to console
    logAnalyticsMetrics();

    // 6. Return metrics
    return NextResponse.json(
      {
        success: true,
        data: {
          ...metrics,
          timestamp: new Date().toISOString(),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching analytics metrics:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch analytics metrics',
      },
      { status: 500 }
    );
  }
}
