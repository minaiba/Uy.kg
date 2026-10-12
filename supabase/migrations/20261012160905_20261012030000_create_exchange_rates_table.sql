/*
# Create exchange_rates table for auto-updating currency rates

## Purpose
Store exchange rates fetched from a free API, updated every 24 hours.
The frontend reads these rates instead of using hardcoded static values.

## New Tables
- `exchange_rates`
  - `id` (int, primary key, always 1 — singleton row)
  - `usd_to_kgs` (numeric, how many KGS per 1 USD)
  - `rub_to_kgs` (numeric, how many KGS per 1 RUB)
  - `updated_at` (timestamptz, last fetch time)

## Security
- RLS enabled, SELECT only for anon+authenticated (rates are public data)
- No INSERT/UPDATE/DELETE from frontend — only the edge function updates via service role

## Initial Data
- Seeds with approximate current rates as fallback
*/

CREATE TABLE IF NOT EXISTS exchange_rates (
  id int PRIMARY KEY DEFAULT 1,
  usd_to_kgs numeric NOT NULL DEFAULT 89,
  rub_to_kgs numeric NOT NULL DEFAULT 1,
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT singleton_row CHECK (id = 1)
);

ALTER TABLE exchange_rates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_exchange_rates" ON exchange_rates;
CREATE POLICY "read_exchange_rates"
ON exchange_rates FOR SELECT
TO anon, authenticated
USING (true);

INSERT INTO exchange_rates (id, usd_to_kgs, rub_to_kgs)
VALUES (1, 89, 1)
ON CONFLICT (id) DO NOTHING;