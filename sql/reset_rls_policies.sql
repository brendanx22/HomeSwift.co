-- Reset and Simplify RLS Policies for HomeSwift
-- This script removes complex policies and creates simple, permissive ones

-- =============================================
-- 1. SAVED_PROPERTIES TABLE
-- =============================================

-- Drop all existing policies
DROP POLICY IF EXISTS "users_can_view_own_saved_properties" ON saved_properties;
DROP POLICY IF EXISTS "users_can_insert_own_saved_properties" ON saved_properties;
DROP POLICY IF EXISTS "users_can_delete_own_saved_properties" ON saved_properties;

-- Create simple, permissive policies
CREATE POLICY "allow_authenticated_select_saved_properties"
ON saved_properties FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "allow_authenticated_insert_saved_properties"
ON saved_properties FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "allow_authenticated_delete_saved_properties"
ON saved_properties FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- =============================================
-- 2. PROPERTIES TABLE
-- =============================================

-- Drop all existing policies
DROP POLICY IF EXISTS "public_select" ON properties;
DROP POLICY IF EXISTS "insert_by_owner" ON properties;
DROP POLICY IF EXISTS "update_by_owner" ON properties;
DROP POLICY IF EXISTS "delete_by_owner" ON properties;
DROP POLICY IF EXISTS "Properties are viewable by everyone" ON properties;
DROP POLICY IF EXISTS "Landlords can insert their own properties" ON properties;
DROP POLICY IF EXISTS "Landlords can update their own properties" ON properties;
DROP POLICY IF EXISTS "Landlords can delete their own properties" ON properties;

-- Create simple, permissive policies
-- Allow EVERYONE (authenticated and anonymous) to view properties
CREATE POLICY "allow_all_select_properties"
ON properties FOR SELECT
TO public
USING (true);

-- Allow authenticated users to insert their own properties
CREATE POLICY "allow_authenticated_insert_properties"
ON properties FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = landlord_id);

-- Allow landlords to update their own properties
CREATE POLICY "allow_authenticated_update_properties"
ON properties FOR UPDATE
TO authenticated
USING (auth.uid() = landlord_id);

-- Allow landlords to delete their own properties
CREATE POLICY "allow_authenticated_delete_properties"
ON properties FOR DELETE
TO authenticated
USING (auth.uid() = landlord_id);

-- =============================================
-- 3. USER_PROFILES TABLE
-- =============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Allow email availability check" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;

-- Create simple policies
CREATE POLICY "allow_authenticated_select_own_profile"
ON user_profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "allow_public_select_profiles"
ON user_profiles FOR SELECT
TO public
USING (true);

CREATE POLICY "allow_authenticated_update_own_profile"
ON user_profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id);

-- =============================================
-- 4. VERIFY POLICIES
-- =============================================

-- Show all policies for saved_properties
SELECT 
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'saved_properties'
ORDER BY policyname;

-- Show all policies for properties
SELECT 
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'properties'
ORDER BY policyname;

-- Show all policies for user_profiles
SELECT 
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'user_profiles'
ORDER BY policyname;
