/**
 * Background job to clean up expired seat locks
 * Should run every minute via cron or scheduled task
 */

import { getServiceSupabase } from '@/lib/supabase/config';

export async function cleanupExpiredLocks() {
  const supabase = getServiceSupabase();
  const now = new Date().toISOString();

  try {
    // Delete expired seat locks
    const { data: deletedLocks, error: locksError } = await supabase
      .from('seat_locks')
      .delete()
      .lt('expires_at', now)
      .select('id');

    if (locksError) throw locksError;

    // Delete expired seat bookings for pending bookings
    const { data: deletedSeats, error: seatsError } = await supabase
      .from('seat_bookings')
      .delete()
      .lt('locked_until', now)
      .in('booking_id', 
        supabase
          .from('bookings')
          .select('id')
          .eq('status', 'pending')
      )
      .select('id');

    if (seatsError) throw seatsError;

    console.log(`[Cleanup] Removed ${deletedLocks?.length || 0} expired locks and ${deletedSeats?.length || 0} expired seat bookings`);

    return {
      success: true,
      locksRemoved: deletedLocks?.length || 0,
      seatsRemoved: deletedSeats?.length || 0,
    };
  } catch (error) {
    console.error('[Cleanup] Error cleaning up expired locks:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// API route handler
export async function GET() {
  const result = await cleanupExpiredLocks();
  return Response.json(result);
}
