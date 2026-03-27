-- Media Library System for SFX, Music, and Assets

-- Create media_library table
CREATE TABLE IF NOT EXISTS public.media_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('music', 'sfx', 'image', 'video')),
  category TEXT, -- e.g., 'action', 'puzzle', 'arcade', 'jump', 'collect', 'hit'
  url TEXT NOT NULL,
  duration INTEGER, -- in seconds for audio/video
  file_size INTEGER, -- in bytes
  format TEXT, -- e.g., 'mp3', 'wav', 'png', 'mp4'
  is_premium BOOLEAN DEFAULT false,
  tags TEXT[], -- searchable tags
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_media_library_type ON public.media_library(type);
CREATE INDEX IF NOT EXISTS idx_media_library_category ON public.media_library(category);
CREATE INDEX IF NOT EXISTS idx_media_library_tags ON public.media_library USING gin(tags);

-- Enable RLS
ALTER TABLE public.media_library ENABLE ROW LEVEL SECURITY;

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

-- Insert sample SFX
INSERT INTO public.media_library (name, type, category, url, tags) VALUES
  ('Jump', 'sfx', 'action', 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3', ARRAY['jump', 'hop', 'bounce']),
  ('Coin Collect', 'sfx', 'collect', 'https://assets.mixkit.co/active_storage/sfx/1993/1993-preview.mp3', ARRAY['coin', 'collect', 'pickup']),
  ('Power Up', 'sfx', 'powerup', 'https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3', ARRAY['powerup', 'upgrade', 'boost']),
  ('Hit', 'sfx', 'action', 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3', ARRAY['hit', 'damage', 'hurt']),
  ('Win', 'sfx', 'success', 'https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3', ARRAY['win', 'success', 'victory']),
  ('Lose', 'sfx', 'fail', 'https://assets.mixkit.co/active_storage/sfx/1006/1006-preview.mp3', ARRAY['lose', 'fail', 'gameover']),
  ('Click', 'sfx', 'ui', 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3', ARRAY['click', 'button', 'ui']),
  ('Whoosh', 'sfx', 'transition', 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3', ARRAY['whoosh', 'swipe', 'transition'])
ON CONFLICT DO NOTHING;

-- Insert sample Music
INSERT INTO public.media_library (name, type, category, url, duration, tags) VALUES
  ('Arcade Theme', 'music', 'arcade', 'https://assets.mixkit.co/music/preview/mixkit-tech-house-vibes-130.mp3', 146, ARRAY['arcade', 'upbeat', 'electronic']),
  ('Puzzle Ambient', 'music', 'puzzle', 'https://assets.mixkit.co/music/preview/mixkit-dreaming-big-31.mp3', 134, ARRAY['puzzle', 'calm', 'ambient']),
  ('Action Beat', 'music', 'action', 'https://assets.mixkit.co/music/preview/mixkit-games-worldbeat-466.mp3', 120, ARRAY['action', 'intense', 'fast']),
  ('Chill Vibes', 'music', 'casual', 'https://assets.mixkit.co/music/preview/mixkit-a-very-happy-christmas-897.mp3', 168, ARRAY['casual', 'chill', 'relaxed'])
ON CONFLICT DO NOTHING;

COMMENT ON TABLE public.media_library IS 'Library of reusable media assets (music, SFX, images, videos) for games and apps';
