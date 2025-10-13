-- Sample Properties Data for HomeSwift Testing
-- This script adds sample properties to test the application

-- Insert sample properties
INSERT INTO public.properties (
  landlord_id,
  title,
  description,
  price,
  property_type,
  bedrooms,
  bathrooms,
  area,
  location,
  amenities,
  images,
  is_featured,
  is_active,
  created_at,
  updated_at
) VALUES
-- Property 1: Luxury Apartment in Lagos
(
  (SELECT id FROM auth.users WHERE email = 'brendannwanze@gmail.com' LIMIT 1),
  'Luxury 3-Bedroom Apartment in Victoria Island',
  'Beautiful modern apartment with stunning city views, fully furnished with premium amenities. Features include a spacious living room, modern kitchen, and access to gym and pool facilities.',
  2500000,
  'apartment',
  3,
  2,
  1800,
  '{"city": "Lagos", "state": "Lagos", "country": "Nigeria", "coordinates": {"lat": 6.4474, "lng": 3.3903}}',
  '["gym", "pool", "parking", "security", "elevator", "balcony", "air_conditioning"]',
  '["https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80", "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80"]',
  true,
  true,
  NOW(),
  NOW()
),

-- Property 2: Family House in Abuja
(
  (SELECT id FROM auth.users WHERE email = 'brendannwanze@gmail.com' LIMIT 1),
  'Spacious 4-Bedroom Detached House in Maitama',
  'Elegant family home in a quiet neighborhood. Perfect for families with children, featuring a large garden, home office, and modern amenities throughout.',
  4500000,
  'house',
  4,
  3,
  3000,
  '{"city": "Abuja", "state": "FCT", "country": "Nigeria", "coordinates": {"lat": 9.0765, "lng": 8.6753}}',
  '["garden", "garage", "security", "generator", "borehole", "study", "laundry"]',
  '["https://images.unsplash.com/photo-1570129477492-45c003edd2be?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80", "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80"]',
  false,
  true,
  NOW(),
  NOW()
),

-- Property 3: Studio Apartment in Lekki
(
  (SELECT id FROM auth.users WHERE email = 'nwanzebrendan@gmail.com' LIMIT 1),
  'Modern Studio Apartment in Lekki Phase 1',
  'Perfect for young professionals or students. Compact yet comfortable space with modern amenities and easy access to shopping and entertainment.',
  800000,
  'apartment',
  1,
  1,
  600,
  '{"city": "Lagos", "state": "Lagos", "country": "Nigeria", "coordinates": {"lat": 6.4698, "lng": 3.5852}}',
  '["gym", "parking", "security", "internet", "laundry", "concierge"]',
  '["https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80", "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80"]',
  true,
  true,
  NOW(),
  NOW()
),

-- Property 4: Townhouse in Port Harcourt
(
  (SELECT id FROM auth.users WHERE email = 'nwanzebrendan@gmail.com' LIMIT 1),
  'Elegant 3-Bedroom Townhouse in GRA',
  'Beautiful townhouse in a gated community. Features modern architecture, private garden, and access to community facilities.',
  3200000,
  'townhouse',
  3,
  2,
  2200,
  '{"city": "Port Harcourt", "state": "Rivers", "country": "Nigeria", "coordinates": {"lat": 4.8156, "lng": 7.0498}}',
  '["garden", "garage", "security", "playground", "clubhouse", "gym"]',
  '["https://images.unsplash.com/photo-1449844908441-8829872d2607?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80", "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80"]',
  false,
  true,
  NOW(),
  NOW()
),

-- Property 5: Penthouse in Ikoyi
(
  (SELECT id FROM auth.users WHERE email = 'brendannwanze@gmail.com' LIMIT 1),
  'Luxury Penthouse with Ocean Views',
  'Exclusive penthouse apartment with panoramic ocean views. Features premium finishes, private terrace, and concierge services.',
  8000000,
  'penthouse',
  4,
  3,
  3500,
  '{"city": "Lagos", "state": "Lagos", "country": "Nigeria", "coordinates": {"lat": 6.4474, "lng": 3.3903}}',
  '["ocean_view", "terrace", "concierge", "valet", "spa", "rooftop", "wine_cellar"]',
  '["https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80", "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80"]',
  true,
  true,
  NOW(),
  NOW()
),

