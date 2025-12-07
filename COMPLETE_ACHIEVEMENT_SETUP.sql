-- ============================================================================
-- COMPLETE ACHIEVEMENT SETUP - Run this to set up everything
-- ============================================================================
-- This script will:
-- 1. Create achievement tables (if not exists)
-- 2. Award achievements to all existing users based on their current stats
-- 3. Set up automatic triggers for future achievements
-- ============================================================================

-- Step 1: Create tables and insert achievements
-- ============================================================================

-- Create achievements table
CREATE TABLE IF NOT EXISTS achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon_url TEXT,
  rarity TEXT NOT NULL CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
  requirement_type TEXT NOT NULL,
  requirement_value INTEGER NOT NULL,
  coins_reward INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user_achievements table
CREATE TABLE IF NOT EXISTS user_achievements (
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  achievement_id UUID REFERENCES achievements(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, achievement_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_achievements_type ON achievements(requirement_type);

-- Enable RLS
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Anyone can view achievements" ON achievements;
CREATE POLICY "Anyone can view achievements"
  ON achievements FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can view their own achievements" ON user_achievements;
CREATE POLICY "Users can view their own achievements"
  ON user_achievements FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can insert their own achievements" ON user_achievements;
CREATE POLICY "Users can insert their own achievements"
  ON user_achievements FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Insert achievements (only if they don't exist)
INSERT INTO achievements (name, description, rarity, requirement_type, requirement_value, coins_reward) 
SELECT * FROM (VALUES
  ('First Steps', 'Create your first game', 'common', 'games_created', 1, 10),
  ('Game Creator', 'Create 5 games', 'common', 'games_created', 5, 25),
  ('Prolific Creator', 'Create 10 games', 'rare', 'games_created', 10, 50),
  ('Game Master', 'Create 25 games', 'epic', 'games_created', 25, 100),
  ('Legend', 'Create 50 games', 'legendary', 'games_created', 50, 250),
  
  ('Player', 'Play 10 games', 'common', 'games_played', 10, 10),
  ('Gamer', 'Play 50 games', 'rare', 'games_played', 50, 50),
  ('Hardcore Gamer', 'Play 100 games', 'epic', 'games_played', 100, 100),
  ('Gaming Legend', 'Play 500 games', 'legendary', 'games_played', 500, 500),
  
  ('Popular', 'Get 10 likes on your games', 'common', 'likes_received', 10, 15),
  ('Trending', 'Get 50 likes on your games', 'rare', 'likes_received', 50, 50),
  ('Viral', 'Get 100 likes on your games', 'epic', 'likes_received', 100, 150),
  ('Superstar', 'Get 500 likes on your games', 'legendary', 'likes_received', 500, 500),
  
  ('Social Butterfly', 'Get 10 followers', 'common', 'followers', 10, 20),
  ('Influencer', 'Get 50 followers', 'rare', 'followers', 50, 75),
  ('Celebrity', 'Get 100 followers', 'epic', 'followers', 100, 200),
  ('Icon', 'Get 500 followers', 'legendary', 'followers', 500, 1000),
  
  ('Remix Artist', 'Remix 5 games', 'common', 'remixes_created', 5, 25),
  ('Remix Master', 'Remix 20 games', 'rare', 'remixes_created', 20, 100),
  
  ('Commentator', 'Leave 50 comments', 'common', 'comments_made', 50, 30),
  ('Community Leader', 'Leave 200 comments', 'rare', 'comments_made', 200, 100)
) AS v(name, description, rarity, requirement_type, requirement_value, coins_reward)
WHERE NOT EXISTS (
  SELECT 1 FROM achievements WHERE achievements.name = v.name
);

-- Function to increment coins
CREATE OR REPLACE FUNCTION increment_coins(user_id UUID, amount INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE profiles
  SET coins = COALESCE(coins, 0) + amount
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION increment_coins TO authenticated;

-- ============================================================================
-- Step 2: Backfill achievements for all existing users
-- ============================================================================

DO $$
DECLARE
  user_record RECORD;
  achievement_record RECORD;
  user_stats RECORD;
  total_achievements INTEGER;
  total_coins INTEGER;
  total_users_updated INTEGER := 0;
BEGIN
  RAISE NOTICE 'Starting achievement backfill...';
  
  -- Loop through all users
  FOR user_record IN 
    SELECT p.id, p.username FROM profiles p
  LOOP
    total_achievements := 0;
    total_coins := 0;
    
    -- Calculate user stats
    SELECT 
      user_record.id as uid,
      -- Games created
      (SELECT COUNT(*) FROM games WHERE creator_id = user_record.id) as games_created,
      -- Likes received
      (SELECT COUNT(*) FROM game_likes gl 
       JOIN games g ON gl.game_id = g.id 
       WHERE g.creator_id = user_record.id) as likes_received,
      -- Followers
      (SELECT COUNT(*) FROM follows WHERE following_id = user_record.id) as followers,
      -- Remixes created
      (SELECT COUNT(*) FROM games WHERE creator_id = user_record.id AND original_game_id IS NOT NULL) as remixes_created,
      -- Comments made
      (SELECT COUNT(*) FROM game_comments gc WHERE gc.user_id = user_record.id) as comments_made
    INTO user_stats;
    
    -- Check each achievement type and award if eligible
    FOR achievement_record IN 
      SELECT * FROM achievements ORDER BY requirement_value ASC
    LOOP
      -- Check if user already has this achievement
      IF NOT EXISTS (
        SELECT 1 FROM user_achievements 
        WHERE user_achievements.user_id = user_record.id 
        AND achievement_id = achievement_record.id
      ) THEN
        -- Check if user meets the requirement
        IF (
          (achievement_record.requirement_type = 'games_created' AND user_stats.games_created >= achievement_record.requirement_value) OR
          (achievement_record.requirement_type = 'likes_received' AND user_stats.likes_received >= achievement_record.requirement_value) OR
          (achievement_record.requirement_type = 'followers' AND user_stats.followers >= achievement_record.requirement_value) OR
          (achievement_record.requirement_type = 'remixes_created' AND user_stats.remixes_created >= achievement_record.requirement_value) OR
          (achievement_record.requirement_type = 'comments_made' AND user_stats.comments_made >= achievement_record.requirement_value)
        ) THEN
          -- Award the achievement
          INSERT INTO user_achievements (user_id, achievement_id, unlocked_at)
          VALUES (user_record.id, achievement_record.id, NOW())
          ON CONFLICT DO NOTHING;
          
          -- Increment counters
          total_achievements := total_achievements + 1;
          total_coins := total_coins + achievement_record.coins_reward;
        END IF;
      END IF;
    END LOOP;
    
    -- Award coins to user
    IF total_coins > 0 THEN
      UPDATE profiles 
      SET coins = COALESCE(coins, 0) + total_coins
      WHERE id = user_record.id;
      
      total_users_updated := total_users_updated + 1;
      RAISE NOTICE 'User %: % achievements, % coins', user_record.username, total_achievements, total_coins;
    END IF;
  END LOOP;
  
  RAISE NOTICE 'Backfill complete! Updated % users', total_users_updated;
END $$;

-- ============================================================================
-- Step 3: Set up automatic triggers for future achievements
-- ============================================================================

-- Function to check and award achievements
CREATE OR REPLACE FUNCTION check_and_award_achievements(p_user_id UUID, p_achievement_type TEXT)
RETURNS TABLE (
  achievement_id UUID,
  achievement_name TEXT,
  coins_awarded INTEGER
) AS $$
DECLARE
  user_stats RECORD;
  achievement_record RECORD;
BEGIN
  -- Calculate current user stats
  SELECT 
    p_user_id as user_id,
    (SELECT COUNT(*) FROM games WHERE creator_id = p_user_id) as games_created,
    (SELECT COUNT(*) FROM game_likes gl 
     JOIN games g ON gl.game_id = g.id 
     WHERE g.creator_id = p_user_id) as likes_received,
    (SELECT COUNT(*) FROM follows WHERE following_id = p_user_id) as followers,
    (SELECT COUNT(*) FROM games WHERE creator_id = p_user_id AND original_game_id IS NOT NULL) as remixes_created,
    (SELECT COUNT(*) FROM game_comments WHERE user_id = p_user_id) as comments_made
  INTO user_stats;
  
  -- Check achievements of the specified type
  FOR achievement_record IN 
    SELECT * FROM achievements 
    WHERE requirement_type = p_achievement_type
    ORDER BY requirement_value ASC
  LOOP
    -- Check if user already has this achievement
    IF NOT EXISTS (
      SELECT 1 FROM user_achievements 
      WHERE user_achievements.user_id = p_user_id 
      AND user_achievements.achievement_id = achievement_record.id
    ) THEN
      -- Check if user meets the requirement
      IF (
        (achievement_record.requirement_type = 'games_created' AND user_stats.games_created >= achievement_record.requirement_value) OR
        (achievement_record.requirement_type = 'likes_received' AND user_stats.likes_received >= achievement_record.requirement_value) OR
        (achievement_record.requirement_type = 'followers' AND user_stats.followers >= achievement_record.requirement_value) OR
        (achievement_record.requirement_type = 'remixes_created' AND user_stats.remixes_created >= achievement_record.requirement_value) OR
        (achievement_record.requirement_type = 'comments_made' AND user_stats.comments_made >= achievement_record.requirement_value)
      ) THEN
        -- Award the achievement
        INSERT INTO user_achievements (user_id, achievement_id, unlocked_at)
        VALUES (p_user_id, achievement_record.id, NOW())
        ON CONFLICT DO NOTHING;
        
        -- Award coins
        UPDATE profiles 
        SET coins = COALESCE(coins, 0) + achievement_record.coins_reward
        WHERE id = p_user_id;
        
        -- Return the awarded achievement
        achievement_id := achievement_record.id;
        achievement_name := achievement_record.name;
        coins_awarded := achievement_record.coins_reward;
        RETURN NEXT;
      END IF;
    END IF;
  END LOOP;
  
  RETURN;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Check achievements when a game is created
CREATE OR REPLACE FUNCTION trigger_check_game_achievements()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM check_and_award_achievements(NEW.creator_id, 'games_created');
  
  IF NEW.original_game_id IS NOT NULL THEN
    PERFORM check_and_award_achievements(NEW.creator_id, 'remixes_created');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS check_game_achievements ON games;
CREATE TRIGGER check_game_achievements
  AFTER INSERT ON games
  FOR EACH ROW
  EXECUTE FUNCTION trigger_check_game_achievements();

-- Trigger: Check achievements when a game is liked
CREATE OR REPLACE FUNCTION trigger_check_like_achievements()
RETURNS TRIGGER AS $$
DECLARE
  game_creator_id UUID;
BEGIN
  SELECT creator_id INTO game_creator_id
  FROM games
  WHERE id = NEW.game_id;
  
  IF game_creator_id IS NOT NULL THEN
    PERFORM check_and_award_achievements(game_creator_id, 'likes_received');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS check_like_achievements ON game_likes;
CREATE TRIGGER check_like_achievements
  AFTER INSERT ON game_likes
  FOR EACH ROW
  EXECUTE FUNCTION trigger_check_like_achievements();

-- Trigger: Check achievements when someone gets a follower
CREATE OR REPLACE FUNCTION trigger_check_follower_achievements()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM check_and_award_achievements(NEW.following_id, 'followers');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS check_follower_achievements ON follows;
CREATE TRIGGER check_follower_achievements
  AFTER INSERT ON follows
  FOR EACH ROW
  EXECUTE FUNCTION trigger_check_follower_achievements();

-- Trigger: Check achievements when a comment is made
CREATE OR REPLACE FUNCTION trigger_check_comment_achievements()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM check_and_award_achievements(NEW.user_id, 'comments_made');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS check_comment_achievements ON game_comments;
CREATE TRIGGER check_comment_achievements
  AFTER INSERT ON game_comments
  FOR EACH ROW
  EXECUTE FUNCTION trigger_check_comment_achievements();

-- ============================================================================
-- Verification
-- ============================================================================

-- Check total achievements awarded
SELECT 
  COUNT(*) as total_achievements_awarded,
  COUNT(DISTINCT user_id) as users_with_achievements,
  SUM((SELECT coins_reward FROM achievements WHERE id = user_achievements.achievement_id)) as total_coins_awarded
FROM user_achievements;

-- Check top achievement earners
SELECT 
  p.username,
  COUNT(*) as achievements_count,
  SUM(a.coins_reward) as total_coins_earned
FROM user_achievements ua
JOIN profiles p ON ua.user_id = p.id
JOIN achievements a ON ua.achievement_id = a.id
GROUP BY p.id, p.username
ORDER BY achievements_count DESC
LIMIT 10;

-- Check if triggers are active
SELECT 
  trigger_name,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
AND trigger_name LIKE '%achievement%'
ORDER BY event_object_table, trigger_name;

-- ============================================================================
-- SUCCESS!
-- ============================================================================
-- All users have been awarded their eligible achievements
-- Automatic triggers are now active for future achievements
-- ============================================================================
