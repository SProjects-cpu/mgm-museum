import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const TICKET_TYPE_LABELS: Record<string, string> = {
  adult: "Adult",
  child: "Child (5-12 years)",
  student: "Student (with valid ID)",
  senior: "Senior Citizen (60+)",
  group: "Group (10+ people)",
};

const TICKET_TYPE_DESCRIPTIONS: Record<string, string> = {
  adult: "Ages 13 and above",
  child: "Ages 5-12 years",
  student: "Valid student ID required",
  senior: "Ages 60 and above",
  group: "Minimum 10 people",
};

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const exhibitionId = params.id;

    // Fetch pricing for the exhibition
    const { data: pricing, error } = await supabase
      .from("pricing")
      .select("*")
      .eq("exhibition_id", exhibitionId)
      .eq("active", true)
      .order("ticket_type", { ascending: true });

    if (error) {
      console.error("Error fetching pricing:", error);
      return NextResponse.json(
        {
          success: false,
          error: { message: "Failed to fetch ticket types" },
        },
        { status: 500 }
      );
    }

    // Transform pricing to ticket types format
    const ticketTypes = (pricing || []).map((p: any) => ({
      type: p.ticket_type,
      label: TICKET_TYPE_LABELS[p.ticket_type] || p.ticket_type,
      price: parseFloat(p.price),
      description: TICKET_TYPE_DESCRIPTIONS[p.ticket_type],
      minQuantity: 0,
      maxQuantity: 20,
    }));

    return NextResponse.json({
      success: true,
      data: { ticketTypes },
    });
  } catch (error: any) {
    console.error("Error in ticket-types API:", error);
    return NextResponse.json(
      {
        success: false,
        error: { message: error.message || "Internal server error" },
      },
      { status: 500 }
    );
  }
}
