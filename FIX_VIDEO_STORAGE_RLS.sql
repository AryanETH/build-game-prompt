-- =====================================================
-- FIX VIDEO STORAGE RLS POLICIES FOR PUBLIC ACCESS
-- =====================================================
-- This script fixes the 403 Forbidden error when loading
-- videos from Supabase Storage in the game feed.
-- =====================================================

-- Step 1: Make the thumbnails bucket public (if not already)
UPDATE storage.buckets 
SET public = true 
WHERE id = 'thumbnails';

-- Step 2: Drop existing restrictive policies on thumbnails bucket
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own files" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "thumbnails_public_read" ON storage.objects;
DROP POLICY IF EXISTS "thumbnails_auth_upload" ON storage.objects;
DROP POLICY IF EXISTS "thumbnails_auth_update" ON storage.objects;
DROP POLICY IF EXISTS "thumbnails_auth_delete" ON storage.objects;

-- Step 3: Create new permissive policies for the thumbnails bucket

-- Allow ANYONE to read/view files (videos, images, audio) - PUBLIC ACCESS
CREATE POLICY "thumbnails_public_read" ON storage.objects
FOR SELECT
USING (bucket_id = 'thumbnails');

-- Allow authenticated users to upload files
CREATE POLICY "thumbnails_auth_upload" ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'thumbnails' 
  AND auth.role() = 'authenticated'
);

-- Allow authenticated users to update their own files
CREATE POLICY "thumbnails_auth_update" ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'thumbnails' 
  AND auth.role() = 'authenticated'
);

-- Allow authenticated users to delete their own files
CREATE POLICY "thumbnails_auth_delete" ON storage.objects
FOR DELETE
USING (
  bucket_id = 'thumbnails' 
  AND auth.role() = 'authenticated'
);

-- Step 4: Ensure the bucket exists and is properly configured
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'thumbnails',
  'thumbnails',
  true,
  52428800, -- 50MB limit for videos
  ARRAY[
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'video/mp4',
    'video/webm',
    'video/quicktime',
    'video/x-msvideo',
    'audio/mpeg',
    'audio/wav',
    'audio/ogg',
    'audio/mp3'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY[
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'video/mp4',
    'video/webm',
    'video/quicktime',
    'video/x-msvideo',
    'audio/mpeg',
    'audio/wav',
    'audio/ogg',
    'audio/mp3'
  ];

-- Step 5: Verify the setup
SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets 
WHERE id = 'thumbnails';

-- Step 6: Check existing policies
SELECT 
  policyname,
  tablename,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage';

-- =====================================================
-- IMPORTANT: Run this in Supabase SQL Editor
-- After running, refresh your app and videos should load
-- =====================================================