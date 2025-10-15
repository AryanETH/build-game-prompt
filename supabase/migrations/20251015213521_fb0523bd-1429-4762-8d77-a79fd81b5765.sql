-- Add followers and following list columns to profiles if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='followers_list') THEN
    ALTER TABLE public.profiles ADD COLUMN followers_list uuid[] DEFAULT '{}';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='following_list') THEN
    ALTER TABLE public.profiles ADD COLUMN following_list uuid[] DEFAULT '{}';
  END IF;
END $$;

-- Create a function to update follower/following arrays
CREATE OR REPLACE FUNCTION update_follower_arrays()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Add to followers_list of the user being followed
    UPDATE profiles 
    SET followers_list = array_append(COALESCE(followers_list, '{}'), NEW.follower_id)
    WHERE id = NEW.following_id AND NOT (NEW.follower_id = ANY(COALESCE(followers_list, '{}')));
    
    -- Add to following_list of the follower
    UPDATE profiles 
    SET following_list = array_append(COALESCE(following_list, '{}'), NEW.following_id)
    WHERE id = NEW.follower_id AND NOT (NEW.following_id = ANY(COALESCE(following_list, '{}')));
    
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Remove from followers_list
    UPDATE profiles 
    SET followers_list = array_remove(COALESCE(followers_list, '{}'), OLD.follower_id)
    WHERE id = OLD.following_id;
    
    -- Remove from following_list
    UPDATE profiles 
    SET following_list = array_remove(COALESCE(following_list, '{}'), OLD.following_id)
    WHERE id = OLD.follower_id;
    
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Create trigger if it doesn't exist
DROP TRIGGER IF EXISTS update_follower_arrays_trigger ON follows;
CREATE TRIGGER update_follower_arrays_trigger
AFTER INSERT OR DELETE ON follows
FOR EACH ROW
EXECUTE FUNCTION update_follower_arrays();