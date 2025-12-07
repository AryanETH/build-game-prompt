-- Create game_reactions table
CREATE TABLE IF NOT EXISTS game_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID REFERENCES games(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  emoji TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(game_id, user_id) -- One reaction per user per game
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_game_reactions_game ON game_reactions(game_id);
CREATE INDEX IF NOT EXISTS idx_game_reactions_user ON game_reactions(user_id);

-- Enable RLS
ALTER TABLE game_reactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view reactions"
  ON game_reactions FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can add reactions"
  ON game_reactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reactions"
  ON game_reactions FOR DELETE
  USING (auth.uid() = user_id);

COMMENT ON TABLE game_reactions IS 'Emoji reactions on games';
