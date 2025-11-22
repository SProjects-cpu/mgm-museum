import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Fetch pending cart items
    const { data: cartItems, error: cartError } = await supabase
      .from("cart_items")
      .select(`
        *,
        exhibitions:exhibition_id(name, slug),
        shows:show_id(name, slug),
        time_slots:time_slot_id(start_time, end_time, slot_date)
      `)
      .eq("user_id", user.id)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false });

    // Fetch confirmed bookings
    const { data: bookings, error: bookingsError } = await supabase
      .from("bookings")
      .select(`
        *,
        exhibitions:exhibition_id(name, slug),
        shows:show_id(name, slug),
        time_slots:time_slot_id(start_time, end_time, slot_date)
      `)
      .eq("user_id", user.id)
      .in("status", ["confirmed", "completed"])
      .order("created_at", { ascending: false });

    if (cartError || bookingsError) {
      console.error("Error fetching cart data:", cartError || bookingsError);
      return NextResponse.json(
        { success: false, error: "Failed to fetch cart data" },
        { status: 500 }
      );
    }

    // Transform bookings to include has_feedback flag
    const confirmedWithFeedback = (bookings || []).map((booking: any) => ({
      ...booking,
      has_feedback: false, // TODO: Check feedback table
    }));

    return NextResponse.json({
      success: true,
      pending: cartItems || [],
      confirmed: confirmedWithFeedback,
    });
  } catch (error: any) {
    console.error("Error in cart bookings API:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
