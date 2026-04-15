-- Add registration fields to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT,
ADD COLUMN IF NOT EXISTS phone_number TEXT,
ADD COLUMN IF NOT EXISTS city_region TEXT,
ADD COLUMN IF NOT EXISTS driver_licence_verified BOOLEAN DEFAULT false;

-- Update the handle_new_user function to include new fields
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    email,
    first_name,
    last_name,
    phone_number,
    city_region,
    is_client,
    is_provider
  ) VALUES (
    NEW.id, 
    NEW.email,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    NEW.raw_user_meta_data->>'phone_number',
    NEW.raw_user_meta_data->>'city_region',
    COALESCE((NEW.raw_user_meta_data->>'is_client')::boolean, true),
    COALESCE((NEW.raw_user_meta_data->>'is_provider')::boolean, false)
  ) ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;