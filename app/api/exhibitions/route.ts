import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Fetch exhibitions
    const { data: exhibitions, error } = await supabase
      .from("exhibitions")
      .select("*")
      .eq("status", "active")
      .order("display_order", { ascending: true });

    if (error) {
      console.error("Error fetching exhibitions:", error);
      return NextResponse.json(
        { error: "Failed to fetch exhibitions" },
        { status: 500 }
      );
    }

    // Fetch pricing from the old pricing table (exhibition_pricing is empty)
    const { data: pricingData } = await supabase
      .from("pricing")
      .select("*")
      .eq("active", true)
      .not("exhibition_id", "is", null);

    // Map pricing to exhibitions
    const exhibitionsWithPricing = (exhibitions || []).map((ex: any) => {
      const pricing = (pricingData || [])
        .filter((p: any) => p.exhibition_id === ex.id)
        .map((p: any) => ({
          ticketType: p.ticket_type,
          price: parseFloat(p.price),
        }));

      return {
        ...ex,
        shortDescription: ex.short_description,
        durationMinutes: ex.duration_minutes,
        pricing: pricing.length > 0 ? pricing : [{ ticketType: "adult", price: 0 }],
      };
    });

    return NextResponse.json({ exhibitions: exhibitionsWithPricing });
  } catch (error) {
    console.error("Error in exhibitions API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
