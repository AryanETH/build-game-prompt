# Apply Matchmaking Migration

## Issue
The migration `20241206000001_add_matchmaking_system.sql` needs to be applied to your remote database.

## Solution

### Option 1: Apply via Supabase Dashboard (Recommended)

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Create a new query
4. Copy and paste the entire content from `supabase/migrations/20241206000001_add_matchmaking_system.sql`
5. Click **Run** to execute

### Option 2: Install Supabase CLI and Push

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# Push all migrations including the old one
supabase db push --include-all
```

### Option 3: Manual SQL Execution

Run this SQL in your Supabase SQL Editor:

```sql
-- Matchmaking and Turn-based Game System

-- Match sessions table
CREATE TABLE IF NOT EXISTS match_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID REFERENCES games(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'waiting',
  player1_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  player2_id UUID,
  current_turn UUID,
  player1_score INTEGER DEFAULT 0,
  player2_score INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  winner_id UUID
);

-- Match queue table
CREATE TABLE IF NOT EXISTS match_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  game_id UUID REFERENCES games(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, game_id)
);

-- Game state snapshots
CREATE TABLE IF NOT EXISTS game_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID REFERENCES match_sessions(id) ON DELETE CASCADE,
  player_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  state_data JSONB,
  turn_number INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_match_sessions_status ON match_sessions(status);
CREATE INDEX IF NOT EXISTS idx_match_sessions_game_id ON match_sessions(game_id);
CREATE INDEX IF NOT EXISTS idx_match_queue_game_id ON match_queue(game_id);
CREATE INDEX IF NOT EXISTS idx_match_queue_user_id ON match_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_game_states_match_id ON game_states(match_id);

-- Enable RLS
ALTER TABLE match_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_states ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own matches"
  ON match_sessions FOR SELECT
  USING (auth.uid() = player1_id OR auth.uid() = player2_id);

CREATE POLICY "Users can create match sessions"
  ON match_sessions FOR INSERT
  WITH CHECK (auth.uid() = player1_id);

CREATE POLICY "Users can update their own matches"
  ON match_sessions FOR UPDATE
  USING (auth.uid() = player1_id OR auth.uid() = player2_id);

CREATE POLICY "Users can view match queue"
  ON match_queue FOR SELECT
  USING (true);

CREATE POLICY "Users can join queue"
  ON match_queue FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave queue"
  ON match_queue FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view game states in their matches"
  ON game_states FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM match_sessions
      WHERE id = match_id
      AND (player1_id = auth.uid() OR player2_id = auth.uid())
    )
  );

CREATE POLICY "Users can create game states"
  ON game_states FOR INSERT
  WITH CHECK (auth.uid() = player_id);

-- Function to match players
CREATE OR REPLACE FUNCTION match_players()
RETURNS void AS $$
DECLARE
  queue_record RECORD;
  match_record RECORD;
BEGIN
  FOR queue_record IN
    SELECT game_id, array_agg(user_id ORDER BY joined_at) as players
    FROM match_queue
    GROUP BY game_id
    HAVING count(*) >= 2
  LOOP
    INSERT INTO match_sessions (game_id, player1_id, player2_id, status, current_turn, started_at)
    VALUES (
      queue_record.game_id,
      queue_record.players[1],
      queue_record.players[2],
      'playing',
      queue_record.players[1],
      NOW()
    );
    
    DELETE FROM match_queue
    WHERE game_id = queue_record.game_id
    AND user_id IN (queue_record.players[1], queue_record.players[2]);
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Realtime subscriptions
ALTER PUBLICATION supabase_realtime ADD TABLE match_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE match_queue;
ALTER PUBLICATION supabase_realtime ADD TABLE game_states;
```

## What This Migration Does

This migration adds the **multiplayer matchmaking system** to your database:

### Tables Created:
1. **match_sessions** - Stores active and completed multiplayer matches
2. **match_queue** - Manages players waiting to be matched
3. **game_states** - Stores turn-by-turn game state snapshots

### Features Enabled:
- Turn-based multiplayer gameplay
- Automatic player matchmaking
- Real-time match updates
- Score tracking
- Game state persistence

### Security:
- Row Level Security (RLS) enabled on all tables
- Users can only view/modify their own matches
- Secure matchmaking function

## Verification

After applying, verify the tables exist:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('match_sessions', 'match_queue', 'game_states');
```

You should see all 3 tables listed.

## Next Steps

After applying this migration, your multiplayer features will be fully functional:
- Players can join matchmaking queues
- System automatically matches players
- Turn-based gameplay works
- Real-time updates for matches
