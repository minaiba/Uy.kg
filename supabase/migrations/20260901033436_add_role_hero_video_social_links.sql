/*
# Add role, hero_video_url, and social_links columns

1. Changes
- Add `role` column to user_profiles (text, default 'user') to distinguish admins from regular users.
- Add `hero_video_url` column to site_settings (text, nullable) for video banner support.
- Add `social_links` column to site_settings (jsonb, nullable) for dynamic social media management.
2. Security
- No RLS policy changes. Existing policies remain intact.
3. Notes
- role: 'admin' or 'user' (default 'user'). Used by frontend to redirect after login.
- social_links: array of {platform, label, url, icon} objects. Managed in admin settings.
*/

ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS role text DEFAULT 'user';

ALTER TABLE site_settings
  ADD COLUMN IF NOT EXISTS hero_video_url text;

ALTER TABLE site_settings
  ADD COLUMN IF NOT EXISTS social_links jsonb DEFAULT '[]'::jsonb;
