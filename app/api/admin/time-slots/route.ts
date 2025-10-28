// @ts-nocheck
// API Route: Admin Time Slots Management
// GET /api/admin/time-slots - List time slots
// POST /api/admin/time-slots - Create time slot(s)

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// Validation schemas
const createTimeSlotSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  start_time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/),
  end_time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/),
  capacity: z.number().int().min(1).max(500),
  slot_type: z.enum(['general', 'exhibition', 'event']).optional(),
  exhibition_id: z.string().uuid().optional(),
  event_id: z.string().uuid().optional(),
  notes: z.string().max(500).optional(),
});

const bulkCreateSchema = z.object({
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time_slots: z.array(z.object({
    start_time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/),
    end_time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/),
    capacity: z.number().int().min(1).max(500),
  })),
  slot_type: z.enum(['general', 'exhibition', 'event']).optional(),
  exhibition_id: z.string().uuid().optional(),
  event_id: z.string().uuid().optional(),
  skip_mondays: z.boolean().optional(),
  skip_holidays: z.array(z.string()).optional(),
});

async function checkAdminAuth(supabase: any) {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return { authorized: false, error: 'Unauthorized' };
  }
  
  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();
  
  if (!userData || !['admin', 'super_admin'].includes(userData.role)) {
    return { authorized: false, error: 'Forbidden' };
  }
  
  return { authorized: true, user };
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const auth = await checkAdminAuth(supabase);
    
    if (!auth.authorized) {
      return NextResponse.json(
        { success: false, error: auth.error },
        { status: auth.error === 'Unauthorized' ? 401 : 403 }
      );
    }
    
    const searchParams = request.nextUrl.searchParams;
    const dateFrom = searchParams.get('date_from');
    const dateTo = searchParams.get('date_to');
    const slotType = searchParams.get('slot_type');
    const isActive = searchParams.get('is_active');
    
    let query = supabase
      .from('time_slots')
      .select(`
        *,
        exhibition:exhibitions(id, title, slug),
        event:events(id, title, slug)
      `);
    
    if (dateFrom) {
      query = query.gte('date', dateFrom);
    }
    
    if (dateTo) {
      query = query.lte('date', dateTo);
    }
    
    if (slotType) {
      query = query.eq('slot_type', slotType);
    }
    
    if (isActive !== null) {
      query = query.eq('is_active', isActive === 'true');
    }
    
    query = query.order('date', { ascending: true }).order('start_time', { ascending: true });
    
    const { data: slots, error } = await query;
    
    if (error) {
      throw new Error('Failed to fetch time slots');
    }
    
    return NextResponse.json({
      success: true,
      slots: slots || [],
      count: slots?.length || 0,
    });
    
  } catch (error: any) {
    console.error('Error fetching time slots:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch time slots',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const auth = await checkAdminAuth(supabase);
    
    if (!auth.authorized) {
      return NextResponse.json(
        { success: false, error: auth.error },
        { status: auth.error === 'Unauthorized' ? 401 : 403 }
      );
    }
    
    const body = await request.json();
    
    // Check if it's bulk creation or single
    if (body.start_date && body.end_date && body.time_slots) {
      // Bulk creation
      const validation = bulkCreateSchema.safeParse(body);
      
      if (!validation.success) {
        return NextResponse.json(
          {
            success: false,
            error: 'Validation failed',
            details: validation.error.errors,
          },
          { status: 400 }
        );
      }
      
      const { start_date, end_date, time_slots, slot_type, exhibition_id, event_id, skip_mondays, skip_holidays } = validation.data;
      
      // Generate slots for date range
      const startDate = new Date(start_date);
      const endDate = new Date(end_date);
      const slotsToCreate = [];
      
      for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
        const dateString = date.toISOString().split('T')[0];
        const dayOfWeek = date.getDay();
        
        // Skip Mondays if requested
        if (skip_mondays && dayOfWeek === 1) {
          continue;
        }
        
        // Skip holidays if requested
        if (skip_holidays && skip_holidays.includes(dateString)) {
          continue;
        }
        
        // Create slots for this date
        for (const timeSlot of time_slots) {
          slotsToCreate.push({
            date: dateString,
            start_time: timeSlot.start_time,
            end_time: timeSlot.end_time,
            capacity: timeSlot.capacity,
            slot_type: slot_type || 'general',
            exhibition_id: exhibition_id || null,
            event_id: event_id || null,
          });
        }
      }
      
      // Insert all slots
      const { data: createdSlots, error } = await supabase
        .from('time_slots')
        .insert(slotsToCreate)
        .select();
      
      if (error) {
        throw new Error('Failed to create time slots');
      }
      
      return NextResponse.json({
        success: true,
        slots: createdSlots,
        count: createdSlots?.length || 0,
        message: `Created ${createdSlots?.length || 0} time slots`,
      }, { status: 201 });
      
    } else {
      // Single slot creation
      const validation = createTimeSlotSchema.safeParse(body);
      
      if (!validation.success) {
        return NextResponse.json(
          {
            success: false,
            error: 'Validation failed',
            details: validation.error.errors,
          },
          { status: 400 }
        );
      }
      
      const slotData = {
        ...validation.data,
        slot_type: validation.data.slot_type || 'general',
      };
      
      const { data: slot, error } = await supabase
        .from('time_slots')
        .insert(slotData)
        .select()
        .single();
      
      if (error) {
        throw new Error('Failed to create time slot');
      }
      
      return NextResponse.json({
        success: true,
        slot,
        message: 'Time slot created successfully',
      }, { status: 201 });
    }
    
  } catch (error: any) {
    console.error('Error creating time slots:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to create time slots',
      },
      { status: 500 }
    );
  }
}
