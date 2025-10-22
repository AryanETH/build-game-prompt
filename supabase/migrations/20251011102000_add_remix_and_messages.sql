-- ================================
-- Add remix linking to games
-- ================================
ALTER TABLE public.games
  ADD COLUMN IF NOT EXISTS original_game_id UUID REFERENCES public.games(id) ON DELETE SET NULL;

-- Indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_games_created_at ON public.games(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_games_original_game_id ON public.games(original_game_id);

-- ================================
-- Direct Messages Table
-- ================================
CREATE TABLE IF NOT EXISTS public.direct_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;

-- ================================
-- RLS POLICIES (SAFE)
-- ================================

-- View Policy
DO $$
BEGIN
   IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE policyname = 'Users can view their DMs' AND tablename = 'direct_messages'
   ) THEN
      CREATE POLICY "Users can view their DMs"
      ON public.direct_messages
      FOR SELECT
      USING (auth.uid() = sender_id OR auth.uid() = recipient_id);
   END IF;
END$$;

-- Insert Policy
DO $$
BEGIN
   IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE policyname = 'Users can send DMs' AND tablename = 'direct_messages'
   ) THEN
      CREATE POLICY "Users can send DMs"
      ON public.direct_messages
      FOR INSERT
      WITH CHECK (auth.uid() = sender_id);
   END IF;
END$$;

-- Delete Policy
DO $$
BEGIN
   IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE policyname = 'Users can delete their DMs' AND tablename = 'direct_messages'
   ) THEN
      CREATE POLICY "Users can delete their DMs"
      ON public.direct_messages
      FOR DELETE
      USING (auth.uid() = sender_id OR auth.uid() = recipient_id);
   END IF;
END$$;
