import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/config';
import { 
  getRazorpayConfig,
  validateRazorpayConfig,
  DEFAULT_CURRENCY,
} from '@/lib/razorpay/config';
import { 
  formatAmountForRazorpay, 
  generateReceipt,
  parseRazorpayError,
} from '@/lib/razorpay/utils';
import { createRazorpayOrder } from '@/lib/razorpay/client';

export async function POST(request: NextRequest) {
  try {
    // Validate Razorpay configuration
    const configValidation = validateRazorpayConfig();
    if (!configValidation.valid) {
      return NextResponse.json(
        { 
          success: false, 
          message: `Missing Razorpay configuration: ${configValidation.missing.join(', ')}` 
        },
        { status: 500 }
      );
    }

    const supabase = getServiceSupabase();
    
    // Get request body
    const body = await request.json();
    const { cartItems, userDetails } = body;

    // Validate required fields
    if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Cart items are required' },
        { status: 400 }
      );
    }

    if (!userDetails || !userDetails.email || !userDetails.name) {
      return NextResponse.json(
        { success: false, message: 'User details (name, email) are required' },
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

    // Validate cart items still available
    for (const item of cartItems) {
      const { data: timeSlot, error: slotError } = await supabase
        .from('time_slots')
        .select('capacity, current_bookings, buffer_capacity')
        .eq('id', item.timeSlotId)
        .single();

      if (slotError || !timeSlot) {
        return NextResponse.json(
          { success: false, message: `Time slot ${item.timeSlotId} not found` },
          { status: 404 }
        );
      }

      const availableCapacity = 
        timeSlot.capacity - 
        (timeSlot.current_bookings || 0) - 
        (timeSlot.buffer_capacity || 5);

      if (availableCapacity < item.totalTickets) {
        return NextResponse.json(
          { 
            success: false, 
            message: `Insufficient capacity for ${item.exhibitionName || item.showName}` 
          },
          { status: 409 }
        );
      }
    }

    // Calculate total amount
    const totalAmount = cartItems.reduce((sum: number, item: any) => sum + (item.subtotal || 0), 0);
    
    // For free admission, skip Razorpay and create bookings directly
    if (totalAmount === 0) {
      return NextResponse.json({
        success: true,
        isFree: true,
        message: 'Free admission - no payment required',
      });
    }

    // Create Razorpay order
    const amountInPaise = formatAmountForRazorpay(totalAmount);
    const receipt = generateReceipt('booking');
    const config = getRazorpayConfig();

    let razorpayOrder;
    try {
      razorpayOrder = await createRazorpayOrder(
        amountInPaise,
        DEFAULT_CURRENCY,
        receipt,
        {
          user_id: user.id,
          user_email: userDetails.email,
          items_count: cartItems.length.toString(),
        },
        config.environment
      );
    } catch (error: any) {
      console.error('Razorpay order creation failed:', error);
      const errorMessage = parseRazorpayError(error);
      return NextResponse.json(
        { success: false, message: errorMessage },
        { status: 500 }
      );
    }

    // Save payment order to database
    const { data: paymentOrder, error: insertError } = await supabase
      .from('payment_orders')
      .insert({
        razorpay_order_id: razorpayOrder.id,
        user_id: user.id,
        amount: totalAmount,
        currency: DEFAULT_CURRENCY,
        status: 'created',
        cart_snapshot: cartItems,
        payment_email: userDetails.email,
        payment_contact: userDetails.phone,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Failed to save payment order:', insertError);
      return NextResponse.json(
        { success: false, message: 'Failed to save payment order' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      orderId: razorpayOrder.id,
      amount: totalAmount,
      amountInPaise,
      currency: DEFAULT_CURRENCY,
      razorpayKeyId: config.keyId,
      userDetails: {
        name: userDetails.name,
        email: userDetails.email,
        contact: userDetails.phone,
      },
    });
  } catch (error: any) {
    console.error('Error creating payment order:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
