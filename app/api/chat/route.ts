import { NextRequest, NextResponse } from "next/server";

// Knowledge base for the museum chatbot
const KNOWLEDGE_BASE: Record<string, string> = {
  "opening hours": `Our opening hours are:

• Tuesday to Sunday: 10:00 AM - 6:00 PM
• Monday: Closed (Weekly maintenance)
• Last entry: 5:30 PM

Note: We may have extended hours during holidays and special events.`,

  "book tickets": `You can book tickets in three easy ways:

1. Online Booking (Recommended)
   • Visit our website and go to the Exhibitions page
   • Select your preferred exhibition and date
   • Choose ticket types and time slots
   • Complete payment securely online

2. Phone Booking
   • Call us at +91-XXXXXXXXXX
   • Our staff will assist you with the booking

3. Walk-in Purchase
   • Visit our ticket counter directly
   • Subject to availability

Tip: Online booking offers the best prices and guaranteed entry!`,

  "exhibitions": `We have several exciting exhibitions:

1. Planetarium Shows
   • Immersive dome experiences about space and astronomy
   • Duration: 45-60 minutes
   • Perfect for all ages

2. Science Gallery
   • Interactive exhibits on physics, chemistry, and biology
   • Hands-on experiments and demonstrations

3. Holography Gallery
   • 3D holographic displays and optical illusions
   • Unique photo opportunities

4. Technology Zone
   • Robotics, AI, and modern technology exhibits
   • Live demonstrations throughout the day

Visit our Exhibitions page for detailed information and booking.`,

  "pricing": `Our ticket pricing varies by visitor type:

• Adults: ₹200-300 (depending on exhibition)
• Children (5-12 years): ₹100-150
• Students (with valid ID): ₹150-200
• Senior Citizens (60+): ₹150-200
• Children under 5: Free entry

Special Offers:
• Group bookings (10+ visitors): 15% discount
• School groups: Special educational packages
• Family packages: Available for 2 adults + 2 children

Prices may vary by exhibition. Check individual exhibition pages for exact pricing.`,

  "location": `MGM Science Centre Museum

Address: Science Centre Complex, City
Contact: +91-XXXXXXXXXX
Email: info@mgmmuseum.com

How to reach:
• By Metro: Nearest station is Science Centre (500m walk)
• By Bus: Routes 45, 67, 89 stop nearby
• By Car: Ample parking available (₹50 for 4 hours)

The museum is wheelchair accessible with dedicated parking spaces.`,

  "default": `I'm here to help you with information about MGM Science Centre Museum!

I can assist you with:
• Opening hours and visiting information
• Exhibition details and descriptions
• Ticket booking and pricing
• Location and directions
• Visitor guidelines and facilities

What would you like to know?`
};

function findBestMatch(query: string): string {
  const lowerQuery = query.toLowerCase();
  
  // Check for specific keywords
  if (lowerQuery.includes("hour") || lowerQuery.includes("time") || lowerQuery.includes("open")) {
    return KNOWLEDGE_BASE["opening hours"];
  }
  
  if (lowerQuery.includes("book") || lowerQuery.includes("ticket") || lowerQuery.includes("reservation")) {
    return KNOWLEDGE_BASE["book tickets"];
  }
  
  if (lowerQuery.includes("exhibition") || lowerQuery.includes("show") || lowerQuery.includes("available")) {
    return KNOWLEDGE_BASE["exhibitions"];
  }
  
  if (lowerQuery.includes("price") || lowerQuery.includes("cost") || lowerQuery.includes("fee")) {
    return KNOWLEDGE_BASE["pricing"];
  }
  
  if (lowerQuery.includes("location") || lowerQuery.includes("address") || lowerQuery.includes("reach") || lowerQuery.includes("direction")) {
    return KNOWLEDGE_BASE["location"];
  }
  
  // Default response
  return KNOWLEDGE_BASE["default"];
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message } = body;

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Invalid message format" },
        { status: 400 }
      );
    }

    // Find best matching response
    const response = findBestMatch(message);

    return NextResponse.json({
      response,
      success: true,
    });
  } catch (error: any) {
    console.error("Chat API error:", error);
    
    return NextResponse.json(
      { error: "Failed to process chat request" },
      { status: 500 }
    );
  }
}
