-- Audit and Fix RLS Policies for Renter Data Access

-- 1. Check existing policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename IN ('properties', 'saved_properties', 'user_profiles', 'inquiries');

-- 2. Fix PROPERTIES table policies (Critical for homepage)
-- Allow ANYONE to view properties (public read access)
DROP POLICY IF EXISTS "Properties are viewable by everyone" ON properties;
DROP POLICY IF EXISTS "public_select" ON properties;
DROP POLICY IF EXISTS "Enable read access for all users" ON properties;

CREATE POLICY "Properties are viewable by everyone" 
ON properties FOR SELECT 
USING (true);

-- 3. Fix SAVED_PROPERTIES policies
-- Allow users to view/manage ONLY their own saved properties
DROP POLICY IF EXISTS "users_can_view_own_saved_properties" ON saved_properties;
DROP POLICY IF EXISTS "users_can_insert_own_saved_properties" ON saved_properties;
DROP POLICY IF EXISTS "users_can_delete_own_saved_properties" ON saved_properties;

CREATE POLICY "users_can_view_own_saved_properties" 
ON saved_properties FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "users_can_insert_own_saved_properties" 
ON saved_properties FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_can_delete_own_saved_properties" 
ON saved_properties FOR DELETE 
USING (auth.uid() = user_id);

-- 4. Fix USER_PROFILES policies (Critical for navbar profile)
-- Allow users to view their own profile
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON user_profiles;

-- Allow users to see their own profile
CREATE POLICY "Users can view their own profile" 
ON user_profiles FOR SELECT 
USING (auth.uid() = id);

-- 5. Verify user exists in user_profiles
-- This query checks if the specific user has a profile
-- Replace 'USER_ID_HERE' with the actual ID if running manually
-- SELECT * FROM user_profiles WHERE id = 'USER_ID_HERE';
