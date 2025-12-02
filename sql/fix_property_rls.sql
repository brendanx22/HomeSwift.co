-- =============================================
-- FIX PROPERTY RLS POLICIES
-- Run this script to resolve "new row violates row-level security policy" errors
-- =============================================

-- 1. Ensure RLS is enabled
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

-- 2. Drop ALL existing insert policies to clear conflicts
DROP POLICY IF EXISTS "allow_authenticated_insert_properties" ON properties;
DROP POLICY IF EXISTS "insert_by_owner" ON properties;
DROP POLICY IF EXISTS "Landlords can insert their own properties" ON properties;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON properties;

-- 3. Create a clean, correct INSERT policy
-- This allows any authenticated user to insert a property 
-- AS LONG AS they set the landlord_id to their own user ID
CREATE POLICY "allow_authenticated_insert_properties"
ON properties FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = landlord_id);

-- 4. Ensure SELECT policies exist (so you can see what you created)
DROP POLICY IF EXISTS "allow_all_select_properties" ON properties;
DROP POLICY IF EXISTS "public_select" ON properties;

CREATE POLICY "allow_all_select_properties"
ON properties FOR SELECT
TO public
USING (true);

-- 5. Ensure UPDATE/DELETE policies exist
DROP POLICY IF EXISTS "allow_authenticated_update_properties" ON properties;
DROP POLICY IF EXISTS "update_by_owner" ON properties;

CREATE POLICY "allow_authenticated_update_properties"
ON properties FOR UPDATE
TO authenticated
USING (auth.uid() = landlord_id);

DROP POLICY IF EXISTS "allow_authenticated_delete_properties" ON properties;
DROP POLICY IF EXISTS "delete_by_owner" ON properties;

CREATE POLICY "allow_authenticated_delete_properties"
ON properties FOR DELETE
TO authenticated
USING (auth.uid() = landlord_id);

-- 6. Grant necessary permissions to the authenticated role
GRANT ALL ON properties TO authenticated;
GRANT ALL ON properties TO service_role;

-- 7. Verify the policies
SELECT 
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    with_check
FROM pg_policies
WHERE tablename = 'properties';
