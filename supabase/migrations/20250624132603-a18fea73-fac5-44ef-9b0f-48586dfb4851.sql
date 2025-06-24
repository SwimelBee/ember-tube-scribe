
-- Create a table to store YouTube videos with comprehensive metadata
CREATE TABLE public.youtube_videos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  video_id TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  duration TEXT,
  published_at TIMESTAMP WITH TIME ZONE,
  view_count BIGINT,
  like_count BIGINT,
  comment_count BIGINT,
  channel_id TEXT,
  channel_title TEXT,
  tags TEXT[],
  category_id TEXT,
  default_language TEXT,
  transcript TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add Row Level Security (RLS)
ALTER TABLE public.youtube_videos ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own videos" 
  ON public.youtube_videos 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own videos" 
  ON public.youtube_videos 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own videos" 
  ON public.youtube_videos 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own videos" 
  ON public.youtube_videos 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Create index for better performance
CREATE INDEX idx_youtube_videos_user_id ON public.youtube_videos(user_id);
CREATE INDEX idx_youtube_videos_channel_id ON public.youtube_videos(channel_id);
