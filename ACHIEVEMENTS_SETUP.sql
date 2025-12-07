-- Create achievements table
CREATE TABLE IF NOT EXISTS achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon_url TEXT,
  rarity TEXT NOT NULL CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
  requirement_type TEXT NOT NULL, -- 'games_created', 'games_played', 'likes_received', 'followers', etc.
  requirement_value INTEGER NOT NULL,
  coins_reward INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user_achievements table
CREATE TABLE IF NOT EXISTS user_achievements (
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  achievement_id UUID REFERENCES achievements(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, achievement_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_achievements_type ON achievements(requirement_type);

-- Enable RLS
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

-- RLS Policies for achievements (public read)
CREATE POLICY "Anyone can view achievements"
  ON achievements FOR SELECT
  USING (true);

-- RLS Policies for user_achievements
CREATE POLICY "Users can view their own achievements"
  ON user_achievements FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own achievements"
  ON user_achievements FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Insert starter achievements
INSERT INTO achievements (name, description, rarity, requirement_type, requirement_value, coins_reward) VALUES
  ('First Steps', 'Create your first game', 'common', 'games_created', 1, 10),
  ('Game Creator', 'Create 5 games', 'common', 'games_created', 5, 25),
  ('Prolific Creator', 'Create 10 games', 'rare', 'games_created', 10, 50),
  ('Game Master', 'Create 25 games', 'epic', 'games_created', 25, 100),
  ('Legend', 'Create 50 games', 'legendary', 'games_created', 50, 250),
  
  ('Player', 'Play 10 games', 'common', 'games_played', 10, 10),
  ('Gamer', 'Play 50 games', 'rare', 'games_played', 50, 50),
  ('Hardcore Gamer', 'Play 100 games', 'epic', 'games_played', 100, 100),
  ('Gaming Legend', 'Play 500 games', 'legendary', 'games_played', 500, 500),
  
  ('Popular', 'Get 10 likes on your games', 'common', 'likes_received', 10, 15),
  ('Trending', 'Get 50 likes on your games', 'rare', 'likes_received', 50, 50),
  ('Viral', 'Get 100 likes on your games', 'epic', 'likes_received', 100, 150),
  ('Superstar', 'Get 500 likes on your games', 'legendary', 'likes_received', 500, 500),
  
  ('Social Butterfly', 'Get 10 followers', 'common', 'followers', 10, 20),
  ('Influencer', 'Get 50 followers', 'rare', 'followers', 50, 75),
  ('Celebrity', 'Get 100 followers', 'epic', 'followers', 100, 200),
  ('Icon', 'Get 500 followers', 'legendary', 'followers', 500, 1000),
  
  ('Remix Artist', 'Remix 5 games', 'common', 'remixes_created', 5, 25),
  ('Remix Master', 'Remix 20 games', 'rare', 'remixes_created', 20, 100),
  
  ('Commentator', 'Leave 50 comments', 'common', 'comments_made', 50, 30),
  ('Community Leader', 'Leave 200 comments', 'rare', 'comments_made', 200, 100)
ON CONFLICT DO NOTHING;

-- Function to increment coins (if not exists)
CREATE OR REPLACE FUNCTION increment_coins(user_id UUID, amount INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE profiles
  SET coins = COALESCE(coins, 0) + amount
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION increment_coins TO authenticated;

COMMENT ON TABLE achievements IS 'Achievements that users can unlock';
COMMENT ON TABLE user_achievements IS 'Tracks which achievements users have unlocked';
