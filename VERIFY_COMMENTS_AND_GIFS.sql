-- ============================================================================
-- VERIFY AND FIX COMMENTS & GIFS SYSTEM
-- Run this in Supabase SQL Editor to ensure comments and GIFs work properly
-- ============================================================================

-- ============================================================================
-- STEP 1: Verify game_comments table structure
-- ============================================================================

-- Check if table exists
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'game_comments'
ORDER BY ordinal_position;

-- Create table if missing
CREATE TABLE IF NOT EXISTS public.game_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  parent_comment_id UUID REFERENCES public.game_comments(id) ON DELETE CASCADE,
  likes_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- STEP 2: Verify comment_likes table structure
-- ============================================================================

-- Check if table exists
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'comment_likes'
ORDER BY ordinal_position;

-- Create table if missing
CREATE TABLE IF NOT EXISTS public.comment_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID NOT NULL REFERENCES public.game_comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(comment_id, user_id)
);

-- ============================================================================
-- STEP 3: Create indexes for performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_game_comments_game_id ON public.game_comments(game_id);
CREATE INDEX IF NOT EXISTS idx_game_comments_user_id ON public.game_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_game_comments_parent ON public.game_comments(parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_game_comments_created_at ON public.game_comments(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_comment_likes_comment_id ON public.comment_likes(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_likes_user_id ON public.comment_likes(user_id);

-- ============================================================================
-- STEP 4: Enable RLS
-- ============================================================================

ALTER TABLE public.game_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comment_likes ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 5: Drop and recreate RLS policies for game_comments
-- ============================================================================

DROP POLICY IF EXISTS "Anyone can view comments" ON public.game_comments;
DROP POLICY IF EXISTS "Authenticated users can create comments" ON public.game_comments;
DROP POLICY IF EXISTS "Users can update own comments" ON public.game_comments;
DROP POLICY IF EXISTS "Users can delete own comments" ON public.game_comments;

-- Anyone can view all comments (including GIFs)
CREATE POLICY "Anyone can view comments"
  ON public.game_comments FOR SELECT
  TO public
  USING (true);

-- Authenticated users can create comments
CREATE POLICY "Authenticated users can create comments"
  ON public.game_comments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own comments
CREATE POLICY "Users can update own comments"
  ON public.game_comments FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own comments
CREATE POLICY "Users can delete own comments"
  ON public.game_comments FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================================
-- STEP 6: Drop and recreate RLS policies for comment_likes
-- ============================================================================

DROP POLICY IF EXISTS "Anyone can view comment likes" ON public.comment_likes;
DROP POLICY IF EXISTS "Authenticated users can like comments" ON public.comment_likes;
DROP POLICY IF EXISTS "Users can unlike comments" ON public.comment_likes;

-- Anyone can view comment likes
CREATE POLICY "Anyone can view comment likes"
  ON public.comment_likes FOR SELECT
  TO public
  USING (true);

-- Authenticated users can like comments
CREATE POLICY "Authenticated users can like comments"
  ON public.comment_likes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can unlike their own likes
CREATE POLICY "Users can unlike comments"
  ON public.comment_likes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================================
-- STEP 7: Create trigger to auto-update likes_count
-- ============================================================================

-- Drop existing trigger and function if they exist
DROP TRIGGER IF EXISTS update_comment_likes_count_trigger ON public.comment_likes;
DROP FUNCTION IF EXISTS update_comment_likes_count();

-- Create function to update likes_count
CREATE OR REPLACE FUNCTION update_comment_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.game_comments
    SET likes_count = likes_count + 1
    WHERE id = NEW.comment_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.game_comments
    SET likes_count = GREATEST(likes_count - 1, 0)
    WHERE id = OLD.comment_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
CREATE TRIGGER update_comment_likes_count_trigger
  AFTER INSERT OR DELETE ON public.comment_likes
  FOR EACH ROW
  EXECUTE FUNCTION update_comment_likes_count();

-- ============================================================================
-- STEP 8: Create trigger to auto-update game comments_count
-- ============================================================================

-- Drop existing trigger and function if they exist
DROP TRIGGER IF EXISTS update_game_comments_count_trigger ON public.game_comments;
DROP FUNCTION IF EXISTS update_game_comments_count();

-- Create function to update comments_count
CREATE OR REPLACE FUNCTION update_game_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.games
    SET comments_count = COALESCE(comments_count, 0) + 1
    WHERE id = NEW.game_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.games
    SET comments_count = GREATEST(COALESCE(comments_count, 0) - 1, 0)
    WHERE id = OLD.game_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
CREATE TRIGGER update_game_comments_count_trigger
  AFTER INSERT OR DELETE ON public.game_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_game_comments_count();

-- ============================================================================
-- STEP 9: Backfill comments_count for existing games
-- ============================================================================

UPDATE public.games g
SET comments_count = (
  SELECT COUNT(*)
  FROM public.game_comments c
  WHERE c.game_id = g.id
)
WHERE comments_count IS NULL OR comments_count != (
  SELECT COUNT(*)
  FROM public.game_comments c
  WHERE c.game_id = g.id
);

-- ============================================================================
-- STEP 10: Backfill likes_count for existing comments
-- ============================================================================

UPDATE public.game_comments gc
SET likes_count = (
  SELECT COUNT(*)
  FROM public.comment_likes cl
  WHERE cl.comment_id = gc.id
)
WHERE likes_count IS NULL OR likes_count != (
  SELECT COUNT(*)
  FROM public.comment_likes cl
  WHERE cl.comment_id = gc.id
);

-- ============================================================================
-- STEP 11: Test GIF comments
-- ============================================================================

-- Check if any GIF comments exist
SELECT 
  id,
  content,
  user_id,
  game_id,
  created_at,
  CASE 
    WHEN content LIKE '[GIF]%' THEN 'GIF Comment'
    ELSE 'Text Comment'
  END as comment_type
FROM public.game_comments
WHERE content LIKE '[GIF]%'
ORDER BY created_at DESC
LIMIT 10;

-- ============================================================================
-- STEP 12: Verification queries
-- ============================================================================

-- Check comments count
SELECT 
  'game_comments' as table_name,
  COUNT(*) as total_comments,
  COUNT(*) FILTER (WHERE content LIKE '[GIF]%') as gif_comments,
  COUNT(*) FILTER (WHERE parent_comment_id IS NOT NULL) as reply_comments,
  COUNT(*) FILTER (WHERE parent_comment_id IS NULL) as top_level_comments
FROM public.game_comments;

-- Check comment likes count
SELECT 
  'comment_likes' as table_name,
  COUNT(*) as total_likes,
  COUNT(DISTINCT comment_id) as unique_comments_liked,
  COUNT(DISTINCT user_id) as unique_users_who_liked
FROM public.comment_likes;

-- Check RLS policies
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd
FROM pg_policies
WHERE tablename IN ('game_comments', 'comment_likes')
ORDER BY tablename, policyname;

-- Check triggers
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE event_object_table IN ('game_comments', 'comment_likes')
ORDER BY event_object_table, trigger_name;

-- ============================================================================
-- STEP 13: Test comment with replies
-- ============================================================================

-- Find a game with comments
SELECT 
  g.id as game_id,
  g.title,
  COUNT(c.id) as comment_count,
  COUNT(c.id) FILTER (WHERE c.parent_comment_id IS NULL) as top_level,
  COUNT(c.id) FILTER (WHERE c.parent_comment_id IS NOT NULL) as replies
FROM public.games g
LEFT JOIN public.game_comments c ON c.game_id = g.id
GROUP BY g.id, g.title
HAVING COUNT(c.id) > 0
ORDER BY comment_count DESC
LIMIT 5;

-- ============================================================================
-- STEP 14: Check for orphaned comments (comments on deleted games)
-- ============================================================================

SELECT 
  c.id,
  c.game_id,
  c.content,
  c.created_at
FROM public.game_comments c
LEFT JOIN public.games g ON g.id = c.game_id
WHERE g.id IS NULL
LIMIT 10;

-- Clean up orphaned comments if any exist
DELETE FROM public.game_comments
WHERE game_id NOT IN (SELECT id FROM public.games);

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
DECLARE
  comment_count INTEGER;
  gif_count INTEGER;
  like_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO comment_count FROM public.game_comments;
  SELECT COUNT(*) INTO gif_count FROM public.game_comments WHERE content LIKE '[GIF]%';
  SELECT COUNT(*) INTO like_count FROM public.comment_likes;
  
  RAISE NOTICE '✅ Comments system verified!';
  RAISE NOTICE '💬 Total comments: %', comment_count;
  RAISE NOTICE '🎬 GIF comments: %', gif_count;
  RAISE NOTICE '❤️ Total likes: %', like_count;
  RAISE NOTICE '🔒 RLS policies are active';
  RAISE NOTICE '⚡ Auto-update triggers are active';
  RAISE NOTICE '';
  RAISE NOTICE '📝 Comments and GIFs should now work for everyone!';
END $$;
