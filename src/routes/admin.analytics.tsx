import { createFileRoute, Link } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { AdminGate } from "@/components/AdminGate";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";

export const Route = createFileRoute("/admin/analytics")({
  component: () => <AdminGate><Analytics /></AdminGate>,
});

function Analytics() {
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("attempts")
        .select("id, correct_count, wrong_count, total_time, finished_at, members(name), exams(title)")
        .not("finished_at", "is", null)
        .order("finished_at", { ascending: false })
        .limit(50);
      setRows(data ?? []);
    })();
  }, []);

  const chartData = rows.slice(0, 10).map((r: any) => ({
    name: r.members?.name?.slice(0, 10) ?? "—",
    score: r.correct_count + r.wrong_count ? Math.round((r.correct_count / (r.correct_count + r.wrong_count)) * 100) : 0,
  }));

  return (
    <div className="min-h-screen bg-gradient-soft">
      <Header variant="admin" />
      <main className="container mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold mb-6">التحليلات والنتائج</h1>

        <div className="bg-card border rounded-2xl p-6 shadow-soft mb-6">
          <h3 className="font-bold mb-4">أعلى 10 نتائج</h3>
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={chartData}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="score" fill="oklch(0.48 0.09 185)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-card border rounded-2xl overflow-hidden shadow-soft">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr className="text-right">
                <th className="p-3">الطالب</th>
                <th className="p-3">الاختبار</th>
                <th className="p-3">صحيح</th>
                <th className="p-3">خطأ</th>
                <th className="p-3">النسبة</th>
                <th className="p-3">الزمن</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r: any) => {
                const total = r.correct_count + r.wrong_count;
                const pct = total ? Math.round((r.correct_count / total) * 100) : 0;
                return (
                  <tr key={r.id} className="border-t">
                    <td className="p-3 font-medium">{r.members?.name}</td>
                    <td className="p-3">{r.exams?.title}</td>
                    <td className="p-3 text-success">{r.correct_count}</td>
                    <td className="p-3 text-destructive">{r.wrong_count}</td>
                    <td className="p-3 font-bold">{pct}%</td>
                    <td className="p-3">{Math.floor((r.total_time ?? 0) / 60)}د</td>
                    <td className="p-3">
                      <Link to="/admin/results/$attemptId" params={{ attemptId: r.id }}><Button size="sm" variant="outline">عرض</Button></Link>
                    </td>
                  </tr>
                );
              })}
              {!rows.length && <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">لا توجد نتائج</td></tr>}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
