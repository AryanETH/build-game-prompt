-- Fix RLS policies to allow proper access

-- ============================================
-- PROFILES - Allow everyone to read all profiles
-- ============================================

-- Drop all existing profile policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;

-- Create new policies
CREATE POLICY "Anyone can view profiles"
ON profiles FOR SELECT
USING (true);  -- Allow everyone (including anon) to read all profiles

CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- ============================================
-- GAMES - Allow everyone to read public games
-- ============================================

DROP POLICY IF EXISTS "Public games are viewable by everyone" ON games;
DROP POLICY IF EXISTS "Users can create games" ON games;
DROP POLICY IF EXISTS "Users can update own games" ON games;
DROP POLICY IF EXISTS "Users can delete own games" ON games;
DROP POLICY IF EXISTS "Anyone can view public games" ON games;

CREATE POLICY "Anyone can view public games"
ON games FOR SELECT
USING (is_public = true OR creator_id = auth.uid());

CREATE POLICY "Authenticated users can create games"
ON games FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Users can update own games"
ON games FOR UPDATE
TO authenticated
USING (auth.uid() = creator_id)
WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Users can delete own games"
ON games FOR DELETE
TO authenticated
USING (auth.uid() = creator_id);

-- ============================================
-- GAME LIKES - Allow everyone to view, users to manage
-- ============================================

DROP POLICY IF EXISTS "Users can view all likes" ON game_likes;
DROP POLICY IF EXISTS "Users can like games" ON game_likes;
DROP POLICY IF EXISTS "Users can unlike games" ON game_likes;
DROP POLICY IF EXISTS "Anyone can view likes" ON game_likes;

CREATE POLICY "Anyone can view likes"
ON game_likes FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can like games"
ON game_likes FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike games"
ON game_likes FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- ============================================
-- GAME COMMENTS - Allow everyone to view
-- ============================================

DROP POLICY IF EXISTS "Comments are viewable by everyone" ON game_comments;
DROP POLICY IF EXISTS "Authenticated users can create comments" ON game_comments;
DROP POLICY IF EXISTS "Users can delete own comments" ON game_comments;
DROP POLICY IF EXISTS "Anyone can view comments" ON game_comments;

CREATE POLICY "Anyone can view comments"
ON game_comments FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can create comments"
ON game_comments FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments"
ON game_comments FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own comments"
ON game_comments FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- ============================================
-- FOLLOWS - Allow everyone to view
-- ============================================

DROP POLICY IF EXISTS "Follows are viewable by everyone" ON follows;
DROP POLICY IF EXISTS "Users can follow others" ON follows;
DROP POLICY IF EXISTS "Users can unfollow" ON follows;
DROP POLICY IF EXISTS "Anyone can view follows" ON follows;

CREATE POLICY "Anyone can view follows"
ON follows FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can follow"
ON follows FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can unfollow"
ON follows FOR DELETE
TO authenticated
USING (auth.uid() = follower_id);

-- ============================================
-- DIRECT MESSAGES - Users see their own
-- ============================================

DROP POLICY IF EXISTS "Users can view their own messages" ON direct_messages;
DROP POLICY IF EXISTS "Users can send messages" ON direct_messages;
DROP POLICY IF EXISTS "Users can update their received messages" ON direct_messages;

CREATE POLICY "Users can view their messages"
ON direct_messages FOR SELECT
TO authenticated
USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

CREATE POLICY "Users can send messages"
ON direct_messages FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update received messages"
ON direct_messages FOR UPDATE
TO authenticated
USING (auth.uid() = recipient_id)
WITH CHECK (auth.uid() = recipient_id);

-- ============================================
-- COIN PURCHASES - Users see own, admins see all
-- ============================================

DROP POLICY IF EXISTS "Users can view own purchases" ON coin_purchases;
DROP POLICY IF EXISTS "Users can create purchases" ON coin_purchases;
DROP POLICY IF EXISTS "Admins can view all purchases" ON coin_purchases;

CREATE POLICY "Users can view own purchases"
ON coin_purchases FOR SELECT
TO authenticated
USING (
    auth.uid() = user_id 
    OR 
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
);

CREATE POLICY "Users can create purchases"
ON coin_purchases FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can update purchases"
ON coin_purchases FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
);

-- ============================================
-- VERIFY RLS IS ENABLED
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE direct_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE coin_purchases ENABLE ROW LEVEL SECURITY;
