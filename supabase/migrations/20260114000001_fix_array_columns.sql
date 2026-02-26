-- Fix followers_list and following_list to be UUID arrays instead of UUID

-- Drop existing defaults first
ALTER TABLE profiles ALTER COLUMN followers_list DROP DEFAULT;
ALTER TABLE profiles ALTER COLUMN following_list DROP DEFAULT;

-- Change column types to UUID arrays
ALTER TABLE profiles 
  ALTER COLUMN followers_list TYPE uuid[] USING 
    CASE 
      WHEN followers_list IS NULL THEN NULL
      ELSE ARRAY[followers_list]::uuid[]
    END;

ALTER TABLE profiles 
  ALTER COLUMN following_list TYPE uuid[] USING 
    CASE 
      WHEN following_list IS NULL THEN NULL
      ELSE ARRAY[following_list]::uuid[]
    END;

-- Set new defaults to empty array
ALTER TABLE profiles ALTER COLUMN followers_list SET DEFAULT '{}';
ALTER TABLE profiles ALTER COLUMN following_list SET DEFAULT '{}';
