// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
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

    // Use service role to check bookings (bypass RLS)
    const serviceSupabase = createServiceClient();
    
    // Check if exhibition has bookings
    const { data: bookings, error: bookingsError } = await serviceSupabase
      .from('bookings')
      .select('id, booking_reference')
      .eq('exhibition_id', id)
      .limit(5); // Get up to 5 to show in error message

    console.log(`[DELETE Exhibition] Checking bookings for exhibition ${id}`);
    console.log(`[DELETE Exhibition] Bookings found: ${bookings?.length || 0}`);
    console.log(`[DELETE Exhibition] Bookings error:`, bookingsError);

    if (bookingsError) {
      console.error('Error checking bookings:', bookingsError);
      return NextResponse.json(
        { error: 'Failed to check bookings', details: bookingsError.message },
        { status: 500 }
      );
    }

    if (bookings && bookings.length > 0) {
      const bookingRefs = bookings.map(b => b.booking_reference).join(', ');
      console.log(`[DELETE Exhibition] Cannot delete - has ${bookings.length} bookings: ${bookingRefs}`);
      return NextResponse.json(
        { 
          error: `Cannot delete exhibition with existing bookings. Found ${bookings.length} booking(s): ${bookingRefs}. Please cancel all bookings first.`,
          bookingCount: bookings.length,
          bookingReferences: bookings.map(b => b.booking_reference)
        },
        { status: 400 }
      );
    }

    console.log(`[DELETE Exhibition] No bookings found, proceeding with deletion...`);

    // Delete related data in order (respecting foreign key constraints)
    
    // 1. Delete cart items
    console.log(`[DELETE Exhibition] Deleting cart items...`);
    const { error: cartError } = await supabase
      .from('cart_items')
      .delete()
      .eq('exhibition_id', id);
    if (cartError) {
      console.error('[DELETE Exhibition] Error deleting cart items:', cartError);
      return NextResponse.json(
        { error: 'Failed to delete cart items', details: cartError.message },
        { status: 500 }
      );
    }

    // 2. Delete exhibition content sections
    console.log(`[DELETE Exhibition] Deleting content sections...`);
    const { error: contentError } = await supabase
      .from('exhibition_content_sections')
      .delete()
      .eq('exhibition_id', id);
    if (contentError) {
      console.error('[DELETE Exhibition] Error deleting content sections:', contentError);
      return NextResponse.json(
        { error: 'Failed to delete content sections', details: contentError.message },
        { status: 500 }
      );
    }

    // 3. Delete exhibition schedules
    console.log(`[DELETE Exhibition] Deleting schedules...`);
    const { error: scheduleError } = await supabase
      .from('exhibition_schedules')
      .delete()
      .eq('exhibition_id', id);
    if (scheduleError) {
      console.error('[DELETE Exhibition] Error deleting schedules:', scheduleError);
      return NextResponse.json(
        { error: 'Failed to delete schedules', details: scheduleError.message },
        { status: 500 }
      );
    }

    // 4. Delete time slots (only those without bookings)
    console.log(`[DELETE Exhibition] Deleting time slots...`);
    const { error: slotsError } = await supabase
      .from('time_slots')
      .delete()
      .eq('exhibition_id', id);
    if (slotsError) {
      console.error('[DELETE Exhibition] Error deleting time slots:', slotsError);
      return NextResponse.json(
        { error: 'Failed to delete time slots', details: slotsError.message },
        { status: 500 }
      );
    }

    // 5. Delete pricing
    console.log(`[DELETE Exhibition] Deleting pricing...`);
    const { error: pricingError } = await supabase
      .from('pricing')
      .delete()
      .eq('exhibition_id', id);
    if (pricingError) {
      console.error('[DELETE Exhibition] Error deleting pricing:', pricingError);
      return NextResponse.json(
        { error: 'Failed to delete pricing', details: pricingError.message },
        { status: 500 }
      );
    }

    // 6. Finally, delete the exhibition
    console.log(`[DELETE Exhibition] Deleting exhibition...`);
    const { error } = await supabase
      .from('exhibitions')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[DELETE Exhibition] Error deleting exhibition:', error);
      return NextResponse.json(
        { error: 'Failed to delete exhibition', details: error.message },
        { status: 500 }
      );
    }

    console.log(`[DELETE Exhibition] Successfully deleted exhibition ${id}`);

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
