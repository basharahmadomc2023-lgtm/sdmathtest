/*
  # Add trainer public profile visibility and content fields

  1. New columns on `trainers` table:
    - `profile_visibility` (text, default 'hidden') — controls public visibility:
      'hidden' = not visible publicly (default)
      'pending' = trainer requested visibility, awaiting admin approval
      'approved' = admin approved, profile is publicly visible
    - `training_levels` (text, default '') — comma-separated training levels completed or taught
    - `achievements` (text, default '') — trainer achievements description
    - `awards` (text, default '') — awards and certificates description

  2. Security:
    - No RLS policy changes needed — existing policies already allow read/write
    - The public profile page will filter by `profile_visibility = 'approved'` on the client side

  3. Important notes:
    - Default visibility is 'hidden' so existing and new trainers are not publicly visible
    - Trainers can request visibility (sets to 'pending'), but only admin can approve (sets to 'approved')
    - If admin rejects, visibility reverts to 'hidden'
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'trainers' AND column_name = 'profile_visibility'
  ) THEN
    ALTER TABLE trainers ADD COLUMN profile_visibility text NOT NULL DEFAULT 'hidden';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'trainers' AND column_name = 'training_levels'
  ) THEN
    ALTER TABLE trainers ADD COLUMN training_levels text NOT NULL DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'trainers' AND column_name = 'achievements'
  ) THEN
    ALTER TABLE trainers ADD COLUMN achievements text NOT NULL DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'trainers' AND column_name = 'awards'
  ) THEN
    ALTER TABLE trainers ADD COLUMN awards text NOT NULL DEFAULT '';
  END IF;
END $$;
