-- Debug script to check game_likes table and permissions

-- 1. Check if game_likes table exists
SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'game_likes'
ORDER BY ordinal_position;

-- 2. Check RLS policies on game_likes table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'game_likes';

-- 3. Check if RLS is enabled
SELECT schemaname, tablename, rowsecurity, forcerowsecurity
FROM pg_tables 
WHERE tablename = 'game_likes';

-- 4. Test basic operations (run these manually to test)
-- INSERT INTO game_likes (game_id, user_id) VALUES ('test-game-id', auth.uid());
-- SELECT * FROM game_likes WHERE user_id = auth.uid();
-- DELETE FROM game_likes WHERE game_id = 'test-game-id' AND user_id = auth.uid();

-- 5. Check if there are any existing likes
SELECT COUNT(*) as total_likes FROM game_likes;

-- 6. Check recent likes
SELECT gl.*, g.title as game_title, p.username 
FROM game_likes gl
LEFT JOIN games g ON gl.game_id = g.id
LEFT JOIN profiles p ON gl.user_id = p.id
ORDER BY gl.creat