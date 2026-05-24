import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { TrainerGate } from "@/components/TrainerGate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { trainerSession, isThreePartName, THREE_PART_NAME_MSG } from "@/lib/session";
import { generateTrainerCardPDF } from "@/lib/trainer-card";
import { LogOut, Upload, IdCard, Save, Eye, EyeOff, Clock, CircleCheck as CheckCircle2, Circle as XCircle, TextCursorInput } from "lucide-react";

export const Route = createFileRoute("/trainer-dashboard")({
  head: () => ({ meta: [{ title: "لوحة المدرب — SDMATH" }] }),
  component: () => <TrainerGate><Dashboard /></TrainerGate>,
});

function Dashboard() {
  const navigate = useNavigate();
  const session = trainerSession.get();
  const [trainer, setTrainer] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const load = async () => {
    if (!session) return;
    const { data: t } = await supabase.from("trainers").select("*").eq("id", session.id).maybeSingle();
    setTrainer(t);
    if (t) {
      const { data: s } = await supabase
        .from("members")
        .select("id,name,final_certificate_status,final_certificate_url")
        .or(`trainer_id.eq.${t.id},trainer_name.eq.${t.full_name}`);
      const memIds = (s ?? []).map((m: any) => m.id);
      let withStats: any[] = s ?? [];
      if (memIds.length) {
        const { data: at } = await supabase
          .from("attempts")
          .select("member_id,correct_count,wrong_count,finished_at")
          .not("finished_at", "is", null)
          .in("member_id", memIds);
        const stats: Record<string, { count: number; scores: number[] }> = {};
        (at ?? []).forEach((a: any) => {
          const total = (a.correct_count ?? 0) + (a.wrong_count ?? 0);
          const score = total > 0 ? Math.round(((a.correct_count ?? 0) / total) * 100) : 0;
          (stats[a.member_id] ??= { count: 0, scores: [] });
          stats[a.member_id].count++;
          stats[a.member_id].scores.push(score);
        });
        withStats = (s ?? []).map((m: any) => ({
          ...m,
          completed_exams: stats[m.id]?.count ?? 0,
          exam_scores: stats[m.id]?.scores ?? [],
        }));
      }
      setStudents(withStats);
    }
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  if (!trainer) return null;

  const logout = () => { trainerSession.clear(); navigate({ to: "/" }); };

  const save = async () => {
    if (!isThreePartName(trainer.full_name || "")) { toast.error(THREE_PART_NAME_MSG); return; }
    setSaving(true);
    const { error } = await supabase.from("trainers").update({
      full_name: trainer.full_name.trim(),
      membership_number: trainer.membership_number,
      phone: trainer.phone,
      residence: trainer.residence,
      profile_image_url: trainer.profile_image_url,
      training_levels: trainer.training_levels,
      achievements: trainer.achievements,
      awards: trainer.awards,
      years_experience: trainer.years_experience ? Number(trainer.years_experience) : null,
      students_trained: trainer.students_trained ? Number(trainer.students_trained) : null,
      competitions: trainer.competitions,
    } as any).eq("id", trainer.id);
    setSaving(false);
    if (error) { toast.error("حدث خطأ أثناء الحفظ"); return; }
    trainerSession.set({ id: trainer.id, full_name: trainer.full_name.trim(), membership_number: trainer.membership_number });
    toast.success("تم حفظ المعلومات");
    load();
  };
    setSaving(false);
    if (error) { toast.error("حدث خطأ أثناء الحفظ"); return; }
    trainerSession.set({ id: trainer.id, full_name: trainer.full_name.trim(), membership_number: trainer.membership_number });
    toast.success("تم حفظ المعلومات");
    load();
  };

  const requestVisibility = async () => {
    if (!isThreePartName(trainer.full_name || "")) { toast.error("يجب إدخال الاسم الثلاثي أولاً"); return; }
    const { error } = await supabase.from("trainers").update({ profile_visibility: "pending" }).eq("id", trainer.id);
    if (error) { toast.error("حدث خطأ"); return; }
    toast.success("تم إرسال طلب إظهار الملف — بانتظار موافقة الإدارة");
    load();
  };

  const hideProfile = async () => {
    const { error } = await supabase.from("trainers").update({ profile_visibility: "hidden" }).eq("id", trainer.id);
    if (error) { toast.error("حدث خطأ"); return; }
    toast.success("تم إخفاء الملف التعريفي");
    load();
  };

  const onUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const path = `${trainer.id}/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("trainer-images").upload(path, file, { upsert: true });
    if (error) { setUploading(false); toast.error("فشل رفع الصورة"); return; }
    const { data } = supabase.storage.from("trainer-images").getPublicUrl(path);
    setTrainer({ ...trainer, profile_image_url: data.publicUrl });
    setUploading(false);
    toast.success("تم رفع الصورة — اضغط حفظ المعلومات");
  };

  const downloadCard = async () => {
    await generateTrainerCardPDF({
      fullName: trainer.full_name,
      membershipNumber: trainer.membership_number,
      profileImageUrl: trainer.profile_image_url,
    });
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
      <Header />
      <main className="container mx-auto px-4 py-10 sm:py-14 space-y-8">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="text-sm text-primary font-medium mb-1">لوحة المدرب</p>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">مرحباً، {trainer.full_name}</h1>
          </div>
          <Button variant="outline" size="sm" className="rounded-full" onClick={logout}>
            <LogOut className="ml-1 h-4 w-4" /> خروج
          </Button>
        </div>

        {/* Personal info */}
        <section className="card-premium p-6 sm:p-8">
          <h2 className="text-xl font-bold mb-5">معلومات المدرب</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>الاسم الثلاثي</Label>
              <Input value={trainer.full_name ?? ""} onChange={(e) => setTrainer({ ...trainer, full_name: e.target.value })} className="h-11 rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label>رقم العضوية</Label>
              <Input value={trainer.membership_number ?? ""} onChange={(e) => setTrainer({ ...trainer, membership_number: e.target.value })} dir="ltr" className="h-11 rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label>رقم الهاتف</Label>
              <Input value={trainer.phone ?? ""} onChange={(e) => setTrainer({ ...trainer, phone: e.target.value })} dir="ltr" className="h-11 rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label>مكان السكن</Label>
              <Input value={trainer.residence ?? ""} onChange={(e) => setTrainer({ ...trainer, residence: e.target.value })} className="h-11 rounded-xl" />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>الصورة الشخصية</Label>
              <div className="flex items-center gap-4 flex-wrap">
                {trainer.profile_image_url && (
                  <img src={trainer.profile_image_url} alt="" className="w-16 h-16 rounded-full object-cover border border-border" />
                )}
                <label className="inline-flex items-center gap-2 px-4 h-11 rounded-full border border-border bg-card hover:bg-accent cursor-pointer transition-colors">
                  <Upload className="h-4 w-4" />
                  <span className="text-sm">{uploading ? "جارٍ الرفع..." : "تحميل صورة"}</span>
                  <input type="file" accept="image/*" className="hidden" onChange={onUpload} />
                </label>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-3 mt-6">
            <Button onClick={save} disabled={saving} className="rounded-full shadow-soft">
              <Save className="ml-1 h-4 w-4" /> {saving ? "جارٍ الحفظ..." : "حفظ المعلومات"}
            </Button>
            <Button variant="outline" onClick={downloadCard} className="rounded-full">
              <IdCard className="ml-1 h-4 w-4" /> تحميل بطاقة العضوية
            </Button>
          </div>
        </section>

        {/* Profile content for public page */}
        <section className="card-premium p-6 sm:p-8">
          <h2 className="text-xl font-bold mb-1">محتوى الملف التعريفي العام</h2>
          <p className="text-sm text-muted-foreground mb-5">هذه البيانات ستظهر في صفحتك العامة بعد اعتمادها من الإدارة.</p>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>المستويات التدريبية</Label>
              <Input
                value={trainer.training_levels ?? ""}
                onChange={(e) => setTrainer({ ...trainer, training_levels: e.target.value })}
                placeholder="مثال: مستوى 1, مستوى 2, مستوى 3"
                className="h-11 rounded-xl"
              />
              <p className="text-[11px] text-muted-foreground">افصل بين المستويات بفاصلة</p>
            </div>
            <div className="space-y-1.5">
              <Label>مكان السكن (للعرض العام)</Label>
              <Input
                value={trainer.residence ?? ""}
                onChange={(e) => setTrainer({ ...trainer, residence: e.target.value })}
                className="h-11 rounded-xl"
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>الإنجازات</Label>
              <textarea
                value={trainer.achievements ?? ""}
                onChange={(e) => setTrainer({ ...trainer, achievements: e.target.value })}
                placeholder="كل إنجاز في سطر مستقل"
                rows={3}
                className="flex w-full rounded-xl border border-border bg-transparent px-4 py-3 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-[80px] resize-y"
                dir="rtl"
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>الجوائز والشهادات</Label>
              <textarea
                value={trainer.awards ?? ""}
                onChange={(e) => setTrainer({ ...trainer, awards: e.target.value })}
                placeholder="كل جائزة أو شهادة في سطر مستقل"
                rows={3}
                className="flex w-full rounded-xl border border-border bg-transparent px-4 py-3 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-[80px] resize-y"
                dir="rtl"
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-3 mt-6">
            <Button onClick={save} disabled={saving} className="rounded-full shadow-soft">
              <Save className="ml-1 h-4 w-4" /> {saving ? "جارٍ الحفظ..." : "حفظ المحتوى"}
            </Button>
          </div>
        </section>

        {/* Show Profile Publicly section */}
        <section className="card-premium p-6 sm:p-8">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <h2 className="text-xl font-bold mb-1">إظهار الملف التعريفي</h2>
              <p className="text-sm text-muted-foreground">
                عند طلب الإظهار، سيتم مراجعة ملفك من الإدارة قبل أن يصبح عاماً.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 items-center">
              {trainer.profile_visibility === "hidden" && (
                <Button onClick={requestVisibility} className="rounded-full shadow-soft">
                  <Eye className="ml-1.5 h-4 w-4" /> إظهار الملف publicly
                </Button>
              )}
              {trainer.profile_visibility === "pending" && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200 px-4 py-2 text-sm font-medium">
                  <Clock className="h-4 w-4" /> بانتظار موافقة الإدارة
                </span>
              )}
              {trainer.profile_visibility === "approved" && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 px-4 py-2 text-sm font-medium">
                  <CheckCircle2 className="h-4 w-4" /> الملف معتمد ومرئي عاماً
                </span>
              )}
              {(trainer.profile_visibility === "pending" || trainer.profile_visibility === "approved") && (
                <Button variant="outline" onClick={hideProfile} className="rounded-full">
                  <EyeOff className="ml-1.5 h-4 w-4" /> إخفاء الملف
                </Button>
              )}
            </div>
          </div>
        </section>

        {/* Students */}
        <section className="card-premium overflow-hidden">
          <div className="p-6 sm:p-8 pb-3">
            <h2 className="text-xl font-bold">الطلاب المشتركين</h2>
            <p className="text-sm text-muted-foreground mt-1">عرض فقط — البيانات تُدار من قِبل الإدارة.</p>
          </div>
          <div className="hidden md:block">
            <table className="w-full text-sm">
              <thead className="bg-muted/60">
                <tr className="text-right">
                  <th className="p-4 font-semibold">اسم الطالب</th>
                  <th className="p-4 font-semibold">عدد أوراق العمل المنجزة</th>
                  <th className="p-4 font-semibold">إصدار الشهادة النهائية</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <tr key={s.id} className="border-t border-border/60">
                    <td className="p-4 font-medium">{s.name}</td>
                    <td className="p-4 text-muted-foreground">{s.completed_worksheets_count ?? 0}</td>
                    <td className="p-4">{certBadge(s.final_certificate_status ?? "pending")}</td>
                  </tr>
                ))}
                {!students.length && (<tr><td colSpan={3} className="p-12 text-center text-muted-foreground">لا يوجد طلاب مرتبطين بعد</td></tr>)}
              </tbody>
            </table>
          </div>
          <div className="md:hidden p-4 space-y-3">
            {students.map((s) => (
              <div key={s.id} className="border border-border/60 rounded-2xl p-4">
                <p className="font-semibold mb-2">{s.name}</p>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>أوراق منجزة: {s.completed_worksheets_count ?? 0}</span>
                  {certBadge(s.final_certificate_status ?? "pending")}
                </div>
              </div>
            ))}
            {!students.length && <p className="text-center text-muted-foreground py-8">لا يوجد طلاب مرتبطين بعد</p>}
          </div>
        </section>
      </main>
    </div>
  );
}
