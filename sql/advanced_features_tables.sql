-- =============================================
-- HomeSwift Advanced Features Database Tables
-- =============================================

-- VR Property Tours Table
CREATE TABLE vr_property_tours (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  scenes jsonb NOT NULL DEFAULT '[]'::jsonb,
  thumbnail_url text,
  duration_minutes integer DEFAULT 5,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- AI Property Staging Table
CREATE TABLE ai_property_staging (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE,
  room_type text NOT NULL,
  design_style text NOT NULL,
  staging_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  total_cost numeric DEFAULT 0,
  is_active boolean DEFAULT true,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Blockchain Property Records Table
CREATE TABLE blockchain_property_records (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE,
  block_number bigint NOT NULL,
  transaction_hash text NOT NULL UNIQUE,
  owner_address text NOT NULL,
  owner_name text,
  previous_owner_address text,
  property_value numeric,
  document_hashes jsonb DEFAULT '[]'::jsonb,
  is_verified boolean DEFAULT true,
  verification_timestamp timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Investment Clubs Table
CREATE TABLE investment_clubs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  founder_id uuid REFERENCES auth.users(id),
  location text,
  min_investment numeric NOT NULL,
  target_members integer DEFAULT 50,
  current_members integer DEFAULT 1,
  total_assets numeric DEFAULT 0,
  performance_data jsonb DEFAULT '{}'::jsonb,
  requirements jsonb DEFAULT '{}'::jsonb,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Investment Club Memberships Table
CREATE TABLE investment_club_memberships (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  club_id uuid REFERENCES investment_clubs(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  investment_amount numeric NOT NULL,
  joined_date timestamptz DEFAULT now(),
  status text DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
  returns_earned numeric DEFAULT 0,
  UNIQUE(club_id, user_id)
);

-- Neighborhood Data Table
CREATE TABLE neighborhood_data (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  coordinates jsonb NOT NULL,
  safety_score numeric CHECK (safety_score >= 0 AND safety_score <= 10),
  school_rating numeric CHECK (school_rating >= 0 AND school_rating <= 10),
  amenities_score numeric CHECK (amenities_score >= 0 AND amenities_score <= 10),
  transport_score numeric CHECK (transport_score >= 0 AND transport_score <= 10),
  environment_score numeric CHECK (environment_score >= 0 AND environment_score <= 10),
  average_price numeric,
  population integer,
  description text,
  highlights jsonb DEFAULT '[]'::jsonb,
  points_of_interest jsonb DEFAULT '[]'::jsonb,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Property Insurance Quotes Table
CREATE TABLE property_insurance_quotes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id),
  provider_name text NOT NULL,
  annual_premium numeric NOT NULL,
  monthly_premium numeric NOT NULL,
  coverage_details jsonb NOT NULL,
  deductible numeric DEFAULT 1000,
  quote_data jsonb DEFAULT '{}'::jsonb,
  is_accepted boolean DEFAULT false,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Property Tax Records Table
CREATE TABLE property_tax_records (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE,
  tax_year integer NOT NULL,
  assessed_value numeric NOT NULL,
  tax_amount numeric NOT NULL,
  millage_rate numeric NOT NULL,
  exemptions jsonb DEFAULT '[]'::jsonb,
  payment_status text DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'overdue')),
  due_date date,
  paid_date timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Home Inspection Reports Table
CREATE TABLE home_inspection_reports (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE,
  inspector_id uuid REFERENCES auth.users(id),
  inspection_date date NOT NULL,
  report_data jsonb NOT NULL,
  overall_condition text CHECK (overall_condition IN ('excellent', 'good', 'fair', 'poor')),
  major_issues jsonb DEFAULT '[]'::jsonb,
  estimated_repair_cost numeric DEFAULT 0,
  is_completed boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Home Inspection Checklists Table
CREATE TABLE home_inspection_checklists (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id text NOT NULL,
  category_title text NOT NULL,
  category_icon text NOT NULL,
  category_description text,
  category_color text DEFAULT 'blue',
  item_id text NOT NULL,
  item_title text NOT NULL,
  item_description text NOT NULL,
  item_priority text CHECK (item_priority IN ('critical', 'high', 'medium', 'low')) DEFAULT 'medium',
  item_estimated_cost text,
  item_tips text,
  item_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(category_id, item_id)
);

-- User Inspection Progress Table
CREATE TABLE user_inspection_progress (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  checklist_item_id text NOT NULL,
  completed boolean DEFAULT false,
  notes text,
  photos jsonb DEFAULT '[]'::jsonb,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, checklist_item_id)
);

-- Enable Row Level Security on new tables
ALTER TABLE home_inspection_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_inspection_progress ENABLE ROW LEVEL SECURITY;

-- Row Level Security Policies for new tables
-- Home Inspection Checklists (public read access for active items)
CREATE POLICY "public_can_view_active_checklists" ON home_inspection_checklists FOR SELECT USING (is_active = true);
CREATE POLICY "authenticated_can_create_checklists" ON home_inspection_checklists FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- User Inspection Progress (users can only see/modify their own progress)
CREATE POLICY "users_can_view_own_progress" ON user_inspection_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "users_can_create_own_progress" ON user_inspection_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users_can_update_own_progress" ON user_inspection_progress FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "users_can_delete_own_progress" ON user_inspection_progress FOR DELETE USING (auth.uid() = user_id);

-- Row Level Security Policies for new tables
-- VR Property Tours
CREATE POLICY "public_can_view_vr_tours" ON vr_property_tours FOR SELECT USING (true);
CREATE POLICY "authenticated_can_create_vr_tours" ON vr_property_tours FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "owners_can_update_vr_tours" ON vr_property_tours FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "owners_can_delete_vr_tours" ON vr_property_tours FOR DELETE USING (auth.uid() IS NOT NULL);

-- AI Property Staging
CREATE POLICY "public_can_view_staging" ON ai_property_staging FOR SELECT USING (true);
CREATE POLICY "authenticated_can_create_staging" ON ai_property_staging FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "creators_can_update_staging" ON ai_property_staging FOR UPDATE USING (auth.uid() = created_by);

-- Blockchain Property Records
CREATE POLICY "public_can_view_blockchain_records" ON blockchain_property_records FOR SELECT USING (true);
CREATE POLICY "authenticated_can_create_records" ON blockchain_property_records FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Investment Clubs
CREATE POLICY "public_can_view_clubs" ON investment_clubs FOR SELECT USING (true);
CREATE POLICY "authenticated_can_create_clubs" ON investment_clubs FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "founders_can_update_clubs" ON investment_clubs FOR UPDATE USING (auth.uid() = founder_id);

-- Investment Club Memberships
CREATE POLICY "members_can_view_own_memberships" ON investment_club_memberships FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "authenticated_can_join_clubs" ON investment_club_memberships FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "members_can_update_own_memberships" ON investment_club_memberships FOR UPDATE USING (auth.uid() = user_id);

-- Neighborhood Data
CREATE POLICY "public_can_view_neighborhoods" ON neighborhood_data FOR SELECT USING (true);
CREATE POLICY "authenticated_can_create_neighborhoods" ON neighborhood_data FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Property Insurance Quotes
CREATE POLICY "users_can_view_own_quotes" ON property_insurance_quotes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "authenticated_can_create_quotes" ON property_insurance_quotes FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Property Tax Records
CREATE POLICY "public_can_view_tax_records" ON property_tax_records FOR SELECT USING (true);
CREATE POLICY "authenticated_can_create_tax_records" ON property_tax_records FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Home Inspection Reports
CREATE POLICY "inspectors_can_view_own_reports" ON home_inspection_reports FOR SELECT USING (auth.uid() = inspector_id);
CREATE POLICY "authenticated_can_create_reports" ON home_inspection_reports FOR INSERT WITH CHECK (auth.uid() = inspector_id);

-- Property Valuations
CREATE POLICY "public_can_view_valuations" ON property_valuations FOR SELECT USING (true);
CREATE POLICY "authenticated_can_create_valuations" ON property_valuations FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Create indexes for better performance
CREATE INDEX idx_vr_tours_property_id ON vr_property_tours(property_id);
CREATE INDEX idx_staging_property_id ON ai_property_staging(property_id);
CREATE INDEX idx_blockchain_property_id ON blockchain_property_records(property_id);
CREATE INDEX idx_clubs_founder_id ON investment_clubs(founder_id);
CREATE INDEX idx_memberships_club_id ON investment_club_memberships(club_id);
CREATE INDEX idx_memberships_user_id ON investment_club_memberships(user_id);
CREATE INDEX idx_insurance_quotes_property_id ON property_insurance_quotes(property_id);
CREATE INDEX idx_tax_records_property_id ON property_tax_records(property_id);
CREATE INDEX idx_inspection_reports_property_id ON home_inspection_reports(property_id);
CREATE INDEX idx_valuations_property_id ON property_valuations(property_id);
CREATE INDEX idx_checklists_category_id ON home_inspection_checklists(category_id);
CREATE INDEX idx_user_progress_user_id ON user_inspection_progress(user_id);
CREATE INDEX idx_user_progress_item_id ON user_inspection_progress(checklist_item_id);

-- Add updated_at triggers for all tables
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_vr_property_tours_updated_at BEFORE UPDATE ON vr_property_tours FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_ai_property_staging_updated_at BEFORE UPDATE ON ai_property_staging FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_blockchain_property_records_updated_at BEFORE UPDATE ON blockchain_property_records FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_investment_clubs_updated_at BEFORE UPDATE ON investment_clubs FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_neighborhood_data_updated_at BEFORE UPDATE ON neighborhood_data FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_property_tax_records_updated_at BEFORE UPDATE ON property_tax_records FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_home_inspection_reports_updated_at BEFORE UPDATE ON home_inspection_reports FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_property_valuations_updated_at BEFORE UPDATE ON property_valuations FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_home_inspection_checklists_updated_at BEFORE UPDATE ON home_inspection_checklists FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_user_inspection_progress_updated_at BEFORE UPDATE ON user_inspection_progress FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
