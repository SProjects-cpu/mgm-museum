// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

type Params = Promise<{ slug: string }>;

// GET - Fetch single content page
export async function GET(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { slug } = await params;
    const supabase = createClient();

    const { data: page, error } = await supabase
      .from('content_pages')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error) {
      console.error('Error fetching content page:', error);
      return NextResponse.json(
        { error: 'Content page not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ page });
  } catch (error) {
    console.error('Error in content API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update content page
export async function PUT(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { slug } = await params;
    const supabase = createClient();
    const body = await request.json();

    const {
      title,
      content,
      metaTitle,
      metaDescription,
      published
    } = body;

    // Prepare update data
    const updateData: any = {};
    if (title) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (metaTitle) updateData.meta_title = metaTitle;
    if (metaDescription) updateData.meta_description = metaDescription;
    if (published !== undefined) updateData.published = published;
    updateData.updated_at = new Date().toISOString();

    // Update content page
    const { data: page, error } = await supabase
      .from('content_pages')
      .update(updateData)
      .eq('slug', slug)
      .select()
      .single();

    if (error) {
      console.error('Error updating content page:', error);
      return NextResponse.json(
        { error: 'Failed to update content page' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      page,
      message: 'Content page updated successfully'
    });
  } catch (error) {
    console.error('Error in update content API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete content page
export async function DELETE(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { slug } = await params;
    const supabase = createClient();

    // Delete the content page
    const { error } = await supabase
      .from('content_pages')
      .delete()
      .eq('slug', slug);

    if (error) {
      console.error('Error deleting content page:', error);
      return NextResponse.json(
        { error: 'Failed to delete content page' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      message: 'Content page deleted successfully'
    });
  } catch (error) {
    console.error('Error in delete content API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
