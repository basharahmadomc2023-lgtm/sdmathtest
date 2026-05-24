import { createFileRoute, Link } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { AdminGate } from "@/components/AdminGate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Pencil, Trash2, IdCard, Plus, CircleCheck as CheckCircle2, Circle as XCircle, Clock, Eye, Users } from "lucide-react";
import { generateTrainerCardPDF } from "@/lib/trainer-card";
import { isThreePartName, THREE_PART_NAME_MSG } from "@/lib/session";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/admin/trainers")({
  head: () => ({ meta: [{ title: "إدارة المدربين — SDMATH" }] }),
  component: () => <AdminGate><AdminTrainers /></AdminGate>,
});

const STATUS_LABEL: Record<string, string> = { Active: "مفعل", Pending: "معلق", Cancelled: "ملغي" };

function AdminTrainers() {
  const [list, setList] = useState<any[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ full_name: "", membership_number: "", phone: "", residence: "", status: "Active" });

  const load = async () => {
    const { data } = await supabase.from("trainers").select("*").order("created_at", { ascending: false });
    setList(data ?? []);
    const { data: mem } = await supabase.from("members").select("trainer_id,trainer_name");
    const byId: Record<string, number> = {};
    const byName: Record<string, number> = {};
    (mem ?? []).forEach((m: any) => {
      if (m.trainer_id) byId[m.trainer_id] = (byId[m.trainer_id] ?? 0) + 1;
      else if (m.trainer_name) byName[m.trainer_name] = (byName[m.trainer_name] ?? 0) + 1;
    });
    const c: Record<string, number> = {};
    (data ?? []).forEach((t: any) => {
      c[t.id] = (byId[t.id] ?? 0) + (byName[t.full_name] ?? 0);
    });
    setCounts(c);
  };
  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!isThreePartName(form.full_name)) { toast.error(THREE_PART_NAME_MSG); return; }
    if (!form.membership_number.trim()) { toast.error("أدخل رقم العضوية"); return; }
    const { error } = await supabase.from("trainers").insert({
      full_name: form.full_name.trim(),
      membership_number: form.membership_number.trim(),
      phone: form.phone || null,
      residence: form.residence || null,
      status: form.status,
    });
    if (error) { toast.error(error.code === "23505" ? "رقم العضوية مستخدم مسبقاً" : "حدث خطأ"); return; }
    toast.success("تم إنشاء حساب المدرب");
    setOpen(false);
    setForm({ full_name: "", membership_number: "", phone: "", residence: "", status: "Active" });
    load();
  };

  const updateStatus = async (id: string, status: string) => {
    await supabase.from("trainers").update({ status }).eq("id", id);
    toast.success("تم التحديث");
    load();
  };
  const del = async (id: string) => {
    if (!confirm("حذف هذا المدرب؟")) return;
    await supabase.from("trainers").delete().eq("id", id);
    toast.success("تم الحذف");
    load();
  };
  const downloadCard = async (t: any) => {
    await generateTrainerCardPDF({ fullName: t.full_name, membershipNumber: t.membership_number, profileImageUrl: t.profile_image_url });
  };

  const approveProfile = async (id: string) => {
    await supabase.from("trainers").update({ profile_visibility: "approved" }).eq("id", id);
    toast.success("تم اعتماد الملف التعريفي");
    load();
  };
  const rejectProfile = async (id: string) => {
    await supabase.from("trainers").update({ profile_visibility: "hidden" }).eq("id", id);
    toast.success("تم رفض طلب الإظهار");
    load();
  };

  const visBadge = (v: string) => {
    const map: Record<string, { cls: string; label: string }> = {
      hidden: { cls: "bg-gray-100 text-gray-600 border-gray-200", label: "مخفي" },
      pending: { cls: "bg-amber-100 text-amber-800 border-amber-200", label: "بانتظار الاعتماد" },
      approved: { cls: "bg-emerald-100 text-emerald-800 border-emerald-200", label: "معتمد" },
    };
    const info = map[v] ?? map.hidden;
    return <span className={`text-[11px] rounded-full px-2.5 py-1 border ${info.cls}`}>{info.label}</span>;
  };

  const statusBadge = (s: string) => {
    const map: Record<string, string> = {
      Active: "bg-emerald-100 text-emerald-800 border-emerald-200",
      Pending: "bg-amber-100 text-amber-800 border-amber-200",
      Cancelled: "bg-rose-100 text-rose-800 border-rose-200",
    };
    return <span className={`text-[11px] rounded-full px-2.5 py-1 border ${map[s] ?? ""}`}>{STATUS_LABEL[s] ?? s}</span>;
  };

  return (
    <div className="min-h-screen bg-gradient-soft">
      <Header variant="admin" />
      <main className="container mx-auto px-4 py-10 sm:py-14">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">إدارة المدربين</h1>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-full shadow-soft"><Plus className="ml-1 h-4 w-4" /> مدرب جديد</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>إنشاء حساب مدرب</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div className="space-y-1.5"><Label>الاسم الثلاثي</Label>
                  <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} placeholder="مثال: سليمان خالد دياب" /></div>
                <div className="space-y-1.5"><Label>رقم العضوية</Label>
                  <Input value={form.membership_number} onChange={(e) => setForm({ ...form, membership_number: e.target.value })} dir="ltr" /></div>
                <div className="space-y-1.5"><Label>رقم الهاتف</Label>
                  <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} dir="ltr" /></div>
                <div className="space-y-1.5"><Label>مكان السكن</Label>
                  <Input value={form.residence} onChange={(e) => setForm({ ...form, residence: e.target.value })} /></div>
                <div className="space-y-1.5"><Label>الحالة</Label>
                  <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Active">مفعل</SelectItem>
                      <SelectItem value="Pending">معلق</SelectItem>
                      <SelectItem value="Cancelled">ملغي</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter><Button onClick={create} className="rounded-full">حفظ</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="hidden md:block card-premium overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/60">
              <tr className="text-right">
                <th className="p-4 font-semibold">اسم المدرب</th>
                <th className="p-4 font-semibold">رقم العضوية</th>
                <th className="p-4 font-semibold">عدد المشتركين</th>
                <th className="p-4 font-semibold">الحالة</th>
                <th className="p-4 font-semibold">الملف العام</th>
                <th className="p-4 font-semibold">تعديل صفحة المدرب</th>
                <th className="p-4 font-semibold">إصدار بطاقة العضوية</th>
                <th className="p-4 font-semibold">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {list.map((t) => (
                <tr key={t.id} className="border-t border-border/60 hover:bg-muted/30">
                  <td className="p-4 font-medium">{t.full_name}</td>
                  <td className="p-4 text-muted-foreground" dir="ltr">{t.membership_number}</td>
                  <td className="p-4">
                    <Link to="/admin/trainers/$trainerId/subscribers" params={{ trainerId: t.id }}>
                      <button className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 text-primary border border-primary/20 px-3 py-1 text-sm font-semibold hover:bg-primary/15 transition-colors">
                        <Users className="h-3.5 w-3.5" /> {counts[t.id] ?? 0}
                      </button>
                    </Link>
                  </td>
                  <td className="p-4">
                    <Select value={t.status} onValueChange={(v) => updateStatus(t.id, v)}>
                      <SelectTrigger className="h-9 w-32"><SelectValue>{statusBadge(t.status)}</SelectValue></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Active">مفعل</SelectItem>
                        <SelectItem value="Pending">معلق</SelectItem>
                        <SelectItem value="Cancelled">ملغي</SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      {visBadge(t.profile_visibility ?? "hidden")}
                      {t.profile_visibility === "pending" && (
                        <>
                          <Button size="sm" variant="outline" className="h-7 px-2.5 rounded-full text-[11px]" onClick={() => approveProfile(t.id)}>
                            <CheckCircle2 className="ml-1 h-3 w-3 text-emerald-600" /> اعتماد
                          </Button>
                          <Button size="sm" variant="outline" className="h-7 px-2.5 rounded-full text-[11px]" onClick={() => rejectProfile(t.id)}>
                            <XCircle className="ml-1 h-3 w-3 text-rose-600" /> رفض
                          </Button>
                        </>
                      )}
                      {t.profile_visibility === "approved" && (
                        <Link to="/trainer/$membershipNumber" params={{ membershipNumber: t.membership_number }} target="_blank">
                          <Button size="sm" variant="outline" className="h-7 px-2.5 rounded-full text-[11px]">
                            <Eye className="ml-1 h-3 w-3" /> عرض
                          </Button>
                        </Link>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    <Link to="/admin/trainers/$trainerId" params={{ trainerId: t.id }}>
                      <Button size="sm" variant="outline" className="rounded-full"><Pencil className="ml-1 h-3.5 w-3.5" /> تعديل</Button>
                    </Link>
                  </td>
                  <td className="p-4">
                    <Button size="sm" variant="outline" className="rounded-full" onClick={() => downloadCard(t)}>
                      <IdCard className="ml-1 h-3.5 w-3.5" /> إصدار
                    </Button>
                  </td>
                  <td className="p-4">
                    <Button size="sm" variant="outline" className="h-8 w-8 p-0 rounded-full" onClick={() => del(t.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </td>
                </tr>
              ))}
              {!list.length && (<tr><td colSpan={7} className="p-12 text-center text-muted-foreground">لا يوجد مدربين</td></tr>)}
            </tbody>
          </table>
        </div>

        <div className="md:hidden space-y-3">
          {list.map((t) => (
            <div key={t.id} className="card-premium p-4">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <p className="font-semibold">{t.full_name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5" dir="ltr">{t.membership_number}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  {statusBadge(t.status)}
                  {visBadge(t.profile_visibility ?? "hidden")}
                </div>
              </div>
              {t.profile_visibility === "pending" && (
                <div className="flex gap-2 mb-3">
                  <Button size="sm" variant="outline" className="rounded-full" onClick={() => approveProfile(t.id)}>
                    <CheckCircle2 className="ml-1 h-3.5 w-3.5 text-emerald-600" /> اعتماد الملف
                  </Button>
                  <Button size="sm" variant="outline" className="rounded-full" onClick={() => rejectProfile(t.id)}>
                    <XCircle className="ml-1 h-3.5 w-3.5 text-rose-600" /> رفض
                  </Button>
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                <Link to="/admin/trainers/$trainerId" params={{ trainerId: t.id }}>
                  <Button size="sm" variant="outline" className="rounded-full"><Pencil className="ml-1 h-3.5 w-3.5" /> تعديل</Button>
                </Link>
                <Button size="sm" variant="outline" className="rounded-full" onClick={() => downloadCard(t)}><IdCard className="ml-1 h-3.5 w-3.5" /> بطاقة</Button>
                {t.profile_visibility === "approved" && (
                  <Link to="/trainer/$membershipNumber" params={{ membershipNumber: t.membership_number }} target="_blank">
                    <Button size="sm" variant="outline" className="rounded-full"><Eye className="ml-1 h-3.5 w-3.5" /> عرض الملف</Button>
                  </Link>
                )}
                <Button size="sm" variant="outline" className="rounded-full" onClick={() => del(t.id)}><Trash2 className="ml-1 h-3.5 w-3.5 text-destructive" /></Button>
              </div>
            </div>
          ))}
          {!list.length && <p className="text-center text-muted-foreground py-12">لا يوجد مدربين</p>}
        </div>
      </main>
    </div>
  );
}
