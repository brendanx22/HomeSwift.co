-- =============================================
-- Add landlord information columns to properties table
-- This migration adds landlord_name and landlord_profile_image columns
-- =============================================

-- Add landlord_name column
ALTER TABLE properties
ADD COLUMN IF NOT EXISTS landlord_name text;

-- Add landlord_profile_image column
ALTER TABLE properties
ADD COLUMN IF NOT EXISTS landlord_profile_image text;

-- Add comments for documentation
COMMENT ON COLUMN properties.landlord_name IS 'Stores the landlord name directly with the property for faster access';
COMMENT ON COLUMN properties.landlord_profile_image IS 'Stores the landlord profile image URL directly with the property';

-- Update existing properties with landlord information from user_profiles or auth.users
-- This is a best-effort update - some properties may not have complete landlord info

-- Update properties with landlord info from user_profiles table (if it exists)
DO $$
BEGIN
  -- Check if user_profiles table exists and has the required columns
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles'
    AND column_name IN ('full_name')
  ) THEN
    -- Update properties with landlord info from user_profiles
    UPDATE properties
    SET
      landlord_name = COALESCE(
        up.full_name,
        SPLIT_PART(au.email, '@', 1),
        'Property Owner'
      ),
      landlord_profile_image = COALESCE(
        au.raw_user_meta_data->>'avatar_url',
        'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face'
      )
    FROM user_profiles up
    JOIN auth.users au ON up.id = au.id
    WHERE properties.landlord_id = up.id
    AND (properties.landlord_name IS NULL OR properties.landlord_profile_image IS NULL);

    RAISE NOTICE 'Updated % properties with landlord info from user_profiles', FOUND;
  END IF;
END $$;

-- Update remaining properties with landlord info from auth.users metadata
UPDATE properties
SET
  landlord_name = COALESCE(
    au.raw_user_meta_data->>'full_name',
    au.raw_user_meta_data->>'name',
    SPLIT_PART(au.email, '@', 1),
    'Property Owner'
  ),
  landlord_profile_image = COALESCE(
    au.raw_user_meta_data->>'avatar_url',
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face'
  )
FROM auth.users au
WHERE properties.landlord_id = au.id
AND (properties.landlord_name IS NULL OR properties.landlord_profile_image IS NULL);

-- Set default values for any remaining properties without landlord info
UPDATE properties
SET
  landlord_name = 'Property Owner',
  landlord_profile_image = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face'
WHERE landlord_name IS NULL OR landlord_profile_image IS NULL;

-- Update properties table policies to allow updates to the new columns
-- (The existing policies should already allow this since they use auth.uid() = landlord_id)

-- Add indexes for better performance on the new columns
CREATE INDEX IF NOT EXISTS idx_properties_landlord_name ON properties(landlord_name);
CREATE INDEX IF NOT EXISTS idx_properties_landlord_id_name ON properties(landlord_id, landlord_name);

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'Migration completed successfully!';
  RAISE NOTICE 'Added landlord_name and landlord_profile_image columns to properties table';
  RAISE NOTICE 'Updated all existing properties with landlord information';
END $$;
