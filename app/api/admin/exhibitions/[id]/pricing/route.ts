import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET - Fetch pricing for an exhibition
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const exhibitionId = params.id;

    const { data: pricing, error } = await supabase
      .from("exhibition_pricing")
      .select("*")
      .eq("exhibition_id", exhibitionId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching pricing:", error);
      return NextResponse.json(
        { error: "Failed to fetch pricing" },
        { status: 500 }
      );
    }

    return NextResponse.json({ pricing: pricing || [] });
  } catch (error: any) {
    console.error("Error in GET pricing:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Create new pricing tier
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const exhibitionId = params.id;
    const body = await request.json();

    const { ticketType, price, active = true } = body;

    if (!ticketType || price === undefined) {
      return NextResponse.json(
        { error: "Missing required fields: ticketType, price" },
        { status: 400 }
      );
    }

    // Check if pricing for this ticket type already exists
    const { data: existing } = await supabase
      .from("exhibition_pricing")
      .select("id")
      .eq("exhibition_id", exhibitionId)
      .eq("ticket_type", ticketType)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: "Pricing for this ticket type already exists" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("exhibition_pricing")
      .insert({
        exhibition_id: exhibitionId,
        ticket_type: ticketType,
        price: parseFloat(price),
        active,
        valid_from: new Date().toISOString(),
      } as any)
      .select()
      .single();

    if (error) {
      console.error("Error creating pricing:", error);
      return NextResponse.json(
        { error: "Failed to create pricing" },
        { status: 500 }
      );
    }

    return NextResponse.json({ pricing: data }, { status: 201 });
  } catch (error: any) {
    console.error("Error in POST pricing:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT - Update existing pricing tier
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const pricingId = searchParams.get("pricingId");

    if (!pricingId) {
      return NextResponse.json(
        { error: "Missing pricingId parameter" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { price, active } = body;

    const updateData: Record<string, any> = {};
    if (price !== undefined) updateData.price = parseFloat(price);
    if (active !== undefined) updateData.active = active;

    const { data, error } = await supabase
      .from("exhibition_pricing")
      // @ts-ignore - Supabase type inference issue with dynamic updates
      .update(updateData)
      .eq("id", pricingId)
      .select()
      .single();

    if (error) {
      console.error("Error updating pricing:", error);
      return NextResponse.json(
        { error: "Failed to update pricing" },
        { status: 500 }
      );
    }

    return NextResponse.json({ pricing: data });
  } catch (error: any) {
    console.error("Error in PUT pricing:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Remove pricing tier
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const pricingId = searchParams.get("pricingId");

    if (!pricingId) {
      return NextResponse.json(
        { error: "Missing pricingId parameter" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("exhibition_pricing")
      .delete()
      .eq("id", pricingId);

    if (error) {
      console.error("Error deleting pricing:", error);
      return NextResponse.json(
        { error: "Failed to delete pricing" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error in DELETE pricing:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
