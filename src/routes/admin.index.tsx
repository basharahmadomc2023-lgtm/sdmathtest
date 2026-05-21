import { createFileRoute, Link } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { AdminGate } from "@/components/AdminGate";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Users, FileText, Award, BarChart3, CheckCircle2, TrendingUp, PlusCircle } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin/")({
  component: () => <AdminGate><Dash /></AdminGate>,
});

function Dash() {
  const [stats, setStats] = useState({ members: 0, approved: 0, exams: 0, attempts: 0, certs: 0, avg: 0 });
  useEffect(() => {
    (async () => {
      const [m, a, e, at, c] = await Promise.all([
        supabase.from("members").select("*", { count: "exact", head: true }),
        supabase.from("members").select("*", { count: "exact", head: true }).eq("status", "approved"),
        supabase.from("exams").select("*", { count: "exact", head: true }),
        supabase.from("attempts").select("correct_count, wrong_count", { count: "exact" }).not("finished_at", "is", null),
        supabase.from("certificates").select("*", { count: "exact", head: true }),
      ]);
      const attempts = at.data ?? [];
      const totalPct = attempts.reduce((acc, x: any) => {
        const t = (x.correct_count ?? 0) + (x.wrong_count ?? 0);
        return acc + (t ? (x.correct_count / t) * 100 : 0);
      }, 0);
      const avg = attempts.length ? Math.round(totalPct / attempts.length) : 0;
      setStats({
        members: m.count ?? 0,
        approved: a.count ?? 0,
        exams: e.count ?? 0,
        attempts: at.count ?? 0,
        certs: c.count ?? 0,
        avg,
      });
    })();
  }, []);

  const cards = [
    { label: "المشتركين", value: stats.members, icon: Users, link: "/admin/members", tone: "from-primary to-primary-glow" },
    { label: "المقبولين", value: stats.approved, icon: CheckCircle2, link: "/admin/members", tone: "from-emerald-500 to-teal-500" },
    { label: "الاختبارات", value: stats.exams, icon: FileText, link: "/admin/exams", tone: "from-sky-500 to-cyan-500" },
    { label: "الاختبارات المنجزة", value: stats.attempts, icon: BarChart3, link: "/admin/analytics", tone: "from-indigo-500 to-violet-500" },
    { label: "الشهادات", value: stats.certs, icon: Award, link: "/admin/certificates", tone: "from-amber-500 to-orange-500" },
    { label: "متوسط النتائج", value: `${stats.avg}%`, icon: TrendingUp, link: "/admin/analytics", tone: "from-rose-500 to-pink-500" },
  ];

  return (
    <div className="min-h-screen bg-gradient-soft">
      <Header variant="admin" />
      <main className="container mx-auto px-4 py-10 sm:py-14">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-8 sm:mb-10">
          <p className="text-sm text-primary font-medium mb-1">لوحة التحكم</p>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">نظرة عامة</h1>
          <p className="text-muted-foreground mt-1.5">ملخّص نشاط منصة SDMATH في الوقت الحالي.</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="mb-6"
        >
          <Link to="/admin/create-exam" className="card-premium block p-5 sm:p-6 group">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-primary-glow text-white flex items-center justify-center shadow-soft group-hover:scale-105 transition-transform">
                <PlusCircle className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <p className="text-lg sm:text-xl font-bold tracking-tight">إنشاء اختبار</p>
                <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">صفحة الاختبار – أنشئ اختباراً جديداً مع مجموعات الأسئلة والمستويات</p>
              </div>
              <Button variant="outline" className="rounded-full hidden sm:inline-flex">فتح</Button>
            </div>
          </Link>
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {cards.map((c, i) => (
            <motion.div
              key={c.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              <Link to={c.link} className="card-premium p-5 sm:p-6 block group">
                <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${c.tone} text-white flex items-center justify-center mb-4 shadow-soft group-hover:scale-105 transition-transform`}>
                  <c.icon className="h-5 w-5" />
                </div>
                <p className="text-2xl sm:text-3xl font-bold tracking-tight">{c.value}</p>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">{c.label}</p>
              </Link>
            </motion.div>
          ))}
        </div>
      </main>
    </div>
  );
}
