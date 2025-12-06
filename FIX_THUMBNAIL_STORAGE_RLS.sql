-- Fix Thumbnail Storage RLS Policy

-- First, create the thumbnails bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('thumbnails', 'thumbnails', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Anyone can view thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own thumbnails" ON storage.objects;

-- Allow public read access to thumbnails
CREATE POLICY "Anyone can view thumbnails"
ON storage.objects FOR SELECT
USING (bucket_id = 'thumbnails');

-- Allow authenticated users to upload thumbnails
CREATE POLICY "Authenticated users can upload thumbnails"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'thumbnails' 
  AND auth.role() = 'authenticated'
);

-- Allow users to update their own thumbnails
CREATE POLICY "Users can update their own thumbnails"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'thumbnails' 
  AND auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'thumbnails' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own thumbnails
CREATE POLICY "Users can delete their own thumbnails"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'thumbnails' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
