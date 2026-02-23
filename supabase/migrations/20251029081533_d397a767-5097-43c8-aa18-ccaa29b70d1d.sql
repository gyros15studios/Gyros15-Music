-- Add available_from column to albums table
ALTER TABLE public.albums 
ADD COLUMN available_from timestamp with time zone DEFAULT now();