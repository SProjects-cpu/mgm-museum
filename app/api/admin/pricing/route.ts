// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET - Fetch all pricing
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const searchParams = request.nextUrl.searchParams;
    const itemId = searchParams.get('itemId');
    const itemType = searchParams.get('itemType'); // 'show' or 'exhibition'

    let query = supabase.from('pricing').select('*');

    if (itemId && itemType) {
      const column = itemType === 'show' ? 'show_id' : 'exhibition_id';
      query = query.eq(column, itemId);
    }

    const { data: pricing, error } = await query;

    if (error) {
      console.error('Error fetching pricing:', error);
      return NextResponse.json(
        { error: 'Failed to fetch pricing' },
        { status: 500 }
      );
    }

    return NextResponse.json({ pricing: pricing || [] });
  } catch (error) {
    console.error('Error in pricing API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create new pricing tier
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const body = await request.json();

    const {
      itemId,
      itemType, // 'show' or 'exhibition'
      ticketType,
      price,
      active = true
    } = body;

    if (!itemId || !itemType || !ticketType || price === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: itemId, itemType, ticketType, price' },
        { status: 400 }
      );
    }

    if (price < 0) {
      return NextResponse.json(
        { error: 'Price cannot be negative' },
        { status: 400 }
      );
    }

    const pricingData: any = {
      ticket_type: ticketType,
      price,
      active,
      valid_from: new Date().toISOString()
    };

    if (itemType === 'show') {
      pricingData.show_id = itemId;
    } else if (itemType === 'exhibition') {
      pricingData.exhibition_id = itemId;
    } else {
      return NextResponse.json(
        { error: 'Invalid itemType. Must be "show" or "exhibition"' },
        { status: 400 }
      );
    }

    const { data: pricing, error } = await supabase
      .from('pricing')
      .insert(pricingData)
      .select()
      .single();

    if (error) {
      console.error('Error creating pricing:', error);
      return NextResponse.json(
        { error: 'Failed to create pricing' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      pricing,
      message: 'Pricing tier created successfully'
    });
  } catch (error) {
    console.error('Error in create pricing API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
