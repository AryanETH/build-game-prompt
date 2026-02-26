-- Complete Supabase Setup - Check and Fix Everything

-- ============================================
-- 1. ENABLE REQUIRED EXTENSIONS
-- ============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- 2. CHECK AND CREATE MISSING TABLES
-- ============================================

-- Profiles table (should exist, but ensure all columns)
DO $$ 
BEGIN
    -- Add missing columns if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='email') THEN
        ALTER TABLE profiles ADD COLUMN email TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='name') THEN
        ALTER TABLE profiles ADD COLUMN name TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='bio') THEN
        ALTER TABLE profiles ADD COLUMN bio TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='coins') THEN
        ALTER TABLE profiles ADD COLUMN coins INTEGER DEFAULT 100;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='xp') THEN
        ALTER TABLE profiles ADD COLUMN xp INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='onboarding_complete') THEN
        ALTER TABLE profiles ADD COLUMN onboarding_complete BOOLEAN DEFAULT true;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='is_admin') THEN
        ALTER TABLE profiles ADD COLUMN is_admin BOOLEAN DEFAULT false;
    END IF;
END $$;

-- Password reset OTPs table
CREATE TABLE IF NOT EXISTS password_reset_otps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT NOT NULL,
    otp TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    used BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_password_reset_otps_email ON password_reset_otps(email);
CREATE INDEX IF NOT EXISTS idx_password_reset_otps_expires ON password_reset_otps(expires_at);

-- ============================================
-- 3. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE direct_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE coin_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE password_reset_otps ENABLE ROW LEVEL SECURITY;

-- Profiles policies
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

-- Games policies
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

-- Game comments policies
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

-- Follows policies
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

-- Direct messages policies
DROP POLICY IF EXISTS "Users can view their messages" ON direct_messages;
CREATE POLICY "Users can view their messages"
ON direct_messages FOR SELECT
TO authenticated
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

DROP POLICY IF EXISTS "Users can send messages" ON direct_messages;
CREATE POLICY "Users can send messages"
ON direct_messages FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = sender_id);

DROP POLICY IF EXISTS "Users can delete their sent messages" ON direct_messages;
CREATE POLICY "Users can delete their sent messages"
ON direct_messages FOR DELETE
TO authenticated
USING (auth.uid() = sender_id);

-- Coin purchases policies
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

-- Password reset OTPs (service role only)
DROP POLICY IF EXISTS "Service role can manage OTPs" ON password_reset_otps;
CREATE POLICY "Service role can manage OTPs"
ON password_reset_otps FOR ALL
TO service_role
USING (true);

-- ============================================
-- 4. FUNCTIONS AND TRIGGERS
-- ============================================

-- Function to create profile on signup (already updated in previous migration)
-- This ensures it has all the latest fields

-- Function to update game likes count
CREATE OR REPLACE FUNCTION update_game_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE games SET likes_count = likes_count + 1 WHERE id = NEW.game_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE games SET likes_count = GREATEST(0, likes_count - 1) WHERE id = OLD.game_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_game_likes_count_trigger ON game_likes;
CREATE TRIGGER update_game_likes_count_trigger
AFTER INSERT OR DELETE ON game_likes
FOR EACH ROW EXECUTE FUNCTION update_game_likes_count();

-- Function to update game comments count
CREATE OR REPLACE FUNCTION update_game_comments_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE games SET comments_count = comments_count + 1 WHERE id = NEW.game_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE games SET comments_count = GREATEST(0, comments_count - 1) WHERE id = OLD.game_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_game_comments_count_trigger ON game_comments;
CREATE TRIGGER update_game_comments_count_trigger
AFTER INSERT OR DELETE ON game_comments
FOR EACH ROW EXECUTE FUNCTION update_game_comments_count();

-- Function to update profile followers count
CREATE OR REPLACE FUNCTION update_followers_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE profiles SET followers_count = followers_count + 1 WHERE id = NEW.following_id;
        UPDATE profiles SET following_count = following_count + 1 WHERE id = NEW.follower_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE profiles SET followers_count = GREATEST(0, followers_count - 1) WHERE id = OLD.following_id;
        UPDATE profiles SET following_count = GREATEST(0, following_count - 1) WHERE id = OLD.follower_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_followers_count_trigger ON follows;
CREATE TRIGGER update_followers_count_trigger
AFTER INSERT OR DELETE ON follows
FOR EACH ROW EXECUTE FUNCTION update_followers_count();

-- ============================================
-- 5. INDEXES FOR PERFORMANCE
-- ============================================

-- Profiles indexes
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON profiles(created_at DESC);

-- Games indexes
CREATE INDEX IF NOT EXISTS idx_games_creator_id ON games(creator_id);
CREATE INDEX IF NOT EXISTS idx_games_created_at ON games(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_games_likes_count ON games(likes_count DESC);
CREATE INDEX IF NOT EXISTS idx_games_is_public ON games(is_public);

-- Comments indexes
CREATE INDEX IF NOT EXISTS idx_comments_game_id ON game_comments(game_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON game_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON game_comments(created_at DESC);

-- Follows indexes
CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON follows(following_id);
CREATE INDEX IF NOT EXISTS idx_follows_unique ON follows(follower_id, following_id);

-- Messages indexes
CREATE INDEX IF NOT EXISTS idx_messages_sender ON direct_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver ON direct_messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON direct_messages(created_at DESC);

-- ============================================
-- 6. SET ADMIN USER
-- ============================================

-- Set admin flag for the admin email
UPDATE profiles 
SET is_admin = true 
WHERE email = 'playgenofficial@gmail.com';

-- ============================================
-- 7. CLEANUP OLD OTPs
-- ============================================

-- Delete expired OTPs (older than 1 hour)
DELETE FROM password_reset_otps 
WHERE expires_at < NOW() - INTERVAL '1 hour';

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check tables exist
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- Check RLS is enabled
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- Check storage buckets
SELECT * FROM storage.buckets;

-- Check profiles count
SELECT COUNT(*) as profile_count FROM profiles;

-- Check games count
SELECT COUNT(*) as games_count FROM games;
