-- =====================================================
-- VERIFY AND FIX DIRECT MESSAGES SETUP
-- Run this in Supabase SQL Editor
-- =====================================================

-- 1. Check if direct_messages table exists and has correct structure
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'direct_messages' 
ORDER BY ordinal_position;

-- 2. Verify RLS is enabled
SELECT 
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename = 'direct_messages';

-- 3. Check existing policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'direct_messages';

-- 4. Create table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.direct_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_one_time BOOLEAN DEFAULT false,
    viewed_at TIMESTAMPTZ,
    reply_to_id UUID REFERENCES public.direct_messages(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Enable RLS
ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;

-- 6. Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own messages" ON public.direct_messages;
DROP POLICY IF EXISTS "Users can send messages" ON public.direct_messages;
DROP POLICY IF EXISTS "Users can update their received messages" ON public.direct_messages;
DROP POLICY IF EXISTS "Users can delete their own messages" ON public.direct_messages;
DROP POLICY IF EXISTS "Users can view their messages" ON public.direct_messages;
DROP POLICY IF EXISTS "Users can delete their sent messages" ON public.direct_messages;

-- 7. Create RLS Policies
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

-- 8. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_direct_messages_sender ON public.direct_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_direct_messages_recipient ON public.direct_messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_direct_messages_created_at ON public.direct_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_direct_messages_conversation ON public.direct_messages(sender_id, recipient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_direct_messages_reply_to ON public.direct_messages(reply_to_id);

-- 9. Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_direct_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 10. Create trigger for updated_at
DROP TRIGGER IF EXISTS update_direct_messages_updated_at ON public.direct_messages;
CREATE TRIGGER update_direct_messages_updated_at
    BEFORE UPDATE ON public.direct_messages
    FOR EACH ROW
    EXECUTE FUNCTION public.update_direct_messages_updated_at();

-- 11. Grant permissions
GRANT ALL ON public.direct_messages TO authenticated;
GRANT ALL ON public.direct_messages TO service_role;

-- 12. Test query - check if you can see messages
SELECT 
    id,
    sender_id,
    recipient_id,
    CASE 
        WHEN content LIKE '[GIF]%' THEN 'GIF'
        WHEN content LIKE '[IMAGE]%' THEN 'Image'
        ELSE LEFT(content, 50)
    END as content_preview,
    is_one_time,
    viewed_at,
    reply_to_id,
    created_at
FROM public.direct_messages
ORDER BY created_at DESC
LIMIT 10;

-- =====================================================
-- VERIFICATION COMPLETE
-- =====================================================
-- If you see results from the test query, messages are working!
-- Photos are stored as: [IMAGE]data:image/png;base64,iVBORw0KG...
-- GIFs are stored as: [GIF]https://media.giphy.com/...
-- Regular text is stored as-is
-- =====================================================
