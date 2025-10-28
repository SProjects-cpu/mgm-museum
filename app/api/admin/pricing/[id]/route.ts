// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

type Params = Promise<{ id: string }>;

// GET - Fetch single pricing tier
export async function GET(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { id } = await params;
    const supabase = createClient();

    const { data: pricing, error } = await supabase
      .from('pricing')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching pricing:', error);
      return NextResponse.json(
        { error: 'Pricing tier not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ pricing });
  } catch (error) {
    console.error('Error in pricing API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update pricing tier
export async function PUT(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { id } = await params;
    const supabase = createClient();
    const body = await request.json();

    const {
      ticketType,
      price,
      active
    } = body;

    if (price !== undefined && price < 0) {
      return NextResponse.json(
        { error: 'Price cannot be negative' },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (ticketType) updateData.ticket_type = ticketType;
    if (price !== undefined) updateData.price = price;
    if (active !== undefined) updateData.active = active;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }

    const { data: pricing, error } = await supabase
      .from('pricing')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating pricing:', error);
      return NextResponse.json(
        { error: 'Failed to update pricing' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      pricing,
      message: 'Pricing tier updated successfully'
    });
  } catch (error) {
    console.error('Error in update pricing API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete pricing tier
export async function DELETE(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { id } = await params;
    const supabase = createClient();

    const { error } = await supabase
      .from('pricing')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting pricing:', error);
      return NextResponse.json(
        { error: 'Failed to delete pricing' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Pricing tier deleted successfully'
    });
  } catch (error) {
    console.error('Error in delete pricing API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
