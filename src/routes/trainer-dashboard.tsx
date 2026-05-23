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
import { LogOut, Upload, IdCard, Save } from "lucide-react";

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
        .select("id,name,completed_worksheets_count,final_certificate_status")
        .or(`trainer_id.eq.${t.id},trainer_name.eq.${t.full_name}`);
      setStudents(s ?? []);
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
    }).eq("id", trainer.id);
    setSaving(false);
    if (error) { toast.error("حدث خطأ أثناء الحفظ"); return; }
    trainerSession.set({ id: trainer.id, full_name: trainer.full_name.trim(), membership_number: trainer.membership_number });
    toast.success("تم حفظ المعلومات");
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
