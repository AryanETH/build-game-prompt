-- Add reply functionality to direct_messages table
-- Run this in Supabase SQL Editor

-- Add reply_to_id column to track which message is being replied to
ALTER TABLE public.direct_messages 
ADD COLUMN IF NOT EXISTS reply_to_id UUID REFERENCES public.direct_messages(id) ON DELETE SET NULL;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_direct_messages_reply_to ON public.direct_messages(reply_to_id);

-- Verify the column was added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'direct_messages' 
AND column_name = 'reply_to_id';
