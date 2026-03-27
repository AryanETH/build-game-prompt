-- ============================================================================
-- PART 3: INSERT SAMPLE DATA (Run this third)
-- ============================================================================

-- Clear existing sample data
DELETE FROM public.media_library WHERE url LIKE '%mixkit%';

-- Insert SFX (8 essential sounds)
INSERT INTO public.media_library (name, type, category, url, format, tags) VALUES
  ('Jump', 'sfx', 'action', 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3', 'mp3', ARRAY['jump', 'hop']),
  ('Coin', 'sfx', 'collect', 'https://assets.mixkit.co/active_storage/sfx/1993/1993-preview.mp3', 'mp3', ARRAY['coin', 'collect']),
  ('Power Up', 'sfx', 'powerup', 'https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3', 'mp3', ARRAY['powerup', 'boost']),
  ('Hit', 'sfx', 'action', 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3', 'mp3', ARRAY['hit', 'damage']),
  ('Win', 'sfx', 'success', 'https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3', 'mp3', ARRAY['win', 'victory']),
  ('Lose', 'sfx', 'fail', 'https://assets.mixkit.co/active_storage/sfx/1006/1006-preview.mp3', 'mp3', ARRAY['lose', 'gameover']),
  ('Click', 'sfx', 'ui', 'https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3', 'mp3', ARRAY['click', 'button']),
  ('Whoosh', 'sfx', 'transition', 'https://assets.mixkit.co/active_storage/sfx/2577/2577-preview.mp3', 'mp3', ARRAY['whoosh', 'swipe']);

-- Insert Music (4 tracks)
INSERT INTO public.media_library (name, type, category, url, duration, format, tags) VALUES
  ('Arcade', 'music', 'arcade', 'https://assets.mixkit.co/music/preview/mixkit-tech-house-vibes-130.mp3', 146, 'mp3', ARRAY['arcade', 'upbeat']),
  ('Puzzle', 'music', 'puzzle', 'https://assets.mixkit.co/music/preview/mixkit-dreaming-big-31.mp3', 134, 'mp3', ARRAY['puzzle', 'calm']),
  ('Action', 'music', 'action', 'https://assets.mixkit.co/music/preview/mixkit-games-worldbeat-466.mp3', 120, 'mp3', ARRAY['action', 'intense']),
  ('Chill', 'music', 'casual', 'https://assets.mixkit.co/music/preview/mixkit-a-very-happy-christmas-897.mp3', 168, 'mp3', ARRAY['casual', 'chill']);
