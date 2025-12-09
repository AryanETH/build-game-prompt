-- Add name column to profiles table
-- This separates display name from username (like Instagram)

-- Add name column
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS name TEXT;

-- Add index for searching by name
CREATE INDEX IF NOT EXISTS idx_profiles_name ON profiles(name);

-- Update existing profiles to use username as name (temporary)
UPDATE profiles 
SET name = username 
WHERE name IS NULL;

-- Add comment
COMMENT ON COLUMN profiles.name IS 'User display name (can contain spaces, capitals, etc.)';
COMMENT ON COLUMN profiles.username IS 'Unique username handle (lowercase, no spaces)';

-- Make username unique and lowercase
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_username_unique ON profiles(LOWER(username));
