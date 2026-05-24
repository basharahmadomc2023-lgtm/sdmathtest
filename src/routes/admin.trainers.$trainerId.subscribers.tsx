import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { AdminGate } from "@/components/AdminGate";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowRight, Plus, X, CircleCheck as CheckCircle2 } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/admin/trainers/$trainerId/subscribers")({
  head: () => ({ meta: [{ title: "مشتركي المدرب — SDMATH" }] }),
  component: () => <AdminGate><TrainerSubscribers /></AdminGate>,
});

type Member = {
  id: string;
  name: string;
  membership_no: string;
  completed_worksheets_count: number;
  final_certificate_status: string;
  final_certificate_url: string | null;
};

type Exam = {
  id: string;
  title: string;
  level: string;
};

type Attempt = {
  id: string;
  exam_id: string;
  member_id: string;
  correct_count: number;
  wrong_count: number;
  finished_at: string | null;
};

function TrainerSubscribers() {
  const { trainerId } = useParams({ from: "/admin/trainers/$trainerId/subscribers" });
  const [trainer, setTrainer] = useState<any>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [allowedMap, setAllowedMap] = useState<Record<string, string[]>>({});
  const [attemptCounts, setAttemptCounts] = useState<Record<string, number>>({});
  const [examScores, setExamScores] = useState<Record<string, Record<string, { correct: number; total: number }>>>({});
  const [addOpen, setAddOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<string>("");
  const [unassigned, setUnassigned] = useState<any[]>([]);
  const [permOpen, setPermOpen] = useState<string | null>(null);

  const load = async () => {
    const { data: t } = await supabase.from("trainers").select("id,full_name,membership_number").eq("id", trainerId).maybeSingle();
    setTrainer(t);
    if (!t) return;

    // Members linked to this trainer
    const { data: m } = await supabase
      .from("members")
      .select("id,name,membership_no,completed_worksheets_count,final_certificate_status,final_certificate_url")
      .or(`trainer_id.eq.${t.id},trainer_name.eq.${t.full_name}`);
    setMembers((m ?? []) as Member[]);

    // All published exams
    const { data: e } = await supabase.from("exams").select("id,title,level").eq("is_published", true).order("title");
    setExams(e ?? []);

    // Allowed exams per member
    const { data: ae } = await supabase.from("member_allowed_exams").select("member_id,exam_id").in("member_id", (m ?? []).map((x: any) => x.id));
    const map: Record<string, string[]> = {};
    ae?.forEach((r: any) => {
      if (!map[r.member_id]) map[r.member_id] = [];
      map[r.member_id].push(r.exam_id);
    });
    setAllowedMap(map);

    // Attempt counts and scores per member
    if ((m ?? []).length > 0) {
      const memberIds = (m ?? []).map((x: any) => x.id);
      const { data: att } = await supabase
        .from("attempts")
        .select("id,exam_id,member_id,correct_count,wrong_count,finished_at")
        .in("member_id", memberIds)
        .not("finished_at", "is", null);
      const counts: Record<string, number> = {};
      const scores: Record<string, Record<string, { correct: number; total: number }>> = {};
      att?.forEach((a: any) => {
        counts[a.member_id] = (counts[a.member_id] ?? 0) + 1;
        if (!scores[a.member_id]) scores[a.member_id] = {};
        const existing = scores[a.member_id][a.exam_id];
        if (!existing) {
          scores[a.member_id][a.exam_id] = { correct: a.correct_count, total: a.correct_count + a.wrong_count };
        }
      });
      setAttemptCounts(counts);
      setExamScores(scores);
    }

    // Unassigned members
    const { data: u } = await supabase
      .from("members")
      .select("id,name,coach_name,trainer_name")
      .is("trainer_id", null);
    setUnassigned(u ?? []);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [trainerId]);

  if (!trainer) return null;

  const assignMember = async () => {
    if (!selectedMember) return;
    await supabase.from("members").update({ trainer_id: trainer.id, trainer_name: trainer.full_name }).eq("id", selectedMember);
    toast.success("تم تعيين المشترك للمدرب");
    setAddOpen(false);
    setSelectedMember("");
    load();
  };

  const toggleExam = async (memberId: string, examId: string, currentlyAllowed: boolean) => {
    if (currentlyAllowed) {
      await supabase.from("member_allowed_exams").delete().eq("member_id", memberId).eq("exam_id", examId);
      toast.success("تم إلغاء السماح بالاختبار");
    } else {
      await supabase.from("member_allowed_exams").insert({ member_id: memberId, exam_id: examId });
      toast.success("تم السماح بالاختبار");
    }
    load();
  };

  const certBadge = (s: string) => {
    const map: Record<string, string> = {
      issued: "bg-emerald-100 text-emerald-800 border-emerald-200",
      pending: "bg-amber-100 text-amber-800 border-amber-200",
      not_eligible: "bg-rose-100 text-rose-800 border-rose-200",
    };
    const labels: Record<string, string> = { issued: "صادرة", pending: "قيد الانتظار", not_eligible: "غير مؤهل" };
    return <span className={`text-[11px] rounded-full px-2.5 py-1 border ${map[s] ?? map.pending}`}>{labels[s] ?? s}</span>;
  };

  return (
    <div className="min-h-screen bg-gradient-soft">
      <Header variant="admin" />
      <main className="container mx-auto px-4 py-10 sm:py-14 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="text-sm text-primary font-medium mb-1">مشتركين المدرب</p>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">{trainer.full_name}</h1>
          </div>
          <div className="flex flex-wrap gap-3">
            <Dialog open={addOpen} onOpenChange={setAddOpen}>
              <DialogTrigger asChild>
                <Button className="rounded-full shadow-soft"><Plus className="ml-1 h-4 w-4" /> إضافة مشترك</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>تعيين مشترك جديد</DialogTitle></DialogHeader>
                <select
                  value={selectedMember}
                  onChange={(e) => setSelectedMember(e.target.value)}
                  className="w-full rounded-xl border border-border bg-transparent px-4 py-3 text-sm"
                >
                  <option value="">اختر المشترك</option>
                  {unassigned.map((u) => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
                <DialogFooter><Button onClick={assignMember} className="rounded-full">تعيين</Button></DialogFooter>
              </DialogContent>
            </Dialog>
            <Link to="/admin/trainers">
              <Button variant="outline" className="rounded-full"><ArrowRight className="ml-1 h-4 w-4" /> رجوع</Button>
            </Link>
          </div>
        </div>

        {!members.length ? (
          <div className="card-premium p-12 text-center">
            <p className="text-muted-foreground">لا يوجد مشتركين مرتبطين بهذا المدرب</p>
          </div>
        ) : (
          <div className="space-y-4">
            {members.map((m) => {
              const allowed = allowedMap[m.id] ?? [];
              const completedExams = attemptCounts[m.id] ?? 0;
              const scores = examScores[m.id] ?? {};

              return (
                <div key={m.id} className="card-premium p-5 sm:p-6 space-y-4">
                  {/* Member header */}
                  <div className="flex items-start justify-between flex-wrap gap-3">
                    <div>
                      <h3 className="text-lg font-bold">{m.name}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5" dir="ltr">{m.membership_no}</p>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-xs text-muted-foreground">الاختبارات المنجزة: <span className="font-semibold text-foreground">{completedExams}</span></span>
                      {certBadge(m.final_certificate_status ?? "pending")}
                    </div>
                  </div>

                  {/* Exam scores */}
                  {Object.keys(scores).length > 0 && (
                    <div className="space-y-1.5">
                      <p className="text-xs font-semibold text-muted-foreground">نتائج الاختبارات</p>
                      <div className="flex flex-wrap gap-2">
                        {exams.filter(e => scores[e.id]).map(e => {
                          const s = scores[e.id];
                          const pct = s.total > 0 ? Math.round((s.correct / s.total) * 100) : 0;
                          return (
                            <span key={e.id} className="inline-flex items-center gap-1 text-xs rounded-full bg-primary/10 text-primary border border-primary/20 px-2.5 py-1">
                              {e.title}: {s.correct}/{s.total} ({pct}%)
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Final certificate */}
                  {m.final_certificate_status === "issued" && m.final_certificate_url && (
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      <a href={m.final_certificate_url} target="_blank" rel="noopener" className="text-xs text-primary underline">عرض/تحميل الشهادة النهائية</a>
                    </div>
                  )}

                  {/* Exam permissions */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-muted-foreground">صلاحيات الاختبارات</p>
                      <Button size="sm" variant="ghost" className="h-7 text-xs rounded-full" onClick={() => setPermOpen(permOpen === m.id ? null : m.id)}>
                        {permOpen === m.id ? "إغلاق" : "إدارة الصلاحيات"}
                      </Button>
                    </div>

                    {/* Allowed exams (always visible) */}
                    <div className="flex flex-wrap gap-1.5">
                      {allowed.length === 0 && <span className="text-[11px] text-muted-foreground">لم يتم السماح بأي اختبار بعد</span>}
                      {exams.filter(e => allowed.includes(e.id)).map(e => (
                        <Badge key={e.id} variant="secondary" className="gap-1 text-[11px] rounded-full bg-emerald-50 text-emerald-700 border-emerald-200">
                          {e.title}
                          <button onClick={() => toggleExam(m.id, e.id, true)} className="hover:text-rose-600 transition-colors"><X className="h-3 w-3" /></button>
                        </Badge>
                      ))}
                    </div>

                    {/* Available exams (shown when managing) */}
                    {permOpen === m.id && (
                      <div className="border border-border/60 rounded-xl p-3 space-y-2">
                        <p className="text-[11px] text-muted-foreground">الاختبارات المتاحة — اضغط للسماح:</p>
                        <div className="flex flex-wrap gap-1.5">
                          {exams.filter(e => !allowed.includes(e.id)).map(e => (
                            <button
                              key={e.id}
                              onClick={() => toggleExam(m.id, e.id, false)}
                              className="text-[11px] rounded-full border border-dashed border-border px-2.5 py-1 hover:border-primary hover:text-primary transition-colors"
                            >
                              + {e.title}
                            </button>
                          ))}
                          {exams.filter(e => !allowed.includes(e.id)).length === 0 && (
                            <span className="text-[11px] text-muted-foreground">جميع الاختبارات مسموح بها</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
