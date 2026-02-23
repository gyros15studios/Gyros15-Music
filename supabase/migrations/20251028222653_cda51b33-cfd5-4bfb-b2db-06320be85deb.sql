-- Add UPDATE and DELETE policies for albums
CREATE POLICY "Anyone can update albums"
ON public.albums
FOR UPDATE
USING (true)
WITH CHECK (true);

CREATE POLICY "Anyone can delete albums"
ON public.albums
FOR DELETE
USING (true);

-- Add UPDATE and DELETE policies for tracks
CREATE POLICY "Anyone can update tracks"
ON public.tracks
FOR UPDATE
USING (true)
WITH CHECK (true);

CREATE POLICY "Anyone can delete tracks"
ON public.tracks
FOR DELETE
USING (true);

-- Add UPDATE and DELETE policies for storage (album-covers bucket)
CREATE POLICY "Anyone can update album covers"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'album-covers');

CREATE POLICY "Anyone can delete album covers"
ON storage.objects
FOR DELETE
USING (bucket_id = 'album-covers');

-- Add UPDATE and DELETE policies for storage (music-files bucket)
CREATE POLICY "Anyone can update music files"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'music-files');

CREATE POLICY "Anyone can delete music files"
ON storage.objects
FOR DELETE
USING (bucket_id = 'music-files');