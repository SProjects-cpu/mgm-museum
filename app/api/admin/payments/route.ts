// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/client';

/**
 * GET /api/admin/payments
 * Get all payment orders with filters
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const status = searchParams.get('status');
    const searchTerm = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const supabase = getServiceSupabase();

    // Build query
    let query = supabase
      .from('payment_orders')
      .select(`
        *,
        user:users!payment_orders_user_id_fkey(
          email,
          full_name
        )
      `, { count: 'exact' })
      .order('created_at', { ascending: false });

    // Apply filters
    if (startDate) {
      query = query.gte('created_at', startDate);
    }
    if (endDate) {
      query = query.lte('created_at', endDate);
    }
    if (status) {
      query = query.eq('status', status);
    }
    if (searchTerm) {
      query = query.or(`razorpay_order_id.ilike.%${searchTerm}%,payment_id.ilike.%${searchTerm}%`);
    }

    // Pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data: payments, error, count } = await query;

    if (error) {
      console.error('Error fetching payments:', error);
      return NextResponse.json(
        { error: 'Failed to fetch payments' },
        { status: 500 }
      );
    }

    // Get stats
    const { data: allPayments } = await supabase
      .from('payment_orders')
      .select('status, amount');

    const paymentStats = {
      totalOrders: count || 0,
      completedOrders: allPayments?.filter(p => p.status === 'completed').length || 0,
      totalRevenue: allPayments?.filter(p => p.status === 'completed').reduce((sum, p) => sum + (p.amount || 0), 0) || 0,
      pendingAmount: allPayments?.filter(p => p.status === 'created' || p.status === 'pending').reduce((sum, p) => sum + (p.amount || 0), 0) || 0,
    };

    return NextResponse.json({
      success: true,
      payments,
      stats: paymentStats,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      }
    });
  } catch (error) {
    console.error('Admin payments API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
