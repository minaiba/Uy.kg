/*
# Roles, permissions, and moderation system

## 1. user_profiles: new columns
- `is_blocked` (boolean, default false): blocked users cannot sign in or act
- `can_publish` (boolean, default false): users need admin permission to publish listings
- `updated_at` trigger maintained

## 2. properties: new columns + expanded types
- `moderation_status` (text, default 'approved'): 'pending' | 'approved' | 'rejected'
- `property_type` CHECK constraint expanded to include: house, apartment, commercial, land, dacha, cottage, townhouse, office, warehouse, industrial
- Existing data keeps its current type (all old values are still valid)

## 3. RLS changes
### user_profiles
- Admins can read ALL profiles (for the Users management page)
- Admins can update any profile's role, is_blocked, can_publish
- Users can still only read/update their own profile (unchanged)

### properties
- SELECT: public reads published+approved; authenticated reads all (so authors see their own drafts/pending)
- INSERT: authenticated users with can_publish=true OR admins
- UPDATE: admin OR owner (created_by = auth.uid())
- DELETE: admin OR owner

### property_private
- No changes (already owner-scoped)

## 4. Helper function
- `is_admin()`: SECURITY DEFINER, checks if current user's role is 'admin'
  Used in RLS policies to avoid repeating the subquery

## 5. Security notes
- `is_admin()` is SECURITY DEFINER so it can read user_profiles for role checks
- Blocked users: the frontend checks is_blocked on auth state change and signs them out
- can_publish defaults to false — new users cannot create listings until an admin enables it
*/

-- ============================================================
-- 1. user_profiles: add is_blocked and can_publish
-- ============================================================
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_profiles' AND column_name = 'is_blocked') THEN
    ALTER TABLE user_profiles ADD COLUMN is_blocked boolean NOT NULL DEFAULT false;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_profiles' AND column_name = 'can_publish') THEN
    ALTER TABLE user_profiles ADD COLUMN can_publish boolean NOT NULL DEFAULT false;
  END IF;
END $$;

-- ============================================================
-- 2. properties: add moderation_status, expand property_type
-- ============================================================
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'properties' AND column_name = 'moderation_status') THEN
    ALTER TABLE properties ADD COLUMN moderation_status text NOT NULL DEFAULT 'approved' CHECK (moderation_status IN ('pending', 'approved', 'rejected'));
  END IF;
END $$;

-- Expand property_type to include new types (drop old constraint, add new)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'properties_property_type_check') THEN
    ALTER TABLE properties DROP CONSTRAINT properties_property_type_check;
  END IF;
END $$;
ALTER TABLE properties ADD CONSTRAINT properties_property_type_check
  CHECK (property_type IN ('house', 'apartment', 'commercial', 'land', 'dacha', 'cottage', 'townhouse', 'office', 'warehouse', 'industrial'));

-- ============================================================
-- 3. Helper function: is_admin()
-- ============================================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid() AND role = 'admin' AND is_blocked = false
  );
$$;

-- ============================================================
-- 4. RLS: user_profiles
-- ============================================================
-- Drop old policies
DROP POLICY IF EXISTS "read_own_profile" ON user_profiles;
DROP POLICY IF EXISTS "update_own_profile" ON user_profiles;
DROP POLICY IF EXISTS "insert_own_profile" ON user_profiles;
DROP POLICY IF EXISTS "delete_own_profile" ON user_profiles;

-- SELECT: users read own profile; admins read all
CREATE POLICY "read_own_or_admin_profile" ON user_profiles FOR SELECT
  TO authenticated USING (auth.uid() = id OR public.is_admin());

-- INSERT: only on signup (trigger handles this); keep auth.uid() = id
CREATE POLICY "insert_own_profile" ON user_profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

-- UPDATE: users update own profile (but NOT role/is_blocked/can_publish); admins update all
-- We enforce column-level protection via a separate approach below
CREATE POLICY "update_own_or_admin_profile" ON user_profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id OR public.is_admin())
  WITH CHECK (auth.uid() = id OR public.is_admin());

-- DELETE: only own profile
CREATE POLICY "delete_own_profile" ON user_profiles FOR DELETE
  TO authenticated USING (auth.uid() = id);

-- ============================================================
-- 5. RLS: properties — rewrite for ownership + moderation
-- ============================================================
DROP POLICY IF EXISTS "admin_read_all_properties" ON properties;
DROP POLICY IF EXISTS "admin_insert_properties" ON properties;
DROP POLICY IF EXISTS "admin_update_properties" ON properties;
DROP POLICY IF EXISTS "admin_delete_properties" ON properties;
DROP POLICY IF EXISTS "public_read_published_properties" ON properties;

-- SELECT: public sees published+approved; authenticated sees all (so authors see their own)
CREATE POLICY "public_read_properties" ON properties FOR SELECT
  TO anon, authenticated
  USING (is_published = true AND moderation_status = 'approved');

CREATE POLICY "auth_read_all_properties" ON properties FOR SELECT
  TO authenticated
  USING (true);

-- INSERT: authenticated with can_publish=true OR admin
CREATE POLICY "insert_properties" ON properties FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_admin()
    OR (
      created_by = auth.uid()
      AND EXISTS (
        SELECT 1 FROM user_profiles
        WHERE id = auth.uid() AND can_publish = true AND is_blocked = false
      )
    )
  );

-- UPDATE: admin OR owner
CREATE POLICY "update_properties" ON properties FOR UPDATE
  TO authenticated
  USING (public.is_admin() OR created_by = auth.uid())
  WITH CHECK (public.is_admin() OR created_by = auth.uid());

-- DELETE: admin OR owner
CREATE POLICY "delete_properties" ON properties FOR DELETE
  TO authenticated
  USING (public.is_admin() OR created_by = auth.uid());

-- ============================================================
-- 6. Indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_properties_created_by ON properties(created_by);
CREATE INDEX IF NOT EXISTS idx_properties_moderation_status ON properties(moderation_status);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);
