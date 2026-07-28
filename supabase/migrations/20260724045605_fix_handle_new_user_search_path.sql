/*
# Fix handle_new_user trigger function

The handle_new_user trigger was failing during GoTrue signup because:
1. The function didn't set search_path, so table references could fail
2. The function was owned by 'postgres' but GoTrue runs as 'supabase_auth_admin'

Fix:
- Set search_path to 'public, auth' to ensure table references resolve correctly
- Keep SECURITY DEFINER with row_security=off
- Grant INSERT privilege on user_profiles to supabase_auth_admin as a fallback
*/

-- Recreate the function with proper search_path
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
SET row_security = off
AS $function$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name, phone)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'phone'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$function$;

-- Grant INSERT on user_profiles to supabase_auth_admin (the role GoTrue uses)
GRANT INSERT ON public.user_profiles TO supabase_auth_admin;
GRANT SELECT ON public.user_profiles TO supabase_auth_admin;