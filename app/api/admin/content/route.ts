// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET - Fetch all content pages
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: pages, error } = await supabase
      .from('content_pages')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching content pages:', error);
      return NextResponse.json(
        { error: 'Failed to fetch content pages' },
        { status: 500 }
      );
    }

    return NextResponse.json({ pages: pages || [] });
  } catch (error) {
    console.error('Error in content API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create new content page
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    const {
      slug,
      title,
      content,
      metaTitle,
      metaDescription,
      published = false
    } = body;

    // Validate required fields
    if (!slug || !title) {
      return NextResponse.json(
        { error: 'Missing required fields: slug, title' },
        { status: 400 }
      );
    }

    // Check if slug already exists
    const { data: existingPage } = await supabase
      .from('content_pages')
      .select('id')
      .eq('slug', slug)
      .single();

    if (existingPage) {
      return NextResponse.json(
        { error: 'Content page with this slug already exists' },
        { status: 400 }
      );
    }

    // Create content page
    const { data: page, error } = await supabase
      .from('content_pages')
      .insert({
        slug,
        title,
        content: content || {},
        meta_title: metaTitle,
        meta_description: metaDescription,
        published
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating content page:', error);
      return NextResponse.json(
        { error: 'Failed to create content page' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      page,
      message: 'Content page created successfully'
    });
  } catch (error) {
    console.error('Error in create content API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
