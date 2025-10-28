// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { slugify } from '@/lib/utils';

// GET - Fetch all exhibitions for admin
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const category = searchParams.get('category');

    let query = supabase
      .from('exhibitions')
      .select(`
        *,
        pricing(*)
      `)
      .order('display_order', { ascending: true });

    if (status && status !== 'all') {
      query = query.eq('status', status as any);
    }

    if (category && category !== 'all') {
      query = query.eq('category', category as any);
    }

    const { data: exhibitions, error } = await query;

    if (error) {
      console.error('Error fetching exhibitions:', error);
      return NextResponse.json(
        { error: 'Failed to fetch exhibitions', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ exhibitions: exhibitions || [] });
  } catch (error: any) {
    console.error('Error in exhibitions API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// POST - Create new exhibition
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const body = await request.json();

    const {
      name,
      category,
      description,
      shortDescription,
      durationMinutes,
      capacity,
      images = [],
      status = 'active',
      featured = false,
      displayOrder,
      pricing = []
    } = body;

    // Validate required fields
    if (!name || !category || !shortDescription) {
      return NextResponse.json(
        { error: 'Missing required fields: name, category, shortDescription' },
        { status: 400 }
      );
    }

    // Generate slug
    const slug = slugify(name);

    // Check if slug already exists
    const { data: existingExhibition } = await supabase
      .from('exhibitions')
      .select('id')
      .eq('slug', slug as any)
      .single();

    if (existingExhibition) {
      return NextResponse.json(
        { error: 'Exhibition with this name already exists' },
        { status: 400 }
      );
    }

    // Create exhibition
    const { data: exhibition, error } = await supabase
      .from('exhibitions')
      .insert({
        name,
        slug,
        category,
        description,
        short_description: shortDescription,
        duration_minutes: durationMinutes || 45,
        capacity: capacity || 50,
        images,
        status,
        featured,
        display_order: displayOrder || 0
      } as any)
      .select()
      .single();

    if (error) {
      console.error('Error creating exhibition:', error);
      return NextResponse.json(
        { error: 'Failed to create exhibition', details: error.message },
        { status: 500 }
      );
    }

    // Create pricing if provided
    if (pricing.length > 0 && exhibition) {
      const pricingData = pricing.map((p: any) => ({
        exhibition_id: (exhibition as any)?.id,
        ticket_type: p.ticketType || 'adult',
        price: p.price,
        active: p.active !== false,
        valid_from: p.validFrom || new Date().toISOString()
      }));

      const { error: pricingError } = await supabase
        .from('pricing')
        .insert(pricingData as any);

      if (pricingError) {
        console.error('Error creating pricing:', pricingError);
        // Don't fail the whole operation, just log the error
      }
    }

    // Fetch the complete exhibition with pricing
    const { data: completeExhibition } = await supabase
      .from('exhibitions')
      .select('*, pricing(*)')
      .eq('id', (exhibition as any)?.id as any)
      .single();

    return NextResponse.json({ 
      exhibition: completeExhibition,
      message: 'Exhibition created successfully'
    });
  } catch (error: any) {
    console.error('Error in create exhibition API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// PUT - Update exhibition
export async function PUT(request: NextRequest) {
  try {
    const supabase = createClient();
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Exhibition ID is required' },
        { status: 400 }
      );
    }

    // Prepare update data
    const updateData: any = {};
    if (updates.name) updateData.name = updates.name;
    if (updates.category) updateData.category = updates.category;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.shortDescription) updateData.short_description = updates.shortDescription;
    if (updates.durationMinutes) updateData.duration_minutes = updates.durationMinutes;
    if (updates.capacity) updateData.capacity = updates.capacity;
    if (updates.images) updateData.images = updates.images;
    if (updates.status) updateData.status = updates.status;
    if (updates.featured !== undefined) updateData.featured = updates.featured;
    if (updates.displayOrder !== undefined) updateData.display_order = updates.displayOrder;

    // Update exhibition
    const { data: exhibition, error } = await supabase
      .from('exhibitions')
      .update(updateData as any)
      .eq('id', id as any)
      .select('*, pricing(*)')
      .single();

    if (error) {
      console.error('Error updating exhibition:', error);
      return NextResponse.json(
        { error: 'Failed to update exhibition', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      exhibition,
      message: 'Exhibition updated successfully'
    });
  } catch (error: any) {
    console.error('Error in update exhibition API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Delete exhibition (handled by [id]/route.ts)
// This endpoint is deprecated - use DELETE /api/admin/exhibitions/[id] instead

