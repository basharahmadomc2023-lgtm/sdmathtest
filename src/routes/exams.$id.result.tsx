import { createFileRoute, Link } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { CheckCircle2, XCircle, Clock, Trophy } from "lucide-react";

export const Route = createFileRoute("/exams/$id/result")({
  validateSearch: (s: Record<string, unknown>) => ({ attempt: (s.attempt as string) || "" }),
  component: Result,
});

function Result() {
  const { attempt } = Route.useSearch();
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    if (!attempt) return;
    (async () => {
      const { data: a } = await supabase.from("attempts").select("*, exams(title)").eq("id", attempt).maybeSingle();
      setData(a);
    })();
  }, [attempt]);

  if (!data) return <div className="min-h-screen bg-gradient-soft"><Header variant="member" /><main className="container mx-auto px-4 py-12">جارٍ التحميل...</main></div>;

  const total = (data.correct_count ?? 0) + (data.wrong_count ?? 0);
  const pct = total ? Math.round((data.correct_count / total) * 100) : 0;
  const msg = pct >= 80 ? "أداء استثنائي! 🎉" : pct >= 60 ? "أداء جيد، استمر!" : "لا تستسلم، حاول مرة أخرى.";

  return (
    <div className="min-h-screen bg-gradient-soft">
      <Header variant="member" />
      <main className="container mx-auto px-4 py-12 max-w-2xl">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-card border rounded-3xl p-10 shadow-elegant text-center">
          <div className="w-20 h-20 mx-auto rounded-full bg-gradient-hero text-primary-foreground flex items-center justify-center mb-4">
            <Trophy className="h-10 w-10" />
          </div>
          <h1 className="text-3xl font-bold mb-1">انتهى الاختبار</h1>
          <p className="text-muted-foreground mb-8">{data.exams?.title}</p>

          <div className="text-6xl font-black bg-gradient-hero bg-clip-text text-transparent mb-2">{pct}%</div>
          <p className="text-lg mb-8">{msg}</p>

          <div className="grid grid-cols-3 gap-3 mb-8">
            <div className="bg-accent rounded-xl p-4">
              <CheckCircle2 className="h-5 w-5 mx-auto text-success mb-1" />
              <p className="text-2xl font-bold">{data.correct_count}</p>
              <p className="text-xs text-muted-foreground">صحيحة</p>
            </div>
            <div className="bg-accent rounded-xl p-4">
              <XCircle className="h-5 w-5 mx-auto text-destructive mb-1" />
              <p className="text-2xl font-bold">{data.wrong_count}</p>
              <p className="text-xs text-muted-foreground">خاطئة</p>
            </div>
            <div className="bg-accent rounded-xl p-4">
              <Clock className="h-5 w-5 mx-auto text-primary mb-1" />
              <p className="text-2xl font-bold">{Math.floor(data.total_time / 60)}:{String(data.total_time % 60).padStart(2, "0")}</p>
              <p className="text-xs text-muted-foreground">الزمن</p>
            </div>
          </div>

          <Link to="/exams"><Button size="lg" className="w-full">العودة للاختبارات</Button></Link>
        </motion.div>
      </main>
    </div>
  );
}
