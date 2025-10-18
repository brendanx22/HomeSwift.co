-- =============================================
-- HomeSwift Database Reset & Setup Script
-- Run this if you have existing conflicting tables
-- =============================================

-- Drop existing tables (if they exist) to avoid conflicts
DROP TABLE IF EXISTS user_roles CASCADE;
DROP TABLE IF EXISTS saved_properties CASCADE;
DROP TABLE IF EXISTS search_history CASCADE;
DROP TABLE IF EXISTS inquiries CASCADE;
DROP TABLE IF EXISTS properties CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;

-- Drop existing functions and triggers
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================
-- 1. USER PROFILES TABLE
-- =============================================

CREATE TABLE user_profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email text NOT NULL,
  full_name text NOT NULL,
  user_type text NOT NULL CHECK (user_type IN ('landlord', 'renter')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security on user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Users can view their own profile
CREATE POLICY "Users can view their own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = id);

-- Allow checking email availability for signup (unauthenticated users)
CREATE POLICY "Allow email availability check"
  ON user_profiles FOR SELECT
  USING (true);

-- Users can update their own profile
CREATE POLICY "Users can update their own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = id);

-- =============================================
-- 2. PROPERTIES TABLE
-- =============================================

CREATE TABLE properties (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text,
  price numeric,
  location text,
  images text[],
  landlord_id uuid REFERENCES auth.users(id),
  bedrooms integer,
  bathrooms integer,
  area numeric,
  property_type text,
  listing_type text DEFAULT 'for-rent' CHECK (listing_type IN ('for-rent', 'for-sale')),
  amenities jsonb DEFAULT '[]'::jsonb,
  rooms integer DEFAULT 1,
  is_featured boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- =============================================
-- 3. INQUIRIES TABLE
-- =============================================

CREATE TABLE inquiries (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  renter_id uuid REFERENCES auth.users(id),
  landlord_id uuid REFERENCES auth.users(id),
  property_id uuid REFERENCES properties(id),
  message text,
  created_at timestamptz DEFAULT now()
);

-- =============================================
-- 4. SEARCH HISTORY TABLE
-- =============================================

CREATE TABLE search_history (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id),
  query text NOT NULL,
  search_data jsonb,
  created_at timestamptz DEFAULT now()
);

-- =============================================
-- 5.5. PROPERTY VIEWS TABLE
-- =============================================

CREATE TABLE property_views (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE,
  viewer_id uuid REFERENCES auth.users(id),
  viewed_at timestamptz DEFAULT now(),
  UNIQUE(property_id, viewer_id)
);

-- Property views table policies
ALTER TABLE property_views ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_can_insert_own_property_views" ON property_views FOR INSERT WITH CHECK (auth.uid() = viewer_id);
CREATE POLICY "landlords_can_view_property_views" ON property_views FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM properties 
    WHERE properties.id = property_views.property_id 
    AND properties.landlord_id = auth.uid()
  )
);
CREATE POLICY "users_can_view_own_property_views" ON property_views FOR SELECT USING (auth.uid() = viewer_id);

-- =============================================
-- 6. SAVED PROPERTIES TABLE
-- =============================================

CREATE TABLE saved_properties (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id),
  property_id uuid REFERENCES properties(id),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, property_id)
);

-- =============================================
-- 6. USER ROLES TABLE
-- =============================================

CREATE TABLE user_roles (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id),
  role text NOT NULL CHECK (role IN ('renter', 'landlord')),
  is_primary boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- =============================================
-- 7. AUTOMATIC PROFILE CREATION TRIGGER
-- =============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name, user_type)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'user_type'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signups
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- =============================================
-- 8. ROW LEVEL SECURITY POLICIES
-- =============================================

-- Properties table policies
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_select" ON properties FOR SELECT USING (true);
CREATE POLICY "insert_by_owner" ON properties FOR INSERT WITH CHECK (auth.uid() = landlord_id);
CREATE POLICY "update_by_owner" ON properties FOR UPDATE USING (auth.uid() = landlord_id);
CREATE POLICY "delete_by_owner" ON properties FOR DELETE USING (auth.uid() = landlord_id);

-- Inquiries table policies
ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "insert_inquiry" ON inquiries FOR INSERT WITH CHECK (auth.uid() = renter_id);
CREATE POLICY "select_inquiry_participant" ON inquiries FOR SELECT USING (auth.uid() = renter_id OR auth.uid() = landlord_id);

-- Search history table policies
ALTER TABLE search_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_can_view_own_search_history" ON search_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "users_can_insert_own_search_history" ON search_history FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Saved properties table policies
ALTER TABLE saved_properties ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_can_view_own_saved_properties" ON saved_properties FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "users_can_insert_own_saved_properties" ON saved_properties FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users_can_delete_own_saved_properties" ON saved_properties FOR DELETE USING (auth.uid() = user_id);

-- User roles table policies
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_can_view_own_roles" ON user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "users_can_insert_own_roles" ON user_roles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users_can_update_own_roles" ON user_roles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "users_can_delete_own_roles" ON user_roles FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- SETUP COMPLETE - SUCCESS!
-- =============================================
