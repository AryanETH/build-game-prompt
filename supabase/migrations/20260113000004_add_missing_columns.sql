-- Add missing columns that the app expects

-- Add feed_position to games table (for admin-controlled feed ordering)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='games' AND column_name='feed_position') THEN
        ALTER TABLE games ADD COLUMN feed_position INTEGER;
        CREATE INDEX idx_games_feed_position ON games(feed_position) WHERE feed_position IS NOT NULL;
    END IF;
END $$;

-- Add followers_count and following_count to profiles if missing
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='followers_count') THEN
        ALTER TABLE profiles ADD COLUMN followers_count INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='following_count') THEN
        ALTER TABLE profiles ADD COLUMN following_count INTEGER DEFAULT 0;
    END IF;
END $$;

-- Add likes_count to game_comments if missing
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='game_comments' AND column_name='likes_count') THEN
        ALTER TABLE game_comments ADD COLUMN likes_count INTEGER DEFAULT 0;
    END IF;
END $$;

-- Ensure all games have proper default values
UPDATE games SET likes_count = 0 WHERE likes_count IS NULL;
UPDATE games SET plays_count = 0 WHERE plays_count IS NULL;
UPDATE games SET comments_count = 0 WHERE comments_count IS NULL;

-- Ensure all profiles have proper default values
UPDATE profiles SET followers_count = 0 WHERE followers_count IS NULL;
UPDATE profiles SET following_count = 0 WHERE following_count IS NULL;
UPDATE profiles SET coins = 100 WHERE coins IS NULL;
UPDATE profiles SET xp = 0 WHERE xp IS NULL;
