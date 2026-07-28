-- Fix: handle_new_user trigger fails because RLS blocks the insert
-- when auth.uid() is not set during trigger execution.
-- Solution: ALTER the table to BYPASSRLS for the trigger function owner,
-- or better: use SECURITY DEFINER with BYPASSRLS by altering the function.

-- Drop and recreate the function with BYPASSRLS behavior
-- The function already has SECURITY DEFINER, but RLS still applies.
-- We need to ensure the function owner can bypass RLS.

-- Grant the necessary privilege and set the function to be executed
-- with the privileges of the owner (already SECURITY DEFINER).
-- The real fix: temporarily disable RLS during the insert, or
-- better: make the function bypass RLS by using auth.uid() check removal.

-- Actually, the cleanest fix is to add a policy that allows the trigger
-- to insert. But since the trigger runs as SECURITY DEFINER (the owner),
-- we can ALTER the function owner to be a superuser-role, or we can
-- simply ensure RLS is configured to allow service_role inserts.

-- The simplest reliable fix: add a policy allowing inserts for
-- service_role (which the trigger effectively runs as via SECURITY DEFINER)
-- OR: use BYPASSRLS attribute on the role that owns the function.

-- Let's check who owns the function and the table
-- The most reliable approach: disable RLS on user_profiles, add policies back
-- with a permissive insert policy for the trigger context.

-- Actually, SECURITY DEFINER functions run as the function owner.
-- If the function owner has BYPASSRLS, the insert will work.
-- But we can't easily set BYPASSRLS on authenticator role.

-- The cleanest solution: use a SECURITY DEFINER function that explicitly
-- bypasses RLS by using `SET LOCAL row_security = off` before the insert.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET row_security = off
AS $function$
BEGIN
  INSERT INTO user_profiles (id, email, full_name, phone)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'phone')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$function$;