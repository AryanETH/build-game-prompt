-- =====================================================
-- VERIFY AND FIX GAME COMMENTS SYSTEM
-- Includes: Comments, Replies, Likes, GIFs
-- Run this in Supabase SQL Editor
-- =====================================================

-- 1. Check game_comments table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'game_comments' 
ORDER BY ordinal_position;

-- 2. Check comment_likes table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'comment_likes' 
ORDER BY ordinal_position;

-- 3. Verify RLS is enabled
SELECT 
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename IN ('game_comments', 'comment_likes');

-- 4. Check existing policies
SELECT 
    tablename,
    policyname,
    cmd
FROM pg_policies 
WHERE tablename IN ('game_comments', 'comment_likes')
ORDER BY tablename, policyname;

-- =====================================================
-- CREATE TABLES IF MISSING
-- =====================================================

-- 5. Create game_comments table
CREATE TABLE IF NOT EXISTS public.game_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    game_id UUID NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    parent_comment_id UUID REFERENCES public.game_comments(id) ON DELETE CASCADE,
    likes_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Create comment_likes table
CREATE TABLE IF NOT EXISTS public.comment_likes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    comment_id UUID NOT NULL REFERENCES public.game_comments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(comment_id, user_id)
);

-- 7. Add comments_count to games table if missing
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='games' AND column_name='comments_count'
    ) THEN
        ALTER TABLE public.games ADD COLUMN comments_count INTEGER DEFAULT 0;
    END IF;
END $$;

-- =====================================================
-- ENABLE RLS
-- =====================================================

ALTER TABLE public.game_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comment_likes ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- DROP EXISTING POLICIES (to avoid conflicts)
-- =====================================================

-- game_comments policies
DROP POLICY IF EXISTS "Anyone can view comments" ON public.game_comments;
DROP POLICY IF EXISTS "Authenticated users can create comments" ON public.game_comments;
DROP POLICY IF EXISTS "Users can update own comments" ON public.game_comments;
DROP POLICY IF EXISTS "Users can delete own comments" ON public.game_comments;

-- comment_likes policies
DROP POLICY IF EXISTS "Anyone can view comment likes" ON public.comment_likes;
DROP POLICY IF EXISTS "Authenticated users can like comments" ON public.comment_likes;
DROP POLICY IF EXISTS "Users can unlike comments" ON public.comment_likes;

-- =====================================================
-- CREATE RLS POLICIES
-- =====================================================

-- game_comments policies
CREATE POLICY "Anyone can view comments"
ON public.game_comments
FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can create comments"
ON public.game_comments
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comments"
ON public.game_comments
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments"
ON public.game_comments
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- comment_likes policies
CREATE POLICY "Anyone can view comment likes"
ON public.comment_likes
FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can like comments"
ON public.comment_likes
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike comments"
ON public.comment_likes
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- =====================================================
-- CREATE AUTO-UPDATE TRIGGERS
-- =====================================================

-- Trigger: Update comment likes_count when someone likes/unlikes
CREATE OR REPLACE FUNCTION update_comment_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.game_comments 
        SET likes_count = COALESCE(likes_count, 0) + 1 
        WHERE id = NEW.comment_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.game_comments 
        SET likes_count = GREATEST(COALESCE(likes_count, 0) - 1, 0) 
        WHERE id = OLD.comment_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_comment_likes_count ON public.comment_likes;
CREATE TRIGGER trigger_update_comment_likes_count
    AFTER INSERT OR DELETE ON public.comment_likes
    FOR EACH ROW
    EXECUTE FUNCTION update_comment_likes_count();

-- Trigger: Update game comments_count when someone comments
CREATE OR REPLACE FUNCTION update_game_comments_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.games 
        SET comments_count = COALESCE(comments_count, 0) + 1 
        WHERE id = NEW.game_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.games 
        SET comments_count = GREATEST(COALESCE(comments_count, 0) - 1, 0) 
        WHERE id = OLD.game_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_game_comments_count ON public.game_comments;
