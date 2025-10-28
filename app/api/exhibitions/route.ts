// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET - Fetch all exhibitions for public site
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const searchParams = request.nextUrl.searchParams;
    const featured = searchParams.get('featured');
    const category = searchParams.get('category');

    let query = supabase
      .from('exhibitions')
      .select(`
        *,
        pricing(*)
      `)
      .eq('status', 'active')  // Only show active exhibitions on public site
      .order('display_order', { ascending: true });

    if (featured === 'true') {
      query = query.eq('featured', true);
    }

    if (category && category !== 'all') {
      query = query.eq('category', category);
    }

    const { data: exhibitions, error } = await query;

    if (error) {
      console.error('Error fetching exhibitions:', error);
      return NextResponse.json(
        { error: 'Failed to fetch exhibitions', details: error.message },
        { status: 500 }
      );
    }

    // Transform data to match frontend expectations
    const transformedExhibitions = exhibitions?.map(ex => ({
      id: ex.id,
      slug: ex.slug,
      name: ex.name,
      category: ex.category,
      description: ex.description,
      shortDescription: ex.short_description,
      durationMinutes: ex.duration_minutes,
      capacity: ex.capacity,
      images: ex.images || [],
      status: ex.status,
      featured: ex.featured,
      displayOrder: ex.display_order,
      pricing: ex.pricing || [],
      createdAt: ex.created_at,
      updatedAt: ex.updated_at
    })) || [];

    return NextResponse.json({ exhibitions: transformedExhibitions });
  } catch (error: any) {
    console.error('Error in exhibitions public API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

