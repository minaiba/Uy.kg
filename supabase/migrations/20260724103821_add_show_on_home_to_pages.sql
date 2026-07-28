/*
# Add show_on_home column to pages table

1. Changes
- Adds `show_on_home` boolean column to the `pages` table, defaulting to `false`.
- This lets the admin control which CMS pages appear as content sections on the home page.
2. Security
- No RLS policy changes. Existing policies on `pages` remain unchanged.
3. Notes
- Column is nullable=false with default false so existing rows are unaffected.
- The public SELECT policy already allows reading all published pages, so no policy change is needed for the homepage to read these rows.
*/

ALTER TABLE pages
  ADD COLUMN IF NOT EXISTS show_on_home boolean NOT NULL DEFAULT false;
