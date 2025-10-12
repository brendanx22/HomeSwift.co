-- Migration to split full_name into first_name and last_name

-- First, add the new columns if they don't exist
DO $$
BEGIN
    -- Add first_name column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'user_profiles' AND column_name = 'first_name') THEN
        ALTER TABLE user_profiles 
        ADD COLUMN first_name text;
    END IF;

    -- Add last_name column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'user_profiles' AND column_name = 'last_name') THEN
        ALTER TABLE user_profiles 
        ADD COLUMN last_name text;
    END IF;

    -- Update existing records to split full_name into first_name and last_name
    UPDATE user_profiles 
    SET 
        first_name = split_part(COALESCE(full_name, 'User'), ' ', 1),
        last_name = CASE 
            WHEN full_name IS NULL THEN ''
            WHEN array_length(string_to_array(full_name, ' '), 1) > 1 
            THEN array_to_string((string_to_array(full_name, ' ', 2))[2:], ' ')
            ELSE ''
        END
    WHERE first_name IS NULL OR last_name IS NULL;

    -- Make the columns NOT NULL after populating them
    ALTER TABLE user_profiles 
    ALTER COLUMN first_name SET NOT NULL,
    ALTER COLUMN last_name SET NOT NULL,
    ALTER COLUMN first_name SET DEFAULT '',
    ALTER COLUMN last_name SET DEFAULT '';

    -- Update the handle_new_user function to use first_name and last_name
    CREATE OR REPLACE FUNCTION public.handle_new_user() 
    RETURNS trigger AS $$
    BEGIN
      INSERT INTO public.user_profiles (
        id, 
        email, 
        first_name,
        last_name,
        user_type,
        created_at,
        updated_at
      )
      VALUES (
        new.id, 
        new.email,
        split_part(COALESCE(new.raw_user_meta_data->>'full_name', 'User'), ' ', 1),
        CASE 
            WHEN new.raw_user_meta_data->>'full_name' IS NULL THEN ''
            WHEN array_length(string_to_array(new.raw_user_meta_data->>'full_name', ' '), 1) > 1 
            THEN array_to_string((string_to_array(new.raw_user_meta_data->>'full_name', ' ', 2))[2:], ' ')
            ELSE ''
        END,
        COALESCE(new.raw_user_meta_data->>'user_type', 'renter'),
        now(),
        now()
      );
      RETURN new;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;

    -- Recreate the trigger
    DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
    
    CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

    -- Drop the full_name column if it exists and is no longer needed
    -- Note: We'll keep it for now for backward compatibility
    -- ALTER TABLE user_profiles DROP COLUMN IF EXISTS full_name;
END $$;
