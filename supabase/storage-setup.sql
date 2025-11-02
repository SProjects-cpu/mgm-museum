-- Create storage buckets for exhibition and show images
-- Run this in Supabase SQL Editor or via Supabase CLI

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

-- Set up RLS policies for exhibition-images bucket
CREATE POLICY "Allow public read access to exhibition images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'exhibition-images');

CREATE POLICY "Allow authenticated users to upload exhibition images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'exhibition-images' AND
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'super_admin')
  )
);

CREATE POLICY "Allow admin users to update exhibition images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'exhibition-images' AND
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'super_admin')
  )
);

CREATE POLICY "Allow admin users to delete exhibition images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'exhibition-images' AND
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'super_admin')
  )
);

-- Set up RLS policies for show-images bucket
CREATE POLICY "Allow public read access to show images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'show-images');

CREATE POLICY "Allow authenticated users to upload show images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'show-images' AND
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'super_admin')
  )
);

CREATE POLICY "Allow admin users to update show images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'show-images' AND
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'super_admin')
  )
);

CREATE POLICY "Allow admin users to delete show images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'show-images' AND
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'super_admin')
  )
);
