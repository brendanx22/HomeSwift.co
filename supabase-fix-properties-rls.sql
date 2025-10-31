-- Fix Row Level Security (RLS) policies for properties table
-- This allows users to view all properties

-- First, check if RLS is enabled (it should be)
-- If you want to disable RLS entirely (NOT RECOMMENDED for production):
-- ALTER TABLE properties DISABLE ROW LEVEL SECURITY;

-- Better approach: Add a policy to allow SELECT for everyone
-- Drop existing SELECT policy if it exists
DROP POLICY IF EXISTS "Allow public read access to properties" ON properties;
DROP POLICY IF EXISTS "Enable read access for all users" ON properties;
DROP POLICY IF EXISTS "Properties are viewable by everyone" ON properties;

-- Create a new policy that allows anyone (authenticated or not) to SELECT properties
CREATE POLICY "Properties are viewable by everyone"
ON properties
FOR SELECT
TO public
USING (true);

-- Optional: If you want only authenticated users to view properties, use this instead:
-- CREATE POLICY "Properties are viewable by authenticated users"
-- ON properties
-- FOR SELECT
-- TO authenticated
-- USING (true);

-- Optional: Add policies for INSERT, UPDATE, DELETE (only for landlords)
-- Allow landlords to insert their own properties
DROP POLICY IF EXISTS "Landlords can insert their own properties" ON properties;
CREATE POLICY "Landlords can insert their own properties"
ON properties
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = landlord_id);

-- Allow landlords to update their own properties
DROP POLICY IF EXISTS "Landlords can update their own properties" ON properties;
CREATE POLICY "Landlords can update their own properties"
ON properties
FOR UPDATE
TO authenticated
USING (auth.uid() = landlord_id)
WITH CHECK (auth.uid() = landlord_id);

-- Allow landlords to delete their own properties
DROP POLICY IF EXISTS "Landlords can delete their own properties" ON properties;
CREATE POLICY "Landlords can delete their own properties"
ON properties
FOR DELETE
TO authenticated
USING (auth.uid() = landlord_id);

-- Verify the policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'properties';

