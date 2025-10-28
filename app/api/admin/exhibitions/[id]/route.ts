// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

type Params = Promise<{ id: string }>;

// GET - Fetch single exhibition
export async function GET(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { id } = await params;
    const supabase = createClient();

    const { data: exhibition, error } = await supabase
      .from('exhibitions')
      .select(`
        *,
        pricing(*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching exhibition:', error);
      return NextResponse.json(
        { error: 'Exhibition not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ exhibition });
  } catch (error) {
    console.error('Error in exhibition API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update exhibition
export async function PUT(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { id } = await params;
    const supabase = createClient();
    const body = await request.json();

    const {
      name,
      category,
      description,
      shortDescription,
      durationMinutes,
      capacity,
      images,
      status,
      is_featured,
      displayOrder
    } = body;

    // Prepare update data
    const updateData: any = {};
    if (name) updateData.name = name;
    if (category) updateData.category = category;
    if (description !== undefined) updateData.description = description;
    if (shortDescription) updateData.short_description = shortDescription;
    if (durationMinutes) updateData.duration_minutes = durationMinutes;
    if (capacity) updateData.capacity = capacity;
    if (images) updateData.images = images;
    if (status) updateData.status = status;
    if (is_featured !== undefined) updateData.featured = is_featured;
    if (displayOrder !== undefined) updateData.display_order = displayOrder;

    // Update exhibition
    const { data: exhibition, error } = await supabase
      .from('exhibitions')
      .update(updateData)
      .eq('id', id)
      .select('*, pricing(*)')
      .single();

    if (error) {
      console.error('Error updating exhibition:', error);
      return NextResponse.json(
        { error: 'Failed to update exhibition' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      exhibition,
      message: 'Exhibition updated successfully'
    });
  } catch (error) {
    console.error('Error in update exhibition API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete exhibition
export async function DELETE(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { id } = await params;
    const supabase = createClient();

    // Delete related pricing first
    await supabase
      .from('pricing')
      .delete()
      .eq('exhibition_id', id);

    // Delete the exhibition
    const { error } = await supabase
      .from('exhibitions')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting exhibition:', error);
      return NextResponse.json(
        { error: 'Failed to delete exhibition' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      message: 'Exhibition deleted successfully'
    });
  } catch (error) {
    console.error('Error in delete exhibition API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
