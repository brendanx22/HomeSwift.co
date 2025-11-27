-- Optimize Properties Table Performance
-- This script adds indexes to speed up property queries, especially the getProperty() query
-- which joins properties with user_profiles

-- 1. Add index on properties.id (primary lookups)
CREATE INDEX IF NOT EXISTS idx_properties_id 
ON properties(id);

-- 2. Add index on properties.landlord_id (for JOIN with user_profiles)
CREATE INDEX IF NOT EXISTS idx_properties_landlord_id 
ON properties(landlord_id);

-- 3. Add index on user_profiles.id (for JOIN performance)
CREATE INDEX IF NOT EXISTS idx_user_profiles_id 
ON user_profiles(id);

-- 4. Add composite index for common filters
CREATE INDEX IF NOT EXISTS idx_properties_location_type 
ON properties(location, property_type);

-- 5. Add index for price range queries
CREATE INDEX IF NOT EXISTS idx_properties_price 
ON properties(price);

-- 6. Add index for bedroom/bathroom filters
CREATE INDEX IF NOT EXISTS idx_properties_beds_baths 
ON properties(bedrooms, bathrooms);

-- 7. Verify RLS policies aren't causing slowdowns
-- Check current policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'properties';

-- 8. Analyze tables to update statistics for query planner
ANALYZE properties;
ANALYZE user_profiles;

-- 9. Check for missing foreign key indexes
SELECT
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name = 'properties';

-- 10. Show current indexes on properties table
SELECT
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'properties'
ORDER BY indexname;

-- 11. Check table statistics
SELECT
    schemaname,
    relname as tablename,
    n_live_tup as row_count,
    n_dead_tup as dead_rows,
    last_vacuum,
    last_autovacuum,
    last_analyze,
    last_autoanalyze
FROM pg_stat_user_tables
WHERE relname IN ('properties', 'user_profiles');

-- 12. Optional: If queries are still slow, consider materialized view
-- (Uncomment if needed after testing above indexes)
/*
CREATE MATERIALIZED VIEW IF NOT EXISTS properties_with_landlords AS
SELECT 
    p.*,
    up.full_name as landlord_name,
    up.profile_image as landlord_profile_image
FROM properties p
LEFT JOIN user_profiles up ON p.landlord_id = up.id;

-- Create index on materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_properties_with_landlords_id 
ON properties_with_landlords(id);

-- Refresh the materialized view (run this after property updates)
REFRESH MATERIALIZED VIEW CONCURRENTLY properties_with_landlords;
*/
