-- ============================================
-- RUN THIS IN SUPABASE SQL EDITOR
-- ============================================

-- 1. Add missing columns to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS display_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio TEXT;

-- 2. Add bio length constraint
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'profiles_bio_length_check'
    ) THEN
        ALTER TABLE profiles ADD CONSTRAINT profiles_bio_length_check 
            CHECK (char_length(COALESCE(bio, '')) <= 500);
    END IF;
END $$;

-- 3. Ensure game_comments table has all required columns
DO $$ 
BEGIN
    -- Add parent_comment_id if missing (for nested replies)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='game_comments' AND column_name='parent_comment_id'
    ) THEN
        ALTER TABLE game_comments ADD COLUMN parent_comment_id UUID REFERENCES game_comments(id) ON DELETE CASCADE;
    END IF;
    
    -- Add likes_count if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='game_comments' AND column_name='likes_count'
    ) THEN
        ALTER TABLE game_comments ADD COLUMN likes_count INTEGER DEFAULT 0;
    END IF;
    
    -- Add updated_at if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='game_comments' AND column_name='updated_at'
    ) THEN
        ALTER TABLE game_comments ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- 4. Enable RLS on game_comments
ALTER TABLE game_comments ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policies for comments
DROP POLICY IF EXISTS "Anyone can view comments" ON game_comments;
CREATE POLICY "Anyone can view comments"
    ON game_comments FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Authenticated users can create comments" ON game_comments;
CREATE POLICY "Authenticated users can create comments"
    ON game_comments FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own comments" ON game_comments;
CREATE POLICY "Users can update own comments"
    ON game_comments FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own comments" ON game_comments;
CREATE POLICY "Users can delete own comments"
    ON game_comments FOR DELETE
    USING (auth.uid() = user_id);

-- 6. Create comment_likes table if missing
CREATE TABLE IF NOT EXISTS comment_likes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    comment_id UUID REFERENCES game_comments(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(comment_id, user_id)
);

-- 7. Enable RLS on comment_likes
ALTER TABLE comment_likes ENABLE ROW LEVEL SECURITY;

-- 8. Create RLS policies for comment_likes
DROP POLICY IF EXISTS "Anyone can view comment likes" ON comment_likes;
CREATE POLICY "Anyone can view comment likes"
    ON comment_likes FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Authenticated users can like comments" ON comment_likes;
CREATE POLICY "Authenticated users can like comments"
    ON comment_likes FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can unlike comments" ON comment_likes;
CREATE POLICY "Users can unlike comments"
    ON comment_likes FOR DELETE
    USING (auth.uid() = user_id);

-- 9. Add comments_count to games if missing
ALTER TABLE games ADD COLUMN IF NOT EXISTS comments_count INTEGER DEFAULT 0;

-- 10. Backfill comments_count for existing games
UPDATE games g
SET comments_count = (
    SELECT COUNT(*) 
    FROM game_comments gc 
    WHERE gc.game_id = g.id
)
WHERE comments_count IS NULL OR comments_count = 0;

-- 11. Create function to auto-update comment likes count
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

-- 12. Create trigger for comment likes
DROP TRIGGER IF EXISTS trigger_update_comment_likes_count ON comment_likes;
CREATE TRIGGER trigger_update_comment_likes_count
    AFTER INSERT OR DELETE ON comment_likes
    FOR EACH ROW
    EXECUTE FUNCTION update_comment_likes_count();

-- 13. Create function to auto-update game comments count
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

-- 14. Create trigger for game comments count
DROP TRIGGER IF EXISTS trigger_update_game_comments_count ON game_comments;
CREATE TRIGGER trigger_update_game_comments_count
    AFTER INSERT OR DELETE ON game_comments
    FOR EACH ROW
    EXECUTE FUNCTION update_game_comments_count();

-- 15. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_game_comments_game_id ON game_comments(game_id);
CREATE INDEX IF NOT EXISTS idx_game_comments_user_id ON game_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_game_comments_parent ON game_comments(parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_likes_comment_id ON comment_likes(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_likes_user_id ON comment_likes(user_id);

-- Done!
SELECT 'Profile updates and comment system fixed!' as status;
