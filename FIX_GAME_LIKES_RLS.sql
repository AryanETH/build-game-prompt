-- =====================================================
-- FIX GAME_LIKES RLS POLICIES
-- =====================================================
-- This fixes the 403 Forbidden error when liking games
-- =====================================================

-- Step 1: Enable RLS on game_likes table
ALTER TABLE game_likes ENABLE ROW LEVEL SECURITY;

-- Step 2: Drop existing policies
DROP POLICY IF EXISTS "Users can view all likes" ON game_likes;
DROP POLICY IF EXISTS "Users can like games" ON game_likes;
DROP POLICY IF EXISTS "Users can unlike games" ON game_likes;
DROP POLICY IF EXISTS "game_likes_select" ON game_likes;
DROP POLICY IF EXISTS "game_likes_insert" ON game_likes;
DROP POLICY IF EXISTS "game_likes_delete" ON game_likes;
DROP POLICY IF EXISTS "Anyone can view likes" ON game_likes;
DROP POLICY IF EXISTS "Authenticated users can like" ON game_likes;
DROP POLICY IF EXISTS "Users can delete own likes" ON game_likes;

-- Step 3: Create new permissive policies

-- Anyone can view likes (for counting)
CREATE POLICY "Anyone can view likes" ON game_likes
FOR SELECT USING (true);

-- Authenticated users can insert likes
CREATE POLICY "Authenticated users can like" ON game_likes
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can delete their own likes
CREATE POLICY "Users can delete own likes" ON game_likes
FOR DELETE USING (auth.uid() = user_id);

-- Step 4: Verify the policies
SELECT 
  policyname,
  cmd,
  permissive,
  roles,
  qual
FROM pg_policies 
WHERE tablename = 'game_likes';

-- Step 5: Test query (should return results)
SELECT COUNT(*) as total_likes FROM game_likes;

SELECT 'game_likes RLS policies fixed!' as status;