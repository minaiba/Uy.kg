/*
# Real Estate Website Schema

1. Overview
   - Admin-managed CMS for a real estate visiting-card site.
   - Tables: site_settings (singleton), pages (dynamic CMS), properties (listings), property_images, telegram_subscribers, property_inquiries.
   - Multi-language: text fields stored as JSONB with keys 'ru', 'en', 'kg'.
   - Currency: prices stored as numeric with currency code (KGS, USD, RUB).

2. Security
   - Public read for published content (anon + authenticated).
   - Write restricted to authenticated admin.
   - RLS enabled on all tables.
*/

-- ============================================================
-- SITE SETTINGS (singleton)
-- ============================================================
CREATE TABLE IF NOT EXISTS site_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_name text NOT NULL DEFAULT 'Estate Premium',
  logo_url text,
  hero_title jsonb NOT NULL DEFAULT '{"ru":"Найдите дом своей мечты","en":"Find your dream home","kg":"Талап кылган үйүңүздү табыңыз"}',
  hero_subtitle jsonb NOT NULL DEFAULT '{"ru":"Премиальная недвижимость в Кыргызстане","en":"Premium real estate in Kyrgyzstan","kg":"Кыргызстандагы премиум жылжымай мүлк"}',
  hero_image_url text,
  phone text,
  email text,
  address jsonb DEFAULT '{"ru":"Бишкек, Кыргызстан","en":"Bishkek, Kyrgyzstan","kg":"Бишкек, Кыргызстан"}',
  whatsapp text,
  instagram text,
  facebook text,
  telegram text,
  footer_text jsonb DEFAULT '{"ru":"© 2024 Estate Premium. Все права защищены.","en":"© 2024 Estate Premium. All rights reserved.","kg":"© 2024 Estate Premium. Бардык укуктар корголгон."}',
  default_currency text NOT NULL DEFAULT 'KGS',
  about_text jsonb,
  working_hours jsonb DEFAULT '{"ru":"Пн-Сб: 9:00 - 19:00","en":"Mon-Sat: 9:00 - 19:00","kg":"Дүй-Шм: 9:00 - 19:00"}',
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_site_settings" ON site_settings;
CREATE POLICY "public_read_site_settings" ON site_settings FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "admin_insert_site_settings" ON site_settings;
CREATE POLICY "admin_insert_site_settings" ON site_settings FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "admin_update_site_settings" ON site_settings;
CREATE POLICY "admin_update_site_settings" ON site_settings FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "admin_delete_site_settings" ON site_settings;
CREATE POLICY "admin_delete_site_settings" ON site_settings FOR DELETE
  TO authenticated USING (true);

-- ============================================================
-- DYNAMIC PAGES
-- ============================================================
CREATE TABLE IF NOT EXISTS pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title jsonb NOT NULL,
  content jsonb NOT NULL DEFAULT '{}',
  excerpt jsonb,
  featured_image_url text,
  is_published boolean NOT NULL DEFAULT true,
  show_in_menu boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE pages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_pages" ON pages;
CREATE POLICY "public_read_pages" ON pages FOR SELECT
  TO anon, authenticated USING (is_published = true);

DROP POLICY IF EXISTS "admin_insert_pages" ON pages;
CREATE POLICY "admin_insert_pages" ON pages FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "admin_update_pages" ON pages;
CREATE POLICY "admin_update_pages" ON pages FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "admin_delete_pages" ON pages;
CREATE POLICY "admin_delete_pages" ON pages FOR DELETE
  TO authenticated USING (true);

-- ============================================================
-- PROPERTIES
-- ============================================================
CREATE TABLE IF NOT EXISTS properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title jsonb NOT NULL,
  description jsonb NOT NULL DEFAULT '{}',
  price numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'KGS',
  listing_type text NOT NULL DEFAULT 'sale' CHECK (listing_type IN ('sale', 'rent')),
  property_type text NOT NULL DEFAULT 'apartment' CHECK (property_type IN ('house', 'apartment', 'commercial', 'land')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'sold', 'rented', 'draft')),
  location jsonb NOT NULL DEFAULT '{}',
  address text,
  city text,
  district text,
  latitude numeric,
  longitude numeric,
  bedrooms int,
  bathrooms int,
  area numeric NOT NULL DEFAULT 0,
  land_area numeric,
  floor int,
  total_floors int,
  building_type text,
  year_built int,
  features jsonb DEFAULT '[]',
  is_featured boolean NOT NULL DEFAULT false,
  is_published boolean NOT NULL DEFAULT true,
  main_image_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_properties" ON properties;
CREATE POLICY "public_read_properties" ON properties FOR SELECT
  TO anon, authenticated USING (is_published = true);

