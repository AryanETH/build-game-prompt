-- Create game_comments table
CREATE TABLE public.game_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id UUID NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.game_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view comments"
ON public.game_comments FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can create comments"
ON public.game_comments FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments"
ON public.game_comments FOR DELETE
USING (auth.uid() = user_id);

-- Add indexes for performance
CREATE INDEX idx_game_comments_game_id ON public.game_comments(game_id);
CREATE INDEX idx_game_comments_user_id ON public.game_comments(user_id);

-- Add location fields to games table
ALTER TABLE public.games
ADD COLUMN country TEXT,
ADD COLUMN city TEXT,
ADD COLUMN latitude DOUBLE PRECISION,
ADD COLUMN longitude DOUBLE PRECISION;

-- Create index for location-based queries
CREATE INDEX idx_games_country ON public.games(country);
CREATE INDEX idx_games_city ON public.games(city);