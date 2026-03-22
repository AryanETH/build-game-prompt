-- ============================================
-- COMPLETE FIX: Profile, Likes, Comments, GIFs, Replies
-- Run in: https://supabase.com/dashboard/project/uvmkkyvysyvdcalfhziy/sql/new
-- ============================================

-- ========== PART 1: PROFILES ==========

-- Add all profile columns
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS display_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio TEXT;

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- ========== PART 2: GAME LIKES ==========

-- Ensure game_likes table exists
CREATE TABLE IF NOT EXISTS game_likes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    game_id UUID REFERENCES games(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(game_id, user_id)
);

-- Enable RLS on game_likes
ALTER TABLE game_likes ENABLE ROW LEVEL SECURITY;

-- Drop and recreate game_likes policies
DROP POLICY IF EXISTS "Anyone can view game likes" ON game_likes;
CREATE POLICY "Anyone can view game likes"
    ON game_likes FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Authenticated users can like games" ON game_likes;
CREATE POLICY "Authenticated users can like games"
    ON game_likes FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can unlike games" ON game_likes;
CREATE POLICY "Users can unlike games"
    ON game_likes FOR DELETE
    USING (auth.uid() = user_id);

-- Add likes_count to games if missing
ALTER TABLE games ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0;

-- Create function to auto-update game likes count
CREATE OR REPLACE FUNCTION update_game_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE games 
        SET likes_count = COALESCE(likes_count, 0) + 1 
        WHERE id = NEW.game_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE games 
        SET likes_count = GREATEST(COALESCE(likes_count, 0) - 1, 0) 
        WHERE id = OLD.game_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for game likes
DROP TRIGGER IF EXISTS trigger_update_game_likes_count ON game_likes;
CREATE TRIGGER trigger_update_game_likes_count
    AFTER INSERT OR DELETE ON game_likes
    FOR EACH ROW
    EXECUTE FUNCTION update_game_likes_count();

-- Backfill likes_count for existing games
UPDATE games g
SET likes_count = (
    SELECT COUNT(*) 
    FROM game_likes gl 
    WHERE gl.game_id = g.id
);

-- ========== PART 3: COMMENTS & REPLIES ==========

-- Ensure game_comments has all columns
ALTER TABLE game_comments ADD COLUMN IF NOT EXISTS parent_comment_id UUID REFERENCES game_comments(id) ON DELETE CASCADE;
ALTER TABLE game_comments ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0;
ALTER TABLE game_comments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Enable RLS
ALTER TABLE game_comments ENABLE ROW LEVEL SECURITY;

-- Drop and recreate comment policies
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

-- ========== PART 4: COMMENT LIKES ==========

-- Create comment_likes table
CREATE TABLE IF NOT EXISTS comment_likes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    comment_id UUID REFERENCES game_comments(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(comment_id, user_id)
);

-- Enable RLS
ALTER TABLE comment_likes ENABLE ROW LEVEL SECURITY;

-- Drop and recreate comment_likes policies
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

-- Create function to auto-update comment likes count
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

-- Create trigger for comment likes
DROP TRIGGER IF EXISTS trigger_update_comment_likes_count ON comment_likes;
CREATE TRIGGER trigger_update_comment_likes_count
    AFTER INSERT OR DELETE ON comment_likes
    FOR EACH ROW
    EXECUTE FUNCTION update_comment_likes_count();

-- ========== PART 5: GAME COMMENTS COUNT ==========

-- Add comments_count to games
ALTER TABLE games ADD COLUMN IF NOT EXISTS comments_count INTEGER DEFAULT 0;

-- Create function to auto-update game comments count
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

-- Create trigger for game comments count
DROP TRIGGER IF EXISTS trigger_update_game_comments_count ON game_comments;
CREATE TRIGGER trigger_update_game_comments_count
    AFTER INSERT OR DELETE ON game_comments
    FOR EACH ROW
    EXECUTE FUNCTION update_game_comments_count();

-- Backfill comments_count
UPDATE games g
SET comments_count = (
    SELECT COUNT(*) 
    FROM game_comments gc 
    WHERE gc.game_id = g.id
);

-- ========== PART 6: INDEXES FOR PERFORMANCE ==========

CREATE INDEX IF NOT EXISTS idx_game_likes_game_id ON game_likes(game_id);
CREATE INDEX IF NOT EXISTS idx_game_likes_user_id ON game_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_game_comments_game_id ON game_comments(game_id);
CREATE INDEX IF NOT EXISTS idx_game_comments_user_id ON game_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_game_comments_parent ON game_comments(parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_likes_comment_id ON comment_likes(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_likes_user_id ON comment_likes(user_id);

-- ========== VERIFICATION ==========

SELECT 
    'ALL FEATURES FIXED!' as status,
    (SELECT COUNT(*) FROM game_likes) as total_game_likes,
    (SELECT COUNT(*) FROM game_comments) as total_comments,
    (SELECT COUNT(*) FROM comment_likes) as total_comment_likes,
    (SELECT COUNT(*) FROM profiles WHERE bio IS NOT NULL) as profiles_with_bio;
