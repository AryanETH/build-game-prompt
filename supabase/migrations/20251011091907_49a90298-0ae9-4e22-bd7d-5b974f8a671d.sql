-- Create game_comments table if not exists
DO $$
BEGIN
   IF NOT EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'game_comments'
   ) THEN
      CREATE TABLE public.game_comments (
        id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
        game_id UUID NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
        user_id UUID NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
      );
   END IF;
END$$;

-- Enable RLS
ALTER TABLE public.game_comments ENABLE ROW LEVEL SECURITY;

-- ======================
-- RLS POLICIES (SAFE)
-- ======================

-- Anyone can view comments
DO $$
BEGIN
   IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE policyname = 'Anyone can view comments' AND tablename = 'game_comments'
   ) THEN
      CREATE POLICY "Anyone can view comments"
      ON public.game_comments
      FOR SELECT
      USING (true);
   END IF;
END$$;

-- Authenticated users can create comments
DO $$
BEGIN
   IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE policyname = 'Authenticated users can create comments' AND tablename = 'game_comments'
   ) THEN
      CREATE POLICY "Authenticated users can create comments"
      ON public.game_comments
      FOR INSERT
      WITH CHECK (auth.uid() = user_id);
   END IF;
END$$;

-- Users can delete their own comments
DO $$
BEGIN
   IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE policyname = 'Users can delete their own comments' AND tablename = 'game_comments'
   ) THEN
      CREATE POLICY "Users can delete their own comments"
      ON public.game_comments
      FOR DELETE
      USING (auth.uid() = user_id);
   END IF;
END$$;

-- ======================
-- Indexes (SAFE)
-- ======================
DO $$
BEGIN
   IF NOT EXISTS (
      SELECT 1 FROM pg_indexes 
      WHERE schemaname = 'public' AND indexname = 'idx_game_comments_game_id'
   ) THEN
      CREATE INDEX idx_game_comments_game_id ON public.game_comments(game_id);
   END IF;
END$$;

DO $$
BEGIN
   IF NOT EXISTS (
      SELECT 1 FROM pg_indexes 
      WHERE schemaname = 'public' AND indexname = 'idx_game_comments_user_id'
   ) THEN
      CREATE INDEX idx_game_comments_user_id ON public.game_comments(user_id);
   END IF;
END$$;

-- ======================
-- Add location fields to games table
-- ======================
DO $$
BEGIN
   IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'games' AND column_name = 'country'
   ) THEN
      ALTER TABLE public.games
      ADD COLUMN country TEXT;
   END IF;

   IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'games' AND column_name = 'city'
   ) THEN
      ALTER TABLE public.games
      ADD COLUMN city TEXT;
   END IF;

   IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'games' AND column_name = 'latitude'
   ) THEN
      ALTER TABLE public.games
      ADD COLUMN latitude DOUBLE PRECISION;
   END IF;

   IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'games' AND column_name = 'longitude'
   ) THEN
      ALTER TABLE public.games
      ADD COLUMN longitude DOUBLE PRECISION;
   END IF;
END$$;

-- ======================
-- Indexes for games (SAFE)
-- ======================
DO $$
BEGIN
   IF NOT EXISTS (
      SELECT 1 FROM pg_indexes 
      WHERE schemaname = 'public' AND indexname = 'idx_games_country'
   ) THEN
      CREATE INDEX idx_games_country ON public.games(country);
   END IF;

   IF NOT EXISTS (
      SELECT 1 FROM pg_indexes 
      WHERE schemaname = 'public' AND indexname = 'idx_games_city'
   ) THEN
      CREATE INDEX idx_games_city ON public.games(city);
   END IF;
END$$;
