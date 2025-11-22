import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check if user is authenticated and is admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Fetch all exhibitions (including inactive ones for admin)
    const { data: exhibitions, error } = await supabase
      .from("exhibitions")
      .select("*")
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
    console.error("Error in admin exhibitions API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check if user is authenticated and is admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    const { data: exhibition, error } = await supabase
      .from("exhibitions")
      .insert([body])
      .select()
      .single();

    if (error) {
      console.error("Error creating exhibition:", error);
      return NextResponse.json(
        { error: "Failed to create exhibition" },
        { status: 500 }
      );
    }

    return NextResponse.json(exhibition, { status: 201 });
  } catch (error) {
    console.error("Error in admin exhibitions POST API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