-- Property 6: Bungalow in Enugu
(
  (SELECT id FROM auth.users WHERE email = 'nwanzebrendan@gmail.com' LIMIT 1),
  'Charming 2-Bedroom Bungalow in Independence Layout',
  'Cozy bungalow perfect for a small family or couple. Features a beautiful garden, quiet neighborhood, and easy access to amenities.',
  1500000,
  'bungalow',
  2,
  2,
  1400,
  '{"city": "Enugu", "state": "Enugu", "country": "Nigeria", "coordinates": {"lat": 6.4474, "lng": 7.4943}}',
  '["garden", "parking", "security", "borehole", "generator"]',
  '["https://images.unsplash.com/photo-1449824913935-59a10b8d2000?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80", "https://images.unsplash.com/photo-1518780664697-55e3ad937233?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80"]',
  false,
  true,
  NOW(),
  NOW()
),

-- Property 7: Duplex in Kano
(
  (SELECT id FROM auth.users WHERE email = 'brendannwanze@gmail.com' LIMIT 1),
  'Modern 4-Bedroom Duplex in Nassarawa GRA',
  'Spacious duplex with contemporary design. Features include a large compound, boys quarters, and premium security.',
  3500000,
  'duplex',
  4,
  3,
  2800,
  '{"city": "Kano", "state": "Kano", "country": "Nigeria", "coordinates": {"lat": 12.0022, "lng": 8.5919}}',
  '["compound", "boys_quarters", "security", "generator", "borehole", "garden"]',
  '["https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80", "https://images.unsplash.com/photo-1600607687644-aac4c3eac7f4?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80"]',
  false,
  true,
  NOW(),
  NOW()
),

-- Property 8: Apartment in Ibadan
(
  (SELECT id FROM auth.users WHERE email = 'nwanzebrendan@gmail.com' LIMIT 1),
  'Affordable 2-Bedroom Apartment in Bodija',
  'Budget-friendly apartment in a convenient location. Close to markets, schools, and public transport.',
  600000,
  'apartment',
  2,
  1,
  900,
  '{"city": "Ibadan", "state": "Oyo", "country": "Nigeria", "coordinates": {"lat": 7.3775, "lng": 3.9470}}',
  '["parking", "security", "market", "transport"]',
  '["https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80", "https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80"]',
  false,
  true,
  NOW(),
  NOW()
);

-- Update user roles to ensure they have landlord role for testing
-- (This assumes the users already exist from previous migrations)
UPDATE public.user_roles
SET is_primary = true
WHERE user_id IN (SELECT id FROM auth.users WHERE email IN ('brendannwanze@gmail.com', 'nwanzebrendan@gmail.com'))
AND role = 'landlord';

-- Insert some sample saved properties for testing
INSERT INTO public.saved_properties (user_id, property_id)
SELECT
  u.id,
  p.id
FROM auth.users u
CROSS JOIN public.properties p
WHERE u.email = 'brendannwanze@gmail.com'
AND p.title LIKE '%Luxury%'  -- Save luxury properties for testing
LIMIT 2;

-- Add some inquiries for testing
INSERT INTO public.inquiries (property_id, renter_id, message, contact_info)
SELECT
  p.id,
  u.id,
  'I am very interested in this property. Could you please provide more details about the amenities and availability?',
  '{"email": "' || u.email || '", "phone": "+2348012345678"}'
FROM public.properties p
CROSS JOIN auth.users u
WHERE u.email = 'brendannwanze@gmail.com'
AND p.title LIKE '%Apartment%'
LIMIT 3;
