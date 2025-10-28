// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/config';
import { createRazorpayOrder } from '@/lib/razorpay/client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      items,
      customerName,
      customerEmail,
      customerPhone,
      specialRequests,
      visitDate,
      timeSlot
    } = body;

    // Validate required fields
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'No items selected' },
        { status: 400 }
      );
    }

    if (!customerName || !customerEmail || !visitDate) {
      return NextResponse.json(
        { error: 'Missing required customer details' },
        { status: 400 }
      );
    }

    const supabase = getServiceSupabase();

    // Calculate total amount and validate availability
    let totalAmount = 0;
    const bookingItems = [];

    for (const item of items) {
      const { type, id, quantity, ticketType } = item;
      
      // Fetch pricing based on type
      let pricing;
      if (type === 'exhibition') {
        const { data: pricingData } = await supabase
          .from('pricing')
          .select('*')
          .eq('exhibition_id', id)
          .eq('ticket_type', ticketType)
          .eq('active', true)
          .single();
        pricing = pricingData;
      } else if (type === 'show') {
        const { data: pricingData } = await supabase
          .from('show_pricing')
          .select('*')
          .eq('show_id', id)
          .eq('ticket_type', ticketType)
          .eq('active', true)
          .single();
        pricing = pricingData;
      }

      if (!pricing) {
        return NextResponse.json(
          { error: `Pricing not found for ${type} item` },
          { status: 400 }
        );
      }

      const itemTotal = pricing.price * quantity;
      totalAmount += itemTotal;

      bookingItems.push({
        type,
        item_id: id,
        quantity,
        ticket_type: ticketType,
        unit_price: pricing.price,
        total_price: itemTotal
      });
    }

    // Create booking record with pending status
    const bookingReference = `MGM${Date.now()}`;
    
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        booking_reference: bookingReference,
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: customerPhone,
        visit_date: visitDate,
        time_slot: timeSlot,
        total_amount: totalAmount,
        payment_status: 'pending',
        booking_status: 'pending',
        special_requests: specialRequests,
        items: bookingItems,
      })
      .select()
      .single();

    if (bookingError) {
      console.error('Error creating booking:', bookingError);
      return NextResponse.json(
        { error: 'Failed to create booking' },
        { status: 500 }
      );
    }

    // Create Razorpay order
    const razorpayOrder = await createRazorpayOrder(
      totalAmount * 100, // Convert to paise
      'INR',
      bookingReference,
      {
        booking_id: booking.id,
        customer_email: customerEmail,
        customer_name: customerName
      }
    );

    // Update booking with Razorpay order ID
    await supabase
      .from('bookings')
      .update({ razorpay_order_id: razorpayOrder.id })
      .eq('id', booking.id);

    // Log order creation
    await supabase
      .from('payment_logs')
      .insert({
        booking_id: booking.id,
        event_type: 'order.created',
        payload: razorpayOrder
      });

    return NextResponse.json({
      success: true,
      booking: {
        id: booking.id,
        bookingReference,
        totalAmount,
        items: bookingItems
      },
      razorpayOrder: {
        id: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency
      }
    });

  } catch (error: any) {
    console.error('Error in create order API:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create order' },
      { status: 500 }
    );
  }
}
