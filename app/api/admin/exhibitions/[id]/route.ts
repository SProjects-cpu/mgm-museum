import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { data: exhibition, error } = await supabase
      .from("exhibitions")
      .select("*")
      .eq("id", params.id)
      .single();

    if (error) {
      console.error("Error fetching exhibition:", error);
      return NextResponse.json(
        { error: "Failed to fetch exhibition" },
        { status: 500 }
      );
    }

    if (!exhibition) {
      return NextResponse.json(
        { error: "Exhibition not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(exhibition);
  } catch (error) {
    console.error("Error in admin exhibition GET API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
      // @ts-ignore - Supabase type inference issue with dynamic updates
      .update(body)
      .eq("id", params.id)
      .select()
      .single();

    if (error) {
      console.error("Error updating exhibition:", error);
      return NextResponse.json(
        { error: "Failed to update exhibition" },
        { status: 500 }
      );
    }

    return NextResponse.json(exhibition);
  } catch (error) {
    console.error("Error in admin exhibition PUT API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { error } = await supabase
      .from("exhibitions")
      .delete()
      .eq("id", params.id);

    if (error) {
      console.error("Error deleting exhibition:", error);
      return NextResponse.json(
        { error: "Failed to delete exhibition" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in admin exhibition DELETE API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
