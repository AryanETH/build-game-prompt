-- Check RLS status and policies

-- 1. Check if RLS is enabled
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename IN ('profiles', 'games', 'game_likes', 'game_comments', 'follows', 'direct_messages', 'coin_purchases')
ORDER BY tablename;

-- 2. Check all policies on profiles table
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
WHERE tablename = 'profiles';

-- 3. Test if anon role can read profiles
SET ROLE anon;
SELECT COUNT(*) as profiles_visible_to_anon FROM profiles;
RESET ROLE;

-- 4. Test specific query that's failing
SET ROLE anon;
SELECT username, avatar_url FROM profiles WHERE id = '4a170262-b6b4-4dde-ba4e-e76d62b1715f';
RESET ROLE;

-- 5. Check if the profile exists
SELECT id, username, avatar_url, email FROM profiles WHERE id = '4a170262-b6b4-4dde-ba4e-e76d62b1715f';
