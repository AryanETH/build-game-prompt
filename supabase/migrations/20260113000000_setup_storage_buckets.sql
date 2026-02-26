-- Setup all required storage buckets for Oplus

-- 1. Avatars bucket (for user profile pictures)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars', 
  'avatars', 
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

-- Avatars policies
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Public can view avatars" ON storage.objects;
CREATE POLICY "Public can view avatars"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- 2. Game thumbnails bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'game-thumbnails', 
  'game-thumbnails', 
  true,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];

-- Game thumbnails policies
DROP POLICY IF EXISTS "Authenticated users can upload game thumbnails" ON storage.objects;
CREATE POLICY "Authenticated users can upload game thumbnails"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'game-thumbnails');

DROP POLICY IF EXISTS "Public can view game thumbnails" ON storage.objects;
CREATE POLICY "Public can view game thumbnails"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'game-thumbnails');

DROP POLICY IF EXISTS "Users can delete their own game thumbnails" ON storage.objects;
CREATE POLICY "Users can delete their own game thumbnails"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'game-thumbnails' AND
  EXISTS (
    SELECT 1 FROM public.games
    WHERE games.thumbnail_url LIKE '%' || name || '%'
    AND games.creator_id = auth.uid()
  )
);

-- 3. Payment screenshots bucket (already in migration, but ensuring it exists)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'payment-screenshots', 
  'payment-screenshots', 
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];

-- Payment screenshots policies (if not already created)
DROP POLICY IF EXISTS "Users can upload payment screenshots" ON storage.objects;
CREATE POLICY "Users can upload payment screenshots"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'payment-screenshots' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Public can view payment screenshots" ON storage.objects;
CREATE POLICY "Public can view payment screenshots"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'payment-screenshots');

DROP POLICY IF EXISTS "Admins can view all payment screenshots" ON storage.objects;
CREATE POLICY "Admins can view all payment screenshots"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'payment-screenshots' AND
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.is_admin = true
  )
);

-- 4. Game assets bucket (for any additional game files)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'game-assets', 
  'game-assets', 
  true,
  52428800, -- 50MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'audio/mpeg', 'audio/wav', 'audio/ogg']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'audio/mpeg', 'audio/wav', 'audio/ogg'];

-- Game assets policies
DROP POLICY IF EXISTS "Authenticated users can upload game assets" ON storage.objects;
CREATE POLICY "Authenticated users can upload game assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'game-assets');

DROP POLICY IF EXISTS "Public can view game assets" ON storage.objects;
CREATE POLICY "Public can view game assets"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'game-assets');

DROP POLICY IF EXISTS "Users can delete their own game assets" ON storage.objects;
CREATE POLICY "Users can delete their own game assets"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'game-assets' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
