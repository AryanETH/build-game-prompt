-- Create comments table for games
CREATE TABLE IF NOT EXISTS public.game_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id UUID NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(content) <= 1000),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.game_comments ENABLE ROW LEVEL SECURITY;

-- RLS: everyone can read
CREATE POLICY "Comments are viewable by everyone"
  ON public.game_comments FOR SELECT
  USING (true);

-- RLS: authenticated users can insert their own comments
CREATE POLICY "Users can write their own comments"
  ON public.game_comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS: users can delete their own comments
CREATE POLICY "Users can delete their own comments"
  ON public.game_comments FOR DELETE
  USING (auth.uid() = user_id);

-- Optional: maintain counters per game later if desired
