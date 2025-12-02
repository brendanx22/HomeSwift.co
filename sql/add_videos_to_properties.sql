-- Add videos column to properties table
-- This allows storing video metadata (URL, thumbnail, duration, etc.)

ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS videos JSONB DEFAULT '[]'::jsonb;

-- Add comment for clarity
COMMENT ON COLUMN properties.videos IS 'Array of video objects with url, thumbnail, duration, size, etc.';

-- Example video object structure:
-- {
--   "url": "https://supabase.co/storage/v1/object/public/property-videos/userid/propertyid/video.mp4",
--   "thumbnail": "https://...",
--   "duration": 45,
--   "size": 5242880,
--   "filename": "property-tour.mp4"
-- }
