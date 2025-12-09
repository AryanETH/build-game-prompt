-- Add live gaming feature to games table
-- This allows users to mark their gameplay as "live" and appear in the live feed

-- Add is_live column to games table
ALTER TABLE games 
ADD COLUMN IF NOT EXISTS is_live BOOLEAN DEFAULT FALSE;

-- Add live_started_at timestamp to track when user went live
ALTER TABLE games 
ADD COLUMN IF NOT EXISTS live_started_at TIMESTAMPTZ;

-- Add live_viewers_count to track concurrent viewers (optional for future)
ALTER TABLE games 
ADD COLUMN IF NOT EXISTS live_viewers_count INTEGER DEFAULT 0;

-- Create index for efficient live games queries
CREATE INDEX IF NOT EXISTS idx_games_is_live ON games(is_live) WHERE is_live = TRUE;

-- Create index for live games ordered by time
CREATE INDEX IF NOT EXISTS idx_games_live_started_at ON games(live_started_at DESC) WHERE is_live = TRUE;

-- Add RLS policy to allow users to update their own game's live status
CREATE POLICY "Users can update their own game live status"
ON games
FOR UPDATE
USING (auth.uid() = creator_id)
WITH CHECK (auth.uid() = creator_id);

-- Create a function to auto-disable live status after inactivity (optional)
CREATE OR REPLACE FUNCTION auto_disable_stale_live_games()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Disable live status for games that have been live for more than 2 hours without activity
  UPDATE games
  SET is_live = FALSE,
      live_started_at = NULL
  WHERE is_live = TRUE
    AND live_started_at < NOW() - INTERVAL '2 hours';
END;
$$;

-- Optional: Create a cron job to run this function periodically
-- You can set this up in Supabase Dashboard > Database > Cron Jobs
-- SELECT cron.schedule('auto-disable-stale-live', '*/30 * * * *', 'SELECT auto_disable_stale_live_games()');

COMMENT ON COLUMN games.is_live IS 'Indicates if the game creator is currently playing live';
COMMENT ON COLUMN games.live_started_at IS 'Timestamp when the user started playing live';
COMMENT ON COLUMN games.live_viewers_count IS 'Number of concurrent viewers watching the live gameplay';
