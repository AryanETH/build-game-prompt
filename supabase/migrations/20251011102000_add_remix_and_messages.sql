-- Add remix linking to games and direct messages table
-- Games: original_game_id links a remix to its original
ALTER TABLE public.games
  ADD COLUMN IF NOT EXISTS original_game_id UUID REFERENCES public.games(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_games_created_at ON public.games(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_games_original_game_id ON public.games(original_game_id);

-- Direct messages between users
CREATE TABLE IF NOT EXISTS public.direct_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;

-- Policies: only sender or recipient can view their messages
CREATE POLICY IF NOT EXISTS "Users can view their DMs"
  ON public.direct_messages FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

-- Only sender can insert
CREATE POLICY IF NOT EXISTS "Users can send DMs"
  ON public.direct_messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

-- Allow delete by either party for their messages (optional)
CREATE POLICY IF NOT EXISTS "Users can delete their DMs"
  ON public.direct_messages FOR DELETE
  USING (auth.uid() = sender_id OR auth.uid() = recipient_id);
