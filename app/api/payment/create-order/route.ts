import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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
    const { amount, currency = "INR", cartItems, contactInfo } = body;

    console.log('Create order request:', { amount, currency, cartItemsCount: cartItems?.length });

    // Validate required fields
    if (!amount || amount <= 0) {
      console.error('Invalid amount received:', amount);
      return NextResponse.json(
        { success: false, message: `Invalid amount: ${amount}. Amount must be greater than 0.` },
        { status: 400 }
      );
    }

    // Razorpay requires minimum 100 paise (₹1)
    if (amount < 100) {
      console.error('Amount too low for Razorpay:', amount);
      return NextResponse.json(
        { success: false, message: `Amount too low: ₹${amount/100}. Minimum amount is ₹1.` },
        { status: 400 }
      );
    }

    // Check if Razorpay credentials are configured
    // Check both NEXT_PUBLIC_ and non-public versions
    const razorpayKeyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID;
    const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;

    console.log('Razorpay config check:', {
      hasKeyId: !!razorpayKeyId,
      hasKeySecret: !!razorpayKeySecret,
      keyIdPrefix: razorpayKeyId?.substring(0, 8)
    });

    if (!razorpayKeyId || !razorpayKeySecret) {
      console.error("Razorpay credentials not configured", {
        hasKeyId: !!razorpayKeyId,
        hasKeySecret: !!razorpayKeySecret
      });
      return NextResponse.json(
        { success: false, message: "Payment gateway not configured. Please contact support." },
        { status: 500 }
      );
    }

    // Create Razorpay order
    try {
      // Use Razorpay SDK to create order
      const Razorpay = require('razorpay');
      const razorpay = new Razorpay({
        key_id: razorpayKeyId,
        key_secret: razorpayKeySecret,
      });

      console.log('Creating Razorpay order with amount:', amount);

      const razorpayOrder = await razorpay.orders.create({
        amount: amount,
        currency: currency,
        receipt: `receipt_${Date.now()}`,
        notes: {
          user_id: user.id,
          user_email: contactInfo?.email || user.email,
          items_count: cartItems?.length || 0,
        },
      });

      console.log('Razorpay order created:', razorpayOrder.id);
      
      // Save payment order to database
      const { error: orderError } = await supabase
        .from("payment_orders")
        .insert({
          razorpay_order_id: razorpayOrder.id,
          user_id: user.id,
          amount: amount,
          currency: currency,
          status: "created",
          cart_snapshot: cartItems || [],
          payment_email: contactInfo?.email || user.email,
          payment_contact: contactInfo?.phone || "",
          payment_name: contactInfo?.name || "",
        } as any);

      if (orderError) {
        console.error("Error saving payment order to database:", orderError);
        // Continue anyway since Razorpay order was created
      }

      return NextResponse.json({
        success: true,
        orderId: razorpayOrder.id,
        amountInPaise: amount,
        currency: currency,
        razorpayKeyId: razorpayKeyId,
        isFree: amount === 0,
      });
    } catch (error: any) {
      console.error("Razorpay API error:", error);
      return NextResponse.json(
        { success: false, message: `Failed to create payment order: ${error.message}` },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("Error in create-order API:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
