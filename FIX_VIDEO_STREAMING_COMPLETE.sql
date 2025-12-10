-- =====================================================
-- COMPLETE VIDEO STREAMING & LIKES FIX
-- =====================================================
-- Run this SQL in Supabase SQL Editor to fix:
-- 1. Video loading issues
-- 2. Game likes 403 Forbidden error
-- =====================================================

-- =====================================================
-- STEP 1: Ensure immersive media columns exist
-- =====================================================

ALTER TABLE games 
ADD COLUMN IF NOT EXISTS background_sound_url TEXT,
ADD COLUMN IF NOT EXISTS media_type VARCHAR(10) DEFAULT 'image',
ADD COLUMN IF NOT EXISTS media_url TEXT,
ADD COLUMN IF NOT EXISTS media_duration INTEGER DEFAULT 10;

-- Remove old constraint if exists and add new one
ALTER TABLE games DROP CONSTRAINT IF EXISTS games_media_type_check;
ALTER TABLE games ADD CONSTRAINT games_media_type_check 
  CHECK (media_type IS NULL OR media_type IN ('image', 'video', 'gif'));

-- =====================================================
-- STEP 2: Ensure storage bucket is public
-- =====================================================

UPDATE storage.buckets 
SET public = true,
    file_size_limit = 52428800
WHERE id = 'thumbnails';

-- =====================================================
-- STEP 3: Fix storage policies
-- =====================================================

DROP POLICY IF EXISTS "thumbnails_public_read" ON storage.objects;
CREATE POLICY "thumbnails_public_read" ON storage.objects
FOR SELECT USING (bucket_id = 'thumbnails');

-- =====================================================
-- STEP 4: FIX GAME_LIKES RLS POLICIES (403 Error Fix)
-- =====================================================

-- Enable RLS
ALTER TABLE game_likes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view all likes" ON game_likes;
DROP POLICY IF EXISTS "Users can like games" ON game_likes;
DROP POLICY IF EXISTS "Users can unlike games" ON game_likes;
DROP POLICY IF EXISTS "game_likes_select" ON game_likes;
DROP POLICY IF EXISTS "game_likes_insert" ON game_likes;
DROP POLICY IF EXISTS "game_likes_delete" ON game_likes;
DROP POLICY IF EXISTS "Anyone can view likes" ON game_likes;
DROP POLICY IF EXISTS "Authenticated users can like" ON game_likes;
DROP POLICY IF EXISTS "Users can delete own likes" ON game_likes;

-- Create new permissive policies
CREATE POLICY "Anyone can view likes" ON game_likes
FOR SELECT USING (true);

CREATE POLICY "Authenticated users can like" ON game_likes
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own likes" ON game_likes
FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- STEP 5: Update existing games with media_url
-- =====================================================

UPDATE games 
SET media_url = thumbnail_url,
    media_type = 'image'
WHERE media_url IS NULL AND thumbnail_url IS NOT NULL;

-- =====================================================
-- STEP 6: Create indexes for performance
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_games_media_type ON games(media_type);
CREATE INDEX IF NOT EXISTS idx_game_likes_user ON game_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_game_likes_game ON game_likes(game_id);

-- =====================================================
-- STEP 7: Enable realtime
-- =====================================================

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE games;
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE game_likes;
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

-- =====================================================
-- STEP 8: Verify setup
-- =====================================================

-- Check game_likes policies
SELECT 
  policyname,
  cmd,
  permissive
FROM pg_policies 
WHERE tablename = 'game_likes';

-- Check games with video
SELECT 
  id,
  title,
  media_type,
  LEFT(media_url, 50) as media_url_preview
FROM games 
WHERE media_type = 'video'
LIMIT 5;

-- Summary
SELECT 
  'All fixes applied!' as status,
  (SELECT COUNT(*) FROM games) as total_games,
  (SELECT COUNT(*) FROM game_likes) as total_likes;

-- =====================================================
-- DONE! Refresh your app - videos and likes should work.
-- =====================================================