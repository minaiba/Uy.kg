/*
# Add private property fields (author-only)

## 1. Add created_by to properties
- Tracks who created each listing (author/owner)
- Defaults to auth.uid() on insert

## 2. New Table: property_private
- Stores author-only fields: admin_comment, owner_phone, hand_price
- One row per property (1:1)
- RLS: only the author (created_by = auth.uid()) can SELECT, INSERT, UPDATE, DELETE

## Security
- property_private has deny-by-default RLS
- Only the row owner can access their private data
- Non-authors never receive these fields from the database
*/

-- Add created_by to properties
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'properties' AND column_name = 'created_by') THEN
    ALTER TABLE properties ADD COLUMN created_by uuid DEFAULT auth.uid();
  END IF;
END $$;

-- Create property_private table
CREATE TABLE IF NOT EXISTS property_private (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  created_by uuid NOT NULL DEFAULT auth.uid(),
  admin_comment text DEFAULT '',
  owner_phone text DEFAULT '',
  hand_price text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(property_id)
);

ALTER TABLE property_private ENABLE ROW LEVEL SECURITY;

-- Only the author can read their private data
DROP POLICY IF EXISTS "author_read_property_private" ON property_private;
CREATE POLICY "author_read_property_private" ON property_private FOR SELECT
  TO authenticated USING (created_by = auth.uid());

-- Only the author can insert their private data
DROP POLICY IF EXISTS "author_insert_property_private" ON property_private;
CREATE POLICY "author_insert_property_private" ON property_private FOR INSERT
  TO authenticated WITH CHECK (created_by = auth.uid());

-- Only the author can update their private data
DROP POLICY IF EXISTS "author_update_property_private" ON property_private;
CREATE POLICY "author_update_property_private" ON property_private FOR UPDATE
  TO authenticated USING (created_by = auth.uid()) WITH CHECK (created_by = auth.uid());

-- Only the author can delete their private data
DROP POLICY IF EXISTS "author_delete_property_private" ON property_private;
CREATE POLICY "author_delete_property_private" ON property_private FOR DELETE
  TO authenticated USING (created_by = auth.uid());

-- Index for lookups
CREATE INDEX IF NOT EXISTS idx_property_private_property_id ON property_private(property_id);
CREATE INDEX IF NOT EXISTS idx_property_private_created_by ON property_private(created_by);
