import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { AdminGate } from "@/components/AdminGate";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { generateCertificatePDF } from "@/lib/certificate";
import { toast } from "sonner";
import { Award, Download } from "lucide-react";

export const Route = createFileRoute("/admin/results/$attemptId")({
  component: () => <AdminGate><Result /></AdminGate>,
});

function Result() {
  const { attemptId } = Route.useParams();
  const [data, setData] = useState<any>(null);
  const [cert, setCert] = useState<any>(null);

  const load = async () => {
    const { data: a } = await supabase
      .from("attempts")
      .select("*, members(name, membership_no), exams(title)")
      .eq("id", attemptId).maybeSingle();
    setData(a);
    const { data: c } = await supabase.from("certificates").select("*").eq("attempt_id", attemptId).maybeSingle();
    setCert(c);
  };
  useEffect(() => { load(); }, [attemptId]);

  const approve = async () => {
    if (cert) return;
    const bytes = crypto.getRandomValues(new Uint8Array(4));
    const certNumber = `SDM-${Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')}`;
    await supabase.from("attempts").update({ approved: true }).eq("id", attemptId);
    const { data: c } = await supabase.from("certificates").insert({ attempt_id: attemptId, cert_number: certNumber }).select().single();
    setCert(c);
    toast.success("تم إصدار الشهادة");
  };

  const download = async () => {
    if (!data || !cert) return;
    const total = (data.correct_count ?? 0) + (data.wrong_count ?? 0);
    const pct = total ? Math.round((data.correct_count / total) * 100) : 0;
    await generateCertificatePDF({
      memberName: data.members?.name ?? "",
      examTitle: data.exams?.title ?? "",
      score: `${data.correct_count} / ${total} (${pct}%)`,
      date: new Date(cert.issued_at).toLocaleDateString("en-GB"),
      certNumber: cert.cert_number,
      verifyUrl: `${window.location.origin}/certificate/${encodeURIComponent(cert.cert_number)}`,
    });
  };

  if (!data) return <div className="min-h-screen bg-gradient-soft"><Header variant="admin" /><main className="container mx-auto px-4 py-10">جارٍ التحميل...</main></div>;

  const total = (data.correct_count ?? 0) + (data.wrong_count ?? 0);
  const pct = total ? Math.round((data.correct_count / total) * 100) : 0;

  return (
    <div className="min-h-screen bg-gradient-soft">
      <Header variant="admin" />
      <main className="container mx-auto px-4 py-10 max-w-2xl">
        <div className="bg-card border rounded-3xl p-8 shadow-elegant">
          <h1 className="text-2xl font-bold mb-1">نتيجة الطالب</h1>
          <p className="text-muted-foreground mb-6">{data.exams?.title}</p>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <Stat label="الطالب" value={data.members?.name} />
            <Stat label="رقم العضوية" value={data.members?.membership_no} dir="ltr" />
            <Stat label="إجابات صحيحة" value={data.correct_count} />
            <Stat label="إجابات خاطئة" value={data.wrong_count} />
            <Stat label="النسبة المئوية" value={`${pct}%`} />
            <Stat label="الزمن الكلي" value={`${Math.floor((data.total_time ?? 0) / 60)} دقيقة`} />
          </div>

          {cert ? (
            <div className="bg-success/10 border border-success/30 rounded-2xl p-5">
              <p className="font-bold flex items-center gap-2"><Award className="h-5 w-5 text-success" /> الشهادة صادرة</p>
              <p className="text-sm text-muted-foreground mt-1">رقم: <span dir="ltr">{cert.cert_number}</span></p>
              <Button onClick={download} className="mt-4"><Download className="ml-1 h-4 w-4" /> تحميل الشهادة PDF</Button>
            </div>
          ) : (
            <Button onClick={approve} size="lg" className="w-full"><Award className="ml-1 h-5 w-5" /> الموافقة وإصدار الشهادة</Button>
          )}
        </div>
      </main>
    </div>
  );
}

function Stat({ label, value, dir }: { label: string; value: any; dir?: string }) {
  return (
    <div className="bg-accent rounded-xl p-4">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className="text-lg font-bold" dir={dir}>{value}</p>
    </div>
  );
}
