-- ============================================================================
-- PART 2: ENABLE RLS (Run this second)
-- ============================================================================

-- Enable RLS
ALTER TABLE public.media_library ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can view media library" ON public.media_library;
DROP POLICY IF EXISTS "Authenticated users can upload media" ON public.media_library;

-- Create policies
CREATE POLICY "Anyone can view media library"
  ON public.media_library FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can upload media"
  ON public.media_library FOR INSERT
  TO authenticated
  WITH CHECK (true);
