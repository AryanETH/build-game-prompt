-- Create user activities table for activity feed
CREATE TABLE IF NOT EXISTS public.user_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type text NOT NULL CHECK (activity_type IN ('game_published', 'game_creating', 'game_liked', 'user_followed')),
  game_id uuid REFERENCES public.games(id) ON DELETE CASCADE,
  target_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.user_activities ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view activities from people they follow
CREATE POLICY "Users can view activities from followed users"
ON public.user_activities
FOR SELECT
USING (
  user_id IN (
    SELECT following_id 
    FROM public.follows 
    WHERE follower_id = auth.uid()
  )
  OR user_id = auth.uid()
);

-- Policy: Users can insert their own activities
CREATE POLICY "Users can insert their own activities"
ON public.user_activities
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create index for performance
CREATE INDEX idx_user_activities_user_id ON public.user_activities(user_id);
CREATE INDEX idx_user_activities_created_at ON public.user_activities(created_at DESC);

-- Enable realtime for activities
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_activities;