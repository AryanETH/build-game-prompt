-- ============================================================================
-- MEDIA LIBRARY SETUP AND VERIFICATION
-- Run this in Supabase SQL Editor to set up the media library system
-- ============================================================================

-- ============================================================================
-- STEP 1: Create media_library table
-- ============================================================================

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

-- ============================================================================
-- STEP 2: Create indexes for performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_media_library_type ON public.media_library(type);
CREATE INDEX IF NOT EXISTS idx_media_library_category ON public.media_library(category);
CREATE INDEX IF NOT EXISTS idx_media_library_tags ON public.media_library USING gin(tags);

-- ============================================================================
-- STEP 3: Enable RLS and create policies
-- ============================================================================

ALTER TABLE public.media_library ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view media library" ON public.media_library;
DROP POLICY IF EXISTS "Authenticated users can upload media" ON public.media_library;

-- Everyone can read media library
CREATE POLICY "Anyone can view media library"
  ON public.media_library FOR SELECT
  TO public
  USING (true);

-- Only authenticated users can insert (for user uploads)
CREATE POLICY "Authenticated users can upload media"
  ON public.media_library FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ============================================================================
-- STEP 4: Insert sample SFX (free from Mixkit)
-- ============================================================================

-- Clear existing sample data first
DELETE FROM public.media_library WHERE url LIKE '%mixkit%';

-- Insert SFX
INSERT INTO public.media_library (name, type, category, url, format, tags) VALUES
  ('Jump Sound', 'sfx', 'action', 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3', 'mp3', ARRAY['jump', 'hop', 'bounce', 'platformer']),
  ('Coin Collect', 'sfx', 'collect', 'https://assets.mixkit.co/active_storage/sfx/1993/1993-preview.mp3', 'mp3', ARRAY['coin', 'collect', 'pickup', 'item']),
  ('Power Up', 'sfx', 'powerup', 'https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3', 'mp3', ARRAY['powerup', 'upgrade', 'boost', 'level-up']),
  ('Hit Damage', 'sfx', 'action', 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3', 'mp3', ARRAY['hit', 'damage', 'hurt', 'collision']),
  ('Victory', 'sfx', 'success', 'https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3', 'mp3', ARRAY['win', 'success', 'victory', 'complete']),
  ('Game Over', 'sfx', 'fail', 'https://assets.mixkit.co/active_storage/sfx/1006/1006-preview.mp3', 'mp3', ARRAY['lose', 'fail', 'gameover', 'death']),
  ('Button Click', 'sfx', 'ui', 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3', 'mp3', ARRAY['click', 'button', 'ui', 'menu']),
  ('Whoosh', 'sfx', 'transition', 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3', 'mp3', ARRAY['whoosh', 'swipe', 'transition', 'slide']),
  ('Explosion', 'sfx', 'action', 'https://assets.mixkit.co/active_storage/sfx/2803/2803-preview.mp3', 'mp3', ARRAY['explosion', 'boom', 'blast', 'destroy']),
  ('Laser Shot', 'sfx', 'action', 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3', 'mp3', ARRAY['laser', 'shoot', 'fire', 'weapon']),
  ('Notification', 'sfx', 'ui', 'https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3', 'mp3', ARRAY['notification', 'alert', 'message', 'ping']),
  ('Error', 'sfx', 'ui', 'https://assets.mixkit.co/active_storage/sfx/2577/2577-preview.mp3', 'mp3', ARRAY['error', 'wrong', 'invalid', 'fail']);

-- ============================================================================
-- STEP 5: Insert sample Music (free from Mixkit)
-- ============================================================================

INSERT INTO public.media_library (name, type, category, url, duration, format, tags) VALUES
  ('Arcade Theme', 'music', 'arcade', 'https://assets.mixkit.co/music/preview/mixkit-tech-house-vibes-130.mp3', 146, 'mp3', ARRAY['arcade', 'upbeat', 'electronic', 'energetic']),
  ('Puzzle Ambient', 'music', 'puzzle', 'https://assets.mixkit.co/music/preview/mixkit-dreaming-big-31.mp3', 134, 'mp3', ARRAY['puzzle', 'calm', 'ambient', 'relaxing']),
  ('Action Beat', 'music', 'action', 'https://assets.mixkit.co/music/preview/mixkit-games-worldbeat-466.mp3', 120, 'mp3', ARRAY['action', 'intense', 'fast', 'battle']),
  ('Chill Vibes', 'music', 'casual', 'https://assets.mixkit.co/music/preview/mixkit-a-very-happy-christmas-897.mp3', 168, 'mp3', ARRAY['casual', 'chill', 'relaxed', 'background']),
  ('Epic Adventure', 'music', 'adventure', 'https://assets.mixkit.co/music/preview/mixkit-epic-orchestra-transition-2290.mp3', 12, 'mp3', ARRAY['epic', 'adventure', 'orchestral', 'cinematic']),
  ('Retro 8-bit', 'music', 'retro', 'https://assets.mixkit.co/music/preview/mixkit-game-level-music-689.mp3', 120, 'mp3', ARRAY['retro', '8-bit', 'chiptune', 'nostalgic']);

-- ============================================================================
-- STEP 6: Verification queries
-- ============================================================================

-- Check if table exists and has data
SELECT 
  'media_library' as table_name,
  COUNT(*) as total_records,
  COUNT(*) FILTER (WHERE type = 'sfx') as sfx_count,
  COUNT(*) FILTER (WHERE type = 'music') as music_count,
  COUNT(*) FILTER (WHERE type = 'image') as image_count,
  COUNT(*) FILTER (WHERE type = 'video') as video_count
FROM public.media_library;

-- View all SFX
SELECT name, category, tags, url
FROM public.media_library
WHERE type = 'sfx'
ORDER BY category, name;

-- View all Music
SELECT name, category, duration, tags, url
FROM public.media_library
WHERE type = 'music'
ORDER BY category, name;

-- Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'media_library';

-- ============================================================================
-- STEP 7: Test queries (what the frontend will use)
-- ============================================================================

-- Get all SFX by category
SELECT id, name, url, tags
FROM public.media_library
WHERE type = 'sfx' AND category = 'action'
ORDER BY name;

-- Get all music by category
SELECT id, name, url, duration, tags
FROM public.media_library
WHERE type = 'music' AND category = 'arcade'
ORDER BY name;

-- Search by tag
SELECT id, name, type, category, url
FROM public.media_library
WHERE 'jump' = ANY(tags)
ORDER BY type, name;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Media library setup complete!';
  RAISE NOTICE '📊 Run the verification queries above to check the data';
  RAISE NOTICE '🎵 Sample music and SFX have been added';
  RAISE NOTICE '🔒 RLS policies are enabled';
END $$;
