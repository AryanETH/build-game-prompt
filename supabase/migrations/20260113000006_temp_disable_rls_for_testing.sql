-- Temporarily disable RLS on profiles for testing
-- This will help us identify if RLS is the issue

-- TEMPORARY: Disable RLS on profiles to test
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Keep RLS enabled on other tables for security
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE direct_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE coin_purchases ENABLE ROW LEVEL SECURITY;

-- Note: This is temporary for testing
-- Once we confirm it works, we'll re-enable with proper policies
