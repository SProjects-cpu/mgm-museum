// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET - Fetch content sections for an exhibition
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createClient();

    const { data: sections, error } = await supabase
      .from('exhibition_content_sections')
      .select('*')
      .eq('exhibition_id', id)
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Error fetching content sections:', error);
      return NextResponse.json(
        { error: 'Failed to fetch content sections', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ sections: sections || [] });
  } catch (error: any) {
    console.error('Error in content sections API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// POST - Create new content section
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createClient();
    const body = await request.json();

    const {
      sectionType,
      title,
      content,
      images = [],
      displayOrder = 0,
      active = true,
      metadata = {},
    } = body;

    if (!sectionType) {
      return NextResponse.json(
        { error: 'Missing required field: sectionType' },
        { status: 400 }
      );
    }

    const { data: section, error } = await supabase
      .from('exhibition_content_sections')
      .insert({
        exhibition_id: id,
        section_type: sectionType,
        title,
        content,
        images,
        display_order: displayOrder,
        active,
        metadata,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating content section:', error);
      return NextResponse.json(
        { error: 'Failed to create content section', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      section,
      message: 'Content section created successfully',
    });
  } catch (error: any) {
    console.error('Error in create content section API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// PUT - Update content section
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createClient();
    const body = await request.json();
    const { sectionId, ...updates } = body;

    if (!sectionId) {
      return NextResponse.json(
        { error: 'Section ID is required' },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (updates.sectionType) updateData.section_type = updates.sectionType;
    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.content !== undefined) updateData.content = updates.content;
    if (updates.images) updateData.images = updates.images;
    if (updates.displayOrder !== undefined) updateData.display_order = updates.displayOrder;
    if (updates.active !== undefined) updateData.active = updates.active;
    if (updates.metadata) updateData.metadata = updates.metadata;

    const { data: section, error } = await supabase
      .from('exhibition_content_sections')
      .update(updateData)
      .eq('id', sectionId)
      .eq('exhibition_id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating content section:', error);
      return NextResponse.json(
        { error: 'Failed to update content section', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      section,
      message: 'Content section updated successfully',
    });
  } catch (error: any) {
    console.error('Error in update content section API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Delete content section
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createClient();
    const { searchParams } = new URL(request.url);
    const sectionId = searchParams.get('sectionId');

    if (!sectionId) {
      return NextResponse.json(
        { error: 'Section ID is required' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('exhibition_content_sections')
      .delete()
      .eq('id', sectionId)
      .eq('exhibition_id', id);

    if (error) {
      console.error('Error deleting content section:', error);
      return NextResponse.json(
        { error: 'Failed to delete content section', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Content section deleted successfully',
    });
  } catch (error: any) {
    console.error('Error in delete content section API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
