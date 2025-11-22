import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
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

    return NextResponse.json({ exhibitions });
  } catch (error) {
    console.error("Error in exhibitions API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
