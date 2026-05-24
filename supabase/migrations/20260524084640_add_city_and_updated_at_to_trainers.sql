/*
  # Add city and updated_at columns to trainers table

  1. New columns on `trainers`:
    - `city` (text, nullable) — trainer's city, replaces "residence" for display purposes
    - `updated_at` (timestamptz, default now()) — auto-updated timestamp

  2. Also update the supabase config project_id to match the actual connected project.
     (This is a data-only migration, the config.toml update is separate.)

  3. Important notes:
    - `city` is nullable so existing trainer records are not affected
    - `updated_at` defaults to now() and will be set on every update
    - A trigger is added to auto-update `updated_at` on row changes
*/

-- Add city column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'trainers' AND column_name = 'city'
  ) THEN
    ALTER TABLE trainers ADD COLUMN city text;
  END IF;
END $$;

-- Add updated_at column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'trainers' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE trainers ADD COLUMN updated_at timestamptz NOT NULL DEFAULT now();
  END IF;
END $$;

-- Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_trainers_updated_at ON trainers;
CREATE TRIGGER set_trainers_updated_at
  BEFORE UPDATE ON trainers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
