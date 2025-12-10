-- Add immersive media columns to games table
-- This enables admin to add background sounds and video/image thumbnails

-- Add new columns for immersive media
ALTER TABLE games 
ADD COLUMN IF NOT EXISTS background_sound_url TEXT,
ADD COLUMN IF NOT EXISTS media_type VARCHAR(10) CHECK (media_type IN ('image', 'video', 'gif')) DEFAULT 'image',
ADD COLUMN IF NOT EXISTS media_url TEXT,
ADD COLUMN IF NOT EXISTS media_duration INTEGER DEFAULT 10; -- For videos, auto-trimmed to 10 seconds

-- Update existing games to have default media_type
UPDATE games 
SET media_type = 'image', 
    media_url = thumbnail_url 
WHERE media_type IS NULL AND thumbnail_url IS NOT NULL;

-- Add comments for clarity
COMMENT ON COLUMN games.background_sound_url IS 'URL to background sound that plays when game card is in view';
COMMENT ON COLUMN games.media_type IS 'Type of media: image, video, or gif';
COMMENT ON COLUMN games.media_url IS 'URL to the media file (image/video/gif)';
COMMENT ON COLUMN games.media_duration IS 'Duration in seconds for video media (auto-trimmed to 10s max)';

-- Create index for better performance when filtering by media type
CREATE INDEX IF NOT EXISTS idx_games_media_type ON games(media_type);

-- Verify the changes
SELECT 
    'Games table updated' as status,
    COUNT(*) as total_games,
    COUNT(background_sound_url) as games_with_sound,
    COUNT(CASE WHEN media_type = 'video' THEN 1 END) as video_games,
    COUNT(CASE WHEN media_type = 'image' THEN 1 END) as image_games,
    COUNT(CASE WHEN media_type = 'gif' THEN 1 END) as gif_games
FROM games;

SELECT 'Schema update complete! ✅' as result;