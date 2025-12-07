-- ============================================================================
-- BACKFILL ACHIEVEMENTS FOR EXISTING USERS
-- ============================================================================
-- This script scans all existing users and awards achievements they're 
-- already eligible for based on their current stats.
-- Run this AFTER running ACHIEVEMENTS_SETUP.sql
-- ============================================================================

-- Function to backfill achievements for all users
CREATE OR REPLACE FUNCTION backfill_user_achievements()
RETURNS TABLE (
  user_id UUID,
  username TEXT,
  achievements_awarded INTEGER,
  coins_awarded INTEGER
) AS $$
DECLARE
  user_record RECORD;
  achievement_record RECORD;
  user_stats RECORD;
  total_achievements INTEGER;
  total_coins INTEGER;
BEGIN
  -- Loop through all users
  FOR user_record IN 
    SELECT p.id, p.username FROM profiles p
  LOOP
    total_achievements := 0;
    total_coins := 0;
    
    -- Calculate user stats
    SELECT 
      user_record.id as uid,
      user_record.username as uname,
      -- Games created
      (SELECT COUNT(*) FROM games WHERE creator_id = user_record.id) as games_created,
      -- Games played (from plays_count - this is an approximation)
      (SELECT COALESCE(SUM(plays_count), 0) FROM games WHERE creator_id = user_record.id) as games_played_estimate,
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
          (achievement_record.requirement_type = 'games_played' AND user_stats.games_played_estimate >= achievement_record.requirement_value) OR
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
    END IF;
    
    -- Return results for this user if they got any achievements
    IF total_achievements > 0 THEN
      backfill_user_achievements.user_id := user_record.id;
      backfill_user_achievements.username := user_record.username;
      backfill_user_achievements.achievements_awarded := total_achievements;
      backfill_user_achievements.coins_awarded := total_coins;
      RETURN NEXT;
    END IF;
  END LOOP;
  
  RETURN;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- RUN THE BACKFILL
-- ============================================================================
-- This will scan all users and award achievements
-- Results show: user_id, username, achievements_awarded, coins_awarded

SELECT * FROM backfill_user_achievements();

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check total achievements awarded
SELECT 
  COUNT(*) as total_achievements_awarded,
  COUNT(DISTINCT user_id) as users_with_achievements
FROM user_achievements;

-- Check achievements by rarity
SELECT 
  a.rarity,
  COUNT(*) as times_awarded,
  COUNT(DISTINCT ua.user_id) as unique_users
FROM user_achievements ua
JOIN achievements a ON ua.achievement_id = a.id
GROUP BY a.rarity
ORDER BY 
  CASE a.rarity
    WHEN 'common' THEN 1
    WHEN 'rare' THEN 2
    WHEN 'epic' THEN 3
    WHEN 'legendary' THEN 4
  END;

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

-- Check most common achievements
SELECT 
  a.name,
  a.rarity,
  COUNT(*) as times_awarded,
  a.coins_reward
FROM user_achievements ua
JOIN achievements a ON ua.achievement_id = a.id
GROUP BY a.id, a.name, a.rarity, a.coins_reward
ORDER BY times_awarded DESC
LIMIT 10;

-- ============================================================================
-- CLEANUP (Optional)
-- ============================================================================
-- Drop the function after use if you don't need it anymore
-- DROP FUNCTION IF EXISTS backfill_user_achievements();

-- ============================================================================
-- NOTES
-- ============================================================================
-- 1. This script is safe to run multiple times (uses ON CONFLICT DO NOTHING)
-- 2. It only awards achievements users don't already have
-- 3. Coins are automatically added to user accounts
-- 4. The function returns a list of users who received achievements
-- 5. Run the verification queries to see the results
-- ============================================================================

COMMENT ON FUNCTION backfill_user_achievements IS 'Scans all users and awards achievements they are eligible for based on current stats';
