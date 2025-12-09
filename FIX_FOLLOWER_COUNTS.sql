-- Fix Follower/Following Counts Discrepancy
-- This script recalculates and syncs the follower/following counts

-- 1. Recalculate and update followers_count for all profiles
UPDATE profiles
SET followers_count = (
  SELECT COUNT(*)
  FROM follows
  WHERE follows.following_id = profiles.id
);

-- 2. Recalculate and update following_count for all profiles
UPDATE profiles
SET following_count = (
  SELECT COUNT(*)
  FROM follows
  WHERE follows.follower_id = profiles.id
);

-- 3. Ensure triggers exist and are correct
-- Drop all existing triggers first
DROP TRIGGER IF EXISTS update_follow_counts_trigger ON follows;
DROP TRIGGER IF EXISTS on_follow_change ON follows;
DROP TRIGGER IF EXISTS update_follower_arrays_trigger ON follows;

-- Drop existing function with CASCADE to remove all dependencies
DROP FUNCTION IF EXISTS update_follow_counts() CASCADE;
DROP FUNCTION IF EXISTS update_follower_arrays() CASCADE;

-- Create the function to update follower counts
CREATE OR REPLACE FUNCTION update_follow_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Increment following_count for the follower
    UPDATE profiles
    SET following_count = following_count + 1
    WHERE id = NEW.follower_id;
    
    -- Increment followers_count for the person being followed
    UPDATE profiles
    SET followers_count = followers_count + 1
    WHERE id = NEW.following_id;
    
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Decrement following_count for the follower
    UPDATE profiles
    SET following_count = GREATEST(following_count - 1, 0)
    WHERE id = OLD.follower_id;
    
    -- Decrement followers_count for the person being unfollowed
    UPDATE profiles
    SET followers_count = GREATEST(followers_count - 1, 0)
    WHERE id = OLD.following_id;
    
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
CREATE TRIGGER update_follow_counts_trigger
  AFTER INSERT OR DELETE ON follows
  FOR EACH ROW
  EXECUTE FUNCTION update_follow_counts();

-- 4. Verify the counts are correct
-- This will show any profiles where the counts don't match
SELECT 
  p.id,
  p.username,
  p.followers_count as stored_followers,
  (SELECT COUNT(*) FROM follows WHERE following_id = p.id) as actual_followers,
  p.following_count as stored_following,
  (SELECT COUNT(*) FROM follows WHERE follower_id = p.id) as actual_following,
  CASE 
    WHEN p.followers_count != (SELECT COUNT(*) FROM follows WHERE following_id = p.id) THEN 'MISMATCH'
    WHEN p.following_count != (SELECT COUNT(*) FROM follows WHERE follower_id = p.id) THEN 'MISMATCH'
    ELSE 'OK'
  END as status
FROM profiles p
WHERE p.followers_count != (SELECT COUNT(*) FROM follows WHERE following_id = p.id)
   OR p.following_count != (SELECT COUNT(*) FROM follows WHERE follower_id = p.id)
ORDER BY p.username;

-- 5. Enable Realtime for follows and profiles tables
-- Ensure realtime is enabled for instant updates
ALTER PUBLICATION supabase_realtime ADD TABLE follows;

-- Enable realtime on profiles (if not already enabled)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'profiles'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
  END IF;
END $$;

-- Success message
DO $$
DECLARE
  total_profiles INTEGER;
  fixed_profiles INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_profiles FROM profiles;
  SELECT COUNT(*) INTO fixed_profiles 
  FROM profiles p
  WHERE p.followers_count = (SELECT COUNT(*) FROM follows WHERE following_id = p.id)
    AND p.following_count = (SELECT COUNT(*) FROM follows WHERE follower_id = p.id);
    
  RAISE NOTICE '✅ Follower counts fixed!';
  RAISE NOTICE 'Total profiles: %', total_profiles;
  RAISE NOTICE 'Profiles with correct counts: %', fixed_profiles;
  RAISE NOTICE 'Trigger recreated and active';
  RAISE NOTICE 'Realtime enabled for follows and profiles tables';
  RAISE NOTICE '';
  RAISE NOTICE '🎉 All follower/following counts are now accurate and update in real-time!';
END $$;
