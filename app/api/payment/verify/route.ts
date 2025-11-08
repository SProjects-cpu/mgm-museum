import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyPaymentSignature, generateBookingReference } from '@/lib/razorpay/utils';
import { sendBookingConfirmation } from '@/lib/email/send-booking-confirmation';

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Create Supabase client with user's auth token
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: authHeader
          }
        }
      }
    );
    
    // Get request body
    const body = await request.json();
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;

    // Validate required fields
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { success: false, message: 'Missing payment verification data' },
        { status: 400 }
      );
    }

    // Verify payment signature
    const isValid = verifyPaymentSignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    );

    if (!isValid) {
      // Log security event
      console.error('Invalid payment signature detected:', {
        order_id: razorpay_order_id,
        payment_id: razorpay_payment_id,
      });

      return NextResponse.json(
        { success: false, message: 'Invalid payment signature' },
        { status: 400 }
      );
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('Auth error:', authError);
      return NextResponse.json(
        { success: false, message: 'Invalid authentication' },
        { status: 401 }
      );
    }

    console.log('Verifying payment for user:', user.id);

    // Ensure user exists in public.users table
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('id', user.id)
      .single();

    if (!existingUser) {
      console.log('Creating user record in public.users for:', user.id);
      const { error: userError } = await supabase
        .from('users')
        .insert({
          id: user.id,
          email: user.email || '',
          // Let database handle timestamps with DEFAULT NOW()
        });
      
      if (userError) {
        console.error('Failed to create user record:', userError);
        return NextResponse.json(
          { success: false, message: 'Failed to create user account' },
          { status: 500 }
        );
      }
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

    // Check if already processed
    if (paymentOrder.status === 'paid') {
      return NextResponse.json(
        { success: false, message: 'Payment already processed' },
        { status: 400 }
      );
    }

    // Update payment order status
    const { error: updateError } = await supabase
      .from('payment_orders')
      .update({
        status: 'paid',
        payment_id: razorpay_payment_id,
        payment_signature: razorpay_signature,
        // Let database handle updated_at with DEFAULT NOW()
      })
      .eq('id', paymentOrder.id);

    if (updateError) {
      console.error('Failed to update payment order:', updateError);
      return NextResponse.json(
        { success: false, message: 'Failed to update payment status' },
        { status: 500 }
      );
    }

    // Convert cart items to bookings
    const cartSnapshot = paymentOrder.cart_snapshot as any;
    const cartItems = Array.isArray(cartSnapshot) ? cartSnapshot : (cartSnapshot?.items || []);
    
    console.log('Cart snapshot structure:', {
      isArray: Array.isArray(cartSnapshot),
      cartItemsLength: cartItems.length,
      firstItem: cartItems[0],
    });
    
    if (cartItems.length === 0) {
      console.error('No cart items found in snapshot:', paymentOrder.cart_snapshot);
      return NextResponse.json(
        { success: false, message: 'No items found in cart snapshot' },
        { status: 400 }
      );
    }

    const bookings: any[] = [];
    const tickets: any[] = [];
    const errors: any[] = [];

    for (const item of cartItems) {
      // Generate booking reference using utility function
      const bookingReference = generateBookingReference();

      console.log('Creating booking for item:', {
        timeSlotId: item.timeSlotId,
        exhibitionId: item.exhibitionId,
        showId: item.showId,
        bookingDate: item.bookingDate,
      });

      // Get time slot date for accurate booking date - CRITICAL: Always use slot_date as source of truth
      const { data: timeSlot, error: timeSlotError } = await supabase
        .from('time_slots')
        .select('slot_date, start_time, end_time')
        .eq('id', item.timeSlotId)
        .single();

      if (timeSlotError || !timeSlot) {
        console.error('Time slot not found for booking:', {
          timeSlotId: item.timeSlotId,
          error: timeSlotError,
        });
        errors.push({
          item: item.exhibitionName || item.showName,
          error: 'Time slot not found - cannot create booking',
          code: 'TIME_SLOT_NOT_FOUND',
        });
        continue;
      }

      const actualBookingDate = timeSlot.slot_date; // Always use slot_date from database

      // Create booking
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert({
          booking_reference: bookingReference,
          user_id: user.id,
          time_slot_id: item.timeSlotId,
          exhibition_id: item.exhibitionId || null,
          show_id: item.showId || null,
          booking_date: actualBookingDate,
          guest_name: (paymentOrder as any).payment_name || user.user_metadata?.name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'Guest',
          guest_email: paymentOrder.payment_email || user.email,
          guest_phone: paymentOrder.payment_contact || null,
          total_amount: item.subtotal || 0,
          status: 'confirmed',
          payment_status: 'paid',
          payment_order_id: razorpay_order_id,
          payment_id: razorpay_payment_id,
          payment_method: 'razorpay',
        })
        .select()
        .single();

      if (bookingError) {
        console.error('Failed to create booking:', {
          error: bookingError,
          errorCode: bookingError.code,
          errorMessage: bookingError.message,
          errorDetails: bookingError.details,
          item: item,
        });
        errors.push({
          item: item.exhibitionName || item.showName,
          error: bookingError.message,
          code: bookingError.code,
        });
        continue;
      }

      console.log('Booking created successfully:', booking.id);
      bookings.push(booking);

      // Create ticket record (PDF generation will be done separately)
      const ticketNumber = `TKT${Date.now()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      const { data: ticket, error: ticketError } = await supabase
        .from('tickets')
        .insert({
          booking_id: booking.id,
          ticket_number: ticketNumber,
          qr_code: bookingReference, // QR code will contain booking reference
          status: 'active',
        })
        .select()
        .single();

      if (!ticketError && ticket) {
        tickets.push(ticket);
      }
    }

    // Clear cart items for user
    await supabase
      .from('cart_items')
      .delete()
      .eq('user_id', user.id);

    console.log('Payment verification complete:', {
      bookingsCreated: bookings.length,
      ticketsCreated: tickets.length,
      bookingIds: bookings.map(b => b.id),
      errors: errors,
    });

    if (bookings.length === 0) {
      console.error('No bookings were created despite successful payment', {
        totalItems: cartItems.length,
        errors: errors,
      });
      
      // Return detailed error message
      const errorMessage = errors.length > 0
        ? `Booking creation failed: ${errors[0].error} (Code: ${errors[0].code})`
        : 'Failed to create bookings. Please contact support.';
      
      return NextResponse.json(
        { 
          success: false, 
          message: errorMessage,
          details: errors,
        },
        { status: 500 }
      );
    }

    // Send booking confirmation email
    if (bookings.length > 0 && bookings[0]) {
      const firstBooking = bookings[0];
      const guestEmail = paymentOrder.payment_email || user.email;
      
      // Get event details
      const { data: eventData } = await supabase
        .from('bookings')
        .select(`
          exhibitions:exhibition_id (name),
          shows:show_id (name),
          time_slots:time_slot_id (start_time, end_time, slot_date)
        `)
        .eq('id', firstBooking.id)
        .single();

      if (eventData && guestEmail) {
        const exhibitions = eventData.exhibitions as any;
        const shows = eventData.shows as any;
        const timeSlots = eventData.time_slots as any;
        
        const eventTitle = exhibitions?.name || shows?.name || 'Museum Visit';
        
        if (timeSlots) {
          const visitDate = new Date(timeSlots.slot_date).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          });
          
          const formatTime = (time: string) => {
            const [hours, minutes] = time.split(':').map(Number);
            const period = hours >= 12 ? 'PM' : 'AM';
            const displayHours = hours % 12 || 12;
            return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
          };
          
          const timeSlot = `${formatTime(timeSlots.start_time)} - ${formatTime(timeSlots.end_time)}`;
          
          // Send email (don't block response if email fails)
          console.log('Attempting to send confirmation email to:', guestEmail);
          sendBookingConfirmation({
            to: guestEmail,
            guestName: firstBooking.guest_name,
            bookingReference: firstBooking.booking_reference,
            eventTitle,
            visitDate,
            timeSlot,
            totalAmount: Number(firstBooking.total_amount),
            ticketCount: bookings.length,
            paymentId: razorpay_payment_id,
          })
            .then((result) => {
              if (result.success) {
                console.log('Confirmation email sent successfully to:', guestEmail);
              } else {
                console.error('Failed to send confirmation email:', result.error);
              }
            })
            .catch((error) => {
              console.error('Exception while sending confirmation email:', error);
            });
        }
      }
    }

    return NextResponse.json({
      success: true,
      bookings,
      tickets,
      message: 'Payment verified and bookings created successfully',
    });
  } catch (error: any) {
    console.error('Error verifying payment:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
