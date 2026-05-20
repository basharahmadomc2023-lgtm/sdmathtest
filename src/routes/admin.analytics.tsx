import { createFileRoute, Link } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { AdminGate } from "@/components/AdminGate";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";
import { Award, CheckCircle2, Clock, TrendingUp, Users } from "lucide-react";
import { motion } from "framer-motion";

export const Route = createFileRoute("/admin/analytics")({
  component: () => <AdminGate><Analytics /></AdminGate>,
});

function Analytics() {
  const [rows, setRows] = useState<any[]>([]);
  const [certs, setCerts] = useState<Record<string, string>>({});

  const load = async () => {
    const { data } = await supabase
      .from("attempts")
      .select("id, correct_count, wrong_count, total_time, finished_at, approved, members(name, membership_no), exams(title, level)")
      .not("finished_at", "is", null)
      .order("finished_at", { ascending: false })
      .limit(80);
    setRows(data ?? []);
    const { data: c } = await supabase.from("certificates").select("attempt_id, cert_number");
    const map: Record<string, string> = {};
    (c ?? []).forEach((x: any) => { map[x.attempt_id] = x.cert_number; });
    setCerts(map);
  };
  useEffect(() => { load(); }, []);

  const approve = async (r: any) => {
    if (certs[r.id]) return toast.info("تمت المصادقة مسبقاً");
    const cert_number = `SDM-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    const { error: e1 } = await supabase.from("attempts").update({ approved: true }).eq("id", r.id);
    const { error: e2 } = await supabase.from("certificates").insert({ attempt_id: r.id, cert_number });
    if (e1 || e2) return toast.error("فشلت المصادقة");
    toast.success("تمت المصادقة وإصدار الشهادة");
    load();
  };

  const ranked = [...rows].map((r) => {
    const total = r.correct_count + r.wrong_count;
    return { ...r, pct: total ? Math.round((r.correct_count / total) * 100) : 0 };
  });
  const topScores = [...ranked].sort((a, b) => b.pct - a.pct).slice(0, 10).map((r) => ({
    name: (r.members?.name ?? "—").slice(0, 12), score: r.pct,
  }));
  const fastest = [...ranked].filter((r) => r.total_time > 0).sort((a, b) => a.total_time - b.total_time).slice(0, 5);
  const avgScore = ranked.length ? Math.round(ranked.reduce((a, r) => a + r.pct, 0) / ranked.length) : 0;
  const avgTime = ranked.length ? Math.round(ranked.reduce((a, r) => a + (r.total_time ?? 0), 0) / ranked.length) : 0;
  const issued = Object.keys(certs).length;

  const stats = [
    { label: "إجمالي المحاولات", value: ranked.length, icon: Users, tone: "from-primary to-primary-glow" },
    { label: "متوسط النتائج", value: `${avgScore}%`, icon: TrendingUp, tone: "from-emerald-500 to-teal-500" },
    { label: "متوسط الزمن", value: `${Math.floor(avgTime / 60)}د`, icon: Clock, tone: "from-sky-500 to-cyan-500" },
    { label: "شهادات مُصدَرة", value: issued, icon: Award, tone: "from-amber-500 to-orange-500" },
  ];

  return (
    <div className="min-h-screen bg-gradient-soft" dir="rtl">
      <Header variant="admin" />
      <main className="container mx-auto px-4 py-10 sm:py-14">
        <div className="mb-8">
          <p className="text-sm text-primary font-medium mb-1">التحليلات</p>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">الاختبارات المنجزة</h1>
          <p className="text-muted-foreground mt-1.5">نظرة شاملة على أداء المشتركين، النتائج، والشهادات الصادرة.</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
          {stats.map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="card-premium p-5">
              <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${s.tone} text-white flex items-center justify-center shadow-soft mb-3`}>
                <s.icon className="h-5 w-5" />
              </div>
              <p className="text-2xl font-bold tracking-tight">{s.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
            </motion.div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-5 mb-6">
          <div className="card-premium p-5 lg:col-span-2">
            <h3 className="font-bold mb-4">أعلى 10 نتائج</h3>
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={topScores}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))" }} />
                  <Bar dataKey="score" fill="oklch(0.48 0.09 185)" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="card-premium p-5">
            <h3 className="font-bold mb-4">أسرع المشتركين</h3>
            <div className="space-y-3">
              {fastest.map((r, i) => (
                <div key={r.id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">{i + 1}</span>
                    <span className="truncate">{r.members?.name}</span>
                  </div>
                  <span className="text-muted-foreground text-xs">{Math.floor(r.total_time / 60)}د {r.total_time % 60}ث</span>
                </div>
              ))}
              {!fastest.length && <p className="text-muted-foreground text-sm text-center py-6">لا توجد بيانات</p>}
            </div>
          </div>
        </div>

        <div className="card-premium overflow-hidden">
          <div className="p-5 border-b">
            <h3 className="font-bold">جميع الاختبارات المنجزة</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[800px]">
              <thead className="bg-muted/50">
                <tr className="text-right">
                  <th className="p-3 font-medium">المشترك</th>
                  <th className="p-3 font-medium">رقم العضوية</th>
                  <th className="p-3 font-medium">الاختبار</th>
                  <th className="p-3 font-medium">المستوى</th>
                  <th className="p-3 font-medium">صحيح</th>
                  <th className="p-3 font-medium">خطأ</th>
                  <th className="p-3 font-medium">النسبة</th>
                  <th className="p-3 font-medium">الزمن</th>
                  <th className="p-3 font-medium">الحالة</th>
                  <th className="p-3"></th>
                </tr>
              </thead>
              <tbody>
                {ranked.map((r: any) => {
                  const certNo = certs[r.id];
                  return (
                    <tr key={r.id} className="border-t hover:bg-muted/30 transition-colors">
                      <td className="p-3 font-medium">{r.members?.name}</td>
                      <td className="p-3 text-muted-foreground font-mono text-xs">{r.members?.membership_no}</td>
                      <td className="p-3">{r.exams?.title}</td>
                      <td className="p-3 text-xs">{r.exams?.level === "advanced" ? "احترافي" : r.exams?.level === "intermediate" ? "متوسط" : "مبتدئ"}</td>
                      <td className="p-3 text-emerald-600 font-medium">{r.correct_count}</td>
                      <td className="p-3 text-destructive font-medium">{r.wrong_count}</td>
                      <td className="p-3 font-bold">{r.pct}%</td>
                      <td className="p-3 text-xs">{Math.floor((r.total_time ?? 0) / 60)}د</td>
                      <td className="p-3">
                        {certNo ? (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 font-medium inline-flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" /> مُصادَق
                          </span>
                        ) : (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 font-medium">بانتظار</span>
                        )}
                      </td>
                      <td className="p-3">
                        <div className="flex gap-1.5 justify-end">
                          <Link to="/admin/results/$attemptId" params={{ attemptId: r.id }}>
                            <Button size="sm" variant="ghost" className="rounded-full text-xs">عرض</Button>
                          </Link>
                          {!certNo && (
                            <Button size="sm" className="rounded-full text-xs" onClick={() => approve(r)}>
                              المصادقة على الاختبار
                            </Button>
                          )}
                          {certNo && (
                            <Link to="/certificate/$certNumber" params={{ certNumber: certNo }}>
                              <Button size="sm" variant="outline" className="rounded-full text-xs">
                                <Award className="h-3 w-3 ml-1" /> الشهادة
                              </Button>
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {!ranked.length && <tr><td colSpan={10} className="p-10 text-center text-muted-foreground">لا توجد نتائج بعد</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
