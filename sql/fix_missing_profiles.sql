-- =============================================
-- FIX MISSING USER PROFILES
-- Run this to backfill any users missing from user_profiles
-- =============================================

-- 1. Insert missing profiles from auth.users
INSERT INTO public.user_profiles (id, email, full_name, user_type)
SELECT 
    id, 
    email, 
    COALESCE(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name', email) as full_name,
    COALESCE(raw_user_meta_data->>'user_type', 'renter') as user_type
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.user_profiles)
ON CONFLICT (id) DO NOTHING;

-- 2. Verify the fix
SELECT count(*) as profiles_created FROM public.user_profiles;

-- 3. Check specific user (optional - replace with your ID if needed)
-- SELECT * FROM public.user_profiles WHERE id = auth.uid();
