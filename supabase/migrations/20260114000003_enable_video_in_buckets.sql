-- Enable video file types in storage buckets

-- Update game-assets bucket to allow video files
UPDATE storage.buckets
SET allowed_mime_types = ARRAY[
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'audio/mpeg',
  'audio/wav',
  'audio/ogg',
  'video/mp4',
  'video/webm',
  'video/ogg',
  'video/quicktime',
  'text/html',
  'application/octet-stream'
]
WHERE id = 'game-assets';

-- Update game-thumbnails bucket to allow video thumbnails
UPDATE storage.buckets
SET allowed_mime_types = ARRAY[
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'video/mp4',
  'video/webm'
]
WHERE id = 'game-thumbnails';

-- Increase file size limits
UPDATE storage.buckets
SET file_size_limit = 104857600  -- 100 MB
WHERE id = 'game-assets';

UPDATE storage.buckets
SET file_size_limit = 20971520  -- 20 MB
WHERE id = 'game-thumbnails';
