// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/config';

type Params = Promise<{ id: string }>;

// GET - Fetch single show
export async function GET(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { id } = await params;
    const supabase = getServiceSupabase();

    const { data: show, error } = await supabase
      .from('shows')
      .select(`
        *,
        pricing:pricing(*),
        time_slots:time_slots(*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching show:', error);
      return NextResponse.json(
        { error: 'Show not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ show });
  } catch (error) {
    console.error('Error in show API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update show
export async function PUT(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { id } = await params;
    const supabase = getServiceSupabase();
    const body = await request.json();

    const {
      name,
      description,
      type,
      durationMinutes,
      thumbnailUrl,
      trailerUrl,
      status
    } = body;

    // Update show
    const { data: show, error } = await supabase
      .from('shows')
      .update({
        name,
        description,
        type,
        duration_minutes: durationMinutes,
        thumbnail_url: thumbnailUrl,
        trailer_url: trailerUrl,
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating show:', error);
      return NextResponse.json(
        { error: 'Failed to update show' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      show,
      message: 'Show updated successfully'
    });
  } catch (error) {
    console.error('Error in update show API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete show
export async function DELETE(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { id } = await params;
    const supabase = getServiceSupabase();

    // Delete related pricing first
    await supabase
      .from('pricing')
      .delete()
      .eq('show_id', id);

    // Delete related time slots
    await supabase
      .from('time_slots')
      .delete()
      .eq('show_id', id);

    // Delete the show
    const { error } = await supabase
      .from('shows')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting show:', error);
      return NextResponse.json(
        { error: 'Failed to delete show' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      message: 'Show deleted successfully'
    });
  } catch (error) {
    console.error('Error in delete show API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
