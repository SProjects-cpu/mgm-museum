import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;

    console.log('Payment verification request:', {
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      userId: user.id
    });

    // Validate required fields
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { success: false, message: "Missing payment verification data" },
        { status: 400 }
      );
    }

    // Verify signature
    const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!razorpayKeySecret) {
      console.error("Razorpay key secret not configured");
      return NextResponse.json(
        { success: false, message: "Payment gateway not configured" },
        { status: 500 }
      );
    }

    const generatedSignature = crypto
      .createHmac("sha256", razorpayKeySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      console.error("Invalid payment signature");
      return NextResponse.json(
        { success: false, message: "Invalid payment signature" },
        { status: 400 }
      );
    }

    console.log('Payment signature verified successfully');

    // Get payment order from database
    const { data: paymentOrder, error: orderError } = await supabase
      .from("payment_orders")
      .select("*")
      .eq("razorpay_order_id", razorpay_order_id)
      .eq("user_id", user.id)
      .single();

    if (orderError || !paymentOrder) {
      console.error("Payment order not found:", orderError);
      return NextResponse.json(
        { success: false, message: "Payment order not found" },
        { status: 404 }
      );
    }

    console.log('Payment order found:', (paymentOrder as any).id);

    // Update payment order status
    // @ts-ignore - Supabase type inference issue
    const { error: updateError } = await supabase
      .from("payment_orders")
      // @ts-ignore
      .update({
        razorpay_payment_id: razorpay_payment_id,
        razorpay_signature: razorpay_signature,
        status: "paid",
        paid_at: new Date().toISOString(),
      })
      .eq("id", (paymentOrder as any).id);

    if (updateError) {
      console.error("Error updating payment order:", updateError);
    }

    // Create bookings from cart snapshot
    const cartItems = (paymentOrder as any).cart_snapshot || [];
    console.log('Creating bookings for cart items:', cartItems.length);

    if (cartItems.length === 0) {
      console.error("No cart items in payment order");
      return NextResponse.json(
        { success: false, message: "No items to book" },
        { status: 400 }
      );
    }

    const bookings = [];
    
    for (const item of cartItems) {
      try {
        // Get time slot details
        const { data: timeSlot, error: slotError } = await supabase
          .from("time_slots")
          .select("*")
          .eq("id", item.timeSlotId)
          .single();

        if (slotError || !timeSlot) {
          console.error(`Time slot not found for item:`, item);
          continue;
        }

        // Create booking
        const bookingData = {
          user_id: user.id,
          exhibition_id: item.exhibitionId || null,
          show_id: item.showId || null,
          time_slot_id: item.timeSlotId,
          booking_date: item.bookingDate,
          adult_tickets: item.tickets?.adult || 0,
          child_tickets: item.tickets?.child || 0,
          student_tickets: item.tickets?.student || 0,
          senior_tickets: item.tickets?.senior || 0,
          total_tickets: item.totalTickets,
          total_amount: item.subtotal,
          payment_status: "paid",
          booking_status: "confirmed",
          payment_order_id: (paymentOrder as any).id,
          razorpay_payment_id: razorpay_payment_id,
          customer_name: (paymentOrder as any).payment_name,
          customer_email: (paymentOrder as any).payment_email,
          customer_phone: (paymentOrder as any).payment_contact,
        };

        // @ts-ignore - Supabase type inference issue
        const { data: booking, error: bookingError } = await supabase
          .from("bookings")
          // @ts-ignore
          .insert(bookingData)
          .select()
          .single();

        if (bookingError) {
          console.error("Error creating booking:", bookingError);
          continue;
        }

        if (booking) {
          console.log('Booking created:', (booking as any).id);
          bookings.push(booking);
        }
      } catch (error) {
        console.error("Error processing cart item:", error);
      }
    }

    if (bookings.length === 0) {
      console.error("No bookings were created");
      return NextResponse.json(
        { success: false, message: "Failed to create bookings" },
        { status: 500 }
      );
    }

    console.log(`Successfully created ${bookings.length} bookings`);

    return NextResponse.json({
      success: true,
      message: "Payment verified and bookings created",
      bookings: bookings,
      paymentId: razorpay_payment_id,
    });
  } catch (error: any) {
    console.error("Error in payment verification:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
