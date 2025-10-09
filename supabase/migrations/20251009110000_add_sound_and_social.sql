-- Add sound-related columns to games
ALTER TABLE public.games
  ADD COLUMN IF NOT EXISTS sound_enabled BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS sound_theme TEXT,
  ADD COLUMN IF NOT EXISTS sound_volume REAL;

-- Add bio to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS bio TEXT;

-- Create user_follows table
CREATE TABLE IF NOT EXISTS public.user_follows (
  follower_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (follower_id, following_id),
  CHECK (follower_id <> following_id)
);

ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;

-- Policies: anyone can view relationships
CREATE POLICY IF NOT EXISTS "Follows are viewable by everyone"
  ON public.user_follows FOR SELECT USING (true);

-- Only the authenticated user can follow/unfollow as themselves
CREATE POLICY IF NOT EXISTS "Users can follow others"
  ON public.user_follows FOR INSERT
  WITH CHECK (auth.uid() = follower_id);

CREATE POLICY IF NOT EXISTS "Users can unfollow others"
  ON public.user_follows FOR DELETE
  USING (auth.uid() = follower_id);

-- Create game_comments table
CREATE TABLE IF NOT EXISTS public.game_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id UUID NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.game_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Comments are viewable by everyone"
  ON public.game_comments FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "Authenticated users can comment"
  ON public.game_comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can delete their own comments"
  ON public.game_comments FOR DELETE
  USING (auth.uid() = user_id);
