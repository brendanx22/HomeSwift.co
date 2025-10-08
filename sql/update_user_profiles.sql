-- Add full_name column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_profiles' AND column_name = 'full_name') THEN
        ALTER TABLE user_profiles 
        ADD COLUMN full_name text NOT NULL;
        
        -- Update existing records with a default value if needed
        UPDATE user_profiles 
        SET full_name = 'User' 
        WHERE full_name IS NULL;
    END IF;
END $$;

-- Update the handle_new_user function to include full_name
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_profiles (
    id, 
    email, 
    full_name,
    user_type,
    created_at,
    updated_at
  )
  VALUES (
    new.id, 
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', 'User'),
    COALESCE(new.raw_user_meta_data->>'user_type', 'renter'),
    now(),
    now()
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure the trigger exists
DO $$
BEGIN
    -- Drop existing trigger if it exists
    DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
    
    -- Create the trigger
    CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error setting up trigger: %', SQLERRM;
END $$;

-- Set up RLS policies if they don't exist
DO $$
BEGIN
    -- Allow users to create their own profile
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'user_profiles' 
        AND policyname = 'Allow users to create their own profile'
    ) THEN
        CREATE POLICY "Allow users to create their own profile"
        ON user_profiles
        FOR INSERT
        TO authenticated
        WITH CHECK (auth.uid() = id);
    END IF;

    -- Allow users to update their own profile
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'user_profiles' 
        AND policyname = 'Allow users to update their own profile'
    ) THEN
        CREATE POLICY "Allow users to update their own profile"
        ON user_profiles
        FOR UPDATE
        TO authenticated
        USING (auth.uid() = id);
    END IF;

    -- Allow users to view their own profile
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'user_profiles' 
        AND policyname = 'Allow users to view their own profile'
    ) THEN
        CREATE POLICY "Allow users to view their own profile"
        ON user_profiles
        FOR SELECT
        TO authenticated
        USING (auth.uid() = id);
    END IF;
END $$;
