-- Property Reviews System
-- This schema supports a complete review system for properties

-- Create property_reviews table
CREATE TABLE IF NOT EXISTS property_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT NOT NULL,
  comment TEXT NOT NULL,
  pros TEXT,
  cons TEXT,
  recommend BOOLEAN DEFAULT true,
  verified BOOLEAN DEFAULT false,
  helpful_votes INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(property_id, user_id) -- One review per user per property
);

-- Create review_helpful_votes table (track who voted helpful on each review)
CREATE TABLE IF NOT EXISTS review_helpful_votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  review_id UUID NOT NULL REFERENCES property_reviews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(review_id, user_id) -- One vote per user per review
);

-- Add columns if they don't exist (for existing tables)
DO $$ 
BEGIN
  -- Add verified column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'property_reviews' AND column_name = 'verified'
  ) THEN
    ALTER TABLE property_reviews ADD COLUMN verified BOOLEAN DEFAULT false;
  END IF;

  -- Add helpful_votes column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'property_reviews' AND column_name = 'helpful_votes'
  ) THEN
    ALTER TABLE property_reviews ADD COLUMN helpful_votes INTEGER DEFAULT 0;
  END IF;
END $$;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_property_reviews_property_id ON property_reviews(property_id);
CREATE INDEX IF NOT EXISTS idx_property_reviews_user_id ON property_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_property_reviews_created_at ON property_reviews(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_review_helpful_votes_review_id ON review_helpful_votes(review_id);
CREATE INDEX IF NOT EXISTS idx_review_helpful_votes_user_id ON review_helpful_votes(user_id);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists, then create
DROP TRIGGER IF EXISTS update_property_reviews_updated_at ON property_reviews;
CREATE TRIGGER update_property_reviews_updated_at
BEFORE UPDATE ON property_reviews
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE property_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_helpful_votes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for property_reviews

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view property reviews" ON property_reviews;
DROP POLICY IF EXISTS "Authenticated users can create reviews" ON property_reviews;
DROP POLICY IF EXISTS "Users can update their own reviews" ON property_reviews;
DROP POLICY IF EXISTS "Users can delete their own reviews" ON property_reviews;

-- Anyone can read reviews
CREATE POLICY "Anyone can view property reviews"
ON property_reviews FOR SELECT
USING (true);

-- Authenticated users can create reviews (one per property)
CREATE POLICY "Authenticated users can create reviews"
ON property_reviews FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND
  auth.role() = 'authenticated'
);

-- Users can update their own reviews
CREATE POLICY "Users can update their own reviews"
ON property_reviews FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own reviews
CREATE POLICY "Users can delete their own reviews"
ON property_reviews FOR DELETE
USING (auth.uid() = user_id);

-- RLS Policies for review_helpful_votes

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view helpful votes" ON review_helpful_votes;
DROP POLICY IF EXISTS "Authenticated users can add helpful votes" ON review_helpful_votes;
DROP POLICY IF EXISTS "Users can remove their own helpful votes" ON review_helpful_votes;

-- Anyone can view helpful votes
CREATE POLICY "Anyone can view helpful votes"
ON review_helpful_votes FOR SELECT
USING (true);

-- Authenticated users can add helpful votes
CREATE POLICY "Authenticated users can add helpful votes"
ON review_helpful_votes FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND
  auth.role() = 'authenticated'
);

-- Users can remove their own helpful votes
CREATE POLICY "Users can remove their own helpful votes"
ON review_helpful_votes FOR DELETE
USING (auth.uid() = user_id);

-- Function to update helpful_votes count when votes are added/removed
CREATE OR REPLACE FUNCTION update_review_helpful_votes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE property_reviews
    SET helpful_votes = helpful_votes + 1
    WHERE id = NEW.review_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE property_reviews
    SET helpful_votes = helpful_votes - 1
    WHERE id = OLD.review_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_review_helpful_votes_count_trigger ON review_helpful_votes;
CREATE TRIGGER update_review_helpful_votes_count_trigger
AFTER INSERT OR DELETE ON review_helpful_votes
FOR EACH ROW
EXECUTE FUNCTION update_review_helpful_votes_count();

-- Add comments for documentation
COMMENT ON TABLE property_reviews IS 'Stores user reviews for properties';
COMMENT ON TABLE review_helpful_votes IS 'Tracks which users found reviews helpful';
COMMENT ON COLUMN property_reviews.verified IS 'True if user actually rented/booked this property';
COMMENT ON COLUMN property_reviews.helpful_votes IS 'Count of users who found this review helpful';
