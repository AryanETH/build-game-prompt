-- ============================================================================
-- AUTOMATIC ACHIEVEMENT AWARDING SYSTEM
-- ============================================================================
-- This script creates database triggers that automatically check and award
-- achievements when users perform actions (create games, get likes, etc.)
-- ============================================================================

-- Function to check and award achievements for a user
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
    -- Games created
    (SELECT COUNT(*) FROM games WHERE creator_id = p_user_id) as games_created,
    -- Likes received
    (SELECT COUNT(*) FROM game_likes gl 
     JOIN games g ON gl.game_id = g.id 
     WHERE g.creator_id = p_user_id) as likes_received,
    -- Followers
    (SELECT COUNT(*) FROM follows WHERE following_id = p_user_id) as followers,
    -- Remixes created
    (SELECT COUNT(*) FROM games WHERE creator_id = p_user_id AND original_game_id IS NOT NULL) as remixes_created,
    -- Comments made
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

-- ============================================================================
-- TRIGGER: Check achievements when a game is created
-- ============================================================================
CREATE OR REPLACE FUNCTION trigger_check_game_achievements()
RETURNS TRIGGER AS $$
BEGIN
  -- Check games_created achievements
  PERFORM check_and_award_achievements(NEW.creator_id, 'games_created');
  
  -- Check remixes_created achievements if this is a remix
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

-- ============================================================================
-- TRIGGER: Check achievements when a game is liked
-- ============================================================================
CREATE OR REPLACE FUNCTION trigger_check_like_achievements()
RETURNS TRIGGER AS $$
DECLARE
  game_creator_id UUID;
BEGIN
  -- Get the creator of the liked game
  SELECT creator_id INTO game_creator_id
  FROM games
  WHERE id = NEW.game_id;
  
  -- Check likes_received achievements for the game creator
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

-- ============================================================================
-- TRIGGER: Check achievements when someone gets a follower
-- ============================================================================
CREATE OR REPLACE FUNCTION trigger_check_follower_achievements()
RETURNS TRIGGER AS $$
BEGIN
  -- Check followers achievements for the user being followed
  PERFORM check_and_award_achievements(NEW.following_id, 'followers');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS check_follower_achievements ON follows;
CREATE TRIGGER check_follower_achievements
  AFTER INSERT ON follows
  FOR EACH ROW
  EXECUTE FUNCTION trigger_check_follower_achievements();

-- ============================================================================
-- TRIGGER: Check achievements when a comment is made
-- ============================================================================
CREATE OR REPLACE FUNCTION trigger_check_comment_achievements()
RETURNS TRIGGER AS $$
BEGIN
  -- Check comments_made achievements
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
-- VERIFICATION
-- ============================================================================

-- Test the function manually
-- SELECT * FROM check_and_award_achievements('USER_ID_HERE', 'games_created');

-- Check if triggers are active
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
AND trigger_name LIKE '%achievement%'
ORDER BY event_object_table, trigger_name;

-- ============================================================================
-- NOTES
-- ============================================================================
-- 1. Achievements are now automatically awarded when users:
--    - Create games
--    - Get likes on their games
--    - Get followers
--    - Make comments
--    - Create remixes
--
-- 2. The system checks ALL achievements of the relevant type each time
--    (e.g., when you create your 5th game, it checks if you qualify for
--    the 1-game, 5-game, 10-game achievements, etc.)
--
-- 3. Coins are automatically added to user accounts
--
-- 4. The system is idempotent - it won't award the same achievement twice
--
-- 5. For games_played achievements, you'll need to add a trigger on the
--    plays_count update or track plays in a separate table
-- ============================================================================

COMMENT ON FUNCTION check_and_award_achievements IS 'Checks and awards achievements for a user based on their current stats';
COMMENT ON FUNCTION trigger_check_game_achievements IS 'Trigger function to check achievements when a game is created';
COMMENT ON FUNCTION trigger_check_like_achievements IS 'Trigger function to check achievements when a game is liked';
COMMENT ON FUNCTION trigger_check_follower_achievements IS 'Trigger function to check achievements when someone gets a follower';
COMMENT ON FUNCTION trigger_check_comment_achievements IS 'Trigger function to check achievements when a comment is made';
