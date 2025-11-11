// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyAdminAuth } from '@/lib/auth/admin-auth';

type Params = Promise<{ id: string }>;

// GET - Fetch single exhibition
export async function GET(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { error: authError, supabase } = await verifyAdminAuth();
    if (authError) return authError;

    const { id } = await params;

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
        { error: 'Exhibition not found', details: error.message },
        { status: 404 }
      );
    }

    return NextResponse.json({ exhibition });
  } catch (error: any) {
    console.error('Error in exhibition API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
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
    const { error: authError, supabase } = await verifyAdminAuth();
    if (authError) return authError;

    const { id } = await params;
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
        { error: 'Failed to update exhibition', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      exhibition,
      message: 'Exhibition updated successfully'
    });
  } catch (error: any) {
    console.error('Error in update exhibition API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
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
    const { error: authError, supabase } = await verifyAdminAuth();
    if (authError) return authError;

    const { id } = await params;

    // Check if exhibition has bookings
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('id')
      .eq('exhibition_id', id)
      .limit(1);

    if (bookingsError) {
      console.error('Error checking bookings:', bookingsError);
      return NextResponse.json(
        { error: 'Failed to check bookings', details: bookingsError.message },
        { status: 500 }
      );
    }

    if (bookings && bookings.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete exhibition with existing bookings. Please cancel all bookings first.' },
        { status: 400 }
      );
    }

    // Delete related data in order (respecting foreign key constraints)
    
    // 1. Delete cart items
    await supabase
      .from('cart_items')
      .delete()
      .eq('exhibition_id', id);

    // 2. Delete exhibition content sections
    await supabase
      .from('exhibition_content_sections')
      .delete()
      .eq('exhibition_id', id);

    // 3. Delete exhibition schedules
    await supabase
      .from('exhibition_schedules')
      .delete()
      .eq('exhibition_id', id);

    // 4. Delete time slots (only those without bookings)
    await supabase
      .from('time_slots')
      .delete()
      .eq('exhibition_id', id);

    // 5. Delete pricing
    await supabase
      .from('pricing')
      .delete()
      .eq('exhibition_id', id);

    // 6. Finally, delete the exhibition
    const { error } = await supabase
      .from('exhibitions')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting exhibition:', error);
      return NextResponse.json(
        { error: 'Failed to delete exhibition', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      message: 'Exhibition deleted successfully'
    });
  } catch (error: any) {
    console.error('Error in delete exhibition API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
