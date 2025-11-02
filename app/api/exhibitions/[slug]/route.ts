// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET - Fetch exhibition details by slug
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const supabase = createClient();

    // Fetch exhibition with pricing
    const { data: exhibition, error: exhibitionError } = await supabase
      .from('exhibitions')
      .select(`
        *,
        pricing(*)
      `)
      .eq('slug', slug)
      .eq('status', 'active')
      .single();

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
