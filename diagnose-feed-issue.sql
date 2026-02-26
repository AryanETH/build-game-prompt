-- Diagnose Feed Issues

-- 1. Check if games table exists and has data
SELECT 
    COUNT(*) as total_games,
    COUNT(CASE WHEN is_public = true THEN 1 END) as public_games,
    COUNT(CASE WHEN is_public = false THEN 1 END) as private_games
FROM games;

-- 2. Check if profiles table has data
SELECT COUNT(*) as total_profiles FROM profiles;

-- 3. Check RLS policies on games table
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'games';

-- 4. Check if there are any games at all
SELECT 
    id,
    title,
    creator_id,
    is_public,
    created_at
FROM games
ORDER BY created_at DESC
LIMIT 5;

-- 5. Check if game_likes table exists
SELECT COUNT(*) as total_likes FROM game_likes;

-- 6. Check if follows table exists
SELECT COUNT(*) as total_follows FROM follows;

-- 7. Test if anonymous users can read public games
SET ROLE anon;
SELECT COUNT(*) as games_visible_to_anon FROM games WHERE is_public = true;
RESET ROLE;

-- 8. Check for any missing columns in games table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'games'
ORDER BY ordinal_position;
