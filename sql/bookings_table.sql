-- =============================================
-- BOOKINGS TABLE MIGRATION
-- Adds comprehensive booking system to HomeSwift
-- =============================================

-- Create bookings table for storing rental/property booking inquiries
CREATE TABLE IF NOT EXISTS bookings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_name text NOT NULL,
  tenant_email text NOT NULL,
  tenant_phone text NOT NULL,

  -- Property information
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE,
  property_title text NOT NULL,
  property_location text NOT NULL,
  property_price numeric DEFAULT 0,
  property_bedrooms integer DEFAULT 0,
  property_bathrooms integer DEFAULT 0,
  landlord_id uuid REFERENCES auth.users(id),
  landlord_name text NOT NULL,

  -- Booking details
  move_in_date date NOT NULL,
  lease_duration integer NOT NULL CHECK (lease_duration > 0),
  special_requests text,
  movemate_enabled boolean DEFAULT false,
  total_amount numeric DEFAULT 0,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed', 'cancelled')),

  -- Metadata
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_bookings_tenant_id ON bookings(tenant_id);
CREATE INDEX IF NOT EXISTS idx_bookings_property_id ON bookings(property_id);
CREATE INDEX IF NOT EXISTS idx_bookings_landlord_id ON bookings(landlord_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON bookings(created_at);

-- Enable Row Level Security
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for bookings table

-- Tenants can view their own bookings
CREATE POLICY "tenants_can_view_own_bookings"
  ON bookings FOR SELECT
  USING (auth.uid() = tenant_id);

-- Tenants can create their own bookings
CREATE POLICY "tenants_can_create_bookings"
  ON bookings FOR INSERT
  WITH CHECK (auth.uid() = tenant_id);

-- Tenants can update their own pending bookings
CREATE POLICY "tenants_can_update_own_pending_bookings"
  ON bookings FOR UPDATE
  USING (auth.uid() = tenant_id AND status = 'pending');

-- Landlords can view bookings for their properties
CREATE POLICY "landlords_can_view_property_bookings"
  ON bookings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = bookings.property_id
      AND properties.landlord_id = auth.uid()
    )
  );

-- Landlords can update booking status for their properties
CREATE POLICY "landlords_can_update_booking_status"
  ON bookings FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = bookings.property_id
      AND properties.landlord_id = auth.uid()
    )
  );

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply the trigger to bookings table
CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- BOOKINGS TABLE SETUP COMPLETE
-- =============================================

-- Sample data for testing (optional - remove in production)
-- INSERT INTO bookings (
--   tenant_id, tenant_name, tenant_email, tenant_phone,
--   property_id, property_title, property_location, property_price,
--   landlord_id, landlord_name, move_in_date, lease_duration,
--   total_amount, status
-- ) VALUES (
--   'user-uuid-here', 'John Doe', 'john@example.com', '+2348012345678',
--   'property-uuid-here', '2 Bedroom Apartment', 'Lagos', 1500000,
--   'landlord-uuid-here', 'Jane Smith', '2024-01-15', 12,
--   1500000, 'pending'
-- );

COMMENT ON TABLE bookings IS 'Stores comprehensive booking/rental inquiries with user and property details';
COMMENT ON COLUMN bookings.movemate_enabled IS 'Whether the tenant requested MoveMate assistance';
COMMENT ON COLUMN bookings.special_requests IS 'Additional requirements or questions from tenant';
COMMENT ON COLUMN bookings.lease_duration IS 'Lease duration in months';
