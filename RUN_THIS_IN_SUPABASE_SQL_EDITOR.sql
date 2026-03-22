-- ============================================
-- RUN THIS IN SUPABASE SQL EDITOR
-- Go to: https://supabase.com/dashboard/project/tadxoqrxzzmrksdslthd/sql/new
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

-- 3. Add comments_count to games if missing
ALTER TABLE games ADD COLUMN IF NOT EXISTS comments_count INTEGER DEFAULT 0;

-- 4. Backfill comments_count for existing games
UPDATE games g
SET comments_count = (
    SELECT COUNT(*) 
    FROM game_comments gc 
    WHERE gc.game_id = g.id
)
WHERE comments_count IS NULL OR comments_count = 0;

-- 5. Create function to auto-update comment likes count
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

-- 6. Create trigger for comment likes
DROP TRIGGER IF EXISTS trigger_update_comment_likes_count ON comment_likes;
CREATE TRIGGER trigger_update_comment_likes_count
    AFTER INSERT OR DELETE ON comment_likes
    FOR EACH ROW
    EXECUTE FUNCTION update_comment_likes_count();

-- 7. Create function to auto-update game comments count
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

-- 8. Create trigger for game comments count
DROP TRIGGER IF EXISTS trigger_update_game_comments_count ON game_comments;
CREATE TRIGGER trigger_update_game_comments_count
    AFTER INSERT OR DELETE ON game_comments
    FOR EACH ROW
    EXECUTE FUNCTION update_game_comments_count();

-- Done!
SELECT 'Profile updates and comment system fixed!' as status;
