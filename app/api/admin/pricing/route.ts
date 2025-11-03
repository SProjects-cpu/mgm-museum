// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/client';

/**
 * GET /api/admin/pricing
 * Get all pricing tiers with optional filters
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const exhibitionId = searchParams.get('exhibitionId');
    const showId = searchParams.get('showId');
    const ticketType = searchParams.get('ticketType');
    const isActive = searchParams.get('isActive');

    const supabase = getServiceSupabase();

    // Build query
    let query = supabase
      .from('pricing_tiers')
      .select(`
        *,
        exhibition:exhibitions(id, name, slug),
        show:shows(id, name, slug)
      `)
      .order('created_at', { ascending: false });

    // Apply filters
    if (exhibitionId) {
      query = query.eq('exhibition_id', exhibitionId);
    }
    if (showId) {
      query = query.eq('show_id', showId);
    }
    if (ticketType) {
      query = query.eq('ticket_type', ticketType);
    }
    if (isActive !== null && isActive !== undefined) {
      query = query.eq('is_active', isActive === 'true');
    }

    const { data: pricingTiers, error } = await query;

    if (error) {
      console.error('Error fetching pricing tiers:', error);
      return NextResponse.json(
        { error: 'Failed to fetch pricing tiers' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      pricingTiers,
    });
  } catch (error) {
    console.error('Pricing API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/pricing
 * Create a new pricing tier
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      exhibitionId,
      showId,
      ticketType,
      price,
      currency = 'INR',
      validFrom,
      validUntil,
      isActive = true,
    } = body;

    // Validation
    if (!ticketType || price === undefined || price === null || !validFrom) {
      return NextResponse.json(
        { error: 'ticketType, price, and validFrom are required' },
        { status: 400 }
      );
    }

    if (!exhibitionId && !showId) {
      return NextResponse.json(
        { error: 'Either exhibitionId or showId is required' },
        { status: 400 }
      );
    }

    if (exhibitionId && showId) {
      return NextResponse.json(
        { error: 'Cannot set both exhibitionId and showId' },
        { status: 400 }
      );
    }

    const validTicketTypes = ['adult', 'child', 'student', 'senior'];
    if (!validTicketTypes.includes(ticketType)) {
      return NextResponse.json(
        { error: 'Invalid ticket type. Must be: adult, child, student, or senior' },
        { status: 400 }
      );
    }

    if (price < 0) {
      return NextResponse.json(
        { error: 'Price cannot be negative' },
        { status: 400 }
      );
    }

    const supabase = getServiceSupabase();

    // Check for overlapping pricing tiers
    let overlapQuery = supabase
      .from('pricing_tiers')
      .select('id')
      .eq('ticket_type', ticketType)
      .eq('is_active', true);

    if (exhibitionId) {
      overlapQuery = overlapQuery.eq('exhibition_id', exhibitionId);
    }
    if (showId) {
      overlapQuery = overlapQuery.eq('show_id', showId);
    }

    // Check for date overlap
    overlapQuery = overlapQuery.or(
      `and(valid_from.lte.${validFrom},or(valid_until.gte.${validFrom},valid_until.is.null)),` +
      `and(valid_from.lte.${validUntil || '9999-12-31'},or(valid_until.gte.${validFrom},valid_until.is.null))`
    );

    const { data: overlapping } = await overlapQuery;

    if (overlapping && overlapping.length > 0) {
      return NextResponse.json(
        { error: 'A pricing tier with overlapping dates already exists for this ticket type' },
        { status: 409 }
      );
    }

    // Insert new pricing tier
    const { data, error } = await supabase
      .from('pricing_tiers')
      .insert({
        exhibition_id: exhibitionId || null,
        show_id: showId || null,
        ticket_type: ticketType,
        price,
        currency,
        valid_from: validFrom,
        valid_until: validUntil || null,
        is_active: isActive,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating pricing tier:', error);
      return NextResponse.json(
        { error: 'Failed to create pricing tier' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      pricingTier: data,
      message: 'Pricing tier created successfully',
    });
  } catch (error) {
    console.error('Create pricing API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/pricing
 * Update an existing pricing tier
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      id,
      ticketType,
      price,
      currency,
      validFrom,
      validUntil,
      isActive,
    } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Pricing tier ID is required' },
        { status: 400 }
      );
    }

    const supabase = getServiceSupabase();

    // Build update object
    const updates: any = {};
    if (ticketType !== undefined) {
      const validTicketTypes = ['adult', 'child', 'student', 'senior'];
      if (!validTicketTypes.includes(ticketType)) {
        return NextResponse.json(
          { error: 'Invalid ticket type' },
          { status: 400 }
        );
      }
      updates.ticket_type = ticketType;
    }
    if (price !== undefined) {
      if (price < 0) {
        return NextResponse.json(
          { error: 'Price cannot be negative' },
          { status: 400 }
        );
      }
      updates.price = price;
    }
    if (currency !== undefined) updates.currency = currency;
    if (validFrom !== undefined) updates.valid_from = validFrom;
    if (validUntil !== undefined) updates.valid_until = validUntil;
    if (isActive !== undefined) updates.is_active = isActive;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('pricing_tiers')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating pricing tier:', error);
      return NextResponse.json(
        { error: 'Failed to update pricing tier' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      pricingTier: data,
      message: 'Pricing tier updated successfully',
    });
  } catch (error) {
    console.error('Update pricing API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/pricing
 * Delete a pricing tier
 */
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Pricing tier ID is required' },
        { status: 400 }
      );
    }

    const supabase = getServiceSupabase();

    const { error } = await supabase
      .from('pricing_tiers')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting pricing tier:', error);
      return NextResponse.json(
        { error: 'Failed to delete pricing tier' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Pricing tier deleted successfully',
    });
  } catch (error) {
    console.error('Delete pricing API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
