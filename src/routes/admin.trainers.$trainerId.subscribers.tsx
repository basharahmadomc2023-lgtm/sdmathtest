import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { AdminGate } from "@/components/AdminGate";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowRight, Check, X } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

export const Route = createFileRoute("/admin/trainers/$trainerId/subscribers")({
  head: () => ({ meta: [{ title: "مشتركو المدرب — SDMATH" }] }),
  component: () => <AdminGate><Page /></AdminGate>,
});

function Page() {
  const { trainerId } = useParams({ from: "/admin/trainers/$trainerId/subscribers" });
  const [trainer, setTrainer] = useState<any>(null);
  const [subs, setSubs] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);
  const [allowed, setAllowed] = useState<Record<string, Set<string>>>({});
  const [completed, setCompleted] = useState<Record<string, number>>({});

  const load = async () => {
    const { data: t } = await supabase.from("trainers").select("*").eq("id", trainerId).maybeSingle();
    setTrainer(t);
    if (!t) return;
    const { data: m } = await supabase
      .from("members")
      .select("id,name")
      .or(`trainer_id.eq.${t.id},trainer_name.eq.${t.full_name}`);
    setSubs(m ?? []);
    const { data: ex } = await supabase.from("exams").select("id,title").order("created_at", { ascending: false });
    setExams(ex ?? []);
    const ids = (m ?? []).map((x) => x.id);
    if (ids.length) {
      const { data: sa } = await supabase
        .from("subscriber_allowed_exams")
        .select("member_id,exam_id")
        .in("member_id", ids);
      const map: Record<string, Set<string>> = {};
      (sa ?? []).forEach((r: any) => {
        (map[r.member_id] ??= new Set()).add(r.exam_id);
      });
      setAllowed(map);
      const { data: at } = await supabase
        .from("attempts")
        .select("member_id")
        .not("finished_at", "is", null)
        .in("member_id", ids);
      const c: Record<string, number> = {};
      (at ?? []).forEach((r: any) => { c[r.member_id] = (c[r.member_id] ?? 0) + 1; });
      setCompleted(c);
    }
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [trainerId]);

  const toggle = async (memberId: string, examId: string, allow: boolean) => {
    if (allow) {
      await supabase.from("subscriber_allowed_exams").insert({ member_id: memberId, exam_id: examId } as any);
    } else {
      await supabase.from("subscriber_allowed_exams").delete().eq("member_id", memberId).eq("exam_id", examId);
    }
    setAllowed((prev) => {
      const next = { ...prev };
      const set = new Set(next[memberId] ?? []);
      if (allow) set.add(examId); else set.delete(examId);
      next[memberId] = set;
      return next;
    });
    toast.success(allow ? "تم السماح بالاختبار" : "تم إلغاء السماح");
  };

  if (!trainer) return null;

  return (
    <div className="min-h-screen bg-gradient-soft">
      <Header variant="admin" />
      <main className="container mx-auto px-4 py-10 sm:py-14 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="text-sm text-primary font-medium mb-1">إدارة المشتركين</p>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">مشتركو المدرب: {trainer.full_name}</h1>
          </div>
          <Link to="/admin/trainers"><Button variant="outline" className="rounded-full"><ArrowRight className="ml-1 h-4 w-4" /> رجوع</Button></Link>
        </div>

        <section className="card-premium overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/60">
                <tr className="text-right">
                  <th className="p-4 font-semibold">اسم المشترك</th>
                  <th className="p-4 font-semibold">عدد الاختبارات المنجزة</th>
                  <th className="p-4 font-semibold min-w-[260px]">الاختبارات المتاحة</th>
                  <th className="p-4 font-semibold min-w-[260px]">الاختبارات المسموحة</th>
                </tr>
              </thead>
              <tbody>
                {subs.map((s) => {
                  const allow = allowed[s.id] ?? new Set<string>();
                  return (
                    <tr key={s.id} className="border-t border-border/60 align-top">
                      <td className="p-4 font-medium">{s.name}</td>
                      <td className="p-4">{completed[s.id] ?? 0}</td>
                      <td className="p-4">
                        <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                          {exams.map((ex) => (
                            <label key={ex.id} className="flex items-center gap-2 cursor-pointer">
                              <Checkbox
                                checked={allow.has(ex.id)}
                                onCheckedChange={(v) => toggle(s.id, ex.id, !!v)}
                              />
                              <span className="text-sm">{ex.title}</span>
                            </label>
                          ))}
                          {!exams.length && <p className="text-xs text-muted-foreground">لا توجد اختبارات</p>}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-wrap gap-2">
                          {[...allow].map((id) => {
                            const ex = exams.find((e) => e.id === id);
                            if (!ex) return null;
                            return (
                              <span key={id} className="inline-flex items-center gap-1.5 text-[12px] rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 px-2.5 py-1">
                                <Check className="h-3 w-3" /> {ex.title}
                                <button onClick={() => toggle(s.id, id, false)} className="ml-1 hover:text-rose-700">
                                  <X className="h-3 w-3" />
                                </button>
                              </span>
                            );
                          })}
                          {!allow.size && <span className="text-xs text-muted-foreground">لا يوجد اختبارات مسموحة</span>}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {!subs.length && (
                  <tr><td colSpan={4} className="p-12 text-center text-muted-foreground">لا يوجد مشتركون مرتبطون بهذا المدرب</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
