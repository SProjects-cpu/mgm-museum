import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/config';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const exhibitionId = searchParams.get('exhibitionId') || 'acdc4a68-553e-42bf-9b1f-da0b170c03a1';
  
  const supabase = getServiceSupabase();
  const today = new Date().toISOString().split('T')[0];
  
  // Check time slots
  const { data: timeSlots, error } = await supabase
    .from('time_slots')
    .select('slot_date, start_time, end_time, capacity, active')
    .eq('exhibition_id', exhibitionId)
    .eq('active', true)
    .gte('slot_date', today)
    .order('slot_date')
    .limit(10);
  
  // Get count
  const { count } = await supabase
    .from('time_slots')
    .select('*', { count: 'exact', head: true })
    .eq('exhibition_id', exhibitionId)
    .eq('active', true)
    .gte('slot_date', today);
  
  return NextResponse.json({
    exhibitionId,
    today,
    slotsFound: timeSlots?.length || 0,
    totalCount: count,
    firstTenSlots: timeSlots,
    error: error ? error.message : null,
  });
}
