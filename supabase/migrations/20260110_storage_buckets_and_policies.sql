-- Migration: Create Storage Buckets and RLS Policies for Admin Panel
-- Created: 2026-01-10
-- Purpose: Enable image upload functionality for exhibitions and shows

-- ================================================
-- CREATE STORAGE BUCKETS
-- ================================================

-- Create exhibition-images bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'exhibition-images',
  'exhibition-images',
  true,
  5242880, -- 5MB in bytes
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Create show-images bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'show-images',
  'show-images',
  true,
  5242880, -- 5MB in bytes
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- ================================================
-- RLS POLICIES FOR EXHIBITION-IMAGES BUCKET
-- ================================================

-- Allow authenticated admins to upload exhibition images
CREATE POLICY "Admins can upload exhibition images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'exhibition-images' AND
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND role IN ('admin', 'super_admin')
  )
);

-- Allow authenticated admins to update exhibition images
CREATE POLICY "Admins can update exhibition images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'exhibition-images' AND
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND role IN ('admin', 'super_admin')
  )
);

-- Allow authenticated admins to delete exhibition images
CREATE POLICY "Admins can delete exhibition images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'exhibition-images' AND
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND role IN ('admin', 'super_admin')
  )
);

-- Allow public read access to exhibition images
CREATE POLICY "Public can view exhibition images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'exhibition-images');

-- ================================================
-- RLS POLICIES FOR SHOW-IMAGES BUCKET
-- ================================================

-- Allow authenticated admins to upload show images
CREATE POLICY "Admins can upload show images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'show-images' AND
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND role IN ('admin', 'super_admin')
  )
);

-- Allow authenticated admins to update show images
CREATE POLICY "Admins can update show images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'show-images' AND
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND role IN ('admin', 'super_admin')
  )
);

-- Allow authenticated admins to delete show images
CREATE POLICY "Admins can delete show images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'show-images' AND
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND role IN ('admin', 'super_admin')
  )
);

-- Allow public read access to show images
CREATE POLICY "Public can view show images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'show-images');

-- ================================================
-- COMMENTS
-- ================================================

COMMENT ON POLICY "Admins can upload exhibition images" ON storage.objects IS 'Allows admin users to upload images to exhibition-images bucket';
COMMENT ON POLICY "Public can view exhibition images" ON storage.objects IS 'Allows public read access to exhibition images';
COMMENT ON POLICY "Admins can upload show images" ON storage.objects IS 'Allows admin users to upload images to show-images bucket';
COMMENT ON POLICY "Public can view show images" ON storage.objects IS 'Allows public read access to show images';

-- Migration complete!
-- Next steps:
-- 1. Apply this migration in Supabase SQL Editor
-- 2. Verify buckets are created in Storage section
-- 3. Test upload permissions with admin user
-- 4. Test public read access
