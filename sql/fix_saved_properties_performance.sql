-- Fix Performance Issues with Saved Properties Table
-- This script adds indexes and optimizes RLS policies

-- 1. Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_saved_properties_user_id 
ON saved_properties(user_id);

-- 2. Create index on property_id for faster joins
CREATE INDEX IF NOT EXISTS idx_saved_properties_property_id 
ON saved_properties(property_id);

-- 3. Create composite index for the most common query pattern
CREATE INDEX IF NOT EXISTS idx_saved_properties_user_property 
ON saved_properties(user_id, property_id);

-- 4. Drop and recreate RLS policies with optimized queries
DROP POLICY IF EXISTS "users_can_view_own_saved_properties" ON saved_properties;
DROP POLICY IF EXISTS "users_can_insert_own_saved_properties" ON saved_properties;
DROP POLICY IF EXISTS "users_can_delete_own_saved_properties" ON saved_properties;

-- Create optimized RLS policies
CREATE POLICY "users_can_view_own_saved_properties" 
ON saved_properties 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "users_can_insert_own_saved_properties" 
ON saved_properties 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_can_delete_own_saved_properties" 
ON saved_properties 
FOR DELETE 
USING (auth.uid() = user_id);

-- 5. Ensure the properties table has proper indexes as well
CREATE INDEX IF NOT EXISTS idx_properties_id 
ON properties(id);

CREATE INDEX IF NOT EXISTS idx_properties_landlord_id 
ON properties(landlord_id);

-- 6. Verify the policies are working
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'saved_properties';

-- 7. Check index creation
SELECT 
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename IN ('saved_properties', 'properties')
ORDER BY tablename, indexname;
