-- Fix RLS policies so admin can see ALL records (published + unpublished)
-- and public users can submit inquiries and subscribe via Telegram bot

-- === PROPERTIES ===
-- Drop the restrictive SELECT policy
DROP POLICY IF EXISTS public_read_properties ON properties;

-- Create two SELECT policies:
-- 1. Public users can only see published properties
-- 2. Authenticated (admin) users can see ALL properties
CREATE POLICY public_read_published_properties ON properties
  FOR SELECT TO anon, authenticated
  USING (is_published = true);

CREATE POLICY admin_read_all_properties ON properties
  FOR SELECT TO authenticated
  USING (true);

-- === PAGES ===
DROP POLICY IF EXISTS public_read_pages ON pages;

CREATE POLICY public_read_published_pages ON pages
  FOR SELECT TO anon, authenticated
  USING (is_published = true);

CREATE POLICY admin_read_all_pages ON pages
  FOR SELECT TO authenticated
  USING (true);

-- === PROPERTY INQUIRIES ===
-- Allow public (anon) to submit inquiries from the contact form
DROP POLICY IF EXISTS auth_insert_inquiries ON property_inquiries;

CREATE POLICY public_insert_inquiries ON property_inquiries
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- Add a public SELECT policy so visitors can't read inquiries (only admin can)
-- admin_read_inquiries already exists for authenticated, that's correct

-- === TELEGRAM SUBSCRIBERS ===
-- Add INSERT policy so the Telegram bot edge function can add subscribers
-- The bot uses the service role key which bypasses RLS, but let's add it anyway
-- for completeness
CREATE POLICY admin_insert_telegram_subscribers ON telegram_subscribers
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Also allow anon to insert (for the edge function if it uses anon key)
CREATE POLICY public_insert_telegram_subscribers ON telegram_subscribers
  FOR INSERT TO anon
  WITH CHECK (true);