import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { memberSession } from "@/lib/session";
import { Clock, ListChecks, AlertCircle } from "lucide-react";

export const Route = createFileRoute("/exams/$id")({
  component: ExamIntro,
});

function ExamIntro() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [exam, setExam] = useState<any>(null);
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!memberSession.get()) { navigate({ to: "/login" }); return; }
    (async () => {
      const { data: e } = await supabase.from("exams").select("*").eq("id", id).maybeSingle();
      setExam(e);
      const { count: c } = await supabase.from("questions").select("*", { count: "exact", head: true }).eq("exam_id", id);
      setCount(c ?? 0);
    })();
  }, [id, navigate]);

  if (!exam) return (
    <div className="min-h-screen bg-gradient-soft">
      <Header variant="member" />
      <main className="container mx-auto px-4 py-12"><p>جارٍ التحميل...</p></main>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-soft">
      <Header variant="member" />
      <main className="container mx-auto px-4 py-12 max-w-2xl">
        <div className="bg-card border rounded-3xl p-10 shadow-elegant">
          <h1 className="text-3xl font-bold mb-2">{exam.title}</h1>
          {exam.description && <p className="text-muted-foreground mb-6">{exam.description}</p>}

          <div className="grid grid-cols-2 gap-4 my-8">
            <div className="bg-accent rounded-xl p-4 text-center">
              <ListChecks className="h-6 w-6 text-primary mx-auto mb-1" />
              <p className="text-2xl font-bold">{count}</p>
              <p className="text-xs text-muted-foreground">عدد الأسئلة</p>
            </div>
            <div className="bg-accent rounded-xl p-4 text-center">
              <Clock className="h-6 w-6 text-primary mx-auto mb-1" />
              <p className="text-2xl font-bold">{Math.round(exam.total_time / 60)} د</p>
              <p className="text-xs text-muted-foreground">الزمن الكلي</p>
            </div>
          </div>

          <div className="bg-muted rounded-xl p-4 text-sm flex gap-2 mb-6">
            <AlertCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <p className="text-muted-foreground">
              عند البدء سيظهر سؤال واحد في كل مرة مع مؤقت. {exam.allow_back ? "يمكنك الرجوع للأسئلة السابقة." : "لا يمكن الرجوع للأسئلة السابقة."}
            </p>
          </div>

          <div className="flex gap-3">
            <Link to="/exams/$id/take" params={{ id }} className="flex-1">
              <Button size="lg" className="w-full">ابدأ الآن</Button>
            </Link>
            <Link to="/exams">
              <Button size="lg" variant="outline">رجوع</Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
