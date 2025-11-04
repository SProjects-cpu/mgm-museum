// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET - Fetch exhibition details by ID or slug
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createClient();

    // Check if id is a UUID or a slug
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

    // Fetch exhibition with pricing
    let query = supabase
      .from('exhibitions')
      .select(`
        *,
        pricing(*)
      `)
      .eq('status', 'active');

    // Use id or slug based on format
    if (isUUID) {
      query = query.eq('id', id);
    } else {
      query = query.eq('slug', id);
    }

    const { data: exhibition, error: exhibitionError } = await query.single();

    if (exhibitionError || !exhibition) {
      return NextResponse.json(
        { error: 'Exhibition not found' },
        { status: 404 }
      );
    }

    // Fetch content sections
    const { data: contentSections } = await supabase
      .from('exhibition_content_sections')
      .select('*')
      .eq('exhibition_id', exhibition.id)
      .eq('active', true)
      .order('display_order', { ascending: true });

    // Fetch time slots
    const { data: timeSlots } = await supabase
      .from('time_slots')
      .select('*')
      .eq('exhibition_id', exhibition.id)
      .eq('active', true)
      .order('start_time', { ascending: true });

    return NextResponse.json({
      exhibition: {
        ...exhibition,
        contentSections: contentSections || [],
        timeSlots: timeSlots || [],
      },
    });
  } catch (error: any) {
    console.error('Error in exhibition detail API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
