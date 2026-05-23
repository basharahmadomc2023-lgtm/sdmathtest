
-- Trainers table
CREATE TABLE public.trainers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  membership_number TEXT NOT NULL UNIQUE,
  phone TEXT,
  residence TEXT,
  profile_image_url TEXT,
  status TEXT NOT NULL DEFAULT 'Pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.trainers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone read trainers" ON public.trainers FOR SELECT USING (true);
CREATE POLICY "anyone insert trainers" ON public.trainers FOR INSERT WITH CHECK (true);
CREATE POLICY "anyone update trainers" ON public.trainers FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "anyone delete trainers" ON public.trainers FOR DELETE USING (true);

-- Extend members with trainer linkage and stats
ALTER TABLE public.members
  ADD COLUMN IF NOT EXISTS trainer_id UUID,
  ADD COLUMN IF NOT EXISTS trainer_name TEXT,
  ADD COLUMN IF NOT EXISTS completed_worksheets_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS final_certificate_status TEXT NOT NULL DEFAULT 'pending';

-- Storage bucket for trainer profile images
INSERT INTO storage.buckets (id, name, public) VALUES ('trainer-images', 'trainer-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "trainer images public read" ON storage.objects FOR SELECT USING (bucket_id = 'trainer-images');
CREATE POLICY "trainer images insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'trainer-images');
CREATE POLICY "trainer images update" ON storage.objects FOR UPDATE USING (bucket_id = 'trainer-images');
CREATE POLICY "trainer images delete" ON storage.objects FOR DELETE USING (bucket_id = 'trainer-images');
