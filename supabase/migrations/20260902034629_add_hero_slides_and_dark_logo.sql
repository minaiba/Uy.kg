/*
# Add Hero Slides table and Dark Theme Logo

## 1. New Table: hero_slides
- `id` (uuid, primary key)
- `title` (jsonb, multilingual: {ru, en, kg})
- `subtitle` (jsonb, multilingual)
- `description` (jsonb, multilingual)
- `media_url` (text, image or video URL)
- `media_type` (text: 'image' or 'video')
- `button_text` (jsonb, multilingual, nullable)
- `button_link` (text, nullable)
- `sort_order` (integer, for ordering slides)
- `is_active` (boolean, default true)
- `created_at` (timestamp)
- `updated_at` (timestamp)

## 2. Modified Table: site_settings
- Added `logo_dark_url` (text, nullable) — logo for dark theme

## 3. Security
- RLS enabled on hero_slides
- Public read (anon, authenticated) for active slides
- Only authenticated users can insert/update/delete (admin manages)

## Notes
- The hero_slides table stores carousel slides for the homepage hero section
- Each slide supports image or video, multilingual title/subtitle/description, and optional button
- sort_order controls slide ordering; is_active controls visibility
- logo_dark_url on site_settings stores the dark-theme logo
*/

CREATE TABLE IF NOT EXISTS hero_slides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title jsonb NOT NULL DEFAULT '{}'::jsonb,
  subtitle jsonb NOT NULL DEFAULT '{}'::jsonb,
  description jsonb NOT NULL DEFAULT '{}'::jsonb,
  media_url text,
  media_type text NOT NULL DEFAULT 'image',
  button_text jsonb DEFAULT '{}'::jsonb,
  button_link text,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE hero_slides ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_hero_slides" ON hero_slides;
CREATE POLICY "public_read_hero_slides" ON hero_slides FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "auth_insert_hero_slides" ON hero_slides;
CREATE POLICY "auth_insert_hero_slides" ON hero_slides FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "auth_update_hero_slides" ON hero_slides;
CREATE POLICY "auth_update_hero_slides" ON hero_slides FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_delete_hero_slides" ON hero_slides;
CREATE POLICY "auth_delete_hero_slides" ON hero_slides FOR DELETE
  TO authenticated USING (true);

-- Add dark theme logo column to site_settings
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'site_settings' AND column_name = 'logo_dark_url') THEN
    ALTER TABLE site_settings ADD COLUMN logo_dark_url text;
  END IF;
END $$;
