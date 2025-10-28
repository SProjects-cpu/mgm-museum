import { NextResponse } from 'next/server';

/**
 * Health Check Endpoint
 * Returns the status of the application and its services
 */
export async function GET() {
  try {
    const healthCheck = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      services: {
        supabase: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'configured' : 'not_configured',
        resend: process.env.RESEND_API_KEY ? 'configured' : 'not_configured',
        razorpay: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ? 'configured' : 'not_configured',
      },
      version: '1.0.0',
    };

    return NextResponse.json(healthCheck, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
