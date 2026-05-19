
-- Members (no auth.users since login is name+membership number)
CREATE TABLE public.members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  coach_name TEXT NOT NULL,
  membership_no TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  level TEXT DEFAULT 'beginner',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.exams (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  level TEXT NOT NULL DEFAULT 'beginner' CHECK (level IN ('beginner','intermediate','advanced')),
  total_time INTEGER NOT NULL DEFAULT 600, -- seconds
  allow_back BOOLEAN NOT NULL DEFAULT false,
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  image_url TEXT,
  question_text TEXT,
  correct_answer TEXT NOT NULL,
  marks INTEGER NOT NULL DEFAULT 1,
  time_limit INTEGER NOT NULL DEFAULT 30,
  order_no INTEGER NOT NULL DEFAULT 1,
  group_no INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ,
  correct_count INTEGER DEFAULT 0,
  wrong_count INTEGER DEFAULT 0,
  total_time INTEGER DEFAULT 0,
  approved BOOLEAN DEFAULT false
);

CREATE TABLE public.answers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  attempt_id UUID NOT NULL REFERENCES public.attempts(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  given_answer TEXT,
  is_correct BOOLEAN DEFAULT false,
  time_spent INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.certificates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  attempt_id UUID NOT NULL UNIQUE REFERENCES public.attempts(id) ON DELETE CASCADE,
  cert_number TEXT NOT NULL UNIQUE,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

-- Public policies (auth handled server-side via admin client + custom session)
-- Allow anon to insert their own registration
CREATE POLICY "anyone can register" ON public.members FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anyone can read own by membership" ON public.members FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "anyone read published exams" ON public.exams FOR SELECT TO anon, authenticated USING (is_published = true);
CREATE POLICY "anyone read questions" ON public.questions FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "anyone insert attempts" ON public.attempts FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anyone read attempts" ON public.attempts FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anyone update own attempts" ON public.attempts FOR UPDATE TO anon, authenticated USING (true);

CREATE POLICY "anyone insert answers" ON public.answers FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anyone read answers" ON public.answers FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "public read certificates" ON public.certificates FOR SELECT TO anon, authenticated USING (true);

-- Storage bucket for question images and logos
INSERT INTO storage.buckets (id, name, public) VALUES ('exam-images', 'exam-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "public read exam images" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'exam-images');
CREATE POLICY "anyone upload exam images" ON storage.objects FOR INSERT TO anon, authenticated WITH CHECK (bucket_id = 'exam-images');
CREATE POLICY "anyone delete exam images" ON storage.objects FOR DELETE TO anon, authenticated USING (bucket_id = 'exam-images');
