// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getAnalyticsDashboard } from '@/lib/services/analytics';

export async function GET(request: NextRequest) {
  try {
    // TODO: Add admin authentication check

    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('startDate') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const endDate = searchParams.get('endDate') || new Date().toISOString();

    const analytics = await getAnalyticsDashboard(startDate, endDate);

    return NextResponse.json(analytics);
  } catch (error: any) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}







