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

    return NextResponse.json({ items: cartItems || [] });
  } catch (error: any) {
    console.error("Error in cart load API:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
