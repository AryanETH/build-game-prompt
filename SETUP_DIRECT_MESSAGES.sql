-- =====================================================
-- DIRECT MESSAGES SYSTEM - COMPLETE SETUP
-- =====================================================
-- Run this in Supabase SQL Editor to fix messaging
-- =====================================================

-- 1. Create direct_messages table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.direct_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_one_time BOOLEAN DEFAULT false,
    viewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_direct_messages_sender ON public.direct_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_direct_messages_recipient ON public.direct_messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_direct_messages_created_at ON public.direct_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_direct_messages_conversation ON public.direct_messages(sender_id, recipient_id, created_at DESC);

-- 3. Enable Row Level Security
ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;

-- 4. Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own messages" ON public.direct_messages;
DROP POLICY IF EXISTS "Users can send messages" ON public.direct_messages;
DROP POLICY IF EXISTS "Users can update their received messages" ON public.direct_messages;
DROP POLICY IF EXISTS "Users can delete their own messages" ON public.direct_messages;

-- 5. Create RLS Policies

-- Policy: Users can view messages they sent or received
CREATE POLICY "Users can view their own messages"
ON public.direct_messages
FOR SELECT
USING (
    auth.uid() = sender_id OR auth.uid() = recipient_id
);

-- Policy: Users can send messages
CREATE POLICY "Users can send messages"
ON public.direct_messages
FOR INSERT
WITH CHECK (
    auth.uid() = sender_id
);

-- Policy: Users can update messages they received (for marking as viewed)
CREATE POLICY "Users can update their received messages"
ON public.direct_messages
FOR UPDATE
USING (
    auth.uid() = recipient_id
)
WITH CHECK (
    auth.uid() = recipient_id
);

-- Policy: Users can delete their own sent messages
CREATE POLICY "Users can delete their own messages"
ON public.direct_messages
FOR DELETE
USING (
    auth.uid() = sender_id
);

-- 6. Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_direct_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Create trigger for updated_at
DROP TRIGGER IF EXISTS update_direct_messages_updated_at ON public.direct_messages;
CREATE TRIGGER update_direct_messages_updated_at
    BEFORE UPDATE ON public.direct_messages
    FOR EACH ROW
    EXECUTE FUNCTION public.update_direct_messages_updated_at();

-- 8. Grant permissions
GRANT ALL ON public.direct_messages TO authenticated;
GRANT ALL ON public.direct_messages TO service_role;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check if table exists
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'direct_messages'
) AS table_exists;

-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'direct_messages';

-- Check policies
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'direct_messages';

-- Count messages (should work if RLS is correct)
SELECT COUNT(*) as total_messages FROM public.direct_messages;

-- =====================================================
-- TEST QUERIES (Optional - for testing)
-- =====================================================

-- Insert a test message (replace UUIDs with real user IDs)
-- INSERT INTO public.direct_messages (sender_id, recipient_id, content)
-- VALUES (
--     'YOUR_USER_ID_HERE',
--     'RECIPIENT_USER_ID_HERE',
--     'Test message'
-- );

-- View your messages
-- SELECT * FROM public.direct_messages 
-- WHERE sender_id = auth.uid() OR recipient_id = auth.uid()
-- ORDER BY created_at DESC;

-- =====================================================
-- SUCCESS!
-- =====================================================
-- If no errors, your messaging system is ready!
-- Go to Messages page and try sending a message.
-- =====================================================
