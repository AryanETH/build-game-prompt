-- Add feed_position column to games table for admin-controlled feed ordering
-- Run this in your Supabase SQL Editor

-- Add the feed_position column (nullable integer, lower numbers appear first)
ALTER TABLE games ADD COLUMN IF NOT EXISTS feed_position INTEGER DEFAULT NULL;

-- Create an index for efficient ordering
CREATE INDEX IF NOT EXISTS idx_games_feed_position ON games(feed_position NULLS LAST, created_at DESC);

-- Optional: Initialize feed_position for existing games based on creation order
-- This sets position 1 for newest, 2 for second newest, etc.
-- Uncomment and run if you want to set initial positions:
/*
WITH ranked_games AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at DESC) as rn
  FROM games
)
UPDATE games 
SET feed_position = ranked_games.rn
FROM ranked_games
WHERE games.id = ranked_games.id;
*/

-- Grant necessary permissions (adjust if needed based on your RLS policies)
-- The existing RLS policies should already allow updates by authenticated users
