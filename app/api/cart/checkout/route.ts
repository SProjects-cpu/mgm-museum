// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/config';

// POST - Initiate checkout from cart
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { cartId, visitorInfo } = body;

    if (!cartId || !visitorInfo) {
      return NextResponse.json(
        { error: 'Cart ID and visitor information required' },
        { status: 400 }
      );
    }

    const supabase = getServiceSupabase();

    // Fetch cart with items
    const { data: cart, error: cartError } = await supabase
      .from('booking_carts')
      .select(`
        *,
        items:cart_items(
          *,
          time_slot:time_slots(*)
        )
      `)
      .eq('cart_id', cartId)
      .eq('status', 'active')
      .single();

    if (cartError || !cart) {
      return NextResponse.json(
        { error: 'Cart not found or expired' },
        { status: 404 }
      );
    }

    // Check if cart is expired
    if (new Date(cart.expires_at) < new Date()) {
      await supabase
        .from('booking_carts')
        .update({ status: 'expired' })
        .eq('id', cart.id);

      return NextResponse.json(
        { error: 'Cart has expired' },
        { status: 400 }
      );
    }

    // Validate all items still have capacity
    for (const item of cart.items) {
      const { data: timeSlot } = await supabase
        .from('time_slots')
        .select('capacity, current_bookings, buffer_capacity')
        .eq('id', item.time_slot_id)
        .single();

      if (timeSlot) {
        const availableCapacity = timeSlot.capacity - 
          (timeSlot.current_bookings || 0) - 
          (timeSlot.buffer_capacity || 5);

        if (availableCapacity < item.total_tickets) {
          return NextResponse.json(
            { 
              error: 'Insufficient capacity',
              itemId: item.id,
              available: availableCapacity
            },
            { status: 400 }
          );
        }
      }
    }

    // Create bookings for each cart item
    const bookings = [];

    for (const item of cart.items) {
      // Generate booking reference
      const { data: refData } = await supabase
        .rpc('generate_booking_reference');

      const bookingReference = refData || `BK${Date.now()}`;

      // Create booking
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert({
          booking_reference: bookingReference,
          cart_id: cartId,
          time_slot_id: item.time_slot_id,
          exhibition_id: item.exhibition_id,
          show_id: item.show_id,
          visitor_name: visitorInfo.name,
          visitor_email: visitorInfo.email,
          visitor_phone: visitorInfo.phone || null,
          adult_tickets: item.adult_tickets,
          child_tickets: item.child_tickets,
          student_tickets: item.student_tickets,
          senior_tickets: item.senior_tickets,
          total_tickets: item.total_tickets,
          subtotal: item.subtotal,
          total_amount: item.subtotal,
          booking_date: item.booking_date,
          status: 'pending',
          payment_status: item.subtotal > 0 ? 'pending' : 'free',
          special_requirements: visitorInfo.specialRequirements || null
        })
        .select()
        .single();

      if (bookingError) {
        console.error('Booking creation error:', bookingError);
        continue;
      }

      bookings.push(booking);
    }

    // Mark cart as converted
    await supabase
      .from('booking_carts')
      .update({ status: 'converted' })
      .eq('cart_id', cartId);

    return NextResponse.json({
      success: true,
      bookings,
      requiresPayment: cart.total_amount > 0,
      totalAmount: cart.total_amount
    });
  } catch (error: any) {
    console.error('Checkout error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
