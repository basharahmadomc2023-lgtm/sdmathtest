import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { AdminGate } from "@/components/AdminGate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowRight, Save, IdCard, Upload, UserPlus, CircleCheck as CheckCircle2, Circle as XCircle, Eye, EyeOff } from "lucide-react";
import { generateTrainerCardPDF } from "@/lib/trainer-card";
import { isThreePartName, THREE_PART_NAME_MSG } from "@/lib/session";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/admin/trainers/$trainerId")({
  head: () => ({ meta: [{ title: "تعديل صفحة المدرب — SDMATH" }] }),
  component: () => <AdminGate><EditTrainer /></AdminGate>,
});

function EditTrainer() {
  const { trainerId } = useParams({ from: "/admin/trainers/$trainerId" });
  const [trainer, setTrainer] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [unassigned, setUnassigned] = useState<any[]>([]);
  const [assignOpen, setAssignOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<string>("");

  const load = async () => {
    const { data: t } = await supabase.from("trainers").select("*").eq("id", trainerId).maybeSingle();
    setTrainer(t);
    if (t) {
      const { data: s } = await supabase
        .from("members")
        .select("id,name,completed_worksheets_count,final_certificate_status,final_certificate_url,trainer_name,trainer_id")
        .or(`trainer_id.eq.${t.id},trainer_name.eq.${t.full_name}`);
      const memIds = (s ?? []).map((m: any) => m.id);
      let withStats: any[] = s ?? [];
      if (memIds.length) {
        const { data: at } = await supabase
          .from("attempts")
          .select("member_id")
          .not("finished_at", "is", null)
          .in("member_id", memIds);
        const counts: Record<string, number> = {};
        (at ?? []).forEach((a: any) => { counts[a.member_id] = (counts[a.member_id] ?? 0) + 1; });
        withStats = (s ?? []).map((m: any) => ({ ...m, completed_exams: counts[m.id] ?? 0 }));
      }
      setStudents(withStats);
    }
    const { data: u } = await supabase
      .from("members")
      .select("id,name,coach_name,trainer_name")
      .is("trainer_id", null);
    setUnassigned(u ?? []);
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [trainerId]);

  if (!trainer) return null;

  const save = async () => {
    if (!isThreePartName(trainer.full_name || "")) { toast.error(THREE_PART_NAME_MSG); return; }
    const { error } = await supabase.from("trainers").update({
      full_name: trainer.full_name.trim(),
      membership_number: trainer.membership_number,
      phone: trainer.phone,
      residence: trainer.residence,
      profile_image_url: trainer.profile_image_url,
      status: trainer.status,
      training_levels: trainer.training_levels,
      achievements: trainer.achievements,
      awards: trainer.awards,
      profile_visibility: trainer.profile_visibility,
      years_experience: trainer.years_experience ? Number(trainer.years_experience) : null,
      students_trained: trainer.students_trained ? Number(trainer.students_trained) : null,
      competitions: trainer.competitions,
    } as any).eq("id", trainer.id);
    if (error) { toast.error("فشل الحفظ"); return; }
    toast.success("تم حفظ بيانات المدرب");
    load();
  };

  const onUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const path = `${trainer.id}/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("trainer-images").upload(path, file, { upsert: true });
    if (error) { toast.error("فشل رفع الصورة"); return; }
    const { data } = supabase.storage.from("trainer-images").getPublicUrl(path);
    setTrainer({ ...trainer, profile_image_url: data.publicUrl });
    toast.success("تم — اضغط حفظ");
  };

  const updateStudent = async (id: string, patch: any) => {
    await supabase.from("members").update(patch).eq("id", id);
    load();
  };

  const assignStudent = async () => {
    if (!selectedMember) return;
    await supabase.from("members").update({ trainer_id: trainer.id, trainer_name: trainer.full_name }).eq("id", selectedMember);
    toast.success("تم تعيين الطالب للمدرب");
    setAssignOpen(false); setSelectedMember("");
    load();
  };

  return (
    <div className="min-h-screen bg-gradient-soft">
      <Header variant="admin" />
      <main className="container mx-auto px-4 py-10 sm:py-14 space-y-8">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">تعديل صفحة المدرب</h1>
          <Link to="/admin/trainers"><Button variant="outline" className="rounded-full"><ArrowRight className="ml-1 h-4 w-4" /> رجوع</Button></Link>
        </div>

        <section className="card-premium p-6 sm:p-8">
          <h2 className="text-xl font-bold mb-5">بيانات المدرب</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5"><Label>الاسم الثلاثي</Label>
              <Input value={trainer.full_name ?? ""} onChange={(e) => setTrainer({ ...trainer, full_name: e.target.value })} className="h-11 rounded-xl" /></div>
            <div className="space-y-1.5"><Label>رقم العضوية</Label>
              <Input value={trainer.membership_number ?? ""} onChange={(e) => setTrainer({ ...trainer, membership_number: e.target.value })} dir="ltr" className="h-11 rounded-xl" /></div>
            <div className="space-y-1.5"><Label>رقم الهاتف</Label>
              <Input value={trainer.phone ?? ""} onChange={(e) => setTrainer({ ...trainer, phone: e.target.value })} dir="ltr" className="h-11 rounded-xl" /></div>
            <div className="space-y-1.5"><Label>مكان السكن</Label>
              <Input value={trainer.residence ?? ""} onChange={(e) => setTrainer({ ...trainer, residence: e.target.value })} className="h-11 rounded-xl" /></div>
            <div className="space-y-1.5"><Label>الحالة</Label>
              <Select value={trainer.status} onValueChange={(v) => setTrainer({ ...trainer, status: v })}>
                <SelectTrigger className="h-11 rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">مفعل</SelectItem>
                  <SelectItem value="Pending">معلق</SelectItem>
                  <SelectItem value="Cancelled">ملغي</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>الصورة الشخصية</Label>
              <div className="flex items-center gap-3">
                {trainer.profile_image_url && <img src={trainer.profile_image_url} className="w-12 h-12 rounded-full object-cover border" />}
                <label className="inline-flex items-center gap-2 px-4 h-11 rounded-full border border-border bg-card hover:bg-accent cursor-pointer">
                  <Upload className="h-4 w-4" /><span className="text-sm">رفع صورة</span>
                  <input type="file" accept="image/*" className="hidden" onChange={onUpload} />
                </label>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-3 mt-6">
            <Button onClick={save} className="rounded-full shadow-soft"><Save className="ml-1 h-4 w-4" /> حفظ بيانات المدرب</Button>
            <Button variant="outline" className="rounded-full" onClick={() => generateTrainerCardPDF({ fullName: trainer.full_name, membershipNumber: trainer.membership_number, profileImageUrl: trainer.profile_image_url })}>
              <IdCard className="ml-1 h-4 w-4" /> إصدار بطاقة العضوية
            </Button>
          </div>
        </section>

        {/* Profile content for public page */}
        <section className="card-premium p-6 sm:p-8">
          <h2 className="text-xl font-bold mb-5">محتوى الملف التعريفي العام</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>المستويات التدريبية</Label>
              <Input value={trainer.training_levels ?? ""} onChange={(e) => setTrainer({ ...trainer, training_levels: e.target.value })} placeholder="مثال: مستوى 1, مستوى 2" className="h-11 rounded-xl" />
              <p className="text-[11px] text-muted-foreground">افصل بين المستويات بفاصلة</p>
            </div>
            <div className="space-y-1.5">
              <Label>حالة الملف العام</Label>
              <Select value={trainer.profile_visibility ?? "hidden"} onValueChange={(v) => setTrainer({ ...trainer, profile_visibility: v })}>
                <SelectTrigger className="h-11 rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="hidden">مخفي</SelectItem>
                  <SelectItem value="pending">بانتظار الاعتماد</SelectItem>
                  <SelectItem value="approved">معتمد</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>الإنجازات</Label>
              <textarea value={trainer.achievements ?? ""} onChange={(e) => setTrainer({ ...trainer, achievements: e.target.value })} placeholder="كل إنجاز في سطر مستقل" rows={3} className="flex w-full rounded-xl border border-border bg-transparent px-4 py-3 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-[80px] resize-y" dir="rtl" />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>الجوائز والشهادات</Label>
              <textarea value={trainer.awards ?? ""} onChange={(e) => setTrainer({ ...trainer, awards: e.target.value })} placeholder="كل جائزة أو شهادة في سطر مستقل" rows={3} className="flex w-full rounded-xl border border-border bg-transparent px-4 py-3 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-[80px] resize-y" dir="rtl" />
            </div>
            <div className="space-y-1.5">
              <Label>سنوات الخبرة التدريبية</Label>
              <Input type="number" dir="ltr" value={trainer.years_experience ?? ""} onChange={(e) => setTrainer({ ...trainer, years_experience: e.target.value })} className="h-11 rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label>عدد الطلاب المدربين</Label>
              <Input type="number" dir="ltr" value={trainer.students_trained ?? ""} onChange={(e) => setTrainer({ ...trainer, students_trained: e.target.value })} className="h-11 rounded-xl" />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>المسابقات التي شارك فيها</Label>
              <textarea value={trainer.competitions ?? ""} onChange={(e) => setTrainer({ ...trainer, competitions: e.target.value })} placeholder="كل مسابقة في سطر مستقل" rows={3} className="flex w-full rounded-xl border border-border bg-transparent px-4 py-3 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-[80px] resize-y" dir="rtl" />
            </div>
          </div>
          <div className="flex flex-wrap gap-3 mt-6">
            <Button onClick={save} className="rounded-full shadow-soft"><Save className="ml-1 h-4 w-4" /> حفظ المحتوى</Button>
            {trainer.profile_visibility === "approved" && (
              <Link to="/trainer/$membershipNumber" params={{ membershipNumber: trainer.membership_number }} target="_blank">
                <Button variant="outline" className="rounded-full"><Eye className="ml-1 h-4 w-4" /> عرض الملف العام</Button>
              </Link>
            )}
          </div>
        </section>

        <section className="card-premium overflow-hidden">
          <div className="p-6 sm:p-8 pb-3 flex items-center justify-between flex-wrap gap-3">
            <div>
              <h2 className="text-xl font-bold">طلاب المدرب</h2>
              <p className="text-sm text-muted-foreground mt-1">يمكنك تعديل القيم وتعيين طلاب يدوياً.</p>
            </div>
            <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="rounded-full"><UserPlus className="ml-1 h-4 w-4" /> تعيين الطالب للمدرب</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>تعيين طالب غير مرتبط</DialogTitle></DialogHeader>
                <Select value={selectedMember} onValueChange={setSelectedMember}>
                  <SelectTrigger><SelectValue placeholder="اختر الطالب" /></SelectTrigger>
                  <SelectContent>
                    {unassigned.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.name} {u.trainer_name ? `— (${u.trainer_name})` : u.coach_name ? `— (${u.coach_name})` : ""}
                      </SelectItem>
                    ))}
                    {!unassigned.length && <div className="p-2 text-sm text-muted-foreground">لا يوجد طلاب غير مرتبطين</div>}
                  </SelectContent>
                </Select>
                <DialogFooter><Button onClick={assignStudent} className="rounded-full">تعيين</Button></DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/60">
                <tr className="text-right">
                  <th className="p-4 font-semibold">اسم الطالب</th>
                  <th className="p-4 font-semibold">الاختبارات المنجزة</th>
                  <th className="p-4 font-semibold">حالة الشهادة النهائية</th>
                  <th className="p-4 font-semibold">ملف الشهادة</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <tr key={s.id} className="border-t border-border/60">
                    <td className="p-4 font-medium">{s.name}</td>
                    <td className="p-4 text-muted-foreground">{s.completed_exams ?? 0}</td>
                    <td className="p-4">
                      <Select defaultValue={s.final_certificate_status ?? "pending"} onValueChange={(v) => updateStudent(s.id, { final_certificate_status: v })}>
                        <SelectTrigger className="h-9 w-40"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">قيد الانتظار</SelectItem>
                          <SelectItem value="issued">صادرة</SelectItem>
                          <SelectItem value="not_eligible">غير مؤهل</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2 flex-wrap">
                        <label className="inline-flex items-center gap-1.5 px-3 h-9 rounded-full border border-border bg-card hover:bg-accent cursor-pointer text-xs">
                          <Upload className="h-3.5 w-3.5" /> رفع
                          <input type="file" accept="application/pdf,image/*" className="hidden" onChange={async (e) => {
                            const file = e.target.files?.[0]; if (!file) return;
                            const path = `${s.id}/${Date.now()}-${file.name}`;
                            const { error } = await supabase.storage.from("final-certificates").upload(path, file, { upsert: true });
                            if (error) { toast.error("فشل رفع الملف"); return; }
                            const { data } = supabase.storage.from("final-certificates").getPublicUrl(path);
                            await updateStudent(s.id, { final_certificate_url: data.publicUrl, final_certificate_status: "issued" });
                            toast.success("تم رفع الشهادة");
                          }} />
                        </label>
                        {s.final_certificate_url && (
                          <a href={s.final_certificate_url} target="_blank" rel="noopener noreferrer" className="text-[11px] rounded-full bg-primary/10 text-primary border border-primary/20 px-2.5 py-1 hover:bg-primary/15">عرض</a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {!students.length && (<tr><td colSpan={4} className="p-12 text-center text-muted-foreground">لا يوجد طلاب</td></tr>)}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
