
ALTER TABLE public.trainers
  ADD COLUMN IF NOT EXISTS training_levels text,
  ADD COLUMN IF NOT EXISTS achievements text,
  ADD COLUMN IF NOT EXISTS awards text,
  ADD COLUMN IF NOT EXISTS profile_visibility text NOT NULL DEFAULT 'hidden';
