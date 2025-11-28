-- Add latitude and longitude columns to properties table if they don't exist

-- Check if columns exist and add them
DO $$
BEGIN
    -- Add latitude column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'properties' 
        AND column_name = 'latitude'
    ) THEN
        ALTER TABLE properties ADD COLUMN latitude DECIMAL(10, 8);
        RAISE NOTICE 'Added latitude column';
    ELSE
        RAISE NOTICE 'latitude column already exists';
    END IF;

    -- Add longitude column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'properties' 
        AND column_name = 'longitude'
    ) THEN
        ALTER TABLE properties ADD COLUMN longitude DECIMAL(11, 8);
        RAISE NOTICE 'Added longitude column';
    ELSE
        RAISE NOTICE 'longitude column already exists';
    END IF;
END
$$;

-- Create index for geospatial queries (optional but recommended)
CREATE INDEX IF NOT EXISTS idx_properties_location ON properties(latitude, longitude);

-- Verify columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'properties' 
AND column_name IN ('latitude', 'longitude');