DROP POLICY IF EXISTS "admin_insert_properties" ON properties;
CREATE POLICY "admin_insert_properties" ON properties FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "admin_update_properties" ON properties;
CREATE POLICY "admin_update_properties" ON properties FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "admin_delete_properties" ON properties;
CREATE POLICY "admin_delete_properties" ON properties FOR DELETE
  TO authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_properties_listing_type ON properties(listing_type);
CREATE INDEX IF NOT EXISTS idx_properties_property_type ON properties(property_type);
CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(status);
CREATE INDEX IF NOT EXISTS idx_properties_is_featured ON properties(is_featured);
CREATE INDEX IF NOT EXISTS idx_properties_city ON properties(city);

-- ============================================================
-- PROPERTY IMAGES
-- ============================================================
CREATE TABLE IF NOT EXISTS property_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  caption jsonb,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE property_images ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_property_images" ON property_images;
CREATE POLICY "public_read_property_images" ON property_images FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "admin_insert_property_images" ON property_images;
CREATE POLICY "admin_insert_property_images" ON property_images FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "admin_update_property_images" ON property_images;
CREATE POLICY "admin_update_property_images" ON property_images FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "admin_delete_property_images" ON property_images;
CREATE POLICY "admin_delete_property_images" ON property_images FOR DELETE
  TO authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_property_images_property_id ON property_images(property_id);

-- ============================================================
-- TELEGRAM SUBSCRIBERS
-- ============================================================
CREATE TABLE IF NOT EXISTS telegram_subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id bigint UNIQUE NOT NULL,
  username text,
  first_name text,
  last_name text,
  language_code text,
  is_active boolean NOT NULL DEFAULT true,
  subscribed_at timestamptz DEFAULT now()
);

ALTER TABLE telegram_subscribers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_read_telegram_subscribers" ON telegram_subscribers;
CREATE POLICY "admin_read_telegram_subscribers" ON telegram_subscribers FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "admin_update_telegram_subscribers" ON telegram_subscribers;
CREATE POLICY "admin_update_telegram_subscribers" ON telegram_subscribers FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "admin_delete_telegram_subscribers" ON telegram_subscribers;
CREATE POLICY "admin_delete_telegram_subscribers" ON telegram_subscribers FOR DELETE
  TO authenticated USING (true);

-- Edge function inserts subscribers (service role bypasses RLS), so no anon INSERT policy needed.

-- ============================================================
-- PROPERTY INQUIRIES
-- ============================================================
CREATE TABLE IF NOT EXISTS property_inquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES properties(id) ON DELETE SET NULL,
  name text NOT NULL,
  phone text NOT NULL,
  email text,
  message text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE property_inquiries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_insert_inquiries" ON property_inquiries;
CREATE POLICY "public_insert_inquiries" ON property_inquiries FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "admin_read_inquiries" ON property_inquiries;
CREATE POLICY "admin_read_inquiries" ON property_inquiries FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "admin_delete_inquiries" ON property_inquiries;
CREATE POLICY "admin_delete_inquiries" ON property_inquiries FOR DELETE
  TO authenticated USING (true);

-- ============================================================
-- INSERT DEFAULT SITE SETTINGS
-- ============================================================
INSERT INTO site_settings (site_name, phone, email, whatsapp, instagram, facebook, telegram, hero_image_url)
SELECT 'Estate Premium', '+996 555 123 456', 'info@estatepremium.kg', '+996555123456', 'estatepremium', 'estatepremium', 'estatepremium_bot', 'https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg'
WHERE NOT EXISTS (SELECT 1 FROM site_settings);

-- ============================================================
-- STORAGE BUCKETS
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('property-images', 'property-images', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('site-assets', 'site-assets', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "public_read_storage_buckets" ON storage.objects;
CREATE POLICY "public_read_storage_buckets" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id IN ('property-images', 'site-assets'));

DROP POLICY IF EXISTS "admin_upload_storage" ON storage.objects;
CREATE POLICY "admin_upload_storage" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id IN ('property-images', 'site-assets'));

DROP POLICY IF EXISTS "admin_update_storage" ON storage.objects;
CREATE POLICY "admin_update_storage" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id IN ('property-images', 'site-assets'));

DROP POLICY IF EXISTS "admin_delete_storage" ON storage.objects;
CREATE POLICY "admin_delete_storage" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id IN ('property-images', 'site-assets'));

-- ============================================================
-- UPDATED_AT TRIGGERS
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_site_settings_updated_at ON site_settings;
CREATE TRIGGER update_site_settings_updated_at BEFORE UPDATE ON site_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_pages_updated_at ON pages;
CREATE TRIGGER update_pages_updated_at BEFORE UPDATE ON pages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_properties_updated_at ON properties;
CREATE TRIGGER update_properties_updated_at BEFORE UPDATE ON properties
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
