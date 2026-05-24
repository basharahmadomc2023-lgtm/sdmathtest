/*
  # Add exam permissions, trainer profile fields, and final certificate storage

  1. New table: `member_allowed_exams`
    - Links members to exams they are allowed to take
    - `member_id` (uuid, FK to members) — the subscriber
    - `exam_id` (uuid, FK to exams) — the exam allowed
    - UNIQUE constraint on (member_id, exam_id) prevents duplicates
    - Per-subscriber: allowing an exam for one member does NOT allow it for all

  2. New columns on `trainers`:
    - `years_experience` (integer, default 0) — years of training experience
    - `students_trained` (integer, default 0) — number of students trained
    - `competitions` (text, default '') — competitions participated in

  3. New columns on `members`:
    - `final_certificate_url` (text, nullable) — URL to uploaded final certificate file
    - Rename label use: `completed_worksheets_count` now represents completed exams count
      (column name kept to avoid data loss, but UI will show "Completed Exams")

  4. Security:
    - Enable RLS on `member_allowed_exams`
    - Add permissive policies matching existing trainers/members pattern (anon access for client-side app)

  5. Important notes:
    - The exam permission is per subscriber — NOT global
    - Removing a permission row removes the exam from that subscriber's view
    - The `final_certificate_url` stores the uploaded certificate file link
*/

-- Create member_allowed_exams table
CREATE TABLE IF NOT EXISTS member_allowed_exams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  exam_id uuid NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(member_id, exam_id)
);

ALTER TABLE member_allowed_exams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone read member_allowed_exams"
  ON member_allowed_exams FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "anyone insert member_allowed_exams"
  ON member_allowed_exams FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "anyone update member_allowed_exams"
  ON member_allowed_exams FOR UPDATE
  TO anon, authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "anyone delete member_allowed_exams"
  ON member_allowed_exams FOR DELETE
  TO anon, authenticated
  USING (true);

-- Add trainer profile fields
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'trainers' AND column_name = 'years_experience'
  ) THEN
    ALTER TABLE trainers ADD COLUMN years_experience integer NOT NULL DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'trainers' AND column_name = 'students_trained'
  ) THEN
    ALTER TABLE trainers ADD COLUMN students_trained integer NOT NULL DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'trainers' AND column_name = 'competitions'
  ) THEN
    ALTER TABLE trainers ADD COLUMN competitions text NOT NULL DEFAULT '';
  END IF;
END $$;

-- Add final certificate URL on members
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'members' AND column_name = 'final_certificate_url'
  ) THEN
    ALTER TABLE members ADD COLUMN final_certificate_url text;
  END IF;
END $$;

-- Add index for fast lookup
CREATE INDEX IF NOT EXISTS idx_member_allowed_exams_member
  ON member_allowed_exams(member_id);
