import { createFileRoute, Link } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { AdminGate } from "@/components/AdminGate";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Users, FileText, Award, BarChart3, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

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
    { label: "المشتركين", value: stats.members, icon: Users, link: "/admin/members" },
    { label: "المقبولين", value: stats.approved, icon: CheckCircle2, link: "/admin/members" },
    { label: "الاختبارات", value: stats.exams, icon: FileText, link: "/admin/exams" },
    { label: "الاختبارات المنجزة", value: stats.attempts, icon: BarChart3, link: "/admin/analytics" },
    { label: "الشهادات", value: stats.certs, icon: Award, link: "/admin/analytics" },
    { label: "متوسط النتائج", value: `${stats.avg}%`, icon: BarChart3, link: "/admin/analytics" },
  ];

  return (
    <div className="min-h-screen bg-gradient-soft">
      <Header variant="admin" />
      <main className="container mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold mb-2">لوحة التحكم</h1>
        <p className="text-muted-foreground mb-8">نظرة عامة على نشاط المنصة</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {cards.map((c, i) => (
            <motion.div key={c.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Link to={c.link} className="block bg-card border rounded-2xl p-6 shadow-soft hover:shadow-elegant transition-shadow">
                <c.icon className="h-7 w-7 text-primary mb-3" />
                <p className="text-3xl font-bold">{c.value}</p>
                <p className="text-sm text-muted-foreground mt-1">{c.label}</p>
              </Link>
            </motion.div>
          ))}
        </div>
      </main>
    </div>
  );
}
