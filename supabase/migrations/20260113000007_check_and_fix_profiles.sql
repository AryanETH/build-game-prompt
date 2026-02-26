-- Check and fix profiles table

-- 1. Check if any profiles exist
DO $$
DECLARE
    profile_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO profile_count FROM profiles;
    RAISE NOTICE 'Total profiles: %', profile_count;
END $$;

-- 2. Check if the specific user exists
DO $$
DECLARE
    user_exists BOOLEAN;
BEGIN
    SELECT EXISTS(SELECT 1 FROM profiles WHERE id = '4a170262-b6b4-4dde-ba4e-e76d62b1715f') INTO user_exists;
    RAISE NOTICE 'User 4a170262-b6b4-4dde-ba4e-e76d62b1715f exists: %', user_exists;
END $$;

-- 3. Check if there are any auth users without profiles
DO $$
DECLARE
    orphan_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO orphan_count 
    FROM auth.users u 
    WHERE NOT EXISTS (SELECT 1 FROM profiles p WHERE p.id = u.id);
    RAISE NOTICE 'Auth users without profiles: %', orphan_count;
END $$;

-- 4. Create profiles for any auth users that don't have one
INSERT INTO profiles (id, username, email, name, coins, xp, onboarding_complete)
SELECT 
    u.id,
    COALESCE(u.raw_user_meta_data->>'username', 'user_' || substr(u.id::text, 1, 8)),
    u.email,
    COALESCE(u.raw_user_meta_data->>'name', 'User'),
    100,
    0,
    true
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM profiles p WHERE p.id = u.id)
ON CONFLICT (id) DO NOTHING;

-- 5. Ensure all profiles have required fields
UPDATE profiles 
SET 
    username = COALESCE(username, 'user_' || substr(id::text, 1, 8)),
    email = COALESCE(email, id::text || '@temp.com'),
    coins = COALESCE(coins, 100),
    xp = COALESCE(xp, 0),
    onboarding_complete = COALESCE(onboarding_complete, true)
WHERE username IS NULL OR email IS NULL OR coins IS NULL OR xp IS NULL;

-- 6. Show all profiles
SELECT id, username, email, coins, xp, onboarding_complete, created_at FROM profiles ORDER BY created_at DESC LIMIT 10;
