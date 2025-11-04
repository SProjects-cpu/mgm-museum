import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/config';
import { parseRazorpayError } from '@/lib/razorpay/utils';

export async function POST(request: NextRequest) {
  try {
    const supabase = getServiceSupabase();
    
    // Get request body
    const body = await request.json();
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      error_code, 
      error_description,
      error_source,
      error_step,
      error_reason 
    } = body;

    // Validate required fields
    if (!razorpay_order_id) {
      return NextResponse.json(
        { success: false, message: 'Order ID is required' },
        { status: 400 }
      );
    }

    // Get authenticated user
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return NextResponse.json(
        { success: false, message: 'Invalid authentication' },
        { status: 401 }
      );
    }

    // Fetch payment order from database
    const { data: paymentOrder, error: fetchError } = await supabase
      .from('payment_orders')
      .select('*')
      .eq('razorpay_order_id', razorpay_order_id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !paymentOrder) {
      return NextResponse.json(
        { success: false, message: 'Payment order not found' },
        { status: 404 }
      );
    }

    // Update payment order with failure details
    const { error: updateError } = await supabase
      .from('payment_orders')
      .update({
        status: 'failed',
        payment_id: razorpay_payment_id || null,
        error_code: error_code || 'UNKNOWN',
        error_description: error_description || error_reason || 'Payment failed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', paymentOrder.id);

    if (updateError) {
      console.error('Failed to update payment order:', updateError);
    }

    // Log failure for admin review
    console.error('Payment failure:', {
      order_id: razorpay_order_id,
      payment_id: razorpay_payment_id,
      user_id: user.id,
      error_code,
      error_description,
      error_source,
      error_step,
      error_reason,
    });

    // Parse error for user-friendly message
    const userMessage = parseRazorpayError({
      error: {
        code: error_code,
        description: error_description || error_reason,
      },
    });

    return NextResponse.json({
      success: false,
      message: userMessage,
      canRetry: true,
      orderId: razorpay_order_id,
      errorDetails: {
        code: error_code,
        step: error_step,
        source: error_source,
      },
    });
  } catch (error: any) {
    console.error('Error handling payment failure:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to process payment failure' },
      { status: 500 }
    );
  }
}
