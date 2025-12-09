-- Fix Comment System: Add comment likes table and update RLS policies

-- 1. Create comment_likes table (if not exists)
CREATE TABLE IF NOT EXISTS comment_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID NOT NULL REFERENCES game_comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(comment_id, user_id)
);

-- 2. Add likes_count column to game_comments if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'game_comments' AND column_name = 'likes_count'
  ) THEN
    ALTER TABLE game_comments ADD COLUMN likes_count INTEGER DEFAULT 0;
  END IF;
END $$;

-- 3. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_comment_likes_comment_id ON comment_likes(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_likes_user_id ON comment_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_game_comments_parent_id ON game_comments(parent_comment_id);

-- 4. Enable RLS on comment_likes
ALTER TABLE comment_likes ENABLE ROW LEVEL SECURITY;

-- 5. Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view comment likes" ON comment_likes;
DROP POLICY IF EXISTS "Authenticated users can like comments" ON comment_likes;
DROP POLICY IF EXISTS "Users can unlike their own likes" ON comment_likes;

-- 6. Create RLS policies for comment_likes
CREATE POLICY "Anyone can view comment likes"
  ON comment_likes FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can like comments"
  ON comment_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike their own likes"
  ON comment_likes FOR DELETE
  USING (auth.uid() = user_id);

-- 7. Create function to update comment likes count
CREATE OR REPLACE FUNCTION update_comment_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE game_comments
    SET likes_count = likes_count + 1
    WHERE id = NEW.comment_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE game_comments
    SET likes_count = GREATEST(likes_count - 1, 0)
    WHERE id = OLD.comment_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Create trigger for comment likes count
DROP TRIGGER IF EXISTS trigger_update_comment_likes_count ON comment_likes;
CREATE TRIGGER trigger_update_comment_likes_count
  AFTER INSERT OR DELETE ON comment_likes
  FOR EACH ROW
  EXECUTE FUNCTION update_comment_likes_count();

-- 9. Backfill existing likes_count (set to 0 if null)
UPDATE game_comments SET likes_count = 0 WHERE likes_count IS NULL;

-- 10. Enable Realtime for comment_likes and game_comments
-- Note: Supabase automatically handles realtime for tables with RLS enabled
-- But we'll ensure it's explicitly enabled

-- Enable realtime on comment_likes
ALTER PUBLICATION supabase_realtime ADD TABLE comment_likes;

-- Enable realtime on game_comments (if not already enabled)
DO $$
BEGIN
  -- Check if game_comments is already in the publication
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'game_comments'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE game_comments;
  END IF;
END $$;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Comment system fixes applied successfully!';
  RAISE NOTICE '1. ✅ comment_likes table created';
  RAISE NOTICE '2. ✅ likes_count column added to game_comments';
  RAISE NOTICE '3. ✅ RLS policies configured';
  RAISE NOTICE '4. ✅ Triggers for auto-updating likes_count created';
  RAISE NOTICE '5. ✅ Realtime enabled for comment_likes and game_comments';
  RAISE NOTICE '';
  RAISE NOTICE '🎉 Real-time comments and likes are now live!';
  RAISE NOTICE '📖 See REALTIME_COMMENTS_SETUP.md for testing guide';
END $$;
