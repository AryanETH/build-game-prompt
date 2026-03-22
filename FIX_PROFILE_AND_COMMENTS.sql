-- ============================================
-- FIX PROFILE UPDATES & COMMENT SYSTEM
-- ============================================

-- 1. Ensure profiles table has all required columns
DO $$ 
BEGIN
    -- Add name column if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='profiles' AND column_name='name'
    ) THEN
        ALTER TABLE profiles ADD COLUMN name TEXT;
    END IF;
    
    -- Add display_name column if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='profiles' AND column_name='display_name'
    ) THEN
        ALTER TABLE profiles ADD COLUMN display_name TEXT;
    END IF;
    
    -- Add bio column if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='profiles' AND column_name='bio'
    ) THEN
        ALTER TABLE profiles ADD COLUMN bio TEXT;
        ALTER TABLE profiles ADD CONSTRAINT profiles_bio_length_check 
            CHECK (char_length(COALESCE(bio, '')) <= 500);
    END IF;
END $$;

-- 2. Enable RLS on profiles (if not already enabled)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 3. Drop existing policies to recreate them
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- 4. Create comprehensive RLS policies for profiles
CREATE POLICY "Users can view all profiles"
    ON profiles FOR SELECT
    USING (true);

CREATE POLICY "Users can insert own profile"
    ON profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- 5. Ensure game_comments table exists with proper structure
CREATE TABLE IF NOT EXISTS game_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    game_id UUID REFERENCES games(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    parent_comment_id UUID REFERENCES game_comments(id) ON DELETE CASCADE,
    likes_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Enable RLS on game_comments
ALTER TABLE game_comments ENABLE ROW LEVEL SECURITY;

-- 7. Drop existing comment policies
DROP POLICY IF EXISTS "Anyone can view comments" ON game_comments;
DROP POLICY IF EXISTS "Authenticated users can create comments" ON game_comments;
DROP POLICY IF EXISTS "Users can update own comments" ON game_comments;
DROP POLICY IF EXISTS "Users can delete own comments" ON game_comments;

-- 8. Create RLS policies for comments
CREATE POLICY "Anyone can view comments"
    ON game_comments FOR SELECT
    USING (true);

CREATE POLICY "Authenticated users can create comments"
    ON game_comments FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comments"
    ON game_comments FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments"
    ON game_comments FOR DELETE
    USING (auth.uid() = user_id);

-- 9. Ensure comment_likes table exists
CREATE TABLE IF NOT EXISTS comment_likes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    comment_id UUID REFERENCES game_comments(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(comment_id, user_id)
);

-- 10. Enable RLS on comment_likes
ALTER TABLE comment_likes ENABLE ROW LEVEL SECURITY;

-- 11. Drop existing comment_likes policies
DROP POLICY IF EXISTS "Anyone can view comment likes" ON comment_likes;
DROP POLICY IF EXISTS "Authenticated users can like comments" ON comment_likes;
DROP POLICY IF EXISTS "Users can unlike comments" ON comment_likes;

-- 12. Create RLS policies for comment_likes
CREATE POLICY "Anyone can view comment likes"
    ON comment_likes FOR SELECT
    USING (true);

CREATE POLICY "Authenticated users can like comments"
    ON comment_likes FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike comments"
    ON comment_likes FOR DELETE
    USING (auth.uid() = user_id);

-- 13. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_game_comments_game_id ON game_comments(game_id);
CREATE INDEX IF NOT EXISTS idx_game_comments_user_id ON game_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_game_comments_parent ON game_comments(parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_likes_comment_id ON comment_likes(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_likes_user_id ON comment_likes(user_id);

-- 14. Create function to update comment likes count
CREATE OR REPLACE FUNCTION update_comment_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE game_comments 
        SET likes_count = likes_count + 1 
        WHERE id = NEW.comment_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE game_comments 
        SET likes_count = GREATEST(likes_count - 1, 0) 
        WHERE id = OLD.comment_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 15. Create trigger for comment likes count
DROP TRIGGER IF EXISTS trigger_update_comment_likes_count ON comment_likes;
CREATE TRIGGER trigger_update_comment_likes_count
    AFTER INSERT OR DELETE ON comment_likes
    FOR EACH ROW
    EXECUTE FUNCTION update_comment_likes_count();

-- 16. Create function to update game comments count
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

-- 17. Create trigger for game comments count
DROP TRIGGER IF EXISTS trigger_update_game_comments_count ON game_comments;
CREATE TRIGGER trigger_update_game_comments_count
    AFTER INSERT OR DELETE ON game_comments
    FOR EACH ROW
    EXECUTE FUNCTION update_game_comments_count();

-- 18. Ensure games table has comments_count column
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='games' AND column_name='comments_count'
    ) THEN
        ALTER TABLE games ADD COLUMN comments_count INTEGER DEFAULT 0;
    END IF;
END $$;

-- Done!
SELECT 'Profile and comment system fixed!' as status;
