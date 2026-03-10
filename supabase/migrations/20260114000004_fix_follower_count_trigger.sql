-- Fix follower count trigger to update counts when following/unfollowing

-- Drop existing trigger and function if they exist
DROP TRIGGER IF EXISTS update_followers_count_trigger ON follows;
DROP FUNCTION IF EXISTS update_followers_count();

-- Create function to update follower counts
CREATE OR REPLACE FUNCTION update_followers_count()
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

-- Create trigger
CREATE TRIGGER update_followers_count_trigger
AFTER INSERT OR DELETE ON follows
FOR EACH ROW
EXECUTE FUNCTION update_followers_count();

-- Recalculate all follower counts to fix any existing mismatches
UPDATE profiles
SET followers_count = (
  SELECT COUNT(*)
  FROM follows
  WHERE following_id = profiles.id
);

UPDATE profiles
SET following_count = (
  SELECT COUNT(*)
  FROM follows
  WHERE follower_id = profiles.id
);
