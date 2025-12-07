-- =====================================================
-- Real-time Comment Count Update System
-- =====================================================
-- This script creates a trigger to automatically update
-- the comments_count column in the games table whenever
-- a comment is added or deleted.
-- =====================================================

-- Step 1: Add comments_count column if it doesn't exist
ALTER TABLE games 
ADD COLUMN IF NOT EXISTS comments_count INTEGER DEFAULT 0;

-- Step 2: Create function to update comment count
CREATE OR REPLACE FUNCTION update_game_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  -- When a comment is inserted
  IF (TG_OP = 'INSERT') THEN
    UPDATE games 
    SET comments_count = COALESCE(comments_count, 0) + 1
    WHERE id = NEW.game_id;
    RETURN NEW;
  
  -- When a comment is deleted
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE games 
    SET comments_count = GREATEST(COALESCE(comments_count, 0) - 1, 0)
    WHERE id = OLD.game_id;
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_update_comment_count ON game_comments;

-- Step 4: Create trigger on game_comments table
CREATE TRIGGER trigger_update_comment_count
AFTER INSERT OR DELETE ON game_comments
FOR EACH ROW
EXECUTE FUNCTION update_game_comment_count();

-- Step 5: Backfill existing comment counts
UPDATE games g
SET comments_count = (
  SELECT COUNT(*)
  FROM game_comments gc
  WHERE gc.game_id = g.id
);

-- Step 6: Create index for better performance
CREATE INDEX IF NOT EXISTS idx_game_comments_game_id 
ON game_comments(game_id);

-- =====================================================
-- Verification Query
-- =====================================================
-- Run this to verify the counts are correct:
-- 
-- SELECT 
--   g.id,
--   g.title,
--   g.comments_count as stored_count,
--   (SELECT COUNT(*) FROM game_comments WHERE game_id = g.id) as actual_count
-- FROM games g
-- WHERE g.comments_count IS NOT NULL
-- ORDER BY g.created_at DESC
-- LIMIT 10;
-- =====================================================

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Comment count real-time update system installed successfully!';
  RAISE NOTICE 'Comments will now update automatically when added or deleted.';
END $$;
