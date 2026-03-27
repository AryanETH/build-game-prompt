-- ============================================================================
-- PART 1: CREATE TABLES (Run this first)
-- ============================================================================

-- Create media_library table
CREATE TABLE IF NOT EXISTS public.media_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('music', 'sfx', 'image', 'video')),
  category TEXT,
  url TEXT NOT NULL,
  duration INTEGER,
  file_size INTEGER,
  format TEXT,
  is_premium BOOLEAN DEFAULT false,
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add comments_count to games if missing
ALTER TABLE public.games ADD COLUMN IF NOT EXISTS comments_count INTEGER DEFAULT 0;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_media_library_type ON public.media_library(type);
CREATE INDEX IF NOT EXISTS idx_game_comments_game_id ON public.game_comments(game_id);
CREATE INDEX IF NOT EXISTS idx_comment_likes_comment_id ON public.comment_likes(comment_id);
