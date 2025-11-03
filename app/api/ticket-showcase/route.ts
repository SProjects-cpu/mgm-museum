// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/client';

export async function GET() {
  try {
    const supabase = getServiceSupabase();
    
    const { data, error } = await supabase
      .from('ticket_showcase_config')
      .select('*')
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, config: data });
  } catch (error) {
    console.error('Error fetching ticket showcase config:', error);
    return NextResponse.json({ error: 'Failed to fetch config' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const supabase = getServiceSupabase();

    const { data, error } = await supabase
      .from('ticket_showcase_config')
      .update(body)
      .eq('id', body.id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, config: data });
  } catch (error) {
    console.error('Error updating ticket showcase config:', error);
    return NextResponse.json({ error: 'Failed to update config' }, { status: 500 });
  }
}
