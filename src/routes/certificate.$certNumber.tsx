import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Award, CheckCircle2, XCircle } from "lucide-react";

export const Route = createFileRoute("/certificate/$certNumber")({
  component: Verify,
});

function Verify() {
  const { certNumber } = Route.useParams();
  const [state, setState] = useState<"loading" | "valid" | "invalid">("loading");
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    (async () => {
      const { data: c } = await supabase
        .from("certificates")
        .select("*, attempts(correct_count, wrong_count, members(name), exams(title))")
        .eq("cert_number", certNumber)
        .maybeSingle();
      if (!c) { setState("invalid"); return; }
      setData(c);
      setState("valid");
    })();
  }, [certNumber]);

  return (
    <div className="min-h-screen bg-gradient-soft">
      <Header />
      <main className="container mx-auto px-4 py-16 max-w-md text-center">
        {state === "loading" && <p>جارٍ التحقق...</p>}
        {state === "invalid" && (
          <div className="bg-card border rounded-3xl p-10 shadow-elegant">
            <XCircle className="h-16 w-16 mx-auto text-destructive mb-3" />
            <h1 className="text-2xl font-bold">شهادة غير صالحة</h1>
            <p className="text-muted-foreground mt-2">لم نتمكن من العثور على هذه الشهادة.</p>
          </div>
        )}
        {state === "valid" && data && (
          <div className="bg-card border rounded-3xl p-10 shadow-elegant">
            <div className="w-16 h-16 mx-auto rounded-full bg-gradient-hero text-primary-foreground flex items-center justify-center mb-3">
              <Award className="h-8 w-8" />
            </div>
            <CheckCircle2 className="h-6 w-6 text-success mx-auto mb-2" />
            <h1 className="text-2xl font-bold mb-1">شهادة موثّقة</h1>
            <p className="text-sm text-muted-foreground mb-6">صادرة من منصة SDMATH</p>
            <div className="text-right space-y-3 bg-accent rounded-2xl p-5">
              <Row label="الطالب" value={data.attempts?.members?.name} />
              <Row label="الاختبار" value={data.attempts?.exams?.title} />
              <Row label="رقم الشهادة" value={data.cert_number} dir="ltr" />
              <Row label="تاريخ الإصدار" value={new Date(data.issued_at).toLocaleDateString("ar-EG")} />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function Row({ label, value, dir }: { label: string; value: any; dir?: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-bold" dir={dir}>{value}</span>
    </div>
  );
}
