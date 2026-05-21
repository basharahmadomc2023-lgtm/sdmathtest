ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS level text NOT NULL DEFAULT 'beginner';
ALTER TABLE public.exams ADD COLUMN IF NOT EXISTS total_marks integer;
ALTER TABLE public.attempts ADD COLUMN IF NOT EXISTS chosen_level text;
CREATE INDEX IF NOT EXISTS idx_questions_exam_level ON public.questions(exam_id, level);