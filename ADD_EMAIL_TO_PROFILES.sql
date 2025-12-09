-- Add email column to profiles table for username login
-- This allows users to log in with username by looking up their email

-- Add email column
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS email TEXT;

-- Create index for email lookups
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- Create a trigger to automatically populate email from auth.users
CREATE OR REPLACE FUNCTION sync_profile_email()
RETURNS TRIGGER AS $$
BEGIN
  -- Get email from auth.users and update profile
  UPDATE profiles
  SET email = (
    SELECT email 
    FROM auth.users 
    WHERE id = NEW.id
  )
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on profile insert
DROP TRIGGER IF EXISTS on_profile_created_sync_email ON profiles;
CREATE TRIGGER on_profile_created_sync_email
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION sync_profile_email();

-- Backfill existing profiles with emails
UPDATE profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id
AND p.email IS NULL;

COMMENT ON COLUMN profiles.email IS 'User email address (synced from auth.users for username login)';
