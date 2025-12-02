-- Create Supabase Storage bucket for property videos
-- Run this in the Supabase SQL Editor

-- 1. Create the property-videos bucket (if it doesn't exist)
INSERT INTO storage.buckets (id, name, public)
VALUES ('property-videos', 'property-videos', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Allow authenticated users (landlords) to upload videos
CREATE POLICY "Landlords can upload property videos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'property-videos' AND
  auth.role() = 'authenticated'
);

-- 3. Allow public read access to videos
CREATE POLICY "Public can view property videos"
ON storage.objects FOR SELECT
USING (bucket_id = 'property-videos');

-- 4. Allow users to delete their own videos
CREATE POLICY "Users can delete own property videos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'property-videos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- 5. Allow users to update their own videos
CREATE POLICY "Users can update own property videos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'property-videos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
