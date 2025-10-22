-- Quick migration to populate landlord avatars
-- Run this in your Supabase SQL Editor

-- Check current properties and their landlords
SELECT p.id, p.title, p.landlord_id, au.email, au.raw_user_meta_data->>'avatar_url' as avatar_url
FROM properties p
LEFT JOIN auth.users au ON p.landlord_id = au.id
WHERE p.landlord_id = 'c3074a53-a233-4642-95ab-1b8643bbd924'
LIMIT 5;

-- Update specific landlord's avatar (replace with actual landlord ID)
UPDATE properties
SET landlord_profile_image = COALESCE(
  (SELECT au.raw_user_meta_data->>'avatar_url'
   FROM auth.users au
   WHERE au.id = 'c3074a53-a233-4642-95ab-1b8643bbd924'),
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face'
)
WHERE landlord_id = 'c3074a53-a233-4642-95ab-1b8643bbd924';

-- Check what was updated
SELECT id, title, landlord_name, landlord_profile_image
FROM properties
WHERE landlord_id = 'c3074a53-a233-4642-95ab-1b8643bbd924';
