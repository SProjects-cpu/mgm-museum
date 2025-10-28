import { getServiceSupabase } from '@/lib/supabase/client';

const supabase = getServiceSupabase();

/**
 * Upload file to Supabase Storage
 */
export async function uploadFile(
  bucket: string,
  path: string,
  file: File | Buffer,
  options?: {
    contentType?: string;
    cacheControl?: string;
    upsert?: boolean;
  }
) {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        contentType: options?.contentType,
        cacheControl: options?.cacheControl || '3600',
        upsert: options?.upsert || false,
      });

    if (error) throw error;

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);

    return {
      path: data.path,
      url: urlData.publicUrl,
    };
  } catch (error) {
    console.error('Error uploading file:', error);
    throw new Error('Failed to upload file');
  }
}

/**
 * Delete file from storage
 */
export async function deleteFile(bucket: string, path: string) {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Error deleting file:', error);
    throw new Error('Failed to delete file');
  }
}

/**
 * List files in a bucket
 */
export async function listFiles(bucket: string, path?: string) {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .list(path, {
        limit: 100,
        offset: 0,
        sortBy: { column: 'created_at', order: 'desc' },
      });

    if (error) throw error;

    return data;
  } catch (error) {
    console.error('Error listing files:', error);
    throw new Error('Failed to list files');
  }
}

/**
 * Create storage buckets if they don't exist
 */
export async function createStorageBuckets() {
  const buckets = [
    {
      id: 'exhibitions',
      name: 'exhibitions',
      public: true,
      fileSizeLimit: 5242880, // 5MB
      allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
    },
    {
      id: 'shows',
      name: 'shows',
      public: true,
      fileSizeLimit: 5242880,
      allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'video/mp4'],
    },
    {
      id: 'events',
      name: 'events',
      public: true,
      fileSizeLimit: 5242880,
      allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
    },
    {
      id: 'tickets',
      name: 'tickets',
      public: false, // Private - requires authentication
      fileSizeLimit: 2097152, // 2MB
      allowedMimeTypes: ['application/pdf'],
    },
    {
      id: 'gallery',
      name: 'gallery',
      public: true,
      fileSizeLimit: 5242880,
      allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
    },
  ];

  const results = [];

  for (const bucket of buckets) {
    try {
      // Check if bucket exists
      const { data: existing } = await supabase.storage.getBucket(bucket.id);

      if (!existing) {
        // Create bucket
        const { data, error } = await supabase.storage.createBucket(bucket.id, {
          public: bucket.public,
          fileSizeLimit: bucket.fileSizeLimit,
          allowedMimeTypes: bucket.allowedMimeTypes,
        });

        results.push({
          bucket: bucket.id,
          created: !error,
          error: error?.message,
        });
      } else {
        results.push({
          bucket: bucket.id,
          exists: true,
        });
      }
    } catch (error: any) {
      results.push({
        bucket: bucket.id,
        error: error.message,
      });
    }
  }

  return results;
}

/**
 * Get signed URL for private files
 */
export async function getSignedUrl(bucket: string, path: string, expiresIn: number = 3600) {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn);

    if (error) throw error;

    return data.signedUrl;
  } catch (error) {
    console.error('Error creating signed URL:', error);
    throw new Error('Failed to create signed URL');
  }
}






