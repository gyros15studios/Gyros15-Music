-- Create albums table
CREATE TABLE public.albums (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  image_url text,
  artist text NOT NULL DEFAULT 'Gyros15 Musics',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create tracks table
CREATE TABLE public.tracks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  album_id uuid REFERENCES public.albums(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  file_url text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.albums ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tracks ENABLE ROW LEVEL SECURITY;

-- Public read access for albums
CREATE POLICY "Anyone can view albums"
  ON public.albums
  FOR SELECT
  USING (true);

-- Public read access for tracks
CREATE POLICY "Anyone can view tracks"
  ON public.tracks
  FOR SELECT
  USING (true);

-- Allow anyone to insert albums (protected by code in UI)
CREATE POLICY "Anyone can insert albums"
  ON public.albums
  FOR INSERT
  WITH CHECK (true);

-- Allow anyone to insert tracks (protected by code in UI)
CREATE POLICY "Anyone can insert tracks"
  ON public.tracks
  FOR INSERT
  WITH CHECK (true);

-- Create storage bucket for album covers
INSERT INTO storage.buckets (id, name, public)
VALUES ('album-covers', 'album-covers', true);

-- Create storage bucket for music files
INSERT INTO storage.buckets (id, name, public)
VALUES ('music-files', 'music-files', true);

-- Storage policies for album covers
CREATE POLICY "Anyone can view album covers"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'album-covers');

CREATE POLICY "Anyone can upload album covers"
  ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'album-covers');

-- Storage policies for music files
CREATE POLICY "Anyone can view music files"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'music-files');

CREATE POLICY "Anyone can upload music files"
  ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'music-files');