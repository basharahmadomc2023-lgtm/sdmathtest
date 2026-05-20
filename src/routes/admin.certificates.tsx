import { createFileRoute, Link } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { AdminGate } from "@/components/AdminGate";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Award, Trash2, ExternalLink, Download } from "lucide-react";
import { motion } from "framer-motion";
import { generateCertificatePDF } from "@/lib/certificate";

export const Route = createFileRoute("/admin/certificates")({
  component: () => <AdminGate><CertsAdmin /></AdminGate>,
});

function CertsAdmin() {
  const [rows, setRows] = useState<any[]>([]);
  const load = async () => {
    const { data } = await supabase
      .from("certificates")
      .select("id, cert_number, issued_at, attempts(id, correct_count, wrong_count, total_time, members(name, membership_no), exams(title, level))")
      .order("issued_at", { ascending: false });
    setRows(data ?? []);
  };
  useEffect(() => { load(); }, []);

  const del = async (id: string) => {
    if (!confirm("حذف الشهادة؟")) return;
    await supabase.from("certificates").delete().eq("id", id);
    toast.success("تم الحذف");
    load();
  };

  const download = async (r: any) => {
    const att = r.attempts;
    const total = (att?.correct_count ?? 0) + (att?.wrong_count ?? 0);
    const pct = total ? Math.round((att.correct_count / total) * 100) : 0;
    await generateCertificatePDF({
      memberName: att?.members?.name ?? "—",
      examTitle: att?.exams?.title ?? "—",
      score: `${pct}%`,
      date: new Date(r.issued_at).toLocaleDateString("ar"),
      certNumber: r.cert_number,
      verifyUrl: `${window.location.origin}/certificate/${r.cert_number}`,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-soft" dir="rtl">
      <Header variant="admin" />
      <main className="container mx-auto px-4 py-10 sm:py-14">
        <div className="mb-8">
          <p className="text-sm text-primary font-medium mb-1">المصادقات</p>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">الشهادات</h1>
          <p className="text-muted-foreground mt-1.5">جميع الشهادات الصادرة للمشتركين بعد المصادقة.</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {rows.map((r, i) => {
            const att = r.attempts;
            const total = (att?.correct_count ?? 0) + (att?.wrong_count ?? 0);
            const pct = total ? Math.round((att.correct_count / total) * 100) : 0;
            return (
              <motion.div key={r.id}
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                className="card-premium p-5">
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 text-white flex items-center justify-center shadow-soft">
                    <Award className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold truncate">{att?.members?.name ?? "—"}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{att?.exams?.title}</p>
                    <p className="text-[11px] text-muted-foreground mt-1 font-mono">#{r.cert_number}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs mb-4">
                  <span className="text-muted-foreground">النتيجة</span>
                  <span className="font-bold text-primary">{pct}%</span>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="rounded-full flex-1" onClick={() => download(r)}>
                    <Download className="h-3.5 w-3.5 ml-1" /> تحميل
                  </Button>
                  <Link to="/certificate/$certNumber" params={{ certNumber: r.cert_number }}>
                    <Button size="sm" variant="outline" className="rounded-full">
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                  <Button size="sm" variant="outline" className="rounded-full" onClick={() => del(r.id)}>
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
              </motion.div>
            );
          })}
          {!rows.length && (
            <div className="col-span-full text-center py-20 text-muted-foreground border-2 border-dashed rounded-2xl">
              لا توجد شهادات بعد. صادق على نتائج المشتركين من قسم التحليلات.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
