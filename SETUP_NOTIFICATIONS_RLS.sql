-- =====================================================
-- Notifications Table RLS Policies Setup
-- =====================================================
-- This script sets up proper Row Level Security policies
-- for the notifications table to allow:
-- 1. Users to read their own notifications
-- 2. Service role to insert notifications (for broadcasts)
-- 3. Users to update/delete their own notifications
-- =====================================================

-- Step 1: Enable RLS on notifications table
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Step 2: Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can insert their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can delete their own notifications" ON notifications;
DROP POLICY IF EXISTS "Service role can insert any notification" ON notifications;

-- Step 3: Create policy for users to read their own notifications
CREATE POLICY "Users can view their own notifications"
ON notifications
FOR SELECT
USING (auth.uid() = user_id);

-- Step 4: Create policy for users to update their own notifications (mark as read)
CREATE POLICY "Users can update their own notifications"
ON notifications
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Step 5: Create policy for users to delete their own notifications
CREATE POLICY "Users can delete their own notifications"
ON notifications
FOR DELETE
USING (auth.uid() = user_id);

-- Step 6: Create policy for service role to insert notifications (for broadcasts and system)
-- This allows the Edge Function to insert notifications for any user
CREATE POLICY "Service role can insert any notification"
ON notifications
FOR INSERT
WITH CHECK (true);

-- Step 7: Grant necessary permissions
GRANT ALL ON notifications TO authenticated;
GRANT ALL ON notifications TO service_role;

-- Step 8: Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id_created 
ON notifications(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id_read 
ON notifications(user_id, ((payload->>'read')::boolean));

-- =====================================================
-- Verification Queries
-- =====================================================

-- Check if RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'notifications';
-- Should show: rowsecurity = true

-- Check policies
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'notifications';
-- Should show 4-5 policies

-- Test notification insert (as service role)
-- This should work from the Edge Function
-- INSERT INTO notifications (user_id, payload) 
-- VALUES ('test-user-id', '{"type": "test", "content": "Test", "read": false}');

-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Notifications RLS policies configured successfully!';
  RAISE NOTICE '✅ Service role can now insert notifications for broadcasts';
  RAISE NOTICE '✅ Users can read, update, and delete their own notifications';
END $$;
