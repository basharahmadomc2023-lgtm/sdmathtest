
-- Per-subscriber allowed exams
CREATE TABLE IF NOT EXISTS public.subscriber_allowed_exams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid NOT NULL,
  exam_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(member_id, exam_id)
);
ALTER TABLE public.subscriber_allowed_exams ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone read sae" ON public.subscriber_allowed_exams FOR SELECT USING (true);
CREATE POLICY "anyone insert sae" ON public.subscriber_allowed_exams FOR INSERT WITH CHECK (true);
CREATE POLICY "anyone delete sae" ON public.subscriber_allowed_exams FOR DELETE USING (true);
CREATE POLICY "anyone update sae" ON public.subscriber_allowed_exams FOR UPDATE USING (true) WITH CHECK (true);

-- Extra trainer fields
ALTER TABLE public.trainers
  ADD COLUMN IF NOT EXISTS years_experience integer,
  ADD COLUMN IF NOT EXISTS students_trained integer,
  ADD COLUMN IF NOT EXISTS competitions text;

-- Final certificate file url on members
ALTER TABLE public.members
  ADD COLUMN IF NOT EXISTS final_certificate_url text;

-- Public bucket for final certificates
INSERT INTO storage.buckets (id, name, public) VALUES ('final-certificates', 'final-certificates', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "public read final-certs" ON storage.objects FOR SELECT USING (bucket_id = 'final-certificates');
CREATE POLICY "public upload final-certs" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'final-certificates');
CREATE POLICY "public update final-certs" ON storage.objects FOR UPDATE USING (bucket_id = 'final-certificates');
CREATE POLICY "public delete final-certs" ON storage.objects FOR DELETE USING (bucket_id = 'final-certificates');
