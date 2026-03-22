-- ============================================
-- VERIFY AND FIX: Profile, Comments, GIFs, Replies
-- Run in: https://supabase.com/dashboard/project/uvmkkyvysyvdcalfhziy/sql/new
-- ============================================

-- 1. Verify and add profile columns
DO $$ 
BEGIN
    -- name column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='profiles' AND column_name='name'
    ) THEN
        ALTER TABLE profiles ADD COLUMN name TEXT;
        RAISE NOTICE 'Added name column';
    ELSE
        RAISE NOTICE 'name column already exists';
    END IF;
    
    -- display_name column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='profiles' AND column_name='display_name'
    ) THEN
        ALTER TABLE profiles ADD COLUMN display_name TEXT;
        RAISE NOTICE 'Added display_name column';
    ELSE
        RAISE NOTICE 'display_name column already exists';
    END IF;
    
    -- bio column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='profiles' AND column_name='bio'
    ) THEN
        ALTER TABLE profiles ADD COLUMN bio TEXT;
        RAISE NOTICE 'Added bio column';
    ELSE
        RAISE NOTICE 'bio column already exists';
    END IF;
END $$;

-- 2. Verify game_comments table structure
DO $$ 
BEGIN
    -- parent_comment_id for nested replies
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='game_comments' AND column_name='parent_comment_id'
    ) THEN
        ALTER TABLE game_comments ADD COLUMN parent_comment_id UUID REFERENCES game_comments(id) ON DELETE CASCADE;
        RAISE NOTICE 'Added parent_comment_id column';
    ELSE
        RAISE NOTICE 'parent_comment_id column already exists';
    END IF;
    
    -- likes_count
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='game_comments' AND column_name='likes_count'
    ) THEN
        ALTER TABLE game_comments ADD COLUMN likes_count INTEGER DEFAULT 0;
        RAISE NOTICE 'Added likes_count column';
    ELSE
        RAISE NOTICE 'likes_count column already exists';
    END IF;
END $$;

-- 3. Create comment_likes table if missing
CREATE TABLE IF NOT EXISTS comment_likes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    comment_id UUID REFERENCES game_comments(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(comment_id, user_id)
);

-- 4. Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_likes ENABLE ROW LEVEL SECURITY;

-- 5. Ensure comment RLS policies exist
DO $$
BEGIN
    -- View comments
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'game_comments' AND policyname = 'Anyone can view comments'
    ) THEN
        CREATE POLICY "Anyone can view comments"
            ON game_comments FOR SELECT
            USING (true);
    END IF;
    
    -- Create comments
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'game_comments' AND policyname = 'Authenticated users can create comments'
    ) THEN
        CREATE POLICY "Authenticated users can create comments"
            ON game_comments FOR INSERT
            WITH CHECK (auth.uid() = user_id);
    END IF;
    
    -- Update own comments
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'game_comments' AND policyname = 'Users can update own comments'
    ) THEN
        CREATE POLICY "Users can update own comments"
            ON game_comments FOR UPDATE
            USING (auth.uid() = user_id);
    END IF;
    
    -- Delete own comments
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'game_comments' AND policyname = 'Users can delete own comments'
    ) THEN
        CREATE POLICY "Users can delete own comments"
            ON game_comments FOR DELETE
            USING (auth.uid() = user_id);
    END IF;
END $$;

-- 6. Ensure comment_likes RLS policies exist
DO $$
BEGIN
    -- View likes
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'comment_likes' AND policyname = 'Anyone can view comment likes'
    ) THEN
        CREATE POLICY "Anyone can view comment likes"
            ON comment_likes FOR SELECT
            USING (true);
    END IF;
    
    -- Create likes
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'comment_likes' AND policyname = 'Authenticated users can like comments'
    ) THEN
        CREATE POLICY "Authenticated users can like comments"
            ON comment_likes FOR INSERT
            WITH CHECK (auth.uid() = user_id);
    END IF;
    
    -- Delete likes (unlike)
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'comment_likes' AND policyname = 'Users can unlike comments'
    ) THEN
        CREATE POLICY "Users can unlike comments"
            ON comment_likes FOR DELETE
            USING (auth.uid() = user_id);
    END IF;
END $$;

-- 7. Create auto-update triggers for counts
CREATE OR REPLACE FUNCTION update_comment_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE game_comments 
        SET likes_count = COALESCE(likes_count, 0) + 1 
        WHERE id = NEW.comment_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE game_comments 
        SET likes_count = GREATEST(COALESCE(likes_count, 0) - 1, 0) 
        WHERE id = OLD.comment_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_comment_likes_count ON comment_likes;
CREATE TRIGGER trigger_update_comment_likes_count
    AFTER INSERT OR DELETE ON comment_likes
    FOR EACH ROW
    EXECUTE FUNCTION update_comment_likes_count();

-- 8. Add comments_count to games
ALTER TABLE games ADD COLUMN IF NOT EXISTS comments_count INTEGER DEFAULT 0;

-- 9. Create trigger for game comments count
CREATE OR REPLACE FUNCTION update_game_comments_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE games 
        SET comments_count = COALESCE(comments_count, 0) + 1 
        WHERE id = NEW.game_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE games 
        SET comments_count = GREATEST(COALESCE(comments_count, 0) - 1, 0) 
        WHERE id = OLD.game_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_game_comments_count ON game_comments;
CREATE TRIGGER trigger_update_game_comments_count
    AFTER INSERT OR DELETE ON game_comments
    FOR EACH ROW
    EXECUTE FUNCTION update_game_comments_count();

-- 10. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_game_comments_game_id ON game_comments(game_id);
CREATE INDEX IF NOT EXISTS idx_game_comments_user_id ON game_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_game_comments_parent ON game_comments(parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_likes_comment_id ON comment_likes(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_likes_user_id ON comment_likes(user_id);

-- Done!
SELECT 
    'Profile, Comments, GIFs, and Replies are all set up!' as status,
    (SELECT COUNT(*) FROM game_comments) as total_comments,
    (SELECT COUNT(*) FROM comment_likes) as total_comment_likes;
