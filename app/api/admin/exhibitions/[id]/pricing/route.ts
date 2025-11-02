// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET - Fetch all pricing tiers for an exhibition
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createClient();

    const { data: pricing, error } = await supabase
      .from('pricing')
      .select('*')
      .eq('exhibition_id', id as any)
      .order('ticket_type', { ascending: true });

    if (error) {
      console.error('Error fetching pricing:', error);
      return NextResponse.json(
        { error: 'Failed to fetch pricing', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true,
      pricing: pricing || [] 
    });
  } catch (error: any) {
    console.error('Error in pricing GET API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// POST - Create new pricing tier
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createClient();
    const body = await request.json();

    const { ticketType, price, active = true, validFrom, validUntil } = body;

    // Validate required fields
    if (!ticketType || price === undefined || price === null) {
      return NextResponse.json(
        { error: 'Missing required fields: ticketType, price' },
        { status: 400 }
      );
    }

    // Check if pricing for this ticket type already exists
    const { data: existing } = await supabase
      .from('pricing')
      .select('id')
      .eq('exhibition_id', id as any)
      .eq('ticket_type', ticketType as any)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'Pricing for this ticket type already exists' },
        { status: 400 }
      );
    }

    // Create pricing tier
    const { data: pricing, error } = await supabase
      .from('pricing')
      .insert({
        exhibition_id: id,
        ticket_type: ticketType,
        price: parseFloat(price),
        active,
        valid_from: validFrom || new Date().toISOString(),
        valid_until: validUntil || null
      } as any)
      .select()
      .single();

    if (error) {
      console.error('Error creating pricing:', error);
      return NextResponse.json(
        { error: 'Failed to create pricing', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true,
      pricing,
      message: 'Pricing tier created successfully'
    });
  } catch (error: any) {
    console.error('Error in pricing POST API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// PUT - Update existing pricing tier
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createClient();
    const body = await request.json();
    const searchParams = request.nextUrl.searchParams;
    const pricingId = searchParams.get('pricingId');

    if (!pricingId) {
      return NextResponse.json(
        { error: 'Pricing ID is required' },
        { status: 400 }
      );
    }

    // Prepare update data
    const updateData: any = {};
    if (body.price !== undefined) updateData.price = parseFloat(body.price);
    if (body.active !== undefined) updateData.active = body.active;
    if (body.validFrom) updateData.valid_from = body.validFrom;
    if (body.validUntil !== undefined) updateData.valid_until = body.validUntil;

    // Update pricing tier
    const { data: pricing, error } = await supabase
      .from('pricing')
      .update(updateData as any)
      .eq('id', pricingId as any)
      .eq('exhibition_id', id as any)
      .select()
      .single();

    if (error) {
      console.error('Error updating pricing:', error);
      return NextResponse.json(
        { error: 'Failed to update pricing', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true,
      pricing,
      message: 'Pricing tier updated successfully'
    });
  } catch (error: any) {
    console.error('Error in pricing PUT API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Remove pricing tier
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createClient();
    const searchParams = request.nextUrl.searchParams;
    const pricingId = searchParams.get('pricingId');

    if (!pricingId) {
      return NextResponse.json(
        { error: 'Pricing ID is required' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('pricing')
      .delete()
      .eq('id', pricingId as any)
      .eq('exhibition_id', id as any);

    if (error) {
      console.error('Error deleting pricing:', error);
      return NextResponse.json(
        { error: 'Failed to delete pricing', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true,
      message: 'Pricing tier deleted successfully'
    });
  } catch (error: any) {
    console.error('Error in pricing DELETE API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
