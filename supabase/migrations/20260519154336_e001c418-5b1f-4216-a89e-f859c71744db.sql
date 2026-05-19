-- Allow admin-side operations (admin is gated client-side; data layer permits anon writes)
-- Members: allow update/delete (for approve/reject/delete)
CREATE POLICY "anyone update members" ON public.members FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "anyone delete members" ON public.members FOR DELETE USING (true);

-- Exams: allow full management
CREATE POLICY "anyone insert exams" ON public.exams FOR INSERT WITH CHECK (true);
CREATE POLICY "anyone update exams" ON public.exams FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "anyone delete exams" ON public.exams FOR DELETE USING (true);
-- Also allow reading unpublished exams (admin preview)
CREATE POLICY "anyone read all exams" ON public.exams FOR SELECT USING (true);

-- Questions: allow CRUD (admin creates, edits)
CREATE POLICY "anyone insert questions" ON public.questions FOR INSERT WITH CHECK (true);
CREATE POLICY "anyone update questions" ON public.questions FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "anyone delete questions" ON public.questions FOR DELETE USING (true);

-- Certificates: admin issuance
CREATE POLICY "anyone insert certificates" ON public.certificates FOR INSERT WITH CHECK (true);
CREATE POLICY "anyone delete certificates" ON public.certificates FOR DELETE USING (true);

-- Storage policies for exam-images bucket (uploads)
CREATE POLICY "public read exam-images" ON storage.objects FOR SELECT USING (bucket_id = 'exam-images');
CREATE POLICY "anyone upload exam-images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'exam-images');
CREATE POLICY "anyone update exam-images" ON storage.objects FOR UPDATE USING (bucket_id = 'exam-images');
CREATE POLICY "anyone delete exam-images" ON storage.objects FOR DELETE USING (bucket_id = 'exam-images');

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_questions_exam_order ON public.questions(exam_id, order_no);
CREATE INDEX IF NOT EXISTS idx_attempts_member ON public.attempts(member_id);
CREATE INDEX IF NOT EXISTS idx_attempts_exam ON public.attempts(exam_id);
CREATE INDEX IF NOT EXISTS idx_attempts_finished ON public.attempts(finished_at DESC) WHERE finished_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_answers_attempt ON public.answers(attempt_id);
CREATE INDEX IF NOT EXISTS idx_certificates_cert_number ON public.certificates(cert_number);
CREATE UNIQUE INDEX IF NOT EXISTS uq_certificates_attempt ON public.certificates(attempt_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_members_membership_no ON public.members(membership_no);
