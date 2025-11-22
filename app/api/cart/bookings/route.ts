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

    // Fetch confirmed bookings for the user
    const { data: bookings, error } = await supabase
      .from("bookings")
      .select(`
        *,
        exhibitions:exhibition_id(name, slug),
        time_slots:time_slot_id(start_time, end_time, slot_date)
      `)
      .eq("user_id", user.id)
      .in("status", ["confirmed", "completed"])
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching bookings:", error);
      return NextResponse.json(
        { error: "Failed to fetch bookings" },
        { status: 500 }
      );
    }

    return NextResponse.json({ bookings: bookings || [] });
  } catch (error: any) {
    console.error("Error in cart bookings API:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
