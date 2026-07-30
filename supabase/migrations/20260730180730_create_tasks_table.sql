/*
# Create tasks table (single-tenant, no auth)

1. New Tables
- `tasks`
  - `id` (uuid, primary key)
  - `title` (text, not null)
  - `date` (date, not null) — the scheduled date
  - `time` (time, nullable) — optional scheduled time
  - `location` (text, nullable) — where the task takes place
  - `participants` (text, nullable) — who joins ("avec qui")
  - `description` (text, nullable) — free-form notes
  - `completed` (boolean, default false) — whether the task is done
  - `created_at` (timestamptz, default now())
2. Security
- Enable RLS on `tasks`.
- Allow anon + authenticated full CRUD because the data is intentionally
  single-tenant / personal (no sign-in screen).
3. Indexes
- Index on `date` for calendar and dashboard range queries.
- Index on `completed` for filtering pending vs done.
*/

CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  date date NOT NULL,
  time time,
  location text,
  participants text,
  description text,
  completed boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tasks_date ON tasks (date);
CREATE INDEX IF NOT EXISTS idx_tasks_completed ON tasks (completed);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_tasks" ON tasks;
CREATE POLICY "anon_select_tasks" ON tasks FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_tasks" ON tasks;
CREATE POLICY "anon_insert_tasks" ON tasks FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_tasks" ON tasks;
CREATE POLICY "anon_update_tasks" ON tasks FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_tasks" ON tasks;
CREATE POLICY "anon_delete_tasks" ON tasks FOR DELETE
  TO anon, authenticated USING (true);
