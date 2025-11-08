import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/config';

export async function POST(request: NextRequest) {
  try {
    const supabase = getServiceSupabase();
    
    console.log('[create-time-slots] Starting time slot creation...');
    
    // Get all active exhibitions
    const { data: exhibitions, error: exError } = await supabase
      .from('exhibitions')
      .select('id, name, status')
      .eq('status', 'active');

    if (exError) {
      console.error('[create-time-slots] Error fetching exhibitions:', exError);
      throw exError;
    }

    console.log(`[create-time-slots] Found ${exhibitions?.length} active exhibitions`);

    // Generate dates for the next 60 days
    const dates: string[] = [];
    const today = new Date();
    for (let i = 0; i < 60; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      dates.push(date.toISOString().split('T')[0]);
    }

    // Time slots to create
    const timeSlots = [
      { start: '10:00:00', end: '11:00:00' },
      { start: '13:00:00', end: '14:00:00' },
      { start: '16:00:00', end: '17:00:00' },
      { start: '19:00:00', end: '20:00:00' },
    ];

    console.log(`[create-time-slots] Creating slots for ${dates.length} days, ${timeSlots.length} slots per day`);

    // Create time slots for each exhibition, date, and time
    const slotsToInsert = [];
    for (const exhibition of exhibitions || []) {
      for (const date of dates) {
        for (const slot of timeSlots) {
          slotsToInsert.push({
            exhibition_id: exhibition.id,
            slot_date: date,
            start_time: slot.start,
            end_time: slot.end,
            capacity: 50,
            active: true,
          });
        }
      }
    }

    console.log(`[create-time-slots] Total slots to insert: ${slotsToInsert.length}`);

    // Insert in batches of 500
    const batchSize = 500;
    let inserted = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (let i = 0; i < slotsToInsert.length; i += batchSize) {
      const batch = slotsToInsert.slice(i, i + batchSize);
      
      // Check which slots already exist
      const exhibitionIds = [...new Set(batch.map(s => s.exhibition_id))];
      const slotDates = [...new Set(batch.map(s => s.slot_date))];
      const startTimes = [...new Set(batch.map(s => s.start_time))];
      
      const { data: existing } = await supabase
        .from('time_slots')
        .select('exhibition_id, slot_date, start_time, end_time')
        .in('exhibition_id', exhibitionIds)
        .in('slot_date', slotDates)
        .in('start_time', startTimes);

      const existingKeys = new Set(
        (existing || []).map(
          (s: any) => `${s.exhibition_id}-${s.slot_date}-${s.start_time}-${s.end_time}`
        )
      );

      // Filter out existing slots
      const newSlots = batch.filter(
        s => !existingKeys.has(`${s.exhibition_id}-${s.slot_date}-${s.start_time}-${s.end_time}`)
      );

      if (newSlots.length > 0) {
        const { data, error } = await supabase
          .from('time_slots')
          .insert(newSlots)
          .select('id');

        if (error) {
          console.error(`[create-time-slots] Error inserting batch:`, error.message);
          errors.push(error.message);
          skipped += newSlots.length;
        } else {
          inserted += data?.length || 0;
        }
      }

      skipped += batch.length - newSlots.length;
    }

    console.log(`[create-time-slots] Complete: ${inserted} inserted, ${skipped} skipped`);

    return NextResponse.json({
      success: true,
      data: {
        inserted,
        skipped,
        total: slotsToInsert.length,
        exhibitions: exhibitions?.length || 0,
        errors: errors.length > 0 ? errors : undefined,
      },
    });
  } catch (error: any) {
    console.error('[create-time-slots] Fatal error:', error);
    return NextResponse.json({
      success: false,
      error: {
        message: error.message || 'Failed to create time slots',
        details: error,
      },
    }, { status: 500 });
  }
}
