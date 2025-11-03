// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getAnalytics } from '@/lib/graphql/resolvers-impl';

export async function GET(request: NextRequest) {
  try {
    // TODO: Add admin authentication check
    
    const searchParams = request.nextUrl.searchParams;
    const month = searchParams.get('month'); // Format: YYYY-MM
    
    if (!month) {
      return NextResponse.json({ error: 'Month parameter required' }, { status: 400 });
    }

    // Calculate date range
    const startDate = `${month}-01`;
    const endDate = new Date(month + '-01');
    endDate.setMonth(endDate.getMonth() + 1);
    endDate.setDate(0); // Last day of month
    const endDateStr = endDate.toISOString().split('T')[0];

    // Get analytics data
    const analytics = await getAnalytics(startDate, endDateStr);

    return NextResponse.json({
      month,
      ...analytics,
    });
  } catch (error: any) {
    console.error('Error fetching monthly report:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch report' },
      { status: 500 }
    );
  }
}







