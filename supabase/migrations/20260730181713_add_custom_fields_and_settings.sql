/*
# Add custom fields + settings table

1. Modified Tables
- `tasks`
  - Add `custom_fields` (jsonb, nullable) — stores values for user-defined custom fields (key = field id).
2. New Tables
- `settings` (single-tenant config, one row)
  - `id` (int, primary key, always 1)
  - `enabled_fields` (jsonb) — which standard form fields are visible
  - `custom_fields` (jsonb) — array of {id, label, type} definitions
  - `updated_at` (timestamptz)
3. Security
- Enable RLS on `settings`.
- Allow anon + authenticated full CRUD (single-tenant, no auth).
*/

ALTER TABLE tasks ADD COLUMN IF NOT EXISTS custom_fields jsonb;

CREATE TABLE IF NOT EXISTS settings (
  id int PRIMARY KEY DEFAULT 1,
  enabled_fields jsonb NOT NULL DEFAULT '["title","date","time","location","participants","description"]'::jsonb,
  custom_fields jsonb NOT NULL DEFAULT '[]'::jsonb,
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT settings_singleton CHECK (id = 1)
);

INSERT INTO settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_settings" ON settings;
CREATE POLICY "anon_select_settings" ON settings FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_settings" ON settings;
CREATE POLICY "anon_insert_settings" ON settings FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_settings" ON settings;
CREATE POLICY "anon_update_settings" ON settings FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_settings" ON settings;
CREATE POLICY "anon_delete_settings" ON settings FOR DELETE
  TO anon, authenticated USING (true);
