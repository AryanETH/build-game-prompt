-- Fix Broadcast Notifications
-- Run this in Supabase SQL Editor to ensure notifications work properly

-- 1. Verify notifications table exists
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
    END IF;
END $$;

-- 2. Drop existing RLS policies
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can insert their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can delete their own notifications" ON notifications;
DROP POLICY IF EXISTS "Service role can insert any notification" ON notifications;
DROP POLICY IF EXISTS "Admins can insert any notification" ON notifications;

-- 3. Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 4. Create new RLS policies
-- Allow users to view their own notifications
CREATE POLICY "Users can view their own notifications"
ON notifications FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Allow users to update their own notifications (mark as read)
CREATE POLICY "Users can update their own notifications"
ON notifications FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own notifications
CREATE POLICY "Users can delete their own notifications"
ON notifications FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Allow service role to insert any notification (for edge functions)
CREATE POLICY "Service role can insert any notification"
ON notifications FOR INSERT
TO service_role
WITH CHECK (true);

-- Allow authenticated users to insert notifications (for admin broadcast)
CREATE POLICY "Authenticated users can insert notifications"
ON notifications FOR INSERT
TO authenticated
WITH CHECK (true);

-- 5. Grant necessary permissions
GRANT ALL ON notifications TO authenticated;
GRANT ALL ON notifications TO service_role;

-- 6. Verify setup
SELECT 
    'Notifications table exists' as status,
    COUNT(*) as notification_count
FROM notifications;

SELECT 
    'RLS policies' as status,
    COUNT(*) as policy_count
FROM pg_policies 
WHERE tablename = 'notifications';

-- 7. Test query (should return user count)
SELECT 
    'Total users for broadcast' as status,
    COUNT(*) as user_count
FROM profiles;

COMMIT;
