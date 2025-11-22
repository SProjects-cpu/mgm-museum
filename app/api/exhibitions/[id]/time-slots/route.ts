import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const exhibitionId = params.id;
    const { searchParams } = new URL(request.url);
    const dateStr = searchParams.get("date");

    if (!dateStr) {
      return NextResponse.json(
        {
          success: false,
          error: { message: "Date parameter is required" },
        },
        { status: 400 }
      );
    }

    // Fetch time slots for the specific date
    const { data: timeSlots, error: slotsError } = await supabase
      .from("time_slots")
      .select("*")
      .eq("exhibition_id", exhibitionId)
      .eq("slot_date", dateStr)
      .eq("active", true)
      .order("start_time", { ascending: true });

    if (slotsError) {
      console.error("Error fetching time slots:", slotsError);
      return NextResponse.json(
        {
          success: false,
          error: { message: "Failed to fetch time slots" },
        },
        { status: 500 }
      );
    }

    // Fetch pricing for the exhibition
    const { data: pricing } = await supabase
      .from("pricing")
      .select("*")
      .eq("exhibition_id", exhibitionId)
      .eq("active", true);

    // Transform time slots to expected format
    const formattedSlots = (timeSlots || []).map((slot: any) => {
      const availableCapacity = slot.capacity - (slot.current_bookings || 0);
      
      return {
        id: slot.id,
        startTime: slot.start_time,
        endTime: slot.end_time,
        totalCapacity: slot.capacity,
        availableCapacity: availableCapacity,
        bookedCount: slot.current_bookings || 0,
        isFull: availableCapacity <= 0,
        pricing: (pricing || []).map((p: any) => ({
          ticketType: p.ticket_type,
          price: parseFloat(p.price),
          label: p.ticket_type.charAt(0).toUpperCase() + p.ticket_type.slice(1),
        })),
      };
    });

    return NextResponse.json({
      success: true,
      data: { timeSlots: formattedSlots },
    });
  } catch (error: any) {
    console.error("Error in time-slots API:", error);
    return NextResponse.json(
      {
        success: false,
        error: { message: error.message || "Internal server error" },
      },
      { status: 500 }
    );
  }
}
