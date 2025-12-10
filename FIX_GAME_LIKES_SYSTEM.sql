-- Fix Game Likes System
-- Run this to ensure the game_likes table exists with proper structure and permissions

-- 1. Create game_likes table if it doesn't exist
CREATE TABLE IF NOT EXISTS game_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(game_id, user_id)
);

-- 2. Enable RLS
ALTER TABLE game_likes ENABLE ROW LEVEL SECURITY;

-- 3. Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view all game likes" ON game_likes;
DROP POLICY IF EXISTS "Users can insert their own likes" ON game_likes;
DROP POLICY IF EXISTS "Users can delete their own likes" ON game_likes;

-- 4. Create RLS policies
CREATE POLICY "Users can view all game likes" ON game_likes
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own likes" ON game_likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own likes" ON game_likes
  FOR DELETE USING (auth.uid() = user_id);

-- 5. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_game_likes_game_id ON game_likes(game_id);
CREATE INDEX IF NOT EXISTS idx_game_likes_user_id ON game_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_game_likes_game_user ON game_likes(game_id, user_id);

-- 6. Update games table to have likes_count if it doesn't exist
ALTER TABLE games ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0;

-- 7. Create function to update likes count
CREATE OR REPLACE FUNCTION update_game_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE games 
    SET likes_count = (
      SELECT COUNT(*) 
      FROM game_likes 
      WHERE game_id = NEW.game_id
    )
    WHERE id = NEW.game_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE games 
    SET likes_count = (
      SELECT COUNT(*) 
      FROM game_likes 
      WHERE game_id = OLD.game_id
    )
    WHERE id = OLD.game_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Create triggers to auto-update likes count
DROP TRIGGER IF EXISTS trigger_update_game_likes_count ON game_likes;
CREATE TRIGGER trigger_update_game_likes_count
  AFTER INSERT OR DELETE ON game_likes
  FOR EACH ROW EXECUTE FUNCTION update_game_likes_count();

-- 9. Recalculate all existing likes counts
UPDATE games 
SET likes_count = (
  SELECT COUNT(*) 
  FROM game_likes 
  WHERE game_likes.game_id = games.id
);

-- 10. Grant necessary permissions
GRANT ALL ON game_likes TO authenticated;
GRANT ALL ON game_likes TO service_role;

-- Verification queries (run these to check if everything works)
-- SELECT * FROM game_likes LIMIT 5;
-- SELECT id, title, likes_count FROM games WHERE likes_count > 0 LIMIT 5;