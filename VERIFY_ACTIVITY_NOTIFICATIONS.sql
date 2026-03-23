-- =====================================================
-- VERIFY AND FIX ACTIVITY/NOTIFICATIONS SYSTEM
-- Run this in Supabase SQL Editor
-- =====================================================

-- 1. Check if notifications table exists
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'notifications' 
ORDER BY ordinal_position;

-- 2. Verify RLS is enabled
SELECT 
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename = 'notifications';

-- 3. Check existing policies
SELECT 
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'notifications';

-- 4. Create notifications table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.notifications (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    payload JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON public.notifications(user_id, created_at DESC);

-- 6. Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 7. Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can insert their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can delete their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Service role can insert any notification" ON public.notifications;
DROP POLICY IF EXISTS "Authenticated users can insert notifications" ON public.notifications;

-- 8. Create RLS Policies
-- Allow users to view their own notifications
CREATE POLICY "Users can view their own notifications"
ON public.notifications
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Allow users to update their own notifications (mark as read)
CREATE POLICY "Users can update their own notifications"
ON public.notifications
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own notifications
CREATE POLICY "Users can delete their own notifications"
ON public.notifications
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Allow service role to insert any notification (for edge functions)
CREATE POLICY "Service role can insert any notification"
ON public.notifications
FOR INSERT
TO service_role
WITH CHECK (true);

-- Allow authenticated users to insert notifications (for system notifications)
CREATE POLICY "Authenticated users can insert notifications"
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (true);

-- 9. Grant permissions
GRANT ALL ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
GRANT USAGE, SELECT ON SEQUENCE notifications_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE notifications_id_seq TO service_role;

-- 10. Test query - check recent notifications
SELECT 
    id,
    user_id,
    payload->>'type' as notification_type,
    payload->>'content' as content,
    payload->>'username' as from_user,
    payload->>'read' as is_read,
    created_at
FROM public.notifications
ORDER BY created_at DESC
LIMIT 10;

-- 11. Count notifications by type
SELECT 
    payload->>'type' as notification_type,
    COUNT(*) as count
FROM public.notifications
GROUP BY payload->>'type'
ORDER BY count DESC;

-- 12. Count unread notifications per user
SELECT 
    user_id,
    COUNT(*) as unread_count
FROM public.notifications
WHERE (payload->>'read')::boolean IS NOT TRUE
   OR payload->>'read' IS NULL
GROUP BY user_id
ORDER BY unread_count DESC
LIMIT 10;

-- =====================================================
-- NOTIFICATION TYPES SUPPORTED:
-- =====================================================
-- Engagement: like, comment, reply, mention, share, save, play, remix
-- Social: follow, follow_back
-- Milestones: trending, viral, milestone, achievement, badge, level_up
-- System: system, warning, success, gift, monetization, payout, broadcast
-- =====================================================

-- =====================================================
-- PAYLOAD STRUCTURE:
-- =====================================================
-- {
--   "type": "like",
--   "content": "liked your game",
--   "read": false,
--   "username": "john_doe",
--   "user_id": "uuid",
--   "avatar_url": "https://...",
--   "game_id": "uuid",
--   "game_title": "My Game",
--   "game_thumbnail": "https://...",
--   "comment_id": "uuid",
--   "count": 10,
--   "milestone": 1000,
--   "amount": 50,
--   "image_url": "https://..."
-- }
-- =====================================================

-- 13. Create a test notification (optional - uncomment to test)
-- INSERT INTO public.notifications (user_id, payload)
-- VALUES (
--     auth.uid(),
--     jsonb_build_object(
--         'type', 'system',
--         'content', 'Welcome to Oplus! Your notifications will appear here.',
--         'read', false
--     )
-- );

-- =====================================================
-- VERIFICATION COMPLETE
-- =====================================================
-- If you see results from the test queries, notifications are working!
-- The Activity page should now display all notifications properly.
-- =====================================================
