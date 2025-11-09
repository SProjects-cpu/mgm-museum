import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Allowed file types and max size
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes
const ALLOWED_BUCKETS = ['exhibition-images', 'show-images'];

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Verify user is authenticated and has admin role
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('[Upload API] Authentication error:', authError);
      return NextResponse.json(
        { error: 'Unauthorized. Please login as admin.' },
        { status: 401 }
      );
    }

    // Check if user has admin role
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userError || !userData || !['admin', 'super_admin'].includes(userData.role)) {
      console.error('[Upload API] Authorization error:', userError);
      return NextResponse.json(
        { error: 'Forbidden. Admin access required.' },
        { status: 403 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const bucket = formData.get('bucket') as string;
    const entityId = formData.get('entityId') as string;

    // Validate file presence
    if (!file) {
      console.warn('[Upload API] No file provided');
      return NextResponse.json(
        { error: 'No file provided. Please select an image to upload.' },
        { status: 400 }
      );
    }

    // Validate bucket
    if (!bucket || !ALLOWED_BUCKETS.includes(bucket)) {
      console.warn('[Upload API] Invalid bucket:', bucket);
      return NextResponse.json(
        { error: `Invalid bucket. Must be one of: ${ALLOWED_BUCKETS.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate entity ID
    if (!entityId) {
      console.warn('[Upload API] No entity ID provided');
      return NextResponse.json(
        { error: 'Entity ID is required.' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      console.warn('[Upload API] Invalid file type:', file.type);
      return NextResponse.json(
        { 
          error: 'Invalid file type. Only JPEG, PNG, and WebP images are allowed.',
          allowedTypes: ALLOWED_TYPES
        },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      console.warn('[Upload API] File too large:', file.size);
      return NextResponse.json(
        { 
          error: `File size exceeds 5MB limit. Your file is ${(file.size / 1024 / 1024).toFixed(2)}MB.`,
          maxSize: '5MB',
          fileSize: `${(file.size / 1024 / 1024).toFixed(2)}MB`
        },
        { status: 400 }
      );
    }

    // Validate file extension matches MIME type
    const fileExt = file.name.split('.').pop()?.toLowerCase();
    const validExtensions: Record<string, string[]> = {
      'image/jpeg': ['jpg', 'jpeg'],
      'image/png': ['png'],
      'image/webp': ['webp']
    };

    if (!fileExt || !validExtensions[file.type]?.includes(fileExt)) {
      console.warn('[Upload API] File extension mismatch:', fileExt, file.type);
      return NextResponse.json(
        { error: 'File extension does not match file type.' },
        { status: 400 }
      );
    }

    // Generate unique filename with sanitized entity ID
    const sanitizedEntityId = entityId.replace(/[^a-zA-Z0-9-_]/g, '_');
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileName = `${sanitizedEntityId}/${timestamp}_${randomString}.${fileExt}`;

    console.log('[Upload API] Uploading file:', {
      bucket,
      fileName,
      fileType: file.type,
      fileSize: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
      userId: user.id
    });

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Supabase Storage
    const { data, error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false,
        cacheControl: '3600', // Cache for 1 hour
      });

    if (uploadError) {
      console.error('[Upload API] Supabase storage error:', uploadError);
      
      // Provide specific error messages
      if (uploadError.message.includes('already exists')) {
        return NextResponse.json(
          { error: 'A file with this name already exists. Please try again.' },
          { status: 409 }
        );
      }
      
      if (uploadError.message.includes('not found')) {
        return NextResponse.json(
          { error: 'Storage bucket not found. Please contact support.' },
          { status: 404 }
        );
      }

      return NextResponse.json(
        { 
          error: 'Failed to upload file. Please try again.',
          details: uploadError.message 
        },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);

    console.log('[Upload API] Upload successful:', {
      path: data.path,
      url: publicUrl
    });

    return NextResponse.json({ 
      success: true,
      url: publicUrl,
      path: data.path,
      fileName: file.name,
      fileSize: file.size,
      message: 'File uploaded successfully'
    });

  } catch (error: any) {
    console.error('[Upload API] Unexpected error:', error);
    
    // Handle specific error types
    if (error.name === 'PayloadTooLargeError') {
      return NextResponse.json(
        { error: 'File is too large. Maximum size is 5MB.' },
        { status: 413 }
      );
    }

    return NextResponse.json(
      { 
        error: 'An unexpected error occurred. Please try again.',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}
