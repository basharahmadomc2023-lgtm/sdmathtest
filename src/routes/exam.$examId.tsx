import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { memberSession } from "@/lib/session";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, ListChecks, Play, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/exam/$examId")({
  component: ExamPage,
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
  level: string | null;
};

function ExamPage() {
  const { examId } = Route.useParams();
  const navigate = useNavigate();

  const [exam, setExam] = useState<any>(null);
  const [questions, setQuestions] = useState<Q[]>([]);
  const [loading, setLoading] = useState(true);
  const [started, setStarted] = useState(false);

  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [idx, setIdx] = useState(0);
  const [answer, setAnswer] = useState("");
  const [qTimer, setQTimer] = useState(0);
  const [totalTimer, setTotalTimer] = useState(0);
  const [answers, setAnswers] = useState<
    { question_id: string; given_answer: string; is_correct: boolean; time_spent: number }[]
  >([]);
  const startedAt = useRef<number>(Date.now());
  const qStartAt = useRef<number>(Date.now());

  useEffect(() => {
    const session = memberSession.get();
    if (!session) {
      navigate({ to: "/login" });
      return;
    }
    (async () => {
      const { data: e } = await supabase.from("exams").select("*").eq("id", examId).maybeSingle();
      const { data: qs } = await supabase
        .from("questions")
        .select("*")
        .eq("exam_id", examId)
        .order("order_no");
      if (!e) {
        toast.error("الاختبار غير موجود");
        navigate({ to: "/exams" });
        return;
      }
      setExam(e);
      setQuestions((qs ?? []) as Q[]);
      setTotalTimer(e.total_time);
      setLoading(false);
    })();
  }, [examId, navigate]);

  // total timer
  useEffect(() => {
    if (!started) return;
    const t = setInterval(() => setTotalTimer((v) => Math.max(0, v - 1)), 1000);
    return () => clearInterval(t);
  }, [started]);

  // question timer
  useEffect(() => {
    if (!started || !questions.length) return;
    const t = setInterval(() => setQTimer((v) => Math.max(0, v - 1)), 1000);
    return () => clearInterval(t);
  }, [started, questions, idx]);

  useEffect(() => {
    if (started && qTimer === 0 && questions.length) handleNext(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qTimer]);

  useEffect(() => {
    if (started && totalTimer === 0) finishExam();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalTimer]);

  const beginExam = async () => {
    if (!questions.length) {
      toast.error("لا توجد أسئلة في هذا الاختبار");
      return;
    }
    const session = memberSession.get();
    if (!session) {
      navigate({ to: "/login" });
      return;
    }
    const { data: a, error } = await supabase
      .from("attempts")
      .insert({ exam_id: examId, member_id: session.id } as any)
      .select("id")
      .single();
    if (error || !a) {
      toast.error("تعذر بدء الاختبار");
      return;
    }
    setAttemptId(a.id);
    setQTimer(questions[0].time_limit);
    startedAt.current = Date.now();
    qStartAt.current = Date.now();
    setStarted(true);
  };

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
    await supabase
      .from("attempts")
      .update({
        finished_at: new Date().toISOString(),
        correct_count: correct,
        wrong_count: wrong,
        total_time: totalSpent,
      })
      .eq("id", attemptId);
    navigate({ to: "/exams/$id/result", params: { id: examId }, search: { attempt: attemptId } });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-soft">
        <Header variant="member" />
        <main className="container mx-auto px-4 py-12">جارٍ التحميل...</main>
      </div>
    );
  }

  const levelLabel = (l?: string | null) =>
    l === "beginner" ? "مبتدئ" : l === "intermediate" ? "متوسط" : l === "advanced" ? "احترافي" : "—";

  // Intro view
  if (!started) {
    return (
      <div className="min-h-screen bg-gradient-soft">
        <Header variant="member" />
        <main className="container mx-auto px-4 py-12 max-w-2xl">
          <div className="bg-card border rounded-3xl p-8 sm:p-10 shadow-elegant">
            <h1 className="text-3xl font-bold mb-2">{exam.title}</h1>
            {exam.description && <p className="text-muted-foreground mb-6">{exam.description}</p>}

            <div className="grid grid-cols-2 gap-4 my-8">
              <div className="bg-accent rounded-xl p-4 text-center">
                <ListChecks className="h-6 w-6 text-primary mx-auto mb-1" />
                <p className="text-2xl font-bold">{questions.length}</p>
                <p className="text-xs text-muted-foreground">عدد الأسئلة</p>
              </div>
              <div className="bg-accent rounded-xl p-4 text-center">
                <Clock className="h-6 w-6 text-primary mx-auto mb-1" />
                <p className="text-2xl font-bold">{Math.round(exam.total_time / 60)} د</p>
                <p className="text-xs text-muted-foreground">الزمن الكلي</p>
              </div>
              <div className="bg-accent rounded-xl p-4 text-center">
                <p className="text-sm text-muted-foreground mb-1">المستوى</p>
                <p className="text-base font-semibold">{levelLabel(exam.level)}</p>
              </div>
              <div className="bg-accent rounded-xl p-4 text-center">
                <p className="text-sm text-muted-foreground mb-1">المرحلة التدريبية</p>
                <p className="text-base font-semibold">{exam.stage ?? levelLabel(exam.level)}</p>
              </div>
            </div>

            <div className="bg-primary/5 border border-primary/15 rounded-xl p-4 text-sm flex gap-2 mb-6">
              <AlertCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <p className="text-muted-foreground">
                اقرأ كل سؤال بعناية. لا يمكنك العودة للسؤال السابق بعد الانتقال.
              </p>
            </div>

            <div className="flex gap-3">
              <Button size="lg" className="flex-1" onClick={beginExam} disabled={!questions.length}>
                <Play className="ml-1 h-4 w-4" /> بدء الحل
              </Button>
              <Link to="/exams">
                <Button size="lg" variant="outline">رجوع</Button>
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Question view
  const q = questions[idx];
  const progress = ((idx + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-soft">
      <Header variant="member" />
      <main className="container mx-auto px-4 py-8 max-w-2xl">
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
            <div className="text-xs text-muted-foreground mb-4">{q.marks} علامة</div>
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
              {idx + 1 === questions.length ? "إرسال الاختبار" : "التالي"}
            </Button>
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
