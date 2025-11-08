import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/config';

export async function GET() {
  const supabase = getServiceSupabase();
  
  // Get all exhibitions
  const { data: exhibitions, error } = await supabase
    .from('exhibitions')
    .select('id, name, slug, status')
    .order('name');
  
  // For each exhibition, count time slots
  const exhibitionsWithSlots = await Promise.all(
    (exhibitions || []).map(async (ex) => {
      const { count } = await supabase
        .from('time_slots')
        .select('*', { count: 'exact', head: true })
        .eq('exhibition_id', ex.id)
        .gte('slot_date', new Date().toISOString().split('T')[0]);
      
      return {
        ...ex,
        timeSlotCount: count || 0,
      };
    })
  );
  
  return NextResponse.json({
    exhibitions: exhibitionsWithSlots,
    error: error ? error.message : null,
  });
}
