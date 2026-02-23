-- Create playlists table for authenticated users
CREATE TABLE public.playlists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create playlist_tracks junction table
CREATE TABLE public.playlist_tracks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  playlist_id UUID NOT NULL REFERENCES public.playlists(id) ON DELETE CASCADE,
  track_id UUID NOT NULL REFERENCES public.tracks(id) ON DELETE CASCADE,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(playlist_id, track_id)
);

-- Enable RLS
ALTER TABLE public.playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playlist_tracks ENABLE ROW LEVEL SECURITY;

-- RLS policies for playlists
CREATE POLICY "Users can view their own playlists"
ON public.playlists
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own playlists"
ON public.playlists
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own playlists"
ON public.playlists
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own playlists"
ON public.playlists
FOR DELETE
USING (auth.uid() = user_id);

-- RLS policies for playlist_tracks (based on playlist ownership)
CREATE POLICY "Users can view their playlist tracks"
ON public.playlist_tracks
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.playlists 
    WHERE id = playlist_tracks.playlist_id 
    AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can add tracks to their playlists"
ON public.playlist_tracks
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.playlists 
    WHERE id = playlist_tracks.playlist_id 
    AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their playlist tracks"
ON public.playlist_tracks
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.playlists 
    WHERE id = playlist_tracks.playlist_id 
    AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can remove tracks from their playlists"
ON public.playlist_tracks
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.playlists 
    WHERE id = playlist_tracks.playlist_id 
    AND user_id = auth.uid()
  )
);