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

    // Validate required fields
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { success: false, message: "Invalid amount" },
        { status: 400 }
      );
    }

    // Check if Razorpay credentials are configured
    const razorpayKeyId = process.env.RAZORPAY_KEY_ID;
    const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!razorpayKeyId || !razorpayKeySecret) {
      console.error("Razorpay credentials not configured");
      return NextResponse.json(
        { success: false, message: "Payment gateway not configured" },
        { status: 500 }
      );
    }

    // Create Razorpay order using Razorpay MCP
    try {
      // For now, return a mock order for testing
      // TODO: Integrate with actual Razorpay API
      const orderId = `order_${Date.now()}`;
      
      // Save payment order to database
      const { data: paymentOrder, error: orderError } = await supabase
        .from("payment_orders")
        .insert({
          razorpay_order_id: orderId,
          user_id: user.id,
          amount: amount,
          currency: currency,
          status: "created",
          cart_snapshot: cartItems || [],
          payment_email: contactInfo?.email || user.email,
          payment_contact: contactInfo?.phone || "",
          payment_name: contactInfo?.name || "",
        } as any)
        .select()
        .single();

      if (orderError) {
        console.error("Error creating payment order:", orderError);
        return NextResponse.json(
          { success: false, message: "Failed to create payment order" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        orderId: orderId,
        amount: amount,
        currency: currency,
        keyId: razorpayKeyId,
      });
    } catch (error: any) {
      console.error("Razorpay API error:", error);
      return NextResponse.json(
        { success: false, message: "Failed to create payment order" },
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
