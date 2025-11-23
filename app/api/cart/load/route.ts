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

    // Fetch cart items for the user
    const { data: cartItems, error } = await supabase
      .from("cart_items")
      .select("*")
      .eq("user_id", user.id)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching cart items:", error);
      return NextResponse.json(
        { error: "Failed to fetch cart items" },
        { status: 500 }
      );
    }

    // Transform cart items to match frontend format
    const transformedItems = (cartItems || []).map((item: any) => ({
      id: item.id,
      timeSlotId: item.time_slot_id,
      exhibitionId: item.exhibition_id,
      showId: item.show_id,
      exhibitionName: item.exhibition_name,
      showName: item.show_name,
      bookingDate: item.booking_date,
      tickets: {
        adult: item.adult_tickets,
        child: item.child_tickets,
        student: item.student_tickets,
        senior: item.senior_tickets,
      },
      totalTickets: item.total_tickets,
      subtotal: item.subtotal,
      expiresAt: item.expires_at,
      createdAt: item.created_at,
      // Add timeSlot placeholder - will be populated by frontend
      timeSlot: {
        id: item.time_slot_id,
        slotDate: item.booking_date,
        startTime: '',
        endTime: '',
        capacity: 0,
        currentBookings: 0,
        bufferCapacity: 0,
        availableCapacity: 0,
        active: true,
        itemType: item.exhibition_id ? 'exhibition' as const : 'show' as const,
        itemId: item.exhibition_id || item.show_id,
        itemName: item.exhibition_name || item.show_name,
      },
    }));

    return NextResponse.json({ items: transformedItems });
  } catch (error: any) {
    console.error("Error in cart load API:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
