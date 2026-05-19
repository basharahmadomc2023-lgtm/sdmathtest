import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { memberSession } from "@/lib/session";
import { Clock, ListChecks, Play, Sparkles } from "lucide-react";

export const Route = createFileRoute("/exams")({
  head: () => ({ meta: [{ title: "الاختبارات المتاحة — SDMATH" }] }),
  component: ExamsList,
});

type Exam = { id: string; title: string; description: string | null; level: string; total_time: number; question_count?: number };

function ExamsList() {
  const navigate = useNavigate();
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const session = memberSession.get();
    if (!session) { navigate({ to: "/login" }); return; }
    (async () => {
      const { data: examsData } = await supabase
        .from("exams")
        .select("id, title, description, level, total_time")
        .eq("is_published", true)
        .order("created_at", { ascending: false });
      const ids = (examsData ?? []).map((e) => e.id);
      const counts: Record<string, number> = {};
      if (ids.length) {
        const { data: qs } = await supabase.from("questions").select("exam_id").in("exam_id", ids);
        qs?.forEach((q: any) => { counts[q.exam_id] = (counts[q.exam_id] ?? 0) + 1; });
      }
      setExams((examsData ?? []).map((e) => ({ ...e, question_count: counts[e.id] ?? 0 })));
      setLoading(false);
    })();
  }, [navigate]);

  const levelLabel = (l: string) => l === "beginner" ? "مبتدئ" : l === "intermediate" ? "متوسط" : "صعب";
  const levelTone = (l: string) =>
    l === "beginner" ? "bg-success/10 text-success border-success/20" :
    l === "intermediate" ? "bg-primary/10 text-primary border-primary/20" :
    "bg-destructive/10 text-destructive border-destructive/20";

  return (
    <div className="min-h-screen bg-gradient-soft">
      <Header variant="member" />
      <main className="container mx-auto px-4 py-10 sm:py-14">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8 sm:mb-10"
        >
          <div className="inline-flex items-center gap-1.5 text-xs font-medium text-primary mb-2">
            <Sparkles className="h-3.5 w-3.5" /> مكتبة الاختبارات
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">الاختبارات المتاحة</h1>
          <p className="text-muted-foreground mt-1.5">اختر اختباراً لبدء التحدي</p>
        </motion.div>

        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="card-premium p-6 h-44 animate-pulse" />
            ))}
          </div>
        ) : exams.length === 0 ? (
          <div className="card-premium p-12 text-center">
            <p className="text-muted-foreground">لا توجد اختبارات منشورة حالياً.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {exams.map((e, i) => (
              <motion.div
                key={e.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="card-premium p-6 flex flex-col"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <h3 className="text-lg font-bold leading-snug">{e.title}</h3>
                  <span className={`shrink-0 text-[11px] rounded-full px-2.5 py-1 border ${levelTone(e.level)}`}>
                    {levelLabel(e.level)}
                  </span>
                </div>
                {e.description && <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{e.description}</p>}
                <div className="flex gap-4 text-xs text-muted-foreground mb-5 mt-auto">
                  <span className="flex items-center gap-1"><ListChecks className="h-3.5 w-3.5" /> {e.question_count} سؤال</span>
                  <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {Math.round(e.total_time / 60)} دقيقة</span>
                </div>
                <Link to="/exams/$id" params={{ id: e.id }}>
                  <Button className="w-full rounded-full shadow-soft"><Play className="ml-1 h-4 w-4" /> بدء الاختبار</Button>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
