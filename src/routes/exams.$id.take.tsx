import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { memberSession } from "@/lib/session";
import { motion, AnimatePresence } from "framer-motion";
import { Clock } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/exams/$id/take")({
  component: TakeExam,
});

type Q = {
  id: string;
  image_url: string | null;
  question_text: string | null;
  correct_answer: string;
  marks: number;
  time_limit: number;
  order_no: number;
  group_no: number;
};

function TakeExam() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [exam, setExam] = useState<any>(null);
  const [questions, setQuestions] = useState<Q[]>([]);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [idx, setIdx] = useState(0);
  const [answer, setAnswer] = useState("");
  const [qTimer, setQTimer] = useState(0);
  const [totalTimer, setTotalTimer] = useState(0);
  const [answers, setAnswers] = useState<{ question_id: string; given_answer: string; is_correct: boolean; time_spent: number }[]>([]);
  const startedAt = useRef<number>(Date.now());
  const qStartAt = useRef<number>(Date.now());

  // init
  useEffect(() => {
    const session = memberSession.get();
    if (!session) { navigate({ to: "/login" }); return; }
    (async () => {
      const { data: e } = await supabase.from("exams").select("*").eq("id", id).maybeSingle();
      const { data: qs } = await supabase.from("questions").select("*").eq("exam_id", id).order("order_no");
      if (!e || !qs?.length) { toast.error("لا توجد أسئلة لهذا الاختبار"); navigate({ to: "/exams" }); return; }
      setExam(e);
      setQuestions(qs as Q[]);
      setQTimer(qs[0].time_limit);
      setTotalTimer(e.total_time);
      const { data: a } = await supabase.from("attempts").insert({ exam_id: id, member_id: session.id }).select("id").single();
      setAttemptId(a!.id);
      startedAt.current = Date.now();
      qStartAt.current = Date.now();
    })();
  }, [id, navigate]);

  // total timer
  useEffect(() => {
    if (!exam) return;
    const t = setInterval(() => setTotalTimer((v) => Math.max(0, v - 1)), 1000);
    return () => clearInterval(t);
  }, [exam]);

  // question timer
  useEffect(() => {
    if (!exam || !questions.length) return;
    const t = setInterval(() => setQTimer((v) => Math.max(0, v - 1)), 1000);
    return () => clearInterval(t);
  }, [exam, questions, idx]);

  // auto-advance when q timer hits 0
  useEffect(() => {
    if (qTimer === 0 && questions.length && exam) handleNext(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qTimer]);

  // total time out -> finish
  useEffect(() => {
    if (totalTimer === 0 && exam) finishExam();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalTimer]);

  const handleNext = (auto = false) => {
    if (!questions.length) return;
    const q = questions[idx];
    const given = auto && !answer ? "" : answer.trim();
    const isCorrect = given.toLowerCase() === q.correct_answer.trim().toLowerCase();
    const timeSpent = Math.round((Date.now() - qStartAt.current) / 1000);
    const next = [...answers, { question_id: q.id, given_answer: given, is_correct: isCorrect, time_spent: timeSpent }];
    setAnswers(next);
    setAnswer("");
    if (idx + 1 >= questions.length) {
      finishExam(next);
    } else {
      setIdx(idx + 1);
      setQTimer(questions[idx + 1].time_limit);
      qStartAt.current = Date.now();
    }
  };

  const finishExam = async (allAnswers = answers) => {
    if (!attemptId) return;
    const correct = allAnswers.filter((a) => a.is_correct).length;
    const wrong = allAnswers.length - correct;
    const totalSpent = Math.round((Date.now() - startedAt.current) / 1000);
    await supabase.from("answers").insert(allAnswers.map((a) => ({ ...a, attempt_id: attemptId })));
    await supabase.from("attempts").update({
      finished_at: new Date().toISOString(),
      correct_count: correct,
      wrong_count: wrong,
      total_time: totalSpent,
    }).eq("id", attemptId);
    navigate({ to: "/exams/$id/result", params: { id }, search: { attempt: attemptId } });
  };

  if (!exam || !questions.length) return (
    <div className="min-h-screen bg-gradient-soft"><Header variant="member" /><main className="container mx-auto px-4 py-12">جارٍ التحميل...</main></div>
  );

  const q = questions[idx];
  const progress = ((idx + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-soft">
      <Header variant="member" />
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Header bar */}
        <div className="flex items-center justify-between mb-4 text-sm">
          <span className="font-medium">سؤال {idx + 1} من {questions.length}</span>
          <div className="flex gap-3">
            <span className="flex items-center gap-1 bg-card border rounded-full px-3 py-1">
              <Clock className="h-4 w-4 text-primary" /> السؤال: {qTimer}s
            </span>
            <span className="flex items-center gap-1 bg-card border rounded-full px-3 py-1">
              <Clock className="h-4 w-4 text-primary" /> الكلي: {Math.floor(totalTimer / 60)}:{String(totalTimer % 60).padStart(2, "0")}
            </span>
          </div>
        </div>

        {/* Progress */}
        <div className="h-2 bg-muted rounded-full overflow-hidden mb-6">
          <div className="h-full bg-gradient-hero transition-all" style={{ width: `${progress}%` }} />
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={q.id}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.25 }}
            className="bg-card border rounded-3xl p-8 shadow-elegant"
          >
            <div className="text-xs text-muted-foreground mb-4">المجموعة {q.group_no} • {q.marks} علامة</div>
            {q.image_url && (
              <div className="bg-muted rounded-2xl overflow-hidden mb-6 flex items-center justify-center min-h-[200px]">
                <img src={q.image_url} alt="سؤال" className="max-h-96 w-auto" />
              </div>
            )}
            {q.question_text && <p className="text-lg mb-6">{q.question_text}</p>}

            <Input
              autoFocus
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="اكتب إجابتك هنا..."
              dir="ltr"
              className="text-center text-xl h-14"
              onKeyDown={(e) => e.key === "Enter" && handleNext()}
            />

            <Button onClick={() => handleNext()} size="lg" className="w-full mt-6">
              {idx + 1 === questions.length ? "إنهاء الاختبار" : "التالي"}
            </Button>
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
