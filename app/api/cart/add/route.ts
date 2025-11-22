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
    const {
      timeSlotId,
      bookingDate,
      exhibitionId,
      showId,
      tickets,
      totalTickets,
      subtotal,
    } = body;

    // Validate required fields
    if (!timeSlotId || !bookingDate || !totalTickets) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Set expiration time (15 minutes from now)
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15);

    // Get exhibition or show name
    let itemName = "";
    if (exhibitionId) {
      const { data: exhibition } = await supabase
        .from("exhibitions")
        .select("name")
        .eq("id", exhibitionId)
        .single();
      itemName = exhibition?.name || "";
    } else if (showId) {
      const { data: show } = await supabase
        .from("shows")
        .select("name")
        .eq("id", showId)
        .single();
      itemName = show?.name || "";
    }

    // Insert cart item
    const { data: cartItem, error } = await supabase
      .from("cart_items")
      .insert({
        user_id: user.id,
        time_slot_id: timeSlotId,
        exhibition_id: exhibitionId || null,
        show_id: showId || null,
        exhibition_name: exhibitionId ? itemName : null,
        show_name: showId ? itemName : null,
        booking_date: bookingDate,
        adult_tickets: tickets.adult || 0,
        child_tickets: tickets.child || 0,
        student_tickets: tickets.student || 0,
        senior_tickets: tickets.senior || 0,
        total_tickets: totalTickets,
        subtotal: subtotal,
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("Error adding to cart:", error);
      return NextResponse.json(
        { success: false, message: "Failed to add item to cart" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Item added to cart",
      cartItem,
    });
  } catch (error: any) {
    console.error("Error in cart add API:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
