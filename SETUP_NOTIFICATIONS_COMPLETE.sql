-- =====================================================
-- Complete Notifications System Setup
-- =====================================================
-- Run this in Supabase SQL Editor to ensure all 
-- notification features work properly
-- =====================================================

-- 1. Verify notifications table exists with correct structure
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'notifications') THEN
        CREATE TABLE notifications (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            payload JSONB NOT NULL,
            created_at TIMESTAMPTZ DEFAULT NOW()
        );
        
        CREATE INDEX idx_notifications_user_id ON notifications(user_id);
        CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
        
        RAISE NOTICE 'Created notifications table';
    ELSE
        RAISE NOTICE 'Notifications table already exists';
    END IF;
END $$;

-- 2. Enable RLS on notifications table
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 3. Drop ALL existing policies to avoid conflicts
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'notifications') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON notifications';
    END LOOP;
END $$;

-- 4. Create RLS policies for notifications
CREATE POLICY "Users can view their own notifications"
ON notifications FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
ON notifications FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications"
ON notifications FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert any notification"
ON notifications FOR INSERT
TO service_role
WITH CHECK (true);

CREATE POLICY "Authenticated users can insert notifications"
ON notifications FOR INSERT
TO authenticated
WITH CHECK (true);

-- 5. Grant necessary permissions
GRANT ALL ON notifications TO authenticated;
GRANT ALL ON notifications TO service_role;

-- 6. Verify profiles table has required columns for notifications
DO $$
BEGIN
    -- Check if username column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'username'
    ) THEN
        ALTER TABLE profiles ADD COLUMN username TEXT UNIQUE;
        RAISE NOTICE 'Added username column to profiles';
    END IF;
    
    -- Check if avatar_url column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'avatar_url'
    ) THEN
        ALTER TABLE profiles ADD COLUMN avatar_url TEXT;
        RAISE NOTICE 'Added avatar_url column to profiles';
    END IF;
END $$;

-- 7. Verify games table has required columns for notifications
DO $$
BEGIN
    -- Check if thumbnail_url column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'games' AND column_name = 'thumbnail_url'
    ) THEN
        ALTER TABLE games ADD COLUMN thumbnail_url TEXT;
        RAISE NOTICE 'Added thumbnail_url column to games';
    END IF;
    
    -- Check if cover_url column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'games' AND column_name = 'cover_url'
    ) THEN
        ALTER TABLE games ADD COLUMN cover_url TEXT;
        RAISE NOTICE 'Added cover_url column to games';
    END IF;
END $$;

-- 8. Optional: Create comment_likes table for future use
-- (Currently comment likes are handled optimistically in the UI)
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'comment_likes') THEN
        CREATE TABLE comment_likes (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            comment_id UUID NOT NULL REFERENCES game_comments(id) ON DELETE CASCADE,
            user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            UNIQUE(comment_id, user_id)
        );
        
        CREATE INDEX idx_comment_likes_comment_id ON comment_likes(comment_id);
        CREATE INDEX idx_comment_likes_user_id ON comment_likes(user_id);
        
        -- Enable RLS
        ALTER TABLE comment_likes ENABLE ROW LEVEL SECURITY;
        
        -- RLS Policies
        CREATE POLICY "Anyone can view comment likes"
        ON comment_likes FOR SELECT
        TO authenticated
        USING (true);
        
        CREATE POLICY "Users can insert their own comment likes"
        ON comment_likes FOR INSERT
        TO authenticated
        WITH CHECK (auth.uid() = user_id);
        
        CREATE POLICY "Users can delete their own comment likes"
        ON comment_likes FOR DELETE
        TO authenticated
        USING (auth.uid() = user_id);
        
        GRANT ALL ON comment_likes TO authenticated;
        
        RAISE NOTICE 'Created comment_likes table';
    ELSE
        RAISE NOTICE 'Comment_likes table already exists';
    END IF;
END $$;

-- 9. Verification queries
SELECT 
    'Notifications table' as component,
    'EXISTS' as status,
    COUNT(*) as record_count
FROM notifications
UNION ALL
SELECT 
    'Profiles with username' as component,
    'EXISTS' as status,
    COUNT(*) as record_count
FROM profiles WHERE username IS NOT NULL
UNION ALL
SELECT 
    'Games with thumbnails' as component,
    'EXISTS' as status,
    COUNT(*) as record_count
FROM games WHERE thumbnail_url IS NOT NULL OR cover_url IS NOT NULL
UNION ALL
SELECT 
    'RLS Policies on notifications' as component,
    'ENABLED' as status,
    COUNT(*) as policy_count
FROM pg_policies WHERE tablename = 'notifications';

-- 10. Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Notifications system setup complete!';
    RAISE NOTICE 'All notification types are now ready:';
    RAISE NOTICE '  - Game likes';
    RAISE NOTICE '  - Game comments';
    RAISE NOTICE '  - Comment likes';
    RAISE NOTICE '  - Comment replies';
    RAISE NOTICE '  - User mentions (@username)';
    RAISE NOTICE '  - Game mentions (+game_title)';
    RAISE NOTICE '  - New followers';
END $$;

COMMIT;
