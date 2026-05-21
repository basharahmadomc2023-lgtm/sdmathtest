import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { memberSession } from "@/lib/session";
import { Clock, ListChecks, AlertCircle } from "lucide-react";
import { z } from "zod";

const searchSchema = z.object({ lvl: z.enum(["beginner", "intermediate", "advanced"]).optional() });

export const Route = createFileRoute("/exams/$id")({
  component: ExamIntro,
  validateSearch: searchSchema,
});

type Level = "beginner" | "intermediate" | "advanced";
const labels: Record<Level, string> = { beginner: "مبتدئ", intermediate: "متوسط", advanced: "احترافي" };

function ExamIntro() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [exam, setExam] = useState<any>(null);
  const [counts, setCounts] = useState<Record<Level, number>>({ beginner: 0, intermediate: 0, advanced: 0 });
  const [chosen, setChosen] = useState<Level | null>(null);

  useEffect(() => {
    if (!memberSession.get()) { navigate({ to: "/login" }); return; }
    (async () => {
      const { data: e } = await supabase.from("exams").select("*").eq("id", id).maybeSingle();
      setExam(e);
      const { data: qs } = await supabase.from("questions").select("level").eq("exam_id", id);
      const c: Record<Level, number> = { beginner: 0, intermediate: 0, advanced: 0 };
      (qs ?? []).forEach((q: any) => { const l = (q.level as Level) ?? "beginner"; c[l] = (c[l] ?? 0) + 1; });
      setCounts(c);
    })();
  }, [id, navigate]);

  if (!exam) return (
    <div className="min-h-screen bg-gradient-soft">
      <Header variant="member" />
      <main className="container mx-auto px-4 py-12"><p>جارٍ التحميل...</p></main>
    </div>
  );

  const total = counts.beginner + counts.intermediate + counts.advanced;
  const selectedCount = chosen ? counts[chosen] : 0;

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
              <p className="text-2xl font-bold">{total}</p>
              <p className="text-xs text-muted-foreground">عدد الأسئلة</p>
            </div>
            <div className="bg-accent rounded-xl p-4 text-center">
              <Clock className="h-6 w-6 text-primary mx-auto mb-1" />
              <p className="text-2xl font-bold">{Math.round(exam.total_time / 60)} د</p>
              <p className="text-xs text-muted-foreground">الزمن الكلي</p>
            </div>
          </div>

          <div className="bg-primary/5 border border-primary/15 rounded-xl p-4 text-sm flex gap-2 mb-4">
            <AlertCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <p className="text-muted-foreground">
              ملاحظة: اختر مستوى التدريب المناسب لك. سيتم عرض الأسئلة المطابقة للمستوى الذي تختاره فقط.
            </p>
          </div>

          <div className="space-y-2 mb-6">
            <p className="text-sm font-medium">اختر مستواك التدريبي</p>
            <div className="grid grid-cols-3 gap-2">
              {(["beginner", "intermediate", "advanced"] as Level[]).map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setChosen(l)}
                  className={`rounded-xl border px-3 py-3 text-sm font-medium transition-all ${chosen === l ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/40"}`}
                >
                  <div>{labels[l]}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">{counts[l]} سؤال</div>
                </button>
              ))}
            </div>
          </div>

          {chosen && selectedCount === 0 && (
            <p className="text-xs text-destructive mb-4">لا توجد أسئلة لهذا المستوى في هذا الاختبار.</p>
          )}

          <div className="flex gap-3">
            <Button
              size="lg"
              className="flex-1"
              disabled={!chosen || selectedCount === 0}
              onClick={() => chosen && navigate({ to: "/exams/$id/take", params: { id }, search: { lvl: chosen } })}
            >
              ابدأ الآن
            </Button>
            <Link to="/exams">
              <Button size="lg" variant="outline">رجوع</Button>
            </Link>
          </div>
        </div>
      </main>
    </main>
  );
}
