-- Fix all RLS policies with correct column names

-- ============================================
-- PROFILES POLICIES
-- ============================================

DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
CREATE POLICY "Public profiles are viewable by everyone"
ON profiles FOR SELECT
TO public
USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- ============================================
-- GAMES POLICIES
-- ============================================

DROP POLICY IF EXISTS "Public games are viewable by everyone" ON games;
CREATE POLICY "Public games are viewable by everyone"
ON games FOR SELECT
TO public
USING (is_public = true OR creator_id = auth.uid());

DROP POLICY IF EXISTS "Users can create games" ON games;
CREATE POLICY "Users can create games"
ON games FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = creator_id);

DROP POLICY IF EXISTS "Users can update own games" ON games;
CREATE POLICY "Users can update own games"
ON games FOR UPDATE
TO authenticated
USING (auth.uid() = creator_id);

DROP POLICY IF EXISTS "Users can delete own games" ON games;
CREATE POLICY "Users can delete own games"
ON games FOR DELETE
TO authenticated
USING (auth.uid() = creator_id);

-- ============================================
-- GAME COMMENTS POLICIES
-- ============================================

DROP POLICY IF EXISTS "Comments are viewable by everyone" ON game_comments;
CREATE POLICY "Comments are viewable by everyone"
ON game_comments FOR SELECT
TO public
USING (true);

DROP POLICY IF EXISTS "Authenticated users can create comments" ON game_comments;
CREATE POLICY "Authenticated users can create comments"
ON game_comments FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own comments" ON game_comments;
CREATE POLICY "Users can delete own comments"
ON game_comments FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- ============================================
-- FOLLOWS POLICIES
-- ============================================

DROP POLICY IF EXISTS "Follows are viewable by everyone" ON follows;
CREATE POLICY "Follows are viewable by everyone"
ON follows FOR SELECT
TO public
USING (true);

DROP POLICY IF EXISTS "Users can follow others" ON follows;
CREATE POLICY "Users can follow others"
ON follows FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = follower_id);

DROP POLICY IF EXISTS "Users can unfollow" ON follows;
CREATE POLICY "Users can unfollow"
ON follows FOR DELETE
TO authenticated
USING (auth.uid() = follower_id);

-- ============================================
-- DIRECT MESSAGES POLICIES (already exist, just ensuring)
-- ============================================

-- These are already created in 20251117000003_add_direct_messages.sql
-- Just ensuring they exist

DROP POLICY IF EXISTS "Users can view their own messages" ON direct_messages;
CREATE POLICY "Users can view their own messages" 
ON direct_messages FOR SELECT 
TO authenticated
USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

DROP POLICY IF EXISTS "Users can send messages" ON direct_messages;
CREATE POLICY "Users can send messages" 
ON direct_messages FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = sender_id);

DROP POLICY IF EXISTS "Users can update their received messages" ON direct_messages;
CREATE POLICY "Users can update their received messages" 
ON direct_messages FOR UPDATE 
TO authenticated
USING (auth.uid() = recipient_id);

-- ============================================
-- COIN PURCHASES POLICIES
-- ============================================

DROP POLICY IF EXISTS "Users can view own purchases" ON coin_purchases;
CREATE POLICY "Users can view own purchases"
ON coin_purchases FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create purchases" ON coin_purchases;
CREATE POLICY "Users can create purchases"
ON coin_purchases FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all purchases" ON coin_purchases;
CREATE POLICY "Admins can view all purchases"
ON coin_purchases FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
);

-- ============================================
-- GAME LIKES POLICIES
-- ============================================

DROP POLICY IF EXISTS "Users can view all likes" ON game_likes;
CREATE POLICY "Users can view all likes"
ON game_likes FOR SELECT
TO public
USING (true);

DROP POLICY IF EXISTS "Users can like games" ON game_likes;
CREATE POLICY "Users can like games"
ON game_likes FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can unlike games" ON game_likes;
CREATE POLICY "Users can unlike games"
ON game_likes FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- ============================================
-- SET ADMIN USER
-- ============================================

UPDATE profiles 
SET is_admin = true 
WHERE email = 'playgenofficial@gmail.com';

-- ============================================
-- ENSURE ALL TABLES HAVE RLS ENABLED
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE direct_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE coin_purchases ENABLE ROW LEVEL SECURITY;