CREATE TRIGGER trigger_update_game_comments_count
    AFTER INSERT OR DELETE ON public.game_comments
    FOR EACH ROW
    EXECUTE FUNCTION update_game_comments_count();

-- =====================================================
-- CREATE INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_game_comments_game_id ON public.game_comments(game_id);
CREATE INDEX IF NOT EXISTS idx_game_comments_user_id ON public.game_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_game_comments_parent ON public.game_comments(parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_game_comments_created_at ON public.game_comments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comment_likes_comment_id ON public.comment_likes(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_likes_user_id ON public.comment_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_comment_likes_unique ON public.comment_likes(comment_id, user_id);

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

GRANT ALL ON public.game_comments TO authenticated;
GRANT ALL ON public.game_comments TO service_role;
GRANT ALL ON public.comment_likes TO authenticated;
GRANT ALL ON public.comment_likes TO service_role;

-- =====================================================
-- BACKFILL COUNTS (fix any inconsistencies)
-- =====================================================

-- Fix comment likes_count
UPDATE public.game_comments gc
SET likes_count = (
    SELECT COUNT(*) 
    FROM public.comment_likes cl 
    WHERE cl.comment_id = gc.id
);

-- Fix game comments_count
UPDATE public.games g
SET comments_count = (
    SELECT COUNT(*) 
    FROM public.game_comments gc 
    WHERE gc.game_id = g.id
);

-- =====================================================
-- TEST QUERIES
-- =====================================================

-- Test 1: Check recent comments
SELECT 
    gc.id,
    gc.game_id,
    gc.user_id,
    CASE 
        WHEN gc.content LIKE '[GIF]%' THEN 'GIF'
        ELSE LEFT(gc.content, 50)
    END as content_preview,
    gc.parent_comment_id,
    gc.likes_count,
    gc.created_at
FROM public.game_comments gc
ORDER BY gc.created_at DESC
LIMIT 10;

-- Test 2: Check comment likes
SELECT 
    cl.comment_id,
    cl.user_id,
    cl.created_at
FROM public.comment_likes cl
ORDER BY cl.created_at DESC
LIMIT 10;

-- Test 3: Verify counts are correct
SELECT 
    g.id,
    g.title,
    g.comments_count as stored_count,
    (SELECT COUNT(*) FROM public.game_comments WHERE game_id = g.id) as actual_count,
    CASE 
        WHEN g.comments_count = (SELECT COUNT(*) FROM public.game_comments WHERE game_id = g.id) 
        THEN 'OK' 
        ELSE 'MISMATCH' 
    END as status
FROM public.games g
WHERE g.comments_count > 0 OR EXISTS (SELECT 1 FROM public.game_comments WHERE game_id = g.id)
ORDER BY g.created_at DESC
LIMIT 10;

-- Test 4: Check nested replies
SELECT 
    parent.id as parent_id,
    parent.content as parent_content,
    COUNT(reply.id) as reply_count
FROM public.game_comments parent
LEFT JOIN public.game_comments reply ON reply.parent_comment_id = parent.id
WHERE parent.parent_comment_id IS NULL
GROUP BY parent.id, parent.content
HAVING COUNT(reply.id) > 0
ORDER BY reply_count DESC
LIMIT 10;

-- =====================================================
-- VERIFICATION COMPLETE
-- =====================================================
-- FEATURES SUPPORTED:
-- ✅ Post comments on games
-- ✅ Reply to comments (nested replies)
-- ✅ Like comments
-- ✅ Unlike comments
-- ✅ Send GIFs in comments (format: [GIF]url)
-- ✅ Delete own comments
-- ✅ Real-time updates
-- ✅ Auto-updating counts (likes_count, comments_count)
-- =====================================================

-- GIF FORMAT:
-- Comments starting with [GIF] are rendered as GIF images
-- Example: [GIF]https://media.giphy.com/media/xyz/giphy.gif
-- =====================================================
