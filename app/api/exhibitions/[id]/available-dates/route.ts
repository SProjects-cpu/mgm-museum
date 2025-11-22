import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const exhibitionId = params.id;

    // Get time slots for the next 90 days
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + 90);

    const { data: timeSlots, error } = await supabase
      .from("time_slots")
      .select("slot_date, capacity, current_bookings, active")
      .eq("exhibition_id", exhibitionId)
      .eq("active", true)
      .gte("slot_date", today.toISOString().split('T')[0])
      .lte("slot_date", endDate.toISOString().split('T')[0])
      .order("slot_date", { ascending: true });

    if (error) {
      console.error("Error fetching time slots:", error);
      return NextResponse.json(
        {
          success: false,
          error: { message: "Failed to fetch available dates" },
        },
        { status: 500 }
      );
    }

    // Group by date and calculate availability
    const dateMap = new Map<string, { capacity: number; booked: number }>();
    
    (timeSlots || []).forEach((slot: any) => {
      const date = slot.slot_date;
      const existing = dateMap.get(date) || { capacity: 0, booked: 0 };
      dateMap.set(date, {
        capacity: existing.capacity + slot.capacity,
        booked: existing.booked + (slot.current_bookings || 0),
      });
    });

    // Convert to array format expected by calendar
    const dates = Array.from(dateMap.entries()).map(([date, stats]) => ({
      date,
      isAvailable: true,
      isFull: stats.booked >= stats.capacity,
      availableCapacity: stats.capacity - stats.booked,
      totalCapacity: stats.capacity,
    }));

    return NextResponse.json({
      success: true,
      data: { dates },
    });
  } catch (error: any) {
    console.error("Error in available-dates API:", error);
    return NextResponse.json(
      {
        success: false,
        error: { message: error.message || "Internal server error" },
      },
      { status: 500 }
    );
  }
}
