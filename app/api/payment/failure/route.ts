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
    const { error, orderId } = body;

    console.log('Payment failure logged:', {
      userId: user.id,
      orderId: orderId,
      errorCode: error?.code,
      errorDescription: error?.description,
      errorReason: error?.reason,
    });

    // Log payment failure to database if we have an order ID
    if (orderId) {
      // @ts-ignore
      await supabase
        .from("payment_orders")
        // @ts-ignore
        .update({
          status: "failed",
          failure_reason: error?.description || error?.reason || "Payment failed",
          failure_code: error?.code,
        })
        .eq("razorpay_order_id", orderId)
        .eq("user_id", user.id);
    }

    return NextResponse.json({
      success: true,
      message: "Payment failure logged",
    });
  } catch (error: any) {
    console.error("Error logging payment failure:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
