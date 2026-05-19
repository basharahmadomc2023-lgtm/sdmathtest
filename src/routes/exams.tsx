import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { memberSession } from "@/lib/session";
import { Clock, ListChecks, Play } from "lucide-react";

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
    if (!session) {
      navigate({ to: "/login" });
      return;
    }
    (async () => {
      const { data: examsData } = await supabase
        .from("exams")
        .select("id, title, description, level, total_time")
        .eq("is_published", true)
        .order("created_at", { ascending: false });
      // get question counts
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

  return (
    <div className="min-h-screen bg-gradient-soft">
      <Header variant="member" />
      <main className="container mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-2">الاختبارات المتاحة</h1>
        <p className="text-muted-foreground mb-8">اختر اختباراً لبدء التحدي</p>

        {loading ? (
          <p className="text-muted-foreground">جارٍ التحميل...</p>
        ) : exams.length === 0 ? (
          <div className="bg-card border rounded-2xl p-12 text-center">
            <p className="text-muted-foreground">لا توجد اختبارات منشورة حالياً.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {exams.map((e, i) => (
              <motion.div
                key={e.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-card border rounded-2xl p-6 shadow-soft hover:shadow-elegant transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-bold">{e.title}</h3>
                  <span className="text-xs bg-accent text-accent-foreground rounded-full px-2.5 py-1">
                    {levelLabel(e.level)}
                  </span>
                </div>
                {e.description && <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{e.description}</p>}
                <div className="flex gap-4 text-sm text-muted-foreground mb-5">
                  <span className="flex items-center gap-1"><ListChecks className="h-4 w-4" /> {e.question_count} سؤال</span>
                  <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> {Math.round(e.total_time / 60)} دقيقة</span>
                </div>
                <Link to="/exams/$id" params={{ id: e.id }}>
                  <Button className="w-full"><Play className="ml-1 h-4 w-4" /> بدء الاختبار</Button>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
