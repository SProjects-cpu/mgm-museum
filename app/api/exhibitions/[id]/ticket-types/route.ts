import { NextRequest } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/config';
import { errorResponse, successResponse } from '@/lib/api/response';
import { BookingError } from '@/lib/api/errors';
import { BookingErrorCode } from '@/lib/api/errors';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: exhibitionId } = params;
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const timeSlotId = searchParams.get('timeSlotId');

    const supabase = getServiceSupabase();

    // Check for dynamic pricing if date/timeSlotId provided
    if (date && timeSlotId) {
      const { data: dynamicPricing } = await supabase
        .from('dynamic_pricing')
        .select('ticket_type, price, label')
        .eq('exhibition_id', exhibitionId)
        .eq('active', true)
        .lte('valid_from', date)
        .or(`valid_until.is.null,valid_until.gte.${date}`);

      if (dynamicPricing && dynamicPricing.length > 0) {
        return successResponse({
          ticketTypes: dynamicPricing.map(p => ({
            type: p.ticket_type,
            label: p.label || p.ticket_type,
            price: parseFloat(p.price),
          })),
        });
      }
    }

    // Fallback to default pricing
    const { data: pricing, error } = await supabase
      .from('pricing')
      .select('ticket_type, price')
      .eq('exhibition_id', exhibitionId)
      .eq('active', true)
      .lte('valid_from', date || new Date().toISOString().split('T')[0])
      .or(`valid_until.is.null,valid_until.gte.${date || new Date().toISOString().split('T')[0]}`);

    if (error) throw error;

    return successResponse({
      ticketTypes: (pricing || []).map(p => ({
        type: p.ticket_type,
        label: p.ticket_type,
        price: parseFloat(p.price),
      })),
    });
  } catch (error: any) {
    console.error('[API] Error fetching ticket types:', error);
    return errorResponse(error);
  }
}
