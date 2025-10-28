// @ts-nocheck
// API Route: Admin Time Slot Management (Single)
// GET /api/admin/time-slots/[id]
// PATCH /api/admin/time-slots/[id]
// DELETE /api/admin/time-slots/[id]

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const updateTimeSlotSchema = z.object({
  capacity: z.number().int().min(1).max(500).optional(),
  is_active: z.boolean().optional(),
  notes: z.string().max(500).optional(),
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

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const auth = await checkAdminAuth(supabase);
    
    if (!auth.authorized) {
      return NextResponse.json(
        { success: false, error: auth.error },
        { status: auth.error === 'Unauthorized' ? 401 : 403 }
      );
    }
    
    const { data: slot, error } = await supabase
      .from('time_slots')
      .select(`
        *,
        exhibition:exhibitions(id, title, slug),
        event:events(id, title, slug)
      `)
      .eq('id', params.id)
      .single();
    
    if (error || !slot) {
      return NextResponse.json(
        { success: false, error: 'Time slot not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      slot,
    });
    
  } catch (error: any) {
    console.error('Error fetching time slot:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch time slot',
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const validation = updateTimeSlotSchema.safeParse(body);
    
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
    
    const { data: slot, error } = await supabase
      .from('time_slots')
      .update(validation.data)
      .eq('id', params.id)
      .select()
      .single();
    
    if (error) {
      throw new Error('Failed to update time slot');
    }
    
    // Log capacity change if capacity was updated
    if (validation.data.capacity !== undefined) {
      await supabase.from('capacity_logs').insert({
        time_slot_id: params.id,
        action: 'capacity_adjusted',
        performed_by: auth.user.id,
        notes: `Capacity updated to ${validation.data.capacity}`,
      });
    }
    
    return NextResponse.json({
      success: true,
      slot,
      message: 'Time slot updated successfully',
    });
    
  } catch (error: any) {
    console.error('Error updating time slot:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to update time slot',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const auth = await checkAdminAuth(supabase);
    
    if (!auth.authorized) {
      return NextResponse.json(
        { success: false, error: auth.error },
        { status: auth.error === 'Unauthorized' ? 401 : 403 }
      );
    }
    
    // Check if slot has bookings
    const { data: bookings } = await supabase
      .from('bookings_enhanced')
      .select('id')
      .eq('time_slot_id', params.id)
      .eq('status', 'confirmed');
    
    if (bookings && bookings.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cannot delete time slot with active bookings',
        },
        { status: 400 }
      );
    }
    
    // Soft delete by setting is_active to false
    const { error } = await supabase
      .from('time_slots')
      .update({ is_active: false })
      .eq('id', params.id);
    
    if (error) {
      throw new Error('Failed to delete time slot');
    }
    
    return NextResponse.json({
      success: true,
      message: 'Time slot deleted successfully',
    });
    
  } catch (error: any) {
    console.error('Error deleting time slot:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to delete time slot',
      },
      { status: 500 }
    );
  }
}
