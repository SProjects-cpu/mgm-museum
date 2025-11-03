// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/client';

/**
 * GET /api/pricing/current
 * Get current pricing for an exhibition or show
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const exhibitionId = searchParams.get('exhibitionId');
    const showId = searchParams.get('showId');
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];

    if (!exhibitionId && !showId) {
      return NextResponse.json(
        { error: 'Either exhibitionId or showId is required' },
        { status: 400 }
      );
    }

    const supabase = getServiceSupabase();

    // Use the get_current_pricing function
    const { data, error } = await supabase.rpc('get_current_pricing', {
      p_exhibition_id: exhibitionId || null,
      p_show_id: showId || null,
      p_date: date,
    });

    if (error) {
      console.error('Error fetching pricing:', error);
      return NextResponse.json(
        { error: 'Failed to fetch pricing' },
        { status: 500 }
      );
    }

    // Transform data into a more usable format
    const pricing: Record<string, { price: number; currency: string }> = {};
    if (data && Array.isArray(data)) {
      data.forEach((item: any) => {
        pricing[item.ticket_type] = {
          price: parseFloat(item.price),
          currency: item.currency,
        };
      });
    }

    // If no pricing found, return free admission
    if (Object.keys(pricing).length === 0) {
      pricing.adult = { price: 0, currency: 'INR' };
      pricing.child = { price: 0, currency: 'INR' };
      pricing.student = { price: 0, currency: 'INR' };
      pricing.senior = { price: 0, currency: 'INR' };
    }

    return NextResponse.json({
      success: true,
      pricing,
    });
  } catch (error) {
    console.error('Current pricing API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
