// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET - Fetch show details by slug
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const supabase = createClient();

    // Fetch show with pricing
    const { data: show, error: showError } = await supabase
      .from('shows')
      .select(`
        *,
        pricing(*)
      `)
      .eq('slug', slug)
      .eq('status', 'active')
      .single();

    if (showError || !show) {
      return NextResponse.json(
        { error: 'Show not found' },
        { status: 404 }
      );
    }

    // Fetch content sections
    const { data: contentSections } = await supabase
      .from('show_content_sections')
      .select('*')
      .eq('show_id', show.id)
      .eq('active', true)
      .order('display_order', { ascending: true });

    // Fetch time slots
    const { data: timeSlots } = await supabase
      .from('time_slots')
      .select('*')
      .eq('show_id', show.id)
      .eq('active', true)
      .order('start_time', { ascending: true });

    return NextResponse.json({
      show: {
        ...show,
        contentSections: contentSections || [],
        timeSlots: timeSlots || [],
      },
    });
  } catch (error: any) {
    console.error('Error in show detail API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
